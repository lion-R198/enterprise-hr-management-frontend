#!/usr/bin/env node
/**
 * 提取页面表单（reactive({...})）的字段名，用于对齐联调载荷。
 *
 * 联调以前端请求为基准，因此载荷必须以页面表单的真实字段为准，
 * 不能由测试脚本自行猜测字段名（猜错会把"脚本问题"误报成"接口问题"）。
 *
 * 用法：node scripts/extract-forms.mjs [文件路径片段]
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const filter = process.argv[2] || ''

const walk = (dir, out = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.vue$/.test(e.name)) out.push(p)
  }
  return out
}

const files = walk(join(ROOT, 'src/views')).filter((p) => p.includes(filter))
for (const p of files) {
  const t = readFileSync(p, 'utf8')
  const rel = p.slice(ROOT.length + 1).split('\\').join('/')
  const blocks = []
  for (const m of t.matchAll(/reactive\(\s*\{/g)) {
    // 括号配对，取出对象字面量
    let i = m.index + m[0].length - 1
    let depth = 0
    let end = -1
    for (let k = i; k < t.length; k++) {
      if (t[k] === '{') depth++
      else if (t[k] === '}') {
        depth--
        if (depth === 0) {
          end = k
          break
        }
      }
    }
    if (end < 0) continue
    const body = t.slice(i + 1, end)
    // 只取对象顶层字段：维护花括号/方括号深度，仅深度 0 处的 `key:` 计入
    const keys = []
    let bd = 0
    let sd = 0
    let token = ''
    for (let k = 0; k < body.length; k++) {
      const ch = body[k]
      if (ch === '{') bd++
      else if (ch === '}') bd--
      else if (ch === '[') sd++
      else if (ch === ']') sd--
      if (bd === 0 && sd === 0) {
        if (ch === ':') {
          const m2 = token.match(/([A-Za-z_$][\w$]*)\s*$/)
          if (m2 && !token.includes('?') && !token.includes('=>')) keys.push(m2[1])
          token = ''
          continue
        }
        if (ch === ',' || ch === '\n') token = ''
        else token += ch
      }
    }
    if (keys.length) blocks.push([...new Set(keys)])
  }
  if (!blocks.length) continue
  console.log(`--- ${rel}`)
  blocks.forEach((k, i) => console.log(`    form[${i}] (${k.length}) ${k.join(', ')}`))
}
