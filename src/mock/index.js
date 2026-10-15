/**
 * 【已归档 · 不再被任何代码引用】
 *
 * 前后端联调要求：前端所有请求必须调用后端接口。本文件已从请求链路上移除
 * （src/utils/request.js 已无任何 mock 分支），无法通过环境变量复活。
 *
 * 请勿在本文件继续开发或修改；需求变更请改后端接口。
 * 保留此文件仅为追溯历史 mock 实现口径（字段命名、数据范围规则）。
 *
 * ---------------------------------------------------------------------------
 * Mock 分发器（历史实现）
 *  - 与真实后端契约一致：URL 以 /api 为前缀（request.js 已拼接），统一 {code,message,data} 信封由本层解包
 *  - 返回"已解包的 data"，与 axios 拦截器 return res.data 契约完全一致
 *  - 令牌校验：仅校验格式并还原用户（模拟 JWT 解码），避免页面刷新后强制重登
 *  - 数据范围（BR-05 / NF-10）：主管=本部门，员工=仅本人，越权返回 403
 */
import { ElMessage } from 'element-plus'
import * as db from './db'

// ---------------- 工具 ----------------
let nextId = 100000
const genId = () => ++nextId
const money = (n) => Math.round(n * 100) / 100

/**
 * mock 令牌解析：mock-jwt.<userId>.<timestamp>
 * 原位于 src/utils/auth.js，前端统一真实后端通道后已从该活跃模块移除，
 * 此处内联保留仅为让本归档文件自身保持自洽（本文件不参与任何构建与运行）。
 */
function parseMockToken(token) {
  if (!token || !token.startsWith('mock-jwt.')) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const userId = Number(parts[1])
  return Number.isFinite(userId) ? { userId, issuedAt: Number(parts[2]) } : null
}

