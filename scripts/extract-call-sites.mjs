#!/usr/bin/env node
/**
 * 提取「前端请求 → 页面调用实参」对照表。
 *
 * 目的：联调以前端请求为基准，因此必须知道每个 api 函数在页面里被传入的真实载荷字段，
 * 而不是靠猜。输出用于与后端 DTO 字段名逐项比对，定位字段名不一致的联调缺陷。
 *
 * 用法：node scripts/extract-call-sites.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// 1) 收集 src/api 的函数声明
const apiDir = join(ROOT, 'src/api')
const fns = []
for (const f of readdirSync(apiDir).filter((x) => x.endsWith('.js'))) {
  const t = readFileSync(join(apiDir, f), 'utf8')
  for (const m of t.matchAll(/export\s+function\s+(\w+)\s*\(([^)]*)\)/g)) {
    fns.push({ mod: f.replace('.js', ''), fn: m[1], args: m[2].trim() })
  }
}
const fnNames = new Set(fns.map((x) => x.fn))

// 2) 收集页面里的调用实参
const calls = {}
const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) {
      walk(p)
      continue
    }
    if (!/\.(vue|js)$/.test(e.name)) continue
    const t = readFileSync(p, 'utf8')
    const rel = p.slice(ROOT.length + 1).split('\\').join('/')
    for (const m of t.matchAll(/(\w+)\s*\(([^()]{0,200})\)/g)) {
      const name = m[1]
      if (!fnNames.has(name)) continue
      const line = t.slice(0, m.index).split('\n').length
      ;(calls[name] = calls[name] || []).push(`${rel}:${line}  ${m[0].replace(/\s+/g, ' ').trim()}`)
    }
  }
}
for (const d of ['src/views', 'src/store', 'src/layout']) {
  try {
    if (statSync(join(ROOT, d)).isDirectory()) walk(join(ROOT, d))
  } catch {
    /* 目录不存在 */
  }
}

// 3) 输出
for (const x of fns) {
  const c = calls[x.fn] || []
  console.log(`${x.mod}.${x.fn}(${x.args})`)
  if (!c.length) console.log('      (视图中未直接调用)')
  for (const s of c.slice(0, 3)) console.log('      ' + s)
}
console.log('')
console.log(`函数总数 ${fns.length}；有调用点的 ${fns.filter((x) => (calls[x.fn] || []).length).length}`)
