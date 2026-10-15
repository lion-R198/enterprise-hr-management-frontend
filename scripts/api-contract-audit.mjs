#!/usr/bin/env node
/**
 * 接口契约审计 + 数据表覆盖校验 + 运行时结果合并（npm run audit:api）
 *
 * 三层校验：
 *   ①  静态契约：src/api 声明 ↔ src/mock 实现（悬空调用/冗余实现）
 *   ②  数据表覆盖：schema.sql 每张表 → 供给接口 → 使用页面
 *   ③  运行时实测：合并 dev/api-test.html 的 E2E 结果（verify/api-runtime-result.json）
 *
 * 输出：verify/api-audit-report.json（供生成《前端测试用例.xlsx》）
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractApiDecls } from './api-inventory.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')
const SCHEMA = process.env.SCHEMA_PATH || 'D:/Workspace/enterprise-hr-management/enterprise_hr_schema.sql'

// ---------------------------------------------------------------- ① 静态契约
const apiDecls = extractApiDecls()
const mockText = readFileSync(join(SRC, 'mock/index.js'), 'utf8')
const mockRoutes = []
{
  const re = /route\(\s*['"](\w+)['"]\s*,\s*['"]([^'"]+)['"]/g
  let m
  while ((m = re.exec(mockText))) mockRoutes.push({ method: m[1].toUpperCase(), url: m[2] })
}
const normalize = (u) => u.replace(/\$\{[^}]+\}/g, ':param').replace(/:[^/]+/g, ':param')
const mockKeys = new Set(mockRoutes.map((x) => `${x.method} ${normalize(x.url)}`))
const apiKeys = new Set(apiDecls.map((d) => `${d.method} ${normalize(d.url)}`))
const dangling = apiDecls.filter((d) => !mockKeys.has(`${d.method} ${normalize(d.url)}`))
const redundant = mockRoutes.filter((x) => !apiKeys.has(`${x.method} ${normalize(x.url)}`))

// ---------------------------------------------------------------- ② 数据表
function parseSchema(path) {
  if (!existsSync(path)) return []
  const sql = readFileSync(path, 'utf8')
  const tables = []
  const re = /CREATE TABLE `(\w+)` \(([\s\S]*?)\n\) ENGINE[^\n]*COMMENT = '([^']*)'/g
  let m
  while ((m = re.exec(sql))) {
    const [, name, body, comment] = m
    const columns = [...body.matchAll(/^\s*`(\w+)`\s+([a-z]+(?:\([^)]*\))?)/gm)].map((x) => ({ name: x[1], type: x[2] }))
    tables.push({ name, comment, columns: columns.length, fields: columns })
  }
  return tables
}
const tables = parseSchema(SCHEMA)

/** 接口 → 数据表映射（依据 schema 与 mock 实现人工核对） */
const EP_TABLES = {
  'POST /auth/login': ['sys_user', 'sys_user_role', 'sys_role', 'sys_login_log'],
  'GET /auth/me': ['sys_user', 'sys_user_role', 'sys_role', 'employee'],
  'POST /auth/logout': ['sys_login_log'],
  'GET /dashboard/summary': ['employee', 'dept', 'attendance_record', 'todo_task', 'employee_contract'],
  'GET /dashboard/todos': ['todo_task'],
  'GET /dashboard/notices': ['notice', 'notice_read'],
  'GET /dashboard/charts': ['employee', 'dept'],
  'PUT /dashboard/todos/:param/handle': ['todo_task', 'approval_record'],
  'GET /employees/page': ['employee', 'dept', 'position'],
  'GET /employees/:param': ['employee', 'dept', 'position'],
  'POST /employees': ['employee', 'employee_change', 'sys_user'],
  'PUT /employees/:param': ['employee', 'position'],
  'DELETE /employees/:param': ['employee'],
  'PUT /employees/:param/status': ['employee', 'employee_change'],
  'GET /employees/:param/changes': ['employee_change', 'dept', 'position'],
  'POST /employee-changes': ['employee_change', 'employee', 'position'],
  'GET /employee-changes/page': ['employee_change', 'employee', 'dept'],
  'GET /employee-contracts/page': ['employee_contract', 'employee'],
  'POST /employee-contracts': ['employee_contract'],
  'GET /depts/tree': ['dept', 'employee'],
  'GET /depts': ['dept'],
  'POST /depts': ['dept'],
  'PUT /depts/:param': ['dept'],
  'DELETE /depts/:param': ['dept', 'employee'],
  'GET /positions': ['position', 'dept'],
  'POST /positions': ['position'],
  'PUT /positions/:param': ['position'],
  'GET /attendance/today': ['attendance_record', 'shift'],
  'POST /attendance/checkin': ['attendance_record', 'shift'],
  'POST /attendance/checkout': ['attendance_record', 'shift'],
  'GET /attendance/records': ['attendance_record', 'shift'],
  'GET /leave-requests/page': ['leave_request', 'leave_type', 'employee', 'dept'],
  'POST /leave-requests': ['leave_request', 'leave_balance', 'leave_type', 'todo_task', 'approval_record'],
  'PUT /leave-requests/:param/approve': ['leave_request', 'approval_record', 'todo_task'],
  'GET /leave-balances/my': ['leave_balance', 'leave_type'],
  'GET /overtime-requests/page': ['overtime_request', 'employee', 'dept'],
  'POST /overtime-requests': ['overtime_request', 'todo_task'],
  'PUT /overtime-requests/:param/approve': ['overtime_request', 'approval_record'],
  'GET /business-trips/page': ['business_trip', 'employee', 'dept'],
  'POST /business-trips': ['business_trip', 'todo_task'],
  'PUT /business-trips/:param/approve': ['business_trip', 'approval_record'],
  'GET /attendance-months/page': ['attendance_month', 'employee'],
  'PUT /attendance-months/:param/lock': ['attendance_month'],
  'GET /salary-standards/page': ['salary_standard'],
  'POST /salary-standards': ['salary_standard'],
  'GET /salary-records/page': ['salary_record', 'employee', 'dept'],
  'POST /salary-records/calculate': ['salary_record', 'employee', 'attendance_month'],
  'PUT /salary-records/:param/review': ['salary_record'],
  'PUT /salary-records/:param/pay': ['salary_record'],
  'GET /salary/payslips/my': ['salary_record', 'employee'],
  'GET /salary/payslips/:param/items': ['salary_item', 'salary_record'],
  'GET /recruit-requests/page': ['recruit_request', 'dept', 'position', 'employee'],
  'POST /recruit-requests': ['recruit_request', 'employee'],
  'PUT /recruit-requests/:param/approve': ['recruit_request', 'approval_record'],
  'GET /candidates/page': ['candidate', 'recruit_request'],
  'POST /candidates': ['candidate'],
  'PUT /candidates/:param/stage': ['candidate'],
  'GET /interview-records': ['interview_record', 'candidate', 'employee'],
  'POST /interview-records': ['interview_record', 'candidate'],
  'GET /offers/page': ['offer_record', 'candidate', 'recruit_request'],
  'PUT /offers/:param/send': ['offer_record'],
  'PUT /offers/:param/status': ['offer_record', 'candidate'],
  'GET /training-plans/page': ['training_plan', 'course', 'training_enroll'],
  'POST /training-plans': ['training_plan', 'employee'],
  'POST /training-plans/:param/enroll': ['training_enroll', 'training_plan', 'course'],
  'GET /training/my': ['training_record', 'training_enroll', 'training_plan'],
  'GET /performance-plans/page': ['performance_plan', 'performance_indicator', 'performance_record'],
  'POST /performance-plans': ['performance_plan', 'employee'],
  'PUT /performance-plans/:param/publish': ['performance_plan', 'performance_record', 'employee'],
  'GET /performance-records/page': ['performance_record', 'performance_plan', 'employee'],
  'PUT /performance-records/:param/self-score': ['performance_record', 'performance_plan'],
  'PUT /performance-records/:param/leader-score': ['performance_record', 'performance_plan'],
  'PUT /performance-records/:param/confirm': ['performance_record', 'performance_interview'],
  'GET /sys/users/page': ['sys_user', 'sys_user_role', 'sys_role', 'employee'],
  'POST /sys/users': ['sys_user', 'sys_user_role', 'employee'],
  'PUT /sys/users/:param': ['sys_user', 'sys_user_role'],
  'PUT /sys/users/:param/password/reset': ['sys_user'],
  'DELETE /sys/users/:param': ['sys_user', 'sys_user_role'],
  'GET /sys/roles': ['sys_role'],
  'POST /sys/roles': ['sys_role'],
  'PUT /sys/roles/:param': ['sys_role'],
  'GET /sys/dict-types': ['sys_dict_type'],
  'GET /sys/dict-types/:param/items': ['sys_dict_item', 'sys_dict_type'],
  'GET /sys/configs': ['sys_config'],
  'PUT /sys/configs/:param': ['sys_config'],
  'GET /sys/logs/login': ['sys_login_log', 'sys_user'],
  'GET /sys/logs/oper': ['sys_oper_log', 'sys_user'],
  'GET /notices/page': ['notice', 'notice_read', 'employee'],
  'POST /notices': ['notice', 'employee'],
  'PUT /notices/:param/publish': ['notice'],
  'PUT /notices/:param/offline': ['notice']
}

