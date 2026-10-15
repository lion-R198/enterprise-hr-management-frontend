#!/usr/bin/env node
/**
 * 静态检查：mock handler 使用了 ctx 字段（user/params/query/body）但未在参数解构中声明
 * 这类问题在运行时表现为 ReferenceError，页面只看到"xx is not defined"
 * 用法：node scripts/check-mock-ctx.mjs
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const text = readFileSync(join(ROOT, 'src/mock/index.js'), 'utf8')
const lines = text.split('\n')

// 按 route( 声明切段：handler 本体 = 从声明行到第一个以 "})" 结尾的行（避免把同段辅助函数/分发器算进来）
const segments = []
lines.forEach((line, i) => {
  const m = line.match(/^route\(\s*'(\w+)'\s*,\s*'([^']+)'\s*,\s*(.*)$/)
  if (!m) return
  const body = [line]
  if (!line.trimEnd().endsWith('})')) {
    for (let k = i + 1; k < lines.length; k++) {
      if (/^route\(/.test(lines[k])) break
      body.push(lines[k])
      if (lines[k].trimEnd().endsWith('})')) break
    }
  }
  segments.push({ method: m[1], url: m[2], header: m[3], line: i + 1, body: body.join('\n') })
})

const FIELDS = ['user', 'params', 'query', 'body']
const problems = []
for (const s of segments) {
  const decl = s.header
  if (!decl.includes('(')) continue // 无参数 handler（如 () => ...）
  const bodyOnly = s.body.slice(s.body.indexOf(decl) + decl.length)
  for (const f of FIELDS) {
    const declared = new RegExp(`[{,\\s]${f}[,}\\s=]`).test(decl)
    const used = new RegExp(`\\b${f}\\.[a-zA-Z_]`).test(bodyOnly)
    if (used && !declared) problems.push({ method: s.method, url: s.url, field: f, line: s.line })
  }
}

console.log(`检查 mock 路由 ${segments.length} 条`)
if (!problems.length) {
  console.log('✅ 未发现"使用未解构 ctx 字段"的问题')
} else {
  console.log(`❌ 发现 ${problems.length} 处未解构即使用的 ctx 字段（运行时 ReferenceError）：`)
  for (const p of problems) console.log(`   - L${p.line} ${p.method} ${p.url} → 使用了 ${p.field}.* 但未解构`)
  process.exit(1)
}
