#!/usr/bin/env node
/**
 * 真实业务页面走查：验证「页面实际运行时发出的请求」是否全部调用后端接口。
 *
 * 与 dev/joint-test.js（逐条覆盖 91 个请求）互补：
 *   测试台证明"每个请求定义都能打通后端"；
 *   本脚本证明"页面真实运行时确实在打后端"，而不是在某个页面里偷偷读了本地数据。
 *
 * 判定依据与测试台一致：客户端网络层探针 ∩ 服务端代理日志。
 * 探针必须注入在文档创建之前 —— 用 CDP 的 Page.addScriptToEvaluateOnNewDocument，
 * 这样每次导航产生的新文档都会先装好钩子，再执行业务 JS。
 *
 * 用法：node scripts/page-walkthrough.mjs [基地址] [输出JSON] [代理日志路径]
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BASE = (process.argv[2] || 'http://127.0.0.1:5173').replace(/\/$/, '')
const OUT = process.argv[3] || join(ROOT, 'verify/page-walkthrough-result.json')
const PROXY_LOG = process.argv[4] || join(ROOT, 'verify/proxy-access.jsonl')
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9224

const ACCOUNT = { username: 'admin', password: 'admin123' }

/**
 * 按角色分组走查：页面能否访问受 RBAC 约束（见 src/router/routes.js 的 meta.roles），
 * 用无权限的角色访问会被重定向到 /404，走查不到该页面真正的业务请求。
 * 因此每个页面都交给「有权访问它」的角色，才能覆盖到真实的页面级请求。
 */
const GROUPS = [
  {
    role: 'ROLE_ADMIN',
    account: { username: 'admin', password: 'admin123' },
    pages: [
      ['首页看板', '/dashboard'],
      ['通知公告', '/notices'],
      ['员工列表', '/employee'],
      ['员工异动', '/employee/changes'],
      ['员工合同', '/employee/contracts'],
      ['部门管理', '/dept'],
      ['岗位管理', '/dept/positions'],
      ['考勤打卡', '/attendance/checkin'],
      ['请假管理', '/attendance/leave'],
      ['加班管理', '/attendance/overtime'],
      ['出差管理', '/attendance/trip'],
      ['考勤月报', '/attendance/monthly'],
      ['工资条', '/salary/payslip'],
      ['用户管理', '/system/user'],
      ['角色管理', '/system/role'],
      ['数据字典', '/system/dict'],
      ['参数配置', '/system/config'],
      ['系统日志', '/system/log']
    ]
  },
  {
    role: 'ROLE_HR',
    account: { username: 'lina', password: 'admin123' },
    pages: [
      ['薪资标准', '/salary/standard'],
      ['薪资核算', '/salary/record'],
      ['招聘需求', '/recruit/request'],
      ['候选人管理', '/recruit/candidate'],
      ['Offer 管理', '/recruit/offer'],
      ['培训计划', '/training/plan'],
      ['绩效计划', '/performance/plan'],
      ['绩效考核', '/performance/record'],
      ['考勤月报', '/attendance/monthly'],
      ['员工合同', '/employee/contracts']
    ]
  },
  {
    role: 'ROLE_EMPLOYEE',
    account: { username: 'linwanqing', password: 'admin123' },
    pages: [
      ['员工档案', '/employee/profile'],
      ['我的培训', '/training/my'],
      ['我的工资条', '/salary/payslip'],
      ['我的打卡', '/attendance/checkin'],
      ['我的请假', '/attendance/leave'],
      ['我的考核', '/performance/record']
    ]
  }
]

/** 注入到每个新文档的网络层探针（须先于业务模块执行） */
const PROBE_SOURCE = `(function () {
  window.__NET__ = []
  var push = function (method, url) {
    window.__NET__.push({ method: String(method || 'GET').toUpperCase(), url: String(url), at: Date.now() })
  }
  var XO = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function (method, url) {
    try { this.__net = { method: method, url: url } } catch (e) {}
    return XO.apply(this, arguments)
  }
  var XS = XMLHttpRequest.prototype.send
  XMLHttpRequest.prototype.send = function () {
    if (this.__net) push(this.__net.method, this.__net.url)
    return XS.apply(this, arguments)
  }
  var OF = window.fetch
  if (OF) {
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url)
      var method = (init && init.method) || (input && input.method) || 'GET'
      push(method, url)
      return OF.apply(this, arguments)
    }
  }
})()`

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const profile = mkdtempSync(join(tmpdir(), 'walk-edge-'))
const edge = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*',
  `--user-data-dir=${profile}`, 'about:blank'
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

async function evaluate(expression, awaitPromise = false) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise })
  if (r.exceptionDetails) return { error: r.exceptionDetails.text || 'evaluate 异常' }
  return { value: r.result?.value }
}

async function findPageTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl)
      if (page) return page
    } catch { /* 还没起来 */ }
    await sleep(500)
  }
  throw new Error('CDP 端点未就绪')
}

function readProxyLog() {
  if (!existsSync(PROXY_LOG)) return null
  const map = new Map()
  for (const line of readFileSync(PROXY_LOG, 'utf8').split('\n')) {
    if (!line.trim()) continue
    let rec
    try { rec = JSON.parse(line) } catch { continue }
    if (rec.phase !== 'req') continue
    const p = String(rec.url || '').split('?')[0]
    map.set(`${String(rec.method || '').toUpperCase()} ${p}`, (map.get(`${String(rec.method || '').toUpperCase()} ${p}`) || 0) + 1)
  }
  return map
}

