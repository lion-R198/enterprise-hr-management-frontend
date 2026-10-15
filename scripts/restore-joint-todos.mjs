#!/usr/bin/env node
/**
 * 还原联调测试对演示待办状态的改动。
 *
 * 背景：dashboard 的「处理待办」是页面真实功能，联调测试台会真的处理掉一条待办
 *（否则测不到正向路径）。后端没有"创建待办"的接口，因此无法自建探针待办，
 * 只能处理演示待办并在收尾把状态改回待处理。
 *
 * 本脚本读取 verify/joint-result.json 中记录的 probe.handledTodoIds，
 * 把它们复原为 handle_status=0 / handle_time=NULL。
 *
 * 用法：node scripts/restore-joint-todos.mjs [结果JSON路径]
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const RESULT = process.argv[2] || join(ROOT, 'verify/joint-result.json')
const MYSQL = 'D:/Apps/MySQL8.0/bin/mysql'
const DB = 'enterprise_hr'

if (!existsSync(RESULT)) {
  console.log(`找不到结果文件：${RESULT}`)
  process.exit(0)
}
const data = JSON.parse(readFileSync(RESULT, 'utf8'))
const ids = (data.probe && data.probe.handledTodoIds) || []
if (!ids.length) {
  console.log('本次联调未改动任何待办状态，无需还原。')
  process.exit(0)
}

const sql = `UPDATE todo_task SET handle_status=0, handle_time=NULL WHERE id IN (${ids.join(',')});` +
  `SELECT id, handle_status, handle_time FROM todo_task WHERE id IN (${ids.join(',')});`
const out = execFileSync(MYSQL, ['-uroot', '-p123456', '-D', DB, '-e', sql], { encoding: 'utf8' })
console.log(`已还原 ${ids.length} 条待办：${ids.join(', ')}`)
console.log(out.trim())
