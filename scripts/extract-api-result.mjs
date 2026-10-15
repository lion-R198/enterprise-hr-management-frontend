#!/usr/bin/env node
/**
 * 从无头浏览器导出的 DOM 中提取运行时测试结果（base64 → JSON）
 * 用法：node scripts/extract-api-result.mjs <dom.html> <输出.json>
 */
import { readFileSync, writeFileSync } from 'node:fs'

const [, , domPath = 'verify/api-test-dom.html', outPath = 'verify/api-runtime-result.json'] = process.argv
const html = readFileSync(domPath, 'utf8')
const m = html.match(/<pre id="apiresult">([\s\S]*?)<\/pre>/)
if (!m) {
  console.error('❌ 未在 DOM 中找到 #apiresult（页面可能未跑完）')
  process.exit(1)
}
const b64 = m[1].trim()
if (!b64) {
  console.error('❌ #apiresult 为空，测试可能仍在运行（可调大 --virtual-time-budget）')
  process.exit(1)
}
const json = Buffer.from(b64, 'base64').toString('utf8')
const data = JSON.parse(json)
writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8')
console.log(`✅ 运行时测试结果已提取：${outPath}`)
console.log(`   用例 ${data.total} · 通过 ${data.passed} · 失败 ${data.failed}`)
if (data.failed) {
  console.log('   失败用例：')
  for (const r of data.results.filter((x) => !x.ok)) console.log(`   - ${r.id} ${r.method} ${r.url} [${r.role}] ${r.status} :: ${r.message || r.sample}`)
}