/** 取当前文档内探针记录到的 /api 出行 */
async function collectApiCalls() {
  const r = await evaluate(`JSON.stringify((window.__NET__ || []).filter(function (x) {
    return String(x.url).indexOf('/api/') >= 0
  }))`)
  if (r.error || !r.value) return []
  try {
    return JSON.parse(r.value).map((x) => {
      const raw = String(x.url)
      let p = raw
      try { p = new URL(raw, location.origin).pathname + (new URL(raw, location.origin).search || '') } catch { /* 相对路径原样 */ }
      return { method: x.method, path: p.split('?')[0] }
    })
  } catch {
    return []
  }
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
    try { msg = JSON.parse(ev.data) } catch { return }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
    }
  })

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Page.addScriptToEvaluateOnNewDocument', { source: PROBE_SOURCE })

  // ---- 1) 逐角色、逐页走查 ----
  const results = []
  const loginLogs = []

  for (const group of GROUPS) {
    // 切换账号：真实调用登录接口拿令牌并写入 localStorage（等价于登录成功后的浏览器状态）
    await send('Page.navigate', { url: `${BASE}/login` })
    await sleep(2500)
    const loginProbe = await evaluate(`(async () => {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(${JSON.stringify(group.account)})
      })
      const body = await res.json()
      if (body && body.data && body.data.token) {
        localStorage.setItem('EHR_TOKEN', body.data.token)
        return JSON.stringify({ ok: true, code: body.code, user: body.data.user && body.data.user.username })
      }
      return JSON.stringify({ ok: false, code: body && body.code, message: body && body.message })
    })()`, true)
    const loginResult = (() => { try { return JSON.parse(loginProbe.value) } catch { return { ok: false, raw: loginProbe } } })()
    loginLogs.push({ role: group.role, account: group.account.username, ...loginResult })
    console.log(`\n【${group.role} / ${group.account.username}】登录${loginResult.ok ? '成功' : '失败 ' + JSON.stringify(loginResult)}`)

    for (const [label, path] of group.pages) {
      await send('Page.navigate', { url: `${BASE}${path}` })
      await sleep(3200)
      const calls = await collectApiCalls()
      const finalUrl = (await evaluate('location.pathname')).value || ''
      results.push({ role: group.role, label, path, finalPath: finalUrl, calls })
      const uniq = [...new Set(calls.map((c) => `${c.method} ${c.path}`))]
      const landed = finalUrl === path ? '' : `  ⚠ 落地 ${finalUrl}`
      console.log(`  ${label.padEnd(10, '　')} ${path.padEnd(22)} 出行 ${String(calls.length).padStart(2)} 条｜去重 ${String(uniq.length).padStart(2)} 个接口${landed}`)
    }
  }

  // ---- 3) 交叉验证：页面出行是否都能在服务端代理日志中找到 ----
  const proxy = readProxyLog()
  let totalCalls = 0
  let confirmed = 0
  const missing = []
  for (const r of results) {
    for (const c of r.calls) {
      totalCalls++
      const hit = proxy ? (proxy.get(`${c.method} ${c.path}`) || 0) > 0 : false
      if (hit) confirmed++
      else missing.push({ page: r.path, api: `${c.method} ${c.path}` })
    }
  }

  const allApis = [...new Set(results.flatMap((r) => r.calls.map((c) => `${c.method} ${c.path}`)))].sort()
  const pagesWithCalls = results.filter((r) => r.calls.length > 0).length
  const landed404 = results.filter((r) => r.finalPath !== r.path)

  const dumped = {
    base: BASE,
    rolesVisited: GROUPS.map((g) => g.role),
    loginLogs,
    navigations: results.length,
    pagesWithCalls,
    landedOn404: landed404.map((r) => ({ role: r.role, page: r.path, landed: r.finalPath })),
    totalCalls,
    uniqueApis: allApis.length,
    confirmedByProxy: confirmed,
    missingFromProxy: missing,
    apis: allApis,
    detail: results,
    proxyLog: proxy ? { file: PROXY_LOG, uniqueMethodPath: proxy.size } : { file: PROXY_LOG, error: '不存在' }
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(dumped, null, 2))

  console.log('')
  console.log(`走查导航 ${results.length} 次（${GROUPS.length} 个角色：${GROUPS.map((g) => g.role).join(', ')}）｜有出行的 ${pagesWithCalls} 次`)
  console.log(`页面实际发出 /api 请求 ${totalCalls} 次｜去重后覆盖 ${allApis.length} 个接口`)
  console.log(`服务端代理日志确认抵达后端 ${confirmed} 次${missing.length ? `｜未确认 ${missing.length} 次` : '（全部抵达）'}`)
  if (landed404.length) {
    console.log(`落地 /404 的导航 ${landed404.length} 次（该角色无此页面权限，属预期）：`)
    for (const r of landed404) console.log(`  ${r.role} → ${r.path}`)
  }
  if (missing.length) {
    console.log('未在代理日志中出现的出行：')
    for (const m of missing.slice(0, 20)) console.log(`  ${m.page} → ${m.api}`)
  }
  console.log(`结果已写入 ${OUT}`)
}

main()
  .catch((e) => {
    console.error('执行失败：', e && e.message)
    process.exitCode = 1
  })
  .finally(async () => {
    try { ws && ws.close() } catch { /* ignore */ }
    edge.kill()
    await sleep(500)
    try { rmSync(profile, { recursive: true, force: true }) } catch { /* ignore */ }
  })
