#!/usr/bin/env node
/**
 * 接口清单导出（临时工具）：列出 src/api/*.js 中所有声明的请求地址
 * 用法：node scripts/api-inventory.mjs
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** 提取文件内所有 export function 及其 url/method/说明 */
export function extractApiDecls(dir = join(ROOT, 'src/api')) {
  const rows = []
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.js')) continue
    const text = readFileSync(join(dir, f), 'utf8')
    const lines = text.split('\n')
    const re = /export\s+function\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\n\}/g
    let m
    while ((m = re.exec(text))) {
      const [, fn, args, body] = m
      const url = (body.match(/url:\s*[`'"]([^`'"]+)[`'"]/) || [])[1]
      const method = (body.match(/method:\s*['"](\w+)['"]/) || [])[1] || 'get'
      if (!url) continue
      // 回溯说明：优先 JSDoc（单行/多行），其次上一行 // 注释，其次最近的分节注释
      const before = text.slice(0, m.index)
      const linesBefore = before.split('\n')
      let desc = ''
      let i = linesBefore.length - 1
      while (i >= 0 && linesBefore[i].trim() === '') i--
      if (i >= 0 && linesBefore[i].trim().endsWith('*/')) {
        const buf = []
        const endLine = linesBefore[i].trim()
        if (endLine.startsWith('/**')) {
          // 单行 JSDoc：/** 说明 */
          desc = endLine.replace(/^\/\*\*/, '').replace(/\*\/$/, '').trim()
        } else {
          buf.unshift(endLine.replace(/\*\/$/, ''))
          i--
          while (i >= 0 && !linesBefore[i].trim().startsWith('/**')) {
            buf.unshift(linesBefore[i].replace(/^\s*\*?\s?/, ''))
            i--
          }
          if (i >= 0) buf.unshift(linesBefore[i].trim().replace(/^\/\*\*/, ''))
          desc = buf.join(' ').trim()
        }
      } else if (i >= 0 && linesBefore[i].trim().startsWith('//')) {
        desc = linesBefore[i].trim().replace(/^\/\/\s*/, '')
      }
      let section = ''
      for (let k = i; k >= 0; k--) {
        if (/^\/\/\s*-{3,}/.test(linesBefore[k].trim()) || /^\/\/\s*={3,}/.test(linesBefore[k].trim())) {
          section = linesBefore[k].replace(/^\/\/[-\s=]+/, '').replace(/[-\s=]+$/, '').trim()
          break
        }
      }
      rows.push({
        file: f,
        fn,
        args: args.trim() || '-',
        method: method.toUpperCase(),
        url,
        desc: (desc || '').replace(/\s+/g, ' ').trim(),
        section
      })
    }
  }
  return rows
}

if (process.argv[1] && process.argv[1].endsWith('api-inventory.mjs')) {
  const rows = extractApiDecls()
  console.log(`TOTAL ${rows.length}`)
  rows.forEach((r, i) =>
    console.log(`${i + 1}\t${r.file}\t${r.method}\t${r.url}\t${r.fn}\t${r.args}\t${r.desc || r.section}`)
  )
  console.log('')
  const byFile = {}
  for (const r of rows) byFile[r.file] = (byFile[r.file] || 0) + 1
  console.log('BY FILE', JSON.stringify(byFile))
}