/** 未被接口覆盖的表：归属说明（前端静态实现 / 后续迭代 / 需补接口） */
const TABLE_GAPS = {
  sys_menu: { status: '前端静态实现', note: '菜单权限由前端路由 meta.roles 矩阵静态定义（与需求 2.5 一致）；后端菜单管理接口（F-09-03）本期未对接' },
  sys_role_menu: { status: '需补接口', note: '角色-菜单授权建议补 GET/PUT /api/sys/roles/{id}/menus；当前角色页仅维护数据范围' },
  sys_user_role: { status: '联表返回', note: '用户角色随 /api/sys/users 与 /api/auth/me 的 roles 字段返回，无需独立接口' },
  employee_attachment: { status: '需补接口', note: '员工附件（证件/学历扫描件）建议补 POST /api/employees/{id}/attachments 与列表接口，页面支持上传' },
  employee_schedule: { status: '需补接口', note: '排班管理（F-04-05）建议补 GET/POST /api/employee-schedules 与排班页面' },
  employee_salary: { status: '需补接口', note: '员工个人薪资标准建议补 GET/PUT /api/employees/{id}/salary（当前由核算接口按 employee.salary 计算）' },
  insurance_config: { status: '需补接口', note: '社保公积金配置当前在核算逻辑中按固定比例计算，未读取配置表；建议补 GET/PUT /api/insurance-configs 与社保管理页面（F-05-04）' },
  insurance_record: { status: '需补接口', note: '社保缴纳记录无独立接口；建议随社保管理页补 GET /api/insurance-records' },
  job_posting: { status: '需补接口', note: '职位发布（F-06-02）建议补 GET/POST /api/job-postings，并与招聘需求联动' },
  trainer: { status: '需补接口', note: '讲师表（training）无接口；mock 已备数据但未下发，建议补 GET/POST /api/trainers 或随培训计划返回' },
  notice_read: { status: '联表返回', note: '公告已读由 read_count / 已读记录联表返回，如需"已读/未读"标记建议补 GET /api/notices/{id}/reads' },
  attendance_record: { status: '已覆盖', note: '' },
  shift: { status: '联表返回', note: '班次随 /api/attendance/today 返回；如需班次维护建议补 GET/POST /api/shifts' },
  leave_type: { status: '联表返回', note: '假别随请假接口返回；如需维护建议补 GET /api/leave-types' },
  course: { status: '联表返回', note: '课程随培训计划接口返回' },
  performance_indicator: { status: '联表返回', note: '考核指标随考核方案接口返回；如需维护建议补 GET/POST /api/performance-indicators' },
  salary_item: { status: '联表返回', note: '薪资明细随薪资条明细接口返回' }
}