const now = () => {
  const d = new Date()
  const p = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
const today = () => now().slice(0, 10)

/** 分页封装 */
function paginate(list, { current = 1, size = 10 } = {}) {
  const total = list.length
  const start = (current - 1) * size
  return { records: list.slice(start, start + size), total, current: Number(current), size: Number(size) }
}

/** 业务错误（如 BR-03-02 部门有在职员工禁止删除） */
function fail(message, code = 400) {
  throw { code, message }
}

function requireFields(body, fields) {
  for (const f of fields) {
    if (body[f] === undefined || body[f] === null || body[f] === '') {
      fail(`缺少必填字段：${f}`)
    }
  }
}

/** 员工脱敏视图（NF-08：数据层直接脱敏） */
function empVO(e) {
  return { ...e, id_card: e.id_card ? e.id_card.slice(0, 6) + '**********' + e.id_card.slice(-2) : null }
}

function empName(id) {
  const e = db.employees.find((x) => x.id === id)
  return e ? e.name : `#${id}`
}
function deptName(id) {
  const d = db.depts.find((x) => x.id === id)
  return d ? d.name : `#${id}`
}

/** 关联展示字段（联表返回，模拟后端 VO） */
function joinEmployee(list) {
  return list.map((r) => ({
    ...r,
    employee_name: empName(r.employee_id),
    emp_no: (db.employees.find((x) => x.id === r.employee_id) || {}).emp_no,
    dept_name: deptName(r.dept_id || (db.employees.find((x) => x.id === r.employee_id) || {}).dept_id)
  }))
}

/** 数据范围过滤：主管本部门、员工仅本人（NF-10） */
function scopeEmployees(user) {
  const roles = user.roles || []
  if (roles.includes('ROLE_HR') || roles.includes('ROLE_ADMIN') || roles.includes('ROLE_FINANCE') || roles.includes('ROLE_EXECUTIVE')) {
    return db.employees
  }
  if (roles.includes('ROLE_MANAGER')) return db.employees.filter((e) => e.dept_id === user.deptId)
  return db.employees.filter((e) => e.id === user.employeeId)
}

// ---------------- 路由表 ----------------
// handler(ctx) ctx = { user, params, query, body }
const routes = []
function route(method, pattern, handler) {
  routes.push({ method: method.toUpperCase(), pattern, handler, keys: [] })
  const keys = pattern.split('/').filter((s) => s.startsWith(':')).map((s) => s.slice(1))
  routes[routes.length - 1].keys = keys
}

function matchRoute(method, url) {
  const path = url.split('?')[0].replace(/\/+$/, '') || '/'
  for (const r of routes) {
    if (r.method !== method.toUpperCase()) continue
    const pp = r.pattern.split('/').filter(Boolean)
    const up = path.split('/').filter(Boolean)
    if (pp.length !== up.length) continue
    const params = {}
    let ok = true
    for (let i = 0; i < pp.length; i++) {
      if (pp[i].startsWith(':')) params[pp[i].slice(1)] = up[i]
      else if (pp[i] !== up[i]) { ok = false; break }
    }
    if (ok) return { route: r, params }
  }
  return null
}

// ============================================================
// 认证
// ============================================================
route('POST', '/auth/login', ({ body }) => {
  requireFields(body, ['username', 'password'])
  const u = db.users.find((x) => x.username === body.username)
  if (!u || u.password !== body.password) fail('用户名或密码错误', 400)
  if (u.status === 0) fail('账号已停用，请联系系统管理员', 403)
  if (u.status === 2) fail('账号已锁定，请 30 分钟后重试或联系管理员', 403)
  u.last_login_time = now()
  const token = `mock-jwt.${u.id}.${Date.now()}`
  return {
    token,
    user: { id: u.id, username: u.username, realName: u.real_name, employeeId: u.employee_id, deptId: u.dept_id, roles: u.roles, avatar: null }
  }
})

route('GET', '/auth/me', ({ user }) => {
  const u = db.users.find((x) => x.id === user.id)
  return { id: u.id, username: u.username, realName: u.real_name, employeeId: u.employee_id, deptId: u.dept_id, roles: u.roles, avatar: null }
})

route('POST', '/auth/logout', () => ({ success: true }))

// ============================================================
// 首页看板
// ============================================================
route('GET', '/dashboard/summary', ({ user }) => {
  const scope = scopeEmployees(user)
  const active = scope.filter((e) => e.status === 1 || e.status === 2)
  const deptIds = [...new Set(active.map((e) => e.dept_id))]
  const ym = today().slice(0, 7)
  return {
    totalEmployees: active.length,
    monthHired: scope.filter((e) => (e.hire_date || '').startsWith(ym)).length,
    monthLeft: scope.filter((e) => (e.leave_date || '').startsWith(ym)).length,
    deptCount: deptIds.length,
    headcountLimit: db.depts.filter((d) => deptIds.includes(d.id)).reduce((s, d) => s + d.headcount_limit, 0),
    attendanceAbnormal: db.attendanceRecords.filter((r) => r.attendance_date === today() && [2, 3, 4, 5].includes(r.attendance_status) && scope.some((e) => e.id === r.employee_id)).length,
    pendingApprovals: db.todos.filter((t) => t.receiver_id === user.employeeId && t.handle_status === 0 && t.task_type === 1).length,
    contractExpiring: db.contracts.filter((c) => c.end_date && scope.some((e) => e.id === c.employee_id)).filter((c) => { const diff = (new Date(c.end_date) - new Date()) / 86400000; return diff > 0 && diff <= 60 }).length
  }
})

route('GET', '/dashboard/todos', ({ user }) => {
  const list = db.todos.filter((t) => t.receiver_id === user.employeeId && t.handle_status === 0)
  return { records: list, total: list.length }
})

route('PUT', '/dashboard/todos/:id/handle', ({ params, user }) => {
  const t = db.todos.find((x) => x.id === Number(params.id))
  if (!t) fail('待办不存在', 404)
  if (t.receiver_id !== user.employeeId) fail('无权处理他人待办', 403)
  t.handle_status = 1
  t.handle_time = now()
  return { success: true }
})

route('GET', '/dashboard/notices', () => {
  const list = db.notices.filter((n) => n.status === 2).sort((a, b) => (b.is_top - a.is_top) || (b.publish_time > a.publish_time ? 1 : -1))
  return { records: list, total: list.length }
})

route('GET', '/dashboard/charts', () => {
  const deptDistribution = db.depts
    .filter((d) => d.dept_type === 3 || d.dept_type === 2)
    .map((d) => ({ name: d.name, value: db.employees.filter((e) => e.dept_id === d.id && e.status !== 0).length }))
  const trend = []
  for (let i = 5; i >= 0; i--) {
    const m = new Date()
    m.setMonth(m.getMonth() - i)
    const ym = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`
    trend.push({
      month: ym,
      hired: 2 + ((i * 3) % 5),
      left: (i * 2) % 3
    })
  }
  const grades = ['S', 'A', 'B', 'C', 'D'].map((g) => ({ name: g, value: db.perfRecords.filter((r) => r.grade === g && r.plan_id === 1).length }))
  return { deptDistribution, trend, perfGrades: grades }
})

// ============================================================
// 员工信息
// ============================================================
route('GET', '/employees/page', ({ user, query }) => {
  let list = scopeEmployees(user)
  const kw = (query.keyword || '').trim()
  if (kw) list = list.filter((e) => e.name.includes(kw) || e.emp_no.includes(kw.toUpperCase()) || (e.phone || '').includes(kw))
  if (query.deptId) list = list.filter((e) => e.dept_id === Number(query.deptId))
  if (query.positionId) list = list.filter((e) => e.position_id === Number(query.positionId))
  if (query.status !== undefined && query.status !== '') list = list.filter((e) => e.status === Number(query.status))
  list = [...list].sort((a, b) => a.emp_no.localeCompare(b.emp_no))
  return paginate(list.map(empVO), query)
})

route('GET', '/employees/:id', ({ params, user }) => {
  const e = db.employees.find((x) => x.id === Number(params.id))
  if (!e) fail('员工不存在', 404)
  const roles = user.roles || []
  // NF-10 行级数据隔离：普通员工仅可查看本人档案
  if (roles.includes('ROLE_EMPLOYEE') && e.id !== user.employeeId) fail('无权查看他人档案', 403)
  return { ...empVO(e), dept_name: deptName(e.dept_id), manager_name: e.manager_id ? empName(e.manager_id) : null }
})

route('POST', '/employees', ({ body }) => {
  requireFields(body, ['name', 'deptId', 'positionId'])
  if (body.salary !== undefined && body.salary !== null && Number(body.salary) < 0) fail('薪资不得为负数（BR-02-02）')
  const maxId = Math.max(...db.employees.map((e) => e.id))
  const emp = {
    id: maxId + 1,
    emp_no: `E${String(maxId + 1).padStart(4, '0')}`, // BR-02-01 工号系统自动生成且不可修改
    name: body.name,
    gender: body.gender || 'U',
    phone: body.phone || null,
    email: body.email || null,
    id_card: body.idCard || null,
    education: body.education || null,
    graduate_school: body.graduateSchool || null,
    major: body.major || null,
    dept_id: Number(body.deptId),
    position_id: Number(body.positionId),
    position: (db.positions.find((p) => p.id === Number(body.positionId)) || {}).position_name || '',
    job_level: body.jobLevel || null,
    employee_type: body.employeeType || 1,
    hire_date: body.hireDate || today(),
    status: 3,
    manager_id: body.managerId ? Number(body.managerId) : null,
    salary: body.salary ? Number(body.salary) : null,
    bank_name: body.bankName || null,
    bank_account: body.bankAccount || null,
    remark: body.remark || ''
  }
  db.employees.push(emp)
  db.employeeChanges.push({
    id: genId(), employee_id: emp.id, change_type: 1, before_dept_id: null, after_dept_id: emp.dept_id,
    before_position: null, after_position: emp.position, before_salary: null, after_salary: emp.salary,
    effect_date: emp.hire_date, reason: '入职办理', approval_status: 2, operator_id: 2, apply_no: null
  })
  return { id: emp.id, empNo: emp.emp_no }
})

route('PUT', '/employees/:id', ({ params, body }) => {
  const e = db.employees.find((x) => x.id === Number(params.id))
  if (!e) fail('员工不存在', 404)
  if (body.salary !== undefined && body.salary !== null && Number(body.salary) < 0) fail('薪资不得为负数（BR-02-02）')
  const allow = ['gender', 'phone', 'email', 'address', 'emergency_contact', 'emergency_phone', 'education', 'graduate_school', 'major', 'marital_status', 'political_status', 'job_level', 'bank_name', 'remark']
  for (const k of allow) if (body[k] !== undefined) e[k] = body[k]
  if (body.deptId) e.dept_id = Number(body.deptId)
  if (body.positionId) {
    e.position_id = Number(body.positionId)
    e.position = (db.positions.find((p) => p.id === e.position_id) || {}).position_name || e.position
  }
  if (body.managerId !== undefined) e.manager_id = body.managerId ? Number(body.managerId) : null
  if (body.salary !== undefined && body.salary !== null) e.salary = Number(body.salary)
  return { success: true }
})

route('DELETE', '/employees/:id', ({ params }) => {
  const e = db.employees.find((x) => x.id === Number(params.id))
  if (!e) fail('员工不存在', 404)
  // BR-02-03 逻辑删除：仅置状态标记，历史数据保留可追溯
  e.status = 0
  e.leave_date = today()
  return { success: true }
})

route('PUT', '/employees/:id/status', ({ params, body, user }) => {
  const e = db.employees.find((x) => x.id === Number(params.id))
  if (!e) fail('员工不存在', 404)
  const to = Number(body.status)
  // BR-02-04 状态变更需留痕
  db.employeeChanges.push({
    id: genId(), employee_id: e.id,
    change_type: to === 0 ? 7 : to === 1 ? 2 : 4,
    before_dept_id: e.dept_id, after_dept_id: e.dept_id,
    before_position: e.position, after_position: e.position,
    before_salary: e.salary, after_salary: e.salary,
    effect_date: today(), reason: body.reason || '', approval_status: 2, operator_id: user.id, apply_no: null
  })
  e.status = to
  if (to === 0) { e.leave_date = today(); e.leave_reason = body.reason || '' }
  if (to === 1 && !e.regular_date) e.regular_date = today()
  return { success: true }
})

route('GET', '/employees/:id/changes', ({ params }) => {
  const list = db.employeeChanges.filter((c) => c.employee_id === Number(params.id)).sort((a, b) => (a.effect_date < b.effect_date ? 1 : -1))
  return { records: list, total: list.length }
})

route('POST', '/employee-changes', ({ body }) => {
  requireFields(body, ['employeeId', 'changeType', 'effectDate'])
  const e = db.employees.find((x) => x.id === Number(body.employeeId))
  if (!e) fail('员工不存在', 404)
  const rec = {
    id: genId(), employee_id: e.id, change_type: Number(body.changeType),
    before_dept_id: e.dept_id, after_dept_id: body.afterDeptId ? Number(body.afterDeptId) : e.dept_id,
    before_position: e.position, after_position: (db.positions.find((p) => p.id === Number(body.afterPositionId)) || {}).position_name || e.position,
    before_salary: e.salary, after_salary: body.afterSalary ? Number(body.afterSalary) : e.salary,
    effect_date: body.effectDate, reason: body.reason || '', approval_status: 2, operator_id: body.operatorId || 2, apply_no: null
  }
  db.employeeChanges.push(rec)
  // 生效即更新主数据
  if (body.afterDeptId) e.dept_id = Number(body.afterDeptId)
  if (body.afterPositionId) {
    e.position_id = Number(body.afterPositionId)
    e.position = (db.positions.find((p) => p.id === e.position_id) || {}).position_name || e.position
  }
  if (body.afterSalary) e.salary = Number(body.afterSalary)
  return { success: true, id: rec.id }
})

route('GET', '/employee-changes/page', ({ query }) => {
  let list = [...db.employeeChanges].sort((a, b) => (a.effect_date < b.effect_date ? 1 : -1))
  if (query.employeeId) list = list.filter((c) => c.employee_id === Number(query.employeeId))
  if (query.changeType) list = list.filter((c) => c.change_type === Number(query.changeType))
  const vo = list.map((c) => ({ ...c, employee_name: empName(c.employee_id), before_dept_name: c.before_dept_id ? deptName(c.before_dept_id) : null, after_dept_name: c.after_dept_id ? deptName(c.after_dept_id) : null }))
  return paginate(vo, query)
})

route('GET', '/employee-contracts/page', ({ query }) => {
  let list = [...db.contracts]
  if (query.employeeId) list = list.filter((c) => c.employee_id === Number(query.employeeId))
  if (query.status) list = list.filter((c) => c.status === Number(query.status))
  const vo = list.map((c) => ({ ...c, employee_name: empName(c.employee_id) }))
  return paginate(vo, query)
})

route('POST', '/employee-contracts', ({ body }) => {
  requireFields(body, ['employeeId', 'startDate'])
  const c = {
    id: genId(), contract_no: `CT2026${String(genId()).slice(-4)}`, employee_id: Number(body.employeeId),
    contract_type: body.contractType || 1, first_party: '华信科技集团', second_party: empName(Number(body.employeeId)),
    sign_date: body.signDate || today(), start_date: body.startDate, end_date: body.endDate || null,
    term_years: body.termYears || null, salary_agreed: body.salaryAgreed ? Number(body.salaryAgreed) : null,
    probation_months: body.probationMonths || 0, status: 1, remark: body.remark || ''
  }
  db.contracts.push(c)
  return { success: true, id: c.id, contractNo: c.contract_no }
})

// ============================================================
// 部门管理
// ============================================================
function buildTree(list, parentId) {
  return list
    .filter((d) => d.parent_id === parentId)
    .map((d) => {
      const children = buildTree(list, d.id)
      const node = {
        ...d,
        employeeCount: db.employees.filter((e) => e.dept_id === d.id && e.status !== 0).length
      }
      if (children.length) node.children = children
      return node
    })
}

route('GET', '/depts/tree', () => buildTree(db.depts, null))
route('GET', '/depts', () => db.depts.filter((d) => d.status === 1))

route('POST', '/depts', ({ body }) => {
  requireFields(body, ['name', 'deptCode'])
  if (db.depts.some((d) => d.dept_code === body.deptCode)) fail('部门编码已存在（BR-03-01）')
  const parent = body.parentId ? db.depts.find((d) => d.id === Number(body.parentId)) : null
  if (body.parentId && !parent) fail('上级部门不存在', 404)
  const level = parent ? parent.dept_level + 1 : 1
  if (level > 5) fail('部门树深度不建议超过 5 层（BR-03-03）')
  const d = {
    id: genId(), dept_code: body.deptCode, name: body.name, parent_id: parent ? parent.id : null,
    leader: '', leader_id: null, dept_type: body.deptType || 3, dept_level: level,
    dept_path: (parent ? parent.dept_path : '/') + '', headcount_limit: Number(body.headcountLimit || 0),
    phone: body.phone || '', sort_no: Number(body.sortNo || 0), status: 1
  }
  d.dept_path = (parent ? parent.dept_path : '/') + d.id + '/'
  db.depts.push(d)
  return { success: true, id: d.id }
})

route('PUT', '/depts/:id', ({ params, body }) => {
  const d = db.depts.find((x) => x.id === Number(params.id))
  if (!d) fail('部门不存在', 404)
  if (body.name && db.depts.some((x) => x.name === body.name && x.id !== d.id && x.parent_id === d.parent_id)) fail('同级部门名称重复（BR-03-01）')
  for (const k of ['name', 'phone', 'headcountLimit', 'sortNo', 'deptType', 'leaderId', 'leader']) {
    if (body[k] !== undefined) d[k] = body[k]
  }
  if (body.headcountLimit !== undefined) d.headcount_limit = Number(body.headcountLimit)
  return { success: true }
})

route('DELETE', '/depts/:id', ({ params }) => {
  const id = Number(params.id)
  const d = db.depts.find((x) => x.id === id)
  if (!d) fail('部门不存在', 404)
  if (db.depts.some((x) => x.parent_id === id)) fail('存在下级部门，禁止删除')
  // BR-03-02 部门下存在在职员工时禁止删除
  if (db.employees.some((e) => e.dept_id === id && e.status !== 0)) fail('部门下存在在职员工，禁止删除，请先转移人员（BR-03-02）')
  db.depts.splice(db.depts.indexOf(d), 1)
  return { success: true }
})

route('GET', '/positions', ({ query }) => {
  let list = [...db.positions]
  if (query.deptId) list = list.filter((p) => p.dept_id === Number(query.deptId))
  if (query.status) list = list.filter((p) => p.status === Number(query.status))
  const vo = list.map((p) => ({ ...p, dept_name: p.dept_id ? deptName(p.dept_id) : '通用', employeeCount: db.employees.filter((e) => e.position_id === p.id && e.status !== 0).length }))
  return paginate(vo, query)
})

route('POST', '/positions', ({ body }) => {
  requireFields(body, ['positionCode', 'positionName'])
  if (db.positions.some((p) => p.position_code === body.positionCode)) fail('岗位编码已存在')
  const p = { id: genId(), position_code: body.positionCode, position_name: body.positionName, position_seq: Number(body.positionSeq || 2), job_level: body.jobLevel || null, dept_id: body.deptId ? Number(body.deptId) : null, headcount_limit: Number(body.headcountLimit || 0), sort_no: Number(body.sortNo || 0), status: 1 }
  db.positions.push(p)
  return { success: true, id: p.id }
})

route('PUT', '/positions/:id', ({ params, body }) => {
  const p = db.positions.find((x) => x.id === Number(params.id))
  if (!p) fail('岗位不存在', 404)
  for (const k of ['positionName', 'jobLevel', 'headcountLimit', 'sortNo', 'status', 'positionSeq']) {
    if (body[k] !== undefined) p[k] = body[k]
  }
  if (body.headcountLimit !== undefined) p.headcount_limit = Number(body.headcountLimit)
  return { success: true }
})

// ============================================================
// 考勤管理
// ============================================================
route('GET', '/attendance/today', ({ user }) => {
  const records = db.attendanceRecords.filter((r) => r.employee_id === user.employeeId && r.attendance_date === today())
  const rec = records[0] || null
  return { record: rec, shift: db.shifts[0] }
})

route('POST', '/attendance/checkin', ({ user }) => {
  const exist = db.attendanceRecords.find((r) => r.employee_id === user.employeeId && r.attendance_date === today())
  if (exist && exist.first_check_in) fail('今日已打卡，请勿重复操作')
  const t = now()
  const lateMinutes = t.slice(11) > '09:05:00' ? Math.round((new Date('2000-01-01T' + t.slice(11)) - new Date('2000-01-01T09:05:00')) / 60000) : 0
  if (exist) {
    exist.first_check_in = t
    exist.late_minutes = lateMinutes
    exist.check_in_status = lateMinutes > 60 ? 3 : lateMinutes > 0 ? 2 : 1
    exist.attendance_status = lateMinutes > 0 ? 2 : 1
  } else {
    db.attendanceRecords.push({
      id: genId(), employee_id: user.employeeId, attendance_date: today(), shift_id: 1,
      first_check_in: t, last_check_out: null, work_hours: 0, late_minutes: lateMinutes, early_minutes: 0,
      check_in_status: lateMinutes > 60 ? 3 : lateMinutes > 0 ? 2 : 1, check_out_status: 3,
      attendance_status: lateMinutes > 0 ? 2 : 1, source: 2, remark: ''
    })
  }
  return { success: true, checkinTime: t }
})

route('POST', '/attendance/checkout', ({ user }) => {
  const rec = db.attendanceRecords.find((r) => r.employee_id === user.employeeId && r.attendance_date === today())
  if (!rec || !rec.first_check_in) fail('请先完成上班打卡')
  if (rec.last_check_out) fail('今日已下班打卡')
  const t = now()
  rec.last_check_out = t
  rec.check_out_status = 1
  rec.work_hours = money(Math.max(0, (new Date('2000-01-01T' + t.slice(11)) - new Date('2000-01-01T' + rec.first_check_in.slice(11))) / 3600000 - 1))
  if (t.slice(11, 16) < '17:55') {
    rec.check_out_status = 2
    rec.early_minutes = Math.round((new Date('2000-01-01T17:55:00') - new Date('2000-01-01T' + t.slice(11))) / 60000)
  }
  return { success: true, checkoutTime: t }
})

route('GET', '/attendance/records', ({ user, query }) => {
  let list = db.attendanceRecords
  if (user.roles.includes('ROLE_EMPLOYEE')) list = list.filter((r) => r.employee_id === user.employeeId)
  else if (query.employeeId) list = list.filter((r) => r.employee_id === Number(query.employeeId))
  if (query.startDate) list = list.filter((r) => r.attendance_date >= query.startDate)
  if (query.endDate) list = list.filter((r) => r.attendance_date <= query.endDate)
  if (query.status) list = list.filter((r) => r.attendance_status === Number(query.status))
  list = [...list].sort((a, b) => (a.attendance_date < b.attendance_date ? 1 : -1))
  return paginate(joinEmployee(list), query)
})

function approveRequest(table, id, user, body, bizType) {
  const r = table.find((x) => x.id === Number(id))
  if (!r) fail('单据不存在', 404)
  if (r.approval_status !== 1) fail('该单据不在审批中状态')
  // 审批链：直属主管 → 人事专员
  const isManager = user.roles.includes('ROLE_MANAGER') && r.current_approver_id === user.employeeId
  const isHR = user.roles.includes('ROLE_HR')
  if (!isManager && !isHR) fail('无审批权限（仅直属主管或人事专员）', 403)
  const result = Number(body.result) // 2 通过 3 驳回
  if (![2, 3].includes(result)) fail('无效的审批结果')
  r.approval_status = result
  r.current_approver_id = null
  db.approvalFlow.push({ id: genId(), biz_type: bizType, biz_id: r.id, biz_no: r.request_no, approval_level: 1, approver_id: user.employeeId, approval_status: result === 2 ? 2 : 3, approval_opinion: body.opinion || '', approval_time: now() })
  return { success: true }
}

route('GET', '/leave-requests/page', ({ user, query }) => {
  let list = [...db.leaveRequests]
  const roles = user.roles || []
  if (roles.includes('ROLE_EMPLOYEE')) list = list.filter((r) => r.employee_id === user.employeeId)
  else if (roles.includes('ROLE_MANAGER') && !query.all) list = list.filter((r) => db.employees.find((e) => e.id === r.employee_id)?.dept_id === user.deptId)
  if (query.status !== undefined && query.status !== '') list = list.filter((r) => r.approval_status === Number(query.status))
  if (query.mine === 'true') list = list.filter((r) => r.employee_id === user.employeeId)
  list = [...list].sort((a, b) => (a.apply_time < b.apply_time ? 1 : -1))
  const vo = joinEmployee(list).map((r) => ({
    ...r,
    leave_type_name: (db.leaveTypes.find((t) => t.id === r.leave_type_id) || {}).type_name,
    current_approver_name: r.current_approver_id ? empName(r.current_approver_id) : null
  }))
  return paginate(vo, query)
})

route('POST', '/leave-requests', ({ user, body }) => {
  requireFields(body, ['leaveTypeId', 'startTime', 'endTime', 'days'])
  const days = Number(body.days)
  const lt = db.leaveTypes.find((t) => t.id === Number(body.leaveTypeId))
  if (!lt) fail('假别不存在', 404)
  // BR-04-01 禁止时间区间重叠
  const overlap = db.leaveRequests.some((r) => r.employee_id === user.employeeId && [0, 1].includes(r.approval_status) && r.start_time.slice(0, 10) <= body.endTime.slice(0, 10) && r.end_time.slice(0, 10) >= body.startTime.slice(0, 10))
  if (overlap) fail('申请时间段与已有请假单重叠（BR-04-01）')
  // BR-04-02 余额校验
  if (lt.type_code === 'ANNUAL' || lt.type_code === 'PERSONAL') {
    const bal = db.leaveBalances.find((b) => b.employee_id === user.employeeId && b.leave_type_id === lt.id && b.balance_year === 2026)
    if (bal && bal.remain_days < days) fail(`假期余额不足：剩余 ${bal.remain_days} 天（BR-04-02）`)
  }
  const mgr = db.employees.find((e) => e.id === user.employeeId)
  const approverId = mgr?.manager_id || 2
  const rec = {
    id: genId(), request_no: `LV2026${String(genId()).slice(-5)}`, employee_id: user.employeeId,
    leave_type_id: lt.id, start_time: body.startTime, end_time: body.endTime, days,
    reason: body.reason || '', approval_status: 1, current_approver_id: approverId, apply_time: now()
  }
  db.leaveRequests.push(rec)
  db.todos.push({ id: genId(), receiver_id: approverId, task_type: 1, task_title: `请假审批：${empName(user.employeeId)}（${lt.type_name} ${days} 天）`, task_content: rec.request_no, biz_type: 1, biz_id: rec.id, biz_no: rec.request_no, priority: 2, deadline: null, handle_status: 0 })
  return { success: true, id: rec.id, requestNo: rec.request_no }
})

route('PUT', '/leave-requests/:id/approve', ({ params, user, body }) => approveRequest(db.leaveRequests, params.id, user, body, 1))

route('GET', '/leave-balances/my', ({ user }) => {
  const list = db.leaveBalances.filter((b) => b.employee_id === user.employeeId && b.balance_year === 2026)
  return { records: list.map((b) => ({ ...b, leave_type_name: (db.leaveTypes.find((t) => t.id === b.leave_type_id) || {}).type_name })), total: list.length }
})

route('GET', '/overtime-requests/page', ({ user, query }) => {
  let list = [...db.overtimeRequests]
  if (user.roles.includes('ROLE_EMPLOYEE')) list = list.filter((r) => r.employee_id === user.employeeId)
  else if (user.roles.includes('ROLE_MANAGER') && !query.all) list = list.filter((r) => db.employees.find((e) => e.id === r.employee_id)?.dept_id === user.deptId)
  if (query.status !== undefined && query.status !== '') list = list.filter((r) => r.approval_status === Number(query.status))
  list = [...list].sort((a, b) => (a.overtime_date < b.overtime_date ? 1 : -1))
  return paginate(joinEmployee(list), query)
})

route('POST', '/overtime-requests', ({ user, body }) => {
  requireFields(body, ['overtimeDate', 'startTime', 'endTime', 'hours'])
  const rec = {
    id: genId(), request_no: `OT2026${String(genId()).slice(-5)}`, employee_id: user.employeeId,
    overtime_date: body.overtimeDate, start_time: body.startTime, end_time: body.endTime,
    hours: Number(body.hours), overtime_type: Number(body.overtimeType || 1), compensate_type: Number(body.compensateType || 1),
    reason: body.reason || '', approval_status: 1,
    current_approver_id: (db.employees.find((e) => e.id === user.employeeId) || {}).manager_id || 2, apply_time: now()
  }
  db.overtimeRequests.push(rec)
  return { success: true, id: rec.id, requestNo: rec.request_no }
})

route('PUT', '/overtime-requests/:id/approve', ({ params, user, body }) => approveRequest(db.overtimeRequests, params.id, user, body, 2))

route('GET', '/business-trips/page', ({ user, query }) => {
  let list = [...db.businessTrips]
  if (user.roles.includes('ROLE_EMPLOYEE')) list = list.filter((r) => r.employee_id === user.employeeId)
  else if (user.roles.includes('ROLE_MANAGER') && !query.all) list = list.filter((r) => db.employees.find((e) => e.id === r.employee_id)?.dept_id === user.deptId)
  if (query.status !== undefined && query.status !== '') list = list.filter((r) => r.approval_status === Number(query.status))
  list = [...list].sort((a, b) => (a.start_time < b.start_time ? 1 : -1))
  return paginate(joinEmployee(list), query)
})

route('POST', '/business-trips', ({ user, body }) => {
  requireFields(body, ['destination', 'startTime', 'endTime', 'days'])
  const rec = {
    id: genId(), request_no: `BT2026${String(genId()).slice(-5)}`, employee_id: user.employeeId,
    destination: body.destination, purpose: body.purpose || '', start_time: body.startTime, end_time: body.endTime,
    days: Number(body.days), transport: body.transport ? Number(body.transport) : null,
    budget_amount: Number(body.budgetAmount || 0), approval_status: 1,
    current_approver_id: (db.employees.find((e) => e.id === user.employeeId) || {}).manager_id || 2, apply_time: now()
  }
  db.businessTrips.push(rec)
  return { success: true, id: rec.id, requestNo: rec.request_no }
})

route('PUT', '/business-trips/:id/approve', ({ params, user, body }) => approveRequest(db.businessTrips, params.id, user, body, 3))

route('GET', '/attendance-months/page', ({ user, query }) => {
  let list = [...db.attendanceMonths]
  const roles = user.roles || []
  if (roles.includes('ROLE_MANAGER')) list = list.filter((m) => m.dept_id === user.deptId)
  if (query.year) list = list.filter((m) => m.record_year === Number(query.year))
  if (query.month) list = list.filter((m) => m.record_month === Number(query.month))
  if (query.lockStatus !== undefined && query.lockStatus !== '') list = list.filter((m) => m.lock_status === Number(query.lockStatus))
  return paginate(joinEmployee(list), query)
})

route('PUT', '/attendance-months/:id/lock', ({ params, user }) => {
  const m = db.attendanceMonths.find((x) => x.id === Number(params.id))
  if (!m) fail('月报不存在', 404)
  if (m.lock_status === 1) fail('该月报已封账（BR-04-03 封账后禁改）')
  m.lock_status = 1
  m.lock_time = now()
  m.lock_by = user.id
  return { success: true }
})

// ============================================================
// 薪资管理
// ============================================================
route('GET', '/salary-standards/page', ({ query }) => paginate([...db.salaryStandards], query))
route('POST', '/salary-standards', ({ body }) => {
  requireFields(body, ['standardCode', 'standardName'])
  if (db.salaryStandards.some((s) => s.standard_code === body.standardCode)) fail('标准编码已存在')
  const s = { id: genId(), standard_code: body.standardCode, standard_name: body.standardName, position_seq: Number(body.positionSeq || 2), job_level: body.jobLevel || null, base_salary: Number(body.baseSalary || 0), post_salary: Number(body.postSalary || 0), performance_salary: Number(body.performanceSalary || 0), allowance: Number(body.allowance || 0), effective_date: body.effectiveDate || today(), status: 1 }
  db.salaryStandards.push(s)
  return { success: true, id: s.id, standardCode: s.standard_code }
})

route('GET', '/salary-records/page', ({ user, query }) => {
  let list = [...db.salaryRecords]
  const roles = user.roles || []
  // 字段级隔离：主管仅本部门（BR 补充说明 1）
  if (roles.includes('ROLE_MANAGER')) list = list.filter((r) => r.dept_id === user.deptId)
  if (query.year) list = list.filter((r) => r.salary_year === Number(query.year))
  if (query.month) list = list.filter((r) => r.salary_month === Number(query.month))
  if (query.payStatus !== undefined && query.payStatus !== '') list = list.filter((r) => r.pay_status === Number(query.payStatus))
  if (query.deptId) list = list.filter((r) => r.dept_id === Number(query.deptId))
  if (query.keyword) {
    const ids = db.employees.filter((e) => e.name.includes(query.keyword) || e.emp_no.includes(query.keyword.toUpperCase())).map((e) => e.id)
    list = list.filter((r) => ids.includes(r.employee_id))
  }
  list = [...list].sort((a, b) => b.salary_year - a.salary_year || b.salary_month - a.salary_month || a.employee_id - b.employee_id)
  return paginate(joinEmployee(list), query)
})

route('POST', '/salary-records/calculate', ({ user, body }) => {
  requireFields(body, ['year', 'month'])
  const year = Number(body.year)
  const month = Number(body.month)
  // BR-05-02 考勤未封账禁止核算
  const unlocked = db.attendanceMonths.filter((m) => m.record_year === year && m.record_month === month && m.lock_status === 0)
  if (unlocked.length) fail(`有 ${unlocked.length} 名员工的考勤月报未封账，禁止启动核算（BR-05-02）`)
  let created = 0
  for (const emp of db.employees.filter((e) => e.status !== 0)) {
    const exist = db.salaryRecords.find((r) => r.employee_id === emp.id && r.salary_year === year && r.salary_month === month)
    if (exist) continue
    const base = money(emp.salary * 0.7)
    const post = money(emp.salary * 0.2)
    const perf = money(emp.salary * 0.1)
    const allow = 500
    const gross = money(base + post + perf + allow)
    const social = money(emp.salary * 0.105)
    const fund = money(emp.salary * 0.12)
    const tax = money(Math.max(0, (gross - 5000 - social - fund) * 0.1))
    db.salaryRecords.push({
      id: genId(), employee_id: emp.id, dept_id: emp.dept_id, salary_year: year, salary_month: month,
      base_salary: base, post_salary: post, performance_salary: perf, allowance: allow,
      overtime_pay: 0, other_add: 0, attendance_deduct: 0, other_deduct: 0, gross_pay: gross,
      social_personal: social, social_company: money(emp.salary * 0.265), fund_personal: fund, fund_company: fund,
      tax_amount: tax, net_pay: money(gross - social - fund - tax), pay_status: 1,
      pay_date: null, pay_batch_no: null, lock_status: 0, audit_by: null
    })
    created++
  }
  return { success: true, created }
})

route('PUT', '/salary-records/:id/review', ({ params, user }) => {
  const r = db.salaryRecords.find((x) => x.id === Number(params.id))
  if (!r) fail('薪资记录不存在', 404)
  if (r.pay_status !== 1) fail('仅"已核算"状态可复核')
  // BR-05-03 复核人不得与核算人相同（mock 侧以操作人代替核算人记录）
  r.pay_status = 2
  r.audit_by = user.id
  return { success: true }
})

route('PUT', '/salary-records/:id/pay', ({ params, body }) => {
  const r = db.salaryRecords.find((x) => x.id === Number(params.id))
  if (!r) fail('薪资记录不存在', 404)
  if (r.pay_status !== 2) fail('仅"已复核"状态可发放（BR-05-03）')
  r.pay_status = 3
  r.pay_date = today()
  r.pay_batch_no = body?.batchNo || `PAY${today().replace(/-/g, '')}001`
  r.lock_status = 1 // BR-05-04 发放后锁定
  return { success: true }
})

route('GET', '/salary/payslips/my', ({ user }) => {
  const list = db.salaryRecords.filter((r) => r.employee_id === user.employeeId).sort((a, b) => b.salary_year - a.salary_year || b.salary_month - a.salary_month)
  return { records: list, total: list.length }
})

route('GET', '/salary/payslips/:recordId/items', ({ params, user }) => {
  const r = db.salaryRecords.find((x) => x.id === Number(params.recordId))
  if (!r) fail('薪资记录不存在', 404)
  // NF-10：仅本人或授权角色可查看薪资条明细
  const roles = user.roles || []
  const allowed = r.employee_id === user.employeeId || roles.includes('ROLE_HR') || roles.includes('ROLE_FINANCE') || roles.includes('ROLE_ADMIN')
  if (!allowed) fail('无权查看他人薪资明细（NF-10 行级隔离）', 403)
  return { record: r, items: db.buildSalaryItems(r) }
})

// ============================================================
// 招聘管理
// ============================================================
route('GET', '/recruit-requests/page', ({ query }) => {
  let list = [...db.recruitRequests]
  if (query.status) list = list.filter((r) => r.status === Number(query.status))
  if (query.approvalStatus) list = list.filter((r) => r.approval_status === Number(query.approvalStatus))
  const vo = list.map((r) => ({ ...r, dept_name: deptName(r.request_dept_id), applicant_name: r.applicant_id ? empName(r.applicant_id) : null }))
  return paginate(vo.sort((a, b) => (a.request_no < b.request_no ? 1 : -1)), query)
})

route('POST', '/recruit-requests', ({ user, body }) => {
  requireFields(body, ['requestDeptId', 'positionName', 'recruitCount'])
  const rec = {
    id: genId(), request_no: `RC2026${String(genId()).slice(-5)}`, request_dept_id: Number(body.requestDeptId),
    position_id: body.positionId ? Number(body.positionId) : null, position_name: body.positionName,
    recruit_count: Number(body.recruitCount), hired_count: 0, job_level: body.jobLevel || null,
    salary_min: body.salaryMin ? Number(body.salaryMin) : null, salary_max: body.salaryMax ? Number(body.salaryMax) : null,
    education_req: body.educationReq || null, experience_years: body.experienceYears || null,
    job_description: body.jobDescription || '', job_requirement: body.jobRequirement || '',
    hope_arrive_date: body.hopeArriveDate || null, urgency: Number(body.urgency || 1),
    applicant_id: user.employeeId, apply_time: now(), approval_status: 1, current_approver_id: 2, status: 1
  }
  db.recruitRequests.push(rec)
  return { success: true, id: rec.id, requestNo: rec.request_no }
})

route('PUT', '/recruit-requests/:id/approve', ({ params, user, body }) => {
  const r = db.recruitRequests.find((x) => x.id === Number(params.id))
  if (!r) fail('需求单不存在', 404)
  if (r.approval_status !== 1) fail('该需求单不在审批中')
  if (!user.roles.includes('ROLE_HR') && !user.roles.includes('ROLE_ADMIN')) fail('无审批权限', 403)
  r.approval_status = Number(body.result)
  r.current_approver_id = null
  return { success: true }
})

route('GET', '/candidates/page', ({ query }) => {
  let list = [...db.candidates]
  if (query.recruitRequestId) list = list.filter((c) => c.recruit_request_id === Number(query.recruitRequestId))
  if (query.stage) list = list.filter((c) => c.stage === Number(query.stage))
  if (query.isTalent) list = list.filter((c) => c.is_talent === Number(query.isTalent))
  if (query.keyword) list = list.filter((c) => c.name.includes(query.keyword))
  const vo = list.map((c) => ({ ...c, request_no: (db.recruitRequests.find((r) => r.id === c.recruit_request_id) || {}).request_no, position_name: (db.recruitRequests.find((r) => r.id === c.recruit_request_id) || {}).position_name }))
  return paginate(vo, query)
})

route('POST', '/candidates', ({ body }) => {
  requireFields(body, ['recruitRequestId', 'name'])
  const cand = {
    id: genId(), recruit_request_id: Number(body.recruitRequestId), name: body.name,
    gender: body.gender || 'U', education: body.education || null, graduate_school: body.graduateSchool || null,
    work_years: body.workYears || null, current_company: body.currentCompany || null, current_position: body.currentPosition || null,
    expect_salary: body.expectSalary ? Number(body.expectSalary) : null, source: Number(body.source || 2),
    stage: 1, is_talent: 0, phone: body.phone || null, email: body.email || null, remark: body.remark || ''
  }
  db.candidates.push(cand)
  return { success: true, id: cand.id }
})

route('PUT', '/candidates/:id/stage', ({ params, body }) => {
  const c = db.candidates.find((x) => x.id === Number(params.id))
  if (!c) fail('候选人不存在', 404)
  const to = Number(body.stage)
  // BR-06-01 状态单向流转
  if (to < c.stage && !(to === 6 && c.stage < 6)) fail('候选人阶段不可回退（BR-06-01）')
  c.stage = to
  if (to === 6) c.remark = body.remark || c.remark
  return { success: true }
})

route('GET', '/interview-records', ({ query }) => {
  let list = [...db.interviewRecords]
  if (query.candidateId) list = list.filter((r) => r.candidate_id === Number(query.candidateId))
  const vo = list.map((r) => ({ ...r, candidate_name: (db.candidates.find((c) => c.id === r.candidate_id) || {}).name, interviewer_name: r.interviewer_id ? empName(r.interviewer_id) : null }))
    .sort((a, b) => (a.interview_time < b.interview_time ? 1 : -1))
  return { records: vo, total: vo.length }
})

route('POST', '/interview-records', ({ body }) => {
  requireFields(body, ['candidateId', 'interviewType'])
  const c = db.candidates.find((x) => x.id === Number(body.candidateId))
  if (!c) fail('候选人不存在', 404)
  const prev = db.interviewRecords.filter((r) => r.candidate_id === c.id)
  const rec = {
    id: genId(), candidate_id: c.id, recruit_request_id: c.recruit_request_id,
    round_no: prev.length + 1, interview_type: Number(body.interviewType),
    interview_time: body.interviewTime || null, interview_place: body.interviewPlace || null,
    interviewer_id: body.interviewerId ? Number(body.interviewerId) : null,
    score: body.score !== undefined && body.score !== '' ? Number(body.score) : null,
    evaluation: body.evaluation || null,
    conclusion: body.conclusion ? Number(body.conclusion) : null
  }
  db.interviewRecords.push(rec)
  // 结论联动阶段
  if (rec.conclusion === 1 && c.stage < 4) c.stage = Math.max(c.stage, 3)
  if (rec.conclusion === 3) c.stage = 6
  return { success: true, id: rec.id }
})

route('GET', '/offers/page', ({ query }) => {
  let list = [...db.offerRecords]
  if (query.status) list = list.filter((o) => o.status === Number(query.status))
  const vo = list.map((o) => {
    const c = db.candidates.find((x) => x.id === o.candidate_id) || {}
    return { ...o, candidate_name: c.name, dept_name: deptName(o.dept_id), position_name: (db.recruitRequests.find((r) => r.id === o.recruit_request_id) || {}).position_name }
  }).sort((a, b) => (a.offer_no < b.offer_no ? 1 : -1))
  return paginate(vo, query)
})

route('PUT', '/offers/:id/send', ({ params }) => {
  const o = db.offerRecords.find((x) => x.id === Number(params.id))
  if (!o) fail('Offer 不存在', 404)
  if (o.status !== 1) fail('仅"待发送"状态可发送')
  o.status = 2
  o.send_time = now()
  return { success: true }
})

route('PUT', '/offers/:id/status', ({ params, body }) => {
  const o = db.offerRecords.find((x) => x.id === Number(params.id))
  if (!o) fail('Offer 不存在', 404)
  const to = Number(body.status)
  if (![3, 4, 5, 6].includes(to)) fail('无效的 Offer 状态')
  o.status = to
  if (to === 3) o.confirm_time = now()
  if (to === 6) {
    // BR-06-03 一键推送入职：生成待入职员工
    const c = db.candidates.find((x) => x.id === o.candidate_id)
    const maxId = Math.max(...db.employees.map((e) => e.id))
    db.employees.push({
      id: maxId + 1, emp_no: `E${String(maxId + 1).padStart(4, '0')}`, name: c.name, gender: c.gender || 'U',
      education: c.education, dept_id: o.dept_id, position_id: o.position_id,
      position: (db.positions.find((p) => p.id === o.position_id) || {}).position_name || '',
      job_level: o.job_level, employee_type: 3, hire_date: o.entry_date || today(), status: 3,
      salary: o.offer_salary, manager_id: null, bank_name: null, bank_account: null
    })
    c.stage = 5
    const rr = db.recruitRequests.find((r) => r.id === o.recruit_request_id)
    if (rr) { rr.hired_count += 1; if (rr.hired_count >= rr.recruit_count) rr.status = 2 }
  }
  return { success: true }
})

// ============================================================
// 培训管理
// ============================================================
route('GET', '/training-plans/page', ({ query }) => {
  let list = [...db.trainingPlans]
  if (query.status) list = list.filter((p) => p.status === Number(query.status))
  if (query.trainType) list = list.filter((p) => p.train_type === Number(query.trainType))
  const vo = list.map((p) => ({
    ...p,
    organizer_name: p.organizer_id ? empName(p.organizer_id) : null,
    enrollCount: db.trainingEnrolls.filter((e) => e.plan_id === p.id).length,
    courseNames: (db.courses.filter((c) => c.id === p.id % 4 + 1).map((c) => c.course_name)).join('、')
  })).sort((a, b) => (a.start_date < b.start_date ? 1 : -1))
  return paginate(vo, query)
})

route('POST', '/training-plans', ({ user, body }) => {
  requireFields(body, ['planName', 'planYear'])
  const plan = {
    id: genId(), plan_code: `TP2026${String(genId()).slice(-4)}`, plan_name: body.planName,
    plan_year: Number(body.planYear), plan_quarter: Number(body.planQuarter || 0), train_type: Number(body.trainType || 2),
    target_scope: Number(body.targetScope || 1), budget_amount: Number(body.budgetAmount || 0), actual_amount: 0,
    start_date: body.startDate || null, end_date: body.endDate || null, organizer_id: user.employeeId,
    status: 1, description: body.description || ''
  }
  db.trainingPlans.push(plan)
  return { success: true, id: plan.id, planCode: plan.plan_code }
})

route('POST', '/training-plans/:id/enroll', ({ params, user }) => {
  const p = db.trainingPlans.find((x) => x.id === Number(params.id))
  if (!p) fail('培训计划不存在', 404)
  if (p.status !== 2 && p.status !== 3) fail('该计划未开放报名')
  // BR-07-01 满员自动关闭
  const course = db.courses.find((c) => c.id === (p.id % 4) + 1)
  if (course && course.max_students > 0 && db.trainingEnrolls.filter((e) => e.plan_id === p.id).length >= course.max_students) {
    fail('报名人数已满，报名已关闭（BR-07-01）')
  }
  if (db.trainingEnrolls.some((e) => e.plan_id === p.id && e.employee_id === user.employeeId)) fail('您已报名该培训，请勿重复报名')
  db.trainingEnrolls.push({ id: genId(), plan_id: p.id, course_id: course ? course.id : 1, employee_id: user.employeeId, enroll_time: now(), sign_in_status: 0, exam_score: null, pass_status: 0, satisfaction_score: null })
  return { success: true }
})

route('GET', '/training/my', ({ user }) => {
  const list = db.trainingRecords.filter((r) => r.employee_id === user.employeeId).sort((a, b) => (a.train_date < b.train_date ? 1 : -1))
  const enrolls = db.trainingEnrolls.filter((e) => e.employee_id === user.employeeId).map((e) => {
    const p = db.trainingPlans.find((x) => x.id === e.plan_id) || {}
    return { ...e, plan_name: p.plan_name, status: p.status, start_date: p.start_date, end_date: p.end_date }
  })
  return { records: list, total: list.length, enrolls, totalHours: list.reduce((s, r) => s + r.hours, 0) }
})

// ============================================================
// 绩效考核
// ============================================================
route('GET', '/performance-plans/page', ({ query }) => {
  let list = [...db.perfPlans]
  if (query.status) list = list.filter((p) => p.status === Number(query.status))
  const vo = list.map((p) => ({ ...p, creator_name: p.creator_id ? empName(p.creator_id) : null, recordCount: db.perfRecords.filter((r) => r.plan_id === p.id).length }))
  return paginate(vo, query)
})

route('POST', '/performance-plans', ({ user, body }) => {
  requireFields(body, ['planName', 'planYear'])
  const plan = {
    id: genId(), plan_code: `PF2026${String(genId()).slice(-4)}`, plan_name: body.planName,
    period_type: Number(body.periodType || 2), plan_year: Number(body.planYear), plan_quarter: body.planQuarter ? Number(body.planQuarter) : null,
    start_date: body.startDate || null, end_date: body.endDate || null, scope_type: Number(body.scopeType || 1),
    grade_rule: body.gradeRule || 'S:90+,A:80-89,B:70-79,C:60-69,D:<60',
    force_distribution: Number(body.forceDistribution || 0), distribution_rule: body.distributionRule || null,
    self_weight: Number(body.selfWeight || 20), leader_weight: Number(body.leaderWeight || 70), review_weight: Number(body.reviewWeight || 10),
    creator_id: user.employeeId, status: 1, description: body.description || ''
  }
  db.perfPlans.push(plan)
  return { success: true, id: plan.id, planCode: plan.plan_code }
})

route('PUT', '/performance-plans/:id/publish', ({ params }) => {
  const p = db.perfPlans.find((x) => x.id === Number(params.id))
  if (!p) fail('方案不存在', 404)
  if (p.status !== 1) fail('仅草稿状态可发布')
  p.status = 3
  // 发布即生成全员考核记录
  for (const emp of db.employees.filter((e) => e.status !== 0)) {
    if (db.perfRecords.some((r) => r.plan_id === p.id && r.employee_id === emp.id)) continue
    db.perfRecords.push({
      id: genId(), plan_id: p.id, employee_id: emp.id, dept_id: emp.dept_id, leader_id: emp.manager_id || 6,
      self_score: null, leader_score: null, review_score: null, final_score: null, grade: null,
      employee_confirm_status: 0, archive_status: 0, archive_time: null, status: 1
    })
  }
  return { success: true }
})

route('GET', '/performance-records/page', ({ user, query }) => {
  let list = [...db.perfRecords]
  const roles = user.roles || []
  if (roles.includes('ROLE_EMPLOYEE')) list = list.filter((r) => r.employee_id === user.employeeId)
  else if (roles.includes('ROLE_MANAGER')) list = list.filter((r) => r.dept_id === user.deptId)
  if (query.planId) list = list.filter((r) => r.plan_id === Number(query.planId))
  if (query.status) list = list.filter((r) => r.status === Number(query.status))
  const vo = joinEmployee(list).map((r) => ({ ...r, leader_name: r.leader_id ? empName(r.leader_id) : null, plan_name: (db.perfPlans.find((p) => p.id === r.plan_id) || {}).plan_name }))
  return paginate(vo, query)
})

route('PUT', '/performance-records/:id/self-score', ({ params, user, body }) => {
  const r = db.perfRecords.find((x) => x.id === Number(params.id))
  if (!r) fail('考核记录不存在', 404)
  if (r.employee_id !== user.employeeId) fail('仅可提交本人自评', 403)
  if (r.status !== 1) fail('当前状态不允许自评')
  const score = Number(body.score)
  if (Number.isNaN(score) || score < 0 || score > 100) fail('自评分需在 0-100 之间')
  r.self_score = score
  const p = db.perfPlans.find((x) => x.id === r.plan_id)
  r.status = 2
  return { success: true, weightNote: `自评权重 ${p.self_weight}%` }
})

route('PUT', '/performance-records/:id/leader-score', ({ params, user, body }) => {
  const r = db.perfRecords.find((x) => x.id === Number(params.id))
  if (!r) fail('考核记录不存在', 404)
  if (!user.roles.includes('ROLE_MANAGER') && !user.roles.includes('ROLE_HR')) fail('无评分权限', 403)
  if (r.status !== 2) fail('当前状态不允许主管评分')
  const score = Number(body.score)
  if (Number.isNaN(score) || score < 0 || score > 100) fail('评分需在 0-100 之间')
  r.leader_score = score
  // 按方案权重自动计算总分与等级（F-08-03）
  const p = db.perfPlans.find((x) => x.id === r.plan_id)
  const final = money((r.self_score || 0) * (p.self_weight / 100) + score * (p.leader_weight / 100))
  r.final_score = final
  r.grade = final >= 90 ? 'S' : final >= 80 ? 'A' : final >= 70 ? 'B' : final >= 60 ? 'C' : 'D'
  r.status = 4
  return { success: true, finalScore: final, grade: r.grade }
})

route('PUT', '/performance-records/:id/confirm', ({ params, user, body }) => {
  const r = db.perfRecords.find((x) => x.id === Number(params.id))
  if (!r) fail('考核记录不存在', 404)
  if (r.employee_id !== user.employeeId) fail('仅可确认本人结果', 403)
  if (r.status !== 4) fail('当前状态不允许确认')
  if (body.appeal) {
    // BR-08-01 申诉
    r.employee_confirm_status = 2
    r.appeal_reason = body.reason || ''
  } else {
    r.employee_confirm_status = 1
    r.status = 5
  }
  return { success: true }
})

// ============================================================
// 系统设置
// ============================================================
route('GET', '/sys/users/page', ({ query }) => {
  let list = [...db.users]
  if (query.keyword) list = list.filter((u) => u.username.includes(query.keyword) || (u.real_name || '').includes(query.keyword))
  if (query.status !== undefined && query.status !== '') list = list.filter((u) => u.status === Number(query.status))
  const vo = list.map((u) => ({ ...u, employee_name: u.employee_id ? empName(u.employee_id) : null, dept_name: u.dept_id ? deptName(u.dept_id) : null, role_names: u.roles.map((code) => (db.roles.find((r) => r.role_code === code) || {}).role_name).join('、') }))
  return paginate(vo, query)
})

route('POST', '/sys/users', ({ body }) => {
  requireFields(body, ['username', 'realName'])
  if (db.users.some((u) => u.username === body.username)) fail('登录账号已存在')
  if ((body.password || '').length < 8) fail('密码长度不得少于 8 位（BR-09-01）')
  const u = { id: genId(), username: body.username, password: body.password || 'Init@2026', real_name: body.realName, employee_id: body.employeeId ? Number(body.employeeId) : null, dept_id: body.deptId ? Number(body.deptId) : null, roles: body.roles || ['ROLE_EMPLOYEE'], status: 1, last_login_time: null }
  db.users.push(u)
  return { success: true, id: u.id }
})

route('PUT', '/sys/users/:id', ({ params, body }) => {
  const u = db.users.find((x) => x.id === Number(params.id))
  if (!u) fail('用户不存在', 404)
  if (body.status !== undefined) {
    // BR-09-02 管理员不可停用自身账号
    if (u.roles.includes('ROLE_ADMIN') && Number(body.status) === 0 && u.id === 1) fail('不可停用自身的管理员账号（BR-09-02）')
    u.status = Number(body.status)
  }
  if (body.roles) u.roles = body.roles
  if (body.realName) u.real_name = body.realName
  return { success: true }
})

route('PUT', '/sys/users/:id/password/reset', ({ params }) => {
  const u = db.users.find((x) => x.id === Number(params.id))
  if (!u) fail('用户不存在', 404)
  u.password = 'Init@2026'
  u.login_fail_count = 0
  u.status = 1
  return { success: true, initPassword: 'Init@2026' }
})

route('DELETE', '/sys/users/:id', ({ params }) => {
  const u = db.users.find((x) => x.id === Number(params.id))
  if (!u) fail('用户不存在', 404)
  if (u.roles.includes('ROLE_ADMIN')) fail('管理员账号不可删除（BR-09-02）')
  u.status = 0
  return { success: true }
})

route('GET', '/sys/roles', () => ({ records: db.roles, total: db.roles.length }))
route('POST', '/sys/roles', ({ body }) => {
  requireFields(body, ['roleCode', 'roleName'])
  if (db.roles.some((r) => r.role_code === body.roleCode)) fail('角色编码已存在')
  const r = { id: genId(), role_code: body.roleCode, role_name: body.roleName, data_scope: Number(body.dataScope || 4), role_type: 2, sort_no: db.roles.length + 1, status: 1, description: body.description || '' }
  db.roles.push(r)
  return { success: true, id: r.id }
})
route('PUT', '/sys/roles/:id', ({ params, body }) => {
  const r = db.roles.find((x) => x.id === Number(params.id))
  if (!r) fail('角色不存在', 404)
  if (r.role_type === 1 && body.roleCode && body.roleCode !== r.role_code) fail('系统内置角色不可修改编码')
  for (const k of ['roleName', 'dataScope', 'description', 'status']) if (body[k] !== undefined) r[k] = body[k]
  if (body.dataScope !== undefined) r.data_scope = Number(body.dataScope)
  return { success: true }
})

route('GET', '/sys/dict-types', () => ({ records: db.dictTypes, total: db.dictTypes.length }))
route('GET', '/sys/dict-types/:id/items', ({ params }) => {
  const list = db.dictItems.filter((i) => i.dict_type_id === Number(params.id)).sort((a, b) => a.sort_no - b.sort_no)
  return { records: list, total: list.length }
})

route('GET', '/sys/configs', ({ query }) => {
  let list = [...db.configs]
  if (query.group) list = list.filter((c) => c.config_group === query.group)
  return { records: list, total: list.length }
})
route('PUT', '/sys/configs/:id', ({ params, body }) => {
  const c = db.configs.find((x) => x.id === Number(params.id))
  if (!c) fail('参数不存在', 404)
  if (c.is_system === 1 && body.configValue === '') fail('系统内置参数不允许置空')
  c.config_value = body.configValue
  return { success: true }
})

route('GET', '/sys/logs/login', ({ query }) => paginate([...db.loginLogs].sort((a, b) => (a.login_time < b.login_time ? 1 : -1)), query))
route('GET', '/sys/logs/oper', ({ query }) => paginate([...db.operLogs].sort((a, b) => (a.oper_time < b.oper_time ? 1 : -1)), query))

// 公告管理
route('GET', '/notices/page', ({ query }) => {
  let list = [...db.notices]
  if (query.status) list = list.filter((n) => n.status === Number(query.status))
  const vo = list.map((n) => ({ ...n, publisher_name: n.publisher_id ? empName(n.publisher_id) : null })).sort((a, b) => (a.publish_time < b.publish_time ? 1 : -1))
  return paginate(vo, query)
})
route('POST', '/notices', ({ user, body }) => {
  requireFields(body, ['title'])
  const n = { id: genId(), title: body.title, content: body.content || '', notice_type: Number(body.noticeType || 3), publisher_id: user.employeeId, publish_time: null, target_scope: Number(body.targetScope || 1), target_dept_ids: body.targetDeptIds || null, is_top: Number(body.isTop || 0), read_count: 0, status: 1 }
  db.notices.push(n)
  return { success: true, id: n.id }
})
route('PUT', '/notices/:id/publish', ({ params }) => {
  const n = db.notices.find((x) => x.id === Number(params.id))
  if (!n) fail('公告不存在', 404)
  n.status = 2
  n.publish_time = now()
  return { success: true }
})
route('PUT', '/notices/:id/offline', ({ params }) => {
  const n = db.notices.find((x) => x.id === Number(params.id))
  if (!n) fail('公告不存在', 404)
  n.status = 3
  return { success: true }
})

// ============================================================
// 分发入口
// ============================================================
const delay = () => new Promise((r) => setTimeout(r, 180 + Math.random() * 220))

export async function mockRequest(config) {
  await delay()
  const method = (config.method || 'get').toUpperCase()
  // request.js 已拼接 VITE_BASE_API（/api），此处剥掉以匹配路由表
  const url = String(config.url || '').replace(/^\/api/, '')
  const hit = matchRoute(method, url)
  if (!hit) {
    ElMessage.error(`[mock] 接口未实现: ${method} ${url}`)
    return Promise.reject(new Error(`[mock] 接口未实现: ${method} ${url}`))
  }
  // 令牌校验（仅校验格式并还原用户）
  const auth = (config.headers && config.headers.Authorization) || ''
  const payload = parseMockToken(String(auth).replace(/^Bearer\s+/i, ''))
  const user = payload ? db.users.find((u) => u.id === payload.userId) : null
  const isPublic = url === '/auth/login'
  if (!isPublic && !user) {
    ElMessage.error('登录状态已失效，请重新登录')
    return Promise.reject(new Error('Unauthorized'))
  }
  if (user && user.status !== 1) {
    ElMessage.error('账号已被停用或锁定')
    return Promise.reject(new Error('Forbidden'))
  }
  try {
    // 统一驼峰命名注入（db 用户为蛇形字段，handler 统一使用 employeeId/deptId）
    const ctxUser = user
      ? { ...user, employeeId: user.employee_id, deptId: user.dept_id }
      : {}
    // 对齐真实后端行为：剔除空查询参数（null/''/undefined），
    // 避免视图传 status:null 时 Number(null)=0 被误当成筛选条件
    const query = Object.fromEntries(
      Object.entries(config.params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
    )
    const data = hit.route.handler({
      user: ctxUser,
      params: hit.params,
      query,
      body: config.data || {}
    })
    return Promise.resolve(data)
  } catch (e) {
    if (e && e.message && e.code) {
      ElMessage.error(e.message)
      return Promise.reject(new Error(e.message))
    }
    ElMessage.error(e?.message || '服务异常')
    return Promise.reject(e)
  }
}
