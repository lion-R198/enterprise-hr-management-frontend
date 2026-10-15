#!/usr/bin/env node
/**
 * 用无头 Edge + CDP 驱动联调测试台，取回结果，并与服务端代理日志交叉验证。
 *
 * 为什么不用 --dump-dom：测试台的结果要等 90+ 条真实 HTTP 请求跑完才产生，
 * --dump-dom 在 load 事件后即输出，取不到异步结果；--virtual-time-budget 又会
 * 与真实网络等待互相干扰。改用 CDP 主动轮询，时机完全可控。
 *
 * 最终判定取两条证据的交集：
 *   ① 客户端网络层探针（页面内挂钩 XHR/fetch）记录到该用例发出了请求；
 *   ② 服务端 verify/proxy-access.jsonl 存在同一 方法+路径 的代理记录。
 * 只满足①可能是请求被浏览器内部拦截/未出网；只满足②可能是他人触发。
 * 两者同时满足，才能得出"该前端请求确实调用了后端接口"。
 *
 * 用法：node scripts/run-joint-test.mjs [页面URL] [输出JSON路径] [代理日志路径]
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const URL_PAGE = process.argv[2] || 'http://127.0.0.1:5173/dev/joint-test.html'
const OUT = process.argv[3] || join(ROOT, 'verify/joint-result.json')
const PROXY_LOG = process.argv[4] || join(ROOT, 'verify/proxy-access.jsonl')
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9223
const TIMEOUT_MS = 180000

/** 路径模板 → 正则：/employees/{id}/changes → ^/api/employees/[^/]+/changes$ */
function pathToRegExp(tpl) {
  const escaped = tpl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{[^}]+\\\}/g, '[^/]+')
  return new RegExp(`^/api${escaped}$`)
}

/** 读取服务端代理日志，返回 { 'METHOD /path': 次数 } */
function readProxyLog() {
  if (!existsSync(PROXY_LOG)) return null
  const map = new Map()
  for (const line of readFileSync(PROXY_LOG, 'utf8').split('\n')) {
    if (!line.trim()) continue
    let rec
    try {
      rec = JSON.parse(line)
    } catch {
      continue
    }
    if (rec.phase !== 'req') continue
    const path = String(rec.url || '').split('?')[0]
    const key = `${String(rec.method || '').toUpperCase()} ${path}`
    map.set(key, (map.get(key) || 0) + 1)
  }
  return map
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const profile = mkdtempSync(join(tmpdir(), 'joint-edge-'))
const edge = spawn(EDGE, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  `--remote-debugging-port=${PORT}`,
  '--remote-allow-origins=*',
  `--user-data-dir=${profile}`,
  'about:blank'
], { stdio: 'ignore' })

let ws = null
let seq = 0
const pending = new Map()

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++seq
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
}

async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: false })
  if (r.exceptionDetails) return { error: r.exceptionDetails.text || 'evaluate 异常' }
  return { value: r.result?.value }
}

async function findPageTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`)
      const list = await res.json()
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl)
      if (page) return page
    } catch {
      /* 还没起来 */
    }
    await sleep(500)
  }
  throw new Error('CDP 端点未就绪')
}

async function main() {
  const target = await findPageTarget()
  ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', (e) => reject(new Error('WS 连接失败: ' + (e?.message || 'unknown'))), { once: true })
  })
  ws.addEventListener('message', (ev) => {
    let msg
    try {
      msg = JSON.parse(ev.data)
    } catch {
      return
    }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
    }
  })

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Page.navigate', { url: URL_PAGE })

  const deadline = Date.now() + TIMEOUT_MS
  let dumped = null
  let logLines = []

  while (Date.now() < deadline) {
    await sleep(2000)
    const probe = await evaluate(`(() => {
      const pre = document.getElementById('jointresult');
      const t = pre ? pre.textContent : '';
      let parsed = null;
      try { parsed = t ? JSON.parse(t) : null } catch (e) { parsed = null }
      return JSON.stringify({
        fatal: window.__JOINT_ERROR__ || null,
        done: !!(parsed && parsed.summary),
        title: document.title,
        log: (parsed && parsed.log) ? parsed.log.length : 0
      })
    })()`)
    if (probe.error) continue
    const st = JSON.parse(probe.value)
    if (st.log && st.log !== logLines.length) logLines = new Array(st.log)
    process.stdout.write(`\r  进度：已完成 ${st.log || 0} 条 · ${st.title || ''}          `)
    if (st.fatal) {
      dumped = { fatal: st.fatal }
      break
    }
    if (st.done) {
      const full = await evaluate(`document.getElementById('jointresult').textContent`)
      dumped = JSON.parse(full.value)
      break
    }
  }

  process.stdout.write('\n')
  if (!dumped) throw new Error('等待联调结果超时')

  // ---- 与服务端代理日志交叉验证 ----
  const proxy = readProxyLog()
  if (proxy) {
    for (const cs of dumped.cases) {
      const re = pathToRegExp(cs.path)
      let serverSeen = 0
      for (const [key, n] of proxy) {
        const [m, p] = key.split(' ')
        if (m === cs.method && re.test(p)) serverSeen += n
      }
      cs.serverSeen = serverSeen
      cs.clientIssued = cs.issuedReal
      cs.reachedBackend = cs.clientIssued && serverSeen > 0
    }
    dumped.summary.clientIssued = dumped.cases.filter((x) => x.clientIssued).length
    dumped.summary.serverSeen = dumped.cases.filter((x) => x.serverSeen > 0).length
    dumped.summary.reachedBackend = dumped.cases.filter((x) => x.reachedBackend).length
    dumped.summary.notReached = dumped.cases.filter((x) => !x.reachedBackend).length
    dumped.proxyLog = {
      file: PROXY_LOG,
      uniqueMethodPath: proxy.size,
      totalRequests: [...proxy.values()].reduce((a, b) => a + b, 0)
    }
  } else {
    dumped.proxyLog = { file: PROXY_LOG, error: '代理日志不存在，请以 VITE_LOG_PROXY=true 启动 dev server' }
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(dumped, null, 2))
  const s = dumped.summary || {}
  console.log(`结果已写入 ${OUT}`)
  console.log(
    `前端请求 ${s.total} 条｜客户端发出 ${s.clientIssued}｜服务端收到 ${s.serverSeen}｜双向确认调用后端 ${s.reachedBackend}｜未调用后端 ${s.notReached}`
  )
  if (dumped.proxyLog && dumped.proxyLog.uniqueMethodPath != null) {
    console.log(`代理日志去重后 method+path 共 ${dumped.proxyLog.uniqueMethodPath} 条，累计 ${dumped.proxyLog.totalRequests} 次出行`)
  }
  const bad = (dumped.cases || []).filter((x) => !x.reachedBackend)
  if (bad.length) {
    console.log('未双向确认的用例：')
    for (const x of bad) {
      console.log(`  ${x.id} ${x.method} ${x.path} | 客户端发出=${x.clientIssued} 服务端收到=${x.serverSeen} | HTTP ${x.httpStatus} ${x.message || ''}`)
    }
  }
  if (dumped.fatal) {
    console.log('页面致命错误：')
    console.log(dumped.fatal)
  }
}

main()
  .catch((e) => {
    console.error('执行失败：', e && e.message)
    process.exitCode = 1
  })
  .finally(async () => {
    try {
      ws && ws.close()
    } catch {
      /* ignore */
    }
    edge.kill()
    await sleep(500)
    try {
      rmSync(profile, { recursive: true, force: true })
    } catch {
      /* ignore */
    }
  })