const epTableMap = new Map()
for (const [k, v] of Object.entries(EP_TABLES)) epTableMap.set(k, v)

// 表 → 接口 / 页面（页面信息来自运行时测试用例的 module/page）
const runtimePath = join(ROOT, 'verify/api-runtime-result.json')
const runtime = existsSync(runtimePath) ? JSON.parse(readFileSync(runtimePath, 'utf8')) : null

const pageByEndpoint = new Map()
if (runtime) {
  for (const r of runtime.results) {
    const key = `${r.method} ${normalize(r.url.replace(/^\/api/, ''))}`
    if (!pageByEndpoint.has(key)) pageByEndpoint.set(key, { pages: new Set(), modules: new Set(), roles: new Set(), caseIds: [], statuses: [] })
    const e = pageByEndpoint.get(key)
    e.pages.add(r.page)
    e.modules.add(r.module)
    e.roles.add(r.role)
    e.caseIds.push(r.id)
    e.statuses.push(r.ok ? '通过' : '失败')
  }
}

const FILE_MODULE = {
  'auth.js': '认证',
  'dashboard.js': '首页看板',
  'employee.js': '员工档案',
  'dept.js': '部门管理',
  'attendance.js': '考勤管理',
  'salary.js': '薪资管理',
  'recruit.js': '招聘管理',
  'training.js': '培训管理',
  'performance.js': '绩效考核',
  'system.js': '系统设置'
}
const endpoints = apiDecls.map((d, i) => {
  const key = `${d.method} ${normalize(d.url)}`
  const info = pageByEndpoint.get(key)
  // system.js 内按 URL 再分出"通知公告"
  const module = d.url.startsWith('/notices') ? '通知公告' : (FILE_MODULE[d.file] || d.file.replace('.js', ''))
  const section = (d.section || '').replace(/^[-=\s]+|[-=\s]+$/g, '')
  return {
    seq: i + 1,
    module,
    section,
    file: d.file,
    fn: d.fn,
    name: d.desc || (section ? `${section} · ${d.fn}` : d.fn),
    method: d.method,
    url: `/api${d.url}`,
    urlMock: d.url,
    args: d.args,
    tables: epTableMap.get(key) || [],
    pages: info ? [...info.pages] : [],
    roles: info ? [...info.roles] : [],
    caseIds: info ? info.caseIds : [],
    mockImplemented: mockKeys.has(key),
    runtimeTested: !!info,
    runtimePassed: info ? info.statuses.every((s) => s === '通过') : false
  }
})

const tableCoverage = tables.map((t) => {
  const eps = endpoints.filter((e) => e.tables.includes(t.name))
  const pages = new Set()
  eps.forEach((e) => e.pages.forEach((p) => pages.add(p)))
  const gap = TABLE_GAPS[t.name]
  const covered = eps.length > 0
  return {
    name: t.name,
    comment: t.comment,
    columns: t.columns,
    endpoints: eps.map((e) => `${e.method} ${e.url}`),
    pages: [...pages],
    covered,
    status: covered ? '已覆盖' : (gap?.status || '需补接口'),
    note: covered ? (gap?.note || '由上述接口直接供给') : (gap?.note || '暂未发现对应请求地址，建议补充')
  }
})

// ---------------------------------------------------------------- 前端本地配置
function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}
const dictText = readFileSync(join(SRC, 'dict/index.js'), 'utf8')
const dictGroups = [...dictText.matchAll(/^\s{2}(\w+):\s*\[/gm)].map((m) => m[1])
const settingsText = readFileSync(join(SRC, 'settings.js'), 'utf8')
const configFiles = [...walk(join(SRC, 'config')), ...walk(join(SRC, 'constants'))]

const localConfig = [
  { item: 'src/dict/index.js', type: '业务字典', count: `${dictGroups.length} 组`, stay: '允许留在前端', reason: `与 DB 字段 COMMENT 同源（${dictGroups.slice(0, 8).join('、')}…），枚举文案/标签色属展示层规则；后端接通后可改为 /api/sys/dict-types 下发与字典表对齐`, endpoint: 'GET /api/sys/dict-types · GET /api/sys/dict-types/{id}/items（管理端已实现，业务页暂用本地字典）' },
  { item: 'src/settings.js', type: '系统常量', count: '演示账号 5 条 + 标题/预警天数', stay: '允许留在前端', reason: '标题为 UI 配置；演示账号仅 mock 通道使用；合同到期预警天数属展示层兜底（与 sys_config 同步）', endpoint: 'GET /api/sys/configs（管理端已实现）' },
  { item: 'src/utils/format.js', type: '展示层规则', count: '6 个函数', stay: '允许留在前端', reason: '金额千分位/日期格式/脱敏展示属展示层；数据层（mock 的 empVO 与后端 VO）已同步脱敏，避免仅靠前端遮蔽', endpoint: '—（非数据来源）' },
  { item: 'src/router/routes.js', type: '路由/权限矩阵', count: `${9} 个模块`, stay: '允许留在前端', reason: '路由与 meta.roles 与需求 2.5 权限矩阵一致；菜单权限表（sys_menu）本期由前端静态定义，后端菜单管理未对接', endpoint: '—（建议后续对接 GET /api/sys/menus）' },
  { item: 'src/mock/db.js', type: '模拟数据', count: `${tables.length} 张表映射数据集`, stay: '仅开发环境', reason: 'VITE_USE_MOCK=true 时生效；生产构建 .env.production 已置为 false，切换真实 API 无需改动业务代码', endpoint: '全部 91 个请求地址' }
]

// ---------------------------------------------------------------- 报告
const report = {
  generatedAt: new Date().toLocaleString('zh-CN'),
  schema: SCHEMA,
  useMock: true,
  summary: {
    endpoints: endpoints.length,
    tables: tables.length,
    tableCovered: tableCoverage.filter((t) => t.covered).length,
    tableGap: tableCoverage.filter((t) => !t.covered).length,
    mockRoutes: mockRoutes.length,
    dangling: dangling.length,
    redundant: redundant.length,
    dictGroups: dictGroups.length,
    runtimeTotal: runtime?.total || 0,
    runtimePassed: runtime?.passed || 0,
    runtimeFailed: runtime?.failed || 0,
    ruleCases: runtime ? runtime.results.filter((r) => r.status === '通过（业务规则已拦截）').length : 0
  },
  endpoints,
  tables: tableCoverage,
  configLocal: localConfig,
  runtime: runtime ? { generatedAt: runtime.generatedAt, useMock: runtime.useMock, total: runtime.total, passed: runtime.passed, failed: runtime.failed } : null,
  runtimeCases: runtime ? runtime.results : [],
  dangling,
  redundant
}

writeFileSync(join(ROOT, 'verify/api-audit-report.json'), JSON.stringify(report, null, 2), 'utf8')

// ---------------------------------------------------------------- 控制台报告
const s = report.summary
console.log('================ 接口契约审计 + 数据表覆盖校验 ================')
console.log(`请求地址（src/api 声明）: ${s.endpoints}`)
console.log(`mock 路由实现            : ${s.mockRoutes}`)
console.log(`契约匹配                 : ${s.endpoints - s.dangling}`)
console.log(`悬空调用                 : ${dangling.length}${dangling.length ? ' ❌' : ' ✅'}`)
dangling.forEach((d) => console.log(`   - ${d.method} ${d.url} (${d.file} → ${d.fn})`))
console.log(`冗余实现                 : ${redundant.length}${redundant.length ? ' ⚠️' : ' ✅'}`)
redundant.forEach((d) => console.log(`   - ${d.method} ${d.url}`))
console.log('')
console.log(`建表 SQL 表总数          : ${s.tables}`)
console.log(`已被请求地址覆盖         : ${s.tableCovered}`)
console.log(`未覆盖（需补/静态实现）  : ${s.tableGap}`)
tableCoverage.filter((t) => !t.covered).forEach((t) => console.log(`   - ${t.name}（${t.comment}）→ ${t.status}｜${t.note}`))
console.log('')
if (runtime) {
  console.log(`运行时 E2E 用例          : ${s.runtimeTotal}（通过 ${s.runtimePassed} / 失败 ${s.runtimeFailed}）`)
  console.log(`业务规则拦截断言         : ${s.ruleCases} 条`)
} else {
  console.log('运行时 E2E 用例          : 未执行（先跑 dev/api-test.html 并提取结果）')
}
console.log('')
console.log(`报告已写入：verify/api-audit-report.json`)
console.log('==============================================================')
process.exit(s.dangling.length ? 1 : 0)
