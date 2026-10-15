/**
 * 前后端联调测试台（真实驱动 src/api/** 的全部 91 个请求）
 *
 * 目的：验证前端声明的每一个请求都真实打到后端接口，而不是由本地 mock 返回。
 *
 * 三处刻意「以前端请求为基准」的做法：
 *  1. 载荷字段名一律取自页面表单（src/views 下各页面 Object.assign(form, {...}) 的初始字段）
 *     与页面调用实参，而不是由测试脚本自行猜测 —— 猜错字段名会把"脚本问题"误报成"接口问题"；
 *  2. 调用角色对齐页面真实使用者：员工自助页用员工账号、招聘/培训管理页用 HR 账号、
 *     系统管理页用管理员账号；
 *  3. 请求一律经 src/utils/request.js 的业务封装发出（而非绕过封装直接 fetch），
 *     这样测到的就是前端真实运行时的请求链路。
 *
 * 副作用控制：
 *  - 探针数据统一 TCP 前缀，收尾按前缀清理；
 *  - 更新/删除类优先作用于本套件自建探针记录；
 *  - 薪资核算使用无记录的探针月份（2026-01），收尾按整月清除；
 *  - 封账用例使用"已封账"月报 → 命中 BR-04-03 拦截，不改动任何数据；
 *  - 待办处理记录被处理的 id，收尾复原 handle_status。
 */
import { setToken } from '@/utils/auth'
import { login, getInfo, logout } from '@/api/auth'
import { getSummary, getTodos, getNotices, getCharts, handleTodo } from '@/api/dashboard'
import {
  getDeptTree, getDepts, createDept, updateDept, deleteDept,
  getPositions, createPosition, updatePosition
} from '@/api/dept'
import {
  pageEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee,
  changeEmployeeStatus, getEmployeeChanges, createChange, pageChanges, pageContracts, createContract
} from '@/api/employee'
import {
  getToday, checkin, checkout, pageAttendance, pageLeaveRequests, createLeaveRequest,
  approveLeaveRequest, getMyLeaveBalances, pageOvertimeRequests, createOvertimeRequest,
  approveOvertimeRequest, pageTrips, createTrip, approveTrip, pageAttendanceMonths, lockAttendanceMonth
} from '@/api/attendance'
import {
  pageSalaryStandards, createSalaryStandard, pageSalaryRecords, calculateSalary,
  reviewSalaryRecord, paySalaryRecord, getMyPayslips, getPayslipItems
} from '@/api/salary'
import {
  pageRecruitRequests, createRecruitRequest, approveRecruitRequest, pageCandidates,
  createCandidate, changeCandidateStage, getInterviewRecords, createInterviewRecord,
  pageOffers, sendOffer, changeOfferStatus
} from '@/api/recruit'
import { pageTrainingPlans, createTrainingPlan, enrollTraining, getMyTraining } from '@/api/training'
import {
  pagePerfPlans, createPerfPlan, publishPerfPlan, pagePerfRecords,
  submitSelfScore, submitLeaderScore, confirmPerfRecord
} from '@/api/performance'
import {
  pageSysUsers, createSysUser, updateSysUser, resetSysUserPassword, deleteSysUser,
  getRoles, createRole, updateRole, getDictTypes, getDictItems, getConfigs, updateConfig,
  pageLoginLogs, pageOperLogs, pageNotices, createNotice, publishNotice, offlineNotice
} from '@/api/system'

const PROBE = 'TCP'
const HOST = location.origin
const NO_SUCH_ID = 999999 // 用于「不存在的资源」类用例：验证链路可达且不触碰演示数据

// ---------------------------------------------------------------- 基础工具

const pad = (n) => String(n).padStart(2, '0')
const d = (offset = 0) => {
  const t = new Date(Date.now() + offset * 86400000)
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`
}
/** 后端 spring.jackson.date-format = yyyy-MM-dd HH:mm:ss，LocalDateTime 必须用空格分隔 */
const dt = (offset = 0, time = '09:00:00') => `${d(offset)} ${time}`

/** 原生请求，仅用于采集固件（不计入用例结果） */
async function raw(method, path, { params, data, token } = {}) {
  const url = new URL('/api' + path, HOST)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
    })
  }
  const res = await fetch(url.toString(), {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: data === undefined ? undefined : JSON.stringify(data)
  })
  let body = null
  try {
    body = await res.json()
  } catch {
    /* 非 JSON */
  }
  return { status: res.status, body }
}

/** 路径模板 → 正则：/employees/{id}/changes → /employees/[^/]+/changes */
function pathToRegExp(tpl) {
  const escaped = tpl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{[^}]+\\\}/g, '[^/]+')
  return new RegExp(`^/api${escaped}(\\?|$)`)
}

// ---------------------------------------------------------------- 用例登记

const CASES = []
const S = {} // 探针固件
const T = {} // 角色令牌

/**
 * @param {string} role 该请求在页面上由哪类账号发起：admin / hr / mgr / emp
 */
function c(id, module, method, path, run, role) {
  CASES.push({ id, module, method: method.toUpperCase(), path, run, role })
}

// ---- 认证与令牌（3）
c('FE-001', '认证与令牌', 'POST', '/auth/login', async () => {
  const r = await login({ username: 'admin', password: 'admin123' })
  T.adminLogin = r?.token
  return r
}, 'guest')
c('FE-002', '认证与令牌', 'GET', '/auth/me', () => getInfo(), 'admin')
c('FE-091', '认证与令牌', 'POST', '/auth/logout', () => logout(), 'admin')

// ---- 首页看板（5）
c('FE-003', '首页看板', 'GET', '/dashboard/summary', () => getSummary(), 'admin')
c('FE-004', '首页看板', 'GET', '/dashboard/todos', async () => {
  const r = await getTodos()
  const rows = r?.records || r || []
  S.pendingTodoId = (Array.isArray(rows) ? rows : []).find((x) => (x.handleStatus ?? x.handle_status) === 0)?.id
  return r
}, 'mgr')
c('FE-005', '首页看板', 'GET', '/dashboard/notices', () => getNotices(), 'admin')
c('FE-006', '首页看板', 'GET', '/dashboard/charts', () => getCharts(), 'admin')
c('FE-007', '首页看板', 'PUT', '/dashboard/todos/{id}/handle', async () => {
  // 页面调用实参为 { result: 1 }（后端该接口不接收 body，仅取路径变量）
  const id = S.pendingTodoId || NO_SUCH_ID
  const r = await handleTodo(id, { result: 1 })
  if (S.pendingTodoId) S.handledTodoIds.push(S.pendingTodoId)
  return r
}, 'mgr')

// ---- 组织管理（8）：载荷字段取自 dept/index.vue + dept/positions.vue 表单
c('FE-008', '组织管理', 'GET', '/depts/tree', () => getDeptTree(), 'admin')
c('FE-009', '组织管理', 'GET', '/depts', () => getDepts(), 'admin')
c('FE-010', '组织管理', 'POST', '/depts', async () => {
  const r = await createDept({ deptCode: `${PROBE}_FE_DEPT`, name: `${PROBE}联调探针部门`, parentId: 1, deptType: 3, headcountLimit: 0, phone: '' })
  S.deptId = r?.id
  return r
}, 'admin')
c('FE-011', '组织管理', 'PUT', '/depts/{id}', () => updateDept(S.deptId, {
  id: S.deptId, deptCode: `${PROBE}_FE_DEPT`, name: `${PROBE}联调探针部门(改)`, parentId: 1, deptType: 3, headcountLimit: 0, phone: ''
}), 'admin')
c('FE-012', '组织管理', 'DELETE', '/depts/{id}', () => deleteDept(S.deptId), 'admin')
c('FE-013', '组织管理', 'GET', '/positions', () => getPositions({ current: 1, size: 10 }), 'admin')
c('FE-014', '组织管理', 'POST', '/positions', async () => {
  const r = await createPosition({ positionCode: `${PROBE}_FE_POS`, positionName: `${PROBE}联调探针岗位`, positionSeq: 2, jobLevel: 'P5', headcountLimit: 3 })
  S.positionId = r?.id
  return r
}, 'hr')
c('FE-015', '组织管理', 'PUT', '/positions/{id}', () => updatePosition(S.positionId, {
  positionCode: `${PROBE}_FE_POS`, positionName: `${PROBE}联调探针岗位(改)`, positionSeq: 2, jobLevel: 'P5', headcountLimit: 3
}), 'hr')

// ---- 员工管理（11）：载荷字段取自 employee/index.vue 表单
c('FE-016', '员工管理', 'GET', '/employees/page', () => pageEmployees({ current: 1, size: 10 }), 'admin')
c('FE-017', '员工管理', 'GET', '/employees/{id}', () => getEmployee(S.empId), 'admin')
c('FE-018', '员工管理', 'POST', '/employees', async () => {
  const r = await createEmployee({
    name: `${PROBE}联调探针员工`, gender: 'M', deptId: S.empDeptId, positionId: S.empPositionId,
    jobLevel: 'P5', salary: 11000, phone: '13900000009', email: 'tcp.fe@example.com',
    hireDate: d(-30), education: 3, employeeType: 1
  })
  S.probeEmpId = r?.id
  return r
}, 'hr')
c('FE-019', '员工管理', 'PUT', '/employees/{id}', () => updateEmployee(S.probeEmpId, {
  name: `${PROBE}联调探针员工`, gender: 'M', deptId: S.empDeptId, positionId: S.empPositionId,
  jobLevel: 'P5', salary: 11500, phone: '13900000009', email: 'tcp.fe@example.com',
  hireDate: d(-30), education: 3, employeeType: 1
}), 'hr')
c('FE-020', '员工管理', 'PUT', '/employees/{id}/status', () => changeEmployeeStatus(S.probeEmpId, { status: 1, reason: `${PROBE} 转正` }), 'hr')
c('FE-021', '员工管理', 'GET', '/employees/{id}/changes', () => getEmployeeChanges(S.probeEmpId), 'admin')
c('FE-022', '员工管理', 'POST', '/employee-changes', () => createChange({
  employeeId: S.probeEmpId, changeType: 1, afterDeptId: S.empDeptId, afterPositionId: S.empPositionId,
  afterSalary: 12000, effectDate: d(0), reason: `${PROBE} 异动探针`
}), 'hr')
c('FE-023', '员工管理', 'GET', '/employee-changes/page', () => pageChanges({ current: 1, size: 10 }), 'admin')
c('FE-024', '员工管理', 'GET', '/employee-contracts/page', () => pageContracts({ current: 1, size: 10 }), 'admin')
c('FE-025', '员工管理', 'POST', '/employee-contracts', () => createContract({
  employeeId: S.probeEmpId, contractType: 1, startDate: d(0), endDate: d(730), probationMonths: 3
}), 'hr')
c('FE-026', '员工管理', 'DELETE', '/employees/{id}', () => deleteEmployee(S.probeEmpId), 'hr')

// ---- 考勤与假勤（16）：载荷字段取自 attendance/*.vue 表单
c('FE-027', '考勤与假勤', 'GET', '/attendance/today', () => getToday(), 'demo')
c('FE-028', '考勤与假勤', 'POST', '/attendance/checkin', () => checkin(), 'probeEmp')
c('FE-029', '考勤与假勤', 'POST', '/attendance/checkout', () => checkout(), 'probeEmp')
c('FE-030', '考勤与假勤', 'GET', '/attendance/records', () => pageAttendance({ current: 1, size: 14 }), 'demo')
c('FE-031', '考勤与假勤', 'GET', '/leave-requests/page', () => pageLeaveRequests({ current: 1, size: 10, tab: 0 }), 'demo')
c('FE-032', '考勤与假勤', 'POST', '/leave-requests', async () => {
  const r = await createLeaveRequest({ leaveTypeId: 1, startTime: dt(140, '09:00:00'), endTime: dt(140, '18:00:00'), days: 1, reason: `${PROBE} 联调请假探针` })
  S.leaveId = r?.id
  return r
}, 'probeEmp')
c('FE-033', '考勤与假勤', 'PUT', '/leave-requests/{id}/approve', () => approveLeaveRequest(S.leaveId, { result: 2, opinion: `${PROBE} 联调审批` }), 'hr')
c('FE-034', '考勤与假勤', 'GET', '/leave-balances/my', () => getMyLeaveBalances(), 'demo')
c('FE-035', '考勤与假勤', 'GET', '/overtime-requests/page', () => pageOvertimeRequests({ current: 1, size: 10, tab: 0 }), 'demo')
c('FE-036', '考勤与假勤', 'POST', '/overtime-requests', async () => {
  const r = await createOvertimeRequest({ overtimeDate: d(141), startTime: '18:30', endTime: '21:30', hours: 3, overtimeType: 1, compensateType: 1, reason: `${PROBE} 联调加班探针` })
  S.otId = r?.id
  return r
}, 'probeEmp')
c('FE-037', '考勤与假勤', 'PUT', '/overtime-requests/{id}/approve', () => approveOvertimeRequest(S.otId, { result: 2, opinion: '' }), 'hr')
c('FE-038', '考勤与假勤', 'GET', '/business-trips/page', () => pageTrips({ current: 1, size: 10, tab: 0 }), 'demo')
c('FE-039', '考勤与假勤', 'POST', '/business-trips', async () => {
  const r = await createTrip({ destination: `${PROBE} 联调出差地`, startTime: dt(142, '09:00:00'), endTime: dt(143, '18:00:00'), days: 2, transport: 2, budgetAmount: 1200, purpose: `${PROBE} 联调出差` })
  S.tripId = r?.id
  return r
}, 'probeEmp')
c('FE-040', '考勤与假勤', 'PUT', '/business-trips/{id}/approve', () => approveTrip(S.tripId, { result: 2, opinion: '' }), 'hr')
c('FE-041', '考勤与假勤', 'GET', '/attendance-months/page', () => pageAttendanceMonths({ current: 1, size: 10, year: 2026, month: 7, lockStatus: 1 }), 'hr')
c('FE-042', '考勤与假勤', 'PUT', '/attendance-months/{id}/lock', () => lockAttendanceMonth(S.lockedMonthId), 'hr')

// ---- 薪资管理（8）
c('FE-043', '薪资管理', 'GET', '/salary-standards/page', () => pageSalaryStandards({ current: 1, size: 10 }), 'hr')
c('FE-044', '薪资管理', 'POST', '/salary-standards', () => createSalaryStandard({
  standardCode: `${PROBE}_FE_STD`, standardName: `${PROBE}联调薪资标准`, positionSeq: 2, jobLevel: 'P5',
  baseSalary: 8000, postSalary: 2500, performanceSalary: 1500, allowance: 500
}), 'hr')
c('FE-045', '薪资管理', 'GET', '/salary-records/page', () => pageSalaryRecords({ current: 1, size: 10, year: 2026, month: 7 }), 'hr')
// 页面调用实参为 { year, month }（与后端 SalaryCalculateReq 字段一致）；使用无记录的探针月份
c('FE-046', '薪资管理', 'POST', '/salary-records/calculate', () => calculateSalary({ year: 2026, month: 1 }), 'hr')
c('FE-047', '薪资管理', 'PUT', '/salary-records/{id}/review', () => reviewSalaryRecord(NO_SUCH_ID), 'hr')
c('FE-048', '薪资管理', 'PUT', '/salary-records/{id}/pay', () => paySalaryRecord(NO_SUCH_ID, { payDate: d(0) }), 'hr')
c('FE-049', '薪资管理', 'GET', '/salary/payslips/my', async () => {
  const r = await getMyPayslips()
  const rows = r?.records || r || []
  S.payslipRecordId = (Array.isArray(rows) ? rows : [])[0]?.id || NO_SUCH_ID
  return r
}, 'demo')
c('FE-050', '薪资管理', 'GET', '/salary/payslips/{recordId}/items', () => getPayslipItems(S.payslipRecordId), 'demo')

// ---- 招聘管理（11）：载荷字段取自 recruit/*.vue 表单
c('FE-051', '招聘管理', 'GET', '/recruit-requests/page', () => pageRecruitRequests({ current: 1, size: 10 }), 'hr')
c('FE-052', '招聘管理', 'POST', '/recruit-requests', async () => {
  const r = await createRecruitRequest({
    requestDeptId: S.empDeptId, positionName: `${PROBE}联调招聘岗位`, recruitCount: 1, jobLevel: 'P5',
    salaryMin: 15000, salaryMax: 22000, educationReq: 3, urgency: 1, hopeArriveDate: d(30),
    jobDescription: `${PROBE} 联调招聘需求`, jobRequirement: `本科及以上`
  })
  S.recruitId = r?.id
  return r
}, 'hr')
c('FE-053', '招聘管理', 'PUT', '/recruit-requests/{id}/approve', () => approveRecruitRequest(S.recruitId, { result: 2 }), 'hr')
c('FE-054', '招聘管理', 'GET', '/candidates/page', () => pageCandidates({ current: 1, size: 10 }), 'hr')
c('FE-055', '招聘管理', 'POST', '/candidates', async () => {
  const r = await createCandidate({
    recruitRequestId: S.recruitId, name: `${PROBE}联调候选人`, workYears: 3, education: 3, source: 2,
    currentCompany: `${PROBE}前公司`, expectSalary: 18000, phone: '13900000008'
  })
  S.candidateId = r?.id
  return r
}, 'hr')
c('FE-056', '招聘管理', 'PUT', '/candidates/{id}/stage', () => changeCandidateStage(S.candidateId, { stage: 2 }), 'hr')
c('FE-057', '招聘管理', 'GET', '/interview-records', () => getInterviewRecords({ candidateId: S.candidateId }), 'hr')
c('FE-058', '招聘管理', 'POST', '/interview-records', () => createInterviewRecord({
  interviewType: 1, interviewTime: dt(3, '10:00:00'), interviewPlace: `${PROBE} 联调面试间`,
  score: 85, conclusion: 1, evaluation: `${PROBE} 联调面试评价`, candidateId: S.candidateId
}), 'hr')
c('FE-059', '招聘管理', 'GET', '/offers/page', () => pageOffers({ current: 1, size: 10 }), 'hr')
c('FE-060', '招聘管理', 'PUT', '/offers/{id}/send', () => sendOffer(NO_SUCH_ID), 'hr')
c('FE-061', '招聘管理', 'PUT', '/offers/{id}/status', () => changeOfferStatus(NO_SUCH_ID, { status: 6 }), 'hr')

// ---- 培训管理（4）
c('FE-062', '培训管理', 'GET', '/training-plans/page', () => pageTrainingPlans({ current: 1, size: 10 }), 'hr')
c('FE-063', '培训管理', 'POST', '/training-plans', async () => {
  const r = await createTrainingPlan({
    planName: `${PROBE}联调培训计划`, planYear: 2026, trainType: 2, budgetAmount: 0,
    startDate: d(150), endDate: d(152), description: `${PROBE} 联调探针`
  })
  S.trainPlanId = r?.id
  return r
}, 'hr')
c('FE-064', '培训管理', 'POST', '/training-plans/{id}/enroll', () => enrollTraining(S.trainPlanId), 'probeEmp')
c('FE-065', '培训管理', 'GET', '/training/my', () => getMyTraining(), 'demo')

// ---- 绩效考核（7）：载荷字段取自 performance/*.vue
c('FE-066', '绩效考核', 'GET', '/performance-plans/page', () => pagePerfPlans({ current: 1, size: 10 }), 'hr')
c('FE-067', '绩效考核', 'POST', '/performance-plans', async () => {
  const r = await createPerfPlan({
    planName: `${PROBE}联调考核方案`, periodType: 2, planYear: 2026, startDate: d(-5), endDate: d(25),
    gradeRule: 'S:90+,A:80-89,B:70-79,C:60-69,D:<60', forceDistribution: 0, distributionRule: ''
  })
  S.perfPlanId = r?.id
  return r
}, 'hr')
c('FE-068', '绩效考核', 'PUT', '/performance-plans/{id}/publish', () => publishPerfPlan(S.perfPlanId), 'hr')
c('FE-069', '绩效考核', 'GET', '/performance-records/page', () => pagePerfRecords({ current: 1, size: 10, planId: null, status: null }), 'hr')
// 页面调用实参为 { score }（与后端 ScoreReq.score 一致）
c('FE-070', '绩效考核', 'PUT', '/performance-records/{id}/self-score', () => submitSelfScore(NO_SUCH_ID, { score: 85 }), 'probeEmp')
c('FE-071', '绩效考核', 'PUT', '/performance-records/{id}/leader-score', () => submitLeaderScore(NO_SUCH_ID, { score: 88 }), 'hr')
c('FE-072', '绩效考核', 'PUT', '/performance-records/{id}/confirm', () => confirmPerfRecord(NO_SUCH_ID, {}), 'hr')

// ---- 通知公告（4）：载荷字段取自 notice/index.vue 表单
c('FE-073', '通知公告', 'GET', '/notices/page', () => pageNotices({ current: 1, size: 10, status: null }), 'hr')
c('FE-074', '通知公告', 'POST', '/notices', async () => {
  const r = await createNotice({ title: `${PROBE}联调探针公告`, content: `${PROBE} 联调公告内容`, noticeType: 3, targetScope: 1, isTop: 0 })
  S.noticeId = r?.id
  return r
}, 'hr')
c('FE-075', '通知公告', 'PUT', '/notices/{id}/publish', () => publishNotice(S.noticeId), 'hr')
c('FE-076', '通知公告', 'PUT', '/notices/{id}/offline', () => offlineNotice(S.noticeId), 'hr')

// ---- 系统管理（18）：载荷字段取自 system/*.vue 表单
c('FE-077', '系统管理', 'GET', '/sys/users/page', () => pageSysUsers({ current: 1, size: 10 }), 'admin')
c('FE-078', '系统管理', 'POST', '/sys/users', async () => {
  const r = await createSysUser({ username: `${PROBE.toLowerCase()}_fe_usr`, realName: `${PROBE}联调账号`, password: 'TcpFe@12345', roles: ['ROLE_EMPLOYEE'] })
  S.sysUserId = r?.id
  return r
}, 'admin')
c('FE-079', '系统管理', 'PUT', '/sys/users/{id}', () => updateSysUser(S.sysUserId, {
  id: S.sysUserId, username: `${PROBE.toLowerCase()}_fe_usr`, realName: `${PROBE}联调账号(改)`, roles: ['ROLE_EMPLOYEE']
}), 'admin')
c('FE-080', '系统管理', 'PUT', '/sys/users/{id}/password/reset', () => resetSysUserPassword(S.sysUserId), 'admin')
c('FE-081', '系统管理', 'DELETE', '/sys/users/{id}', () => deleteSysUser(S.sysUserId), 'admin')
c('FE-082', '系统管理', 'GET', '/sys/roles', () => getRoles(), 'admin')
c('FE-083', '系统管理', 'POST', '/sys/roles', async () => {
  const r = await createRole({ roleCode: `${PROBE}_FE_ROLE`, roleName: `${PROBE}联调角色`, dataScope: 4, description: `${PROBE} 联调探针` })
  S.roleId = r?.id
  return r
}, 'admin')
c('FE-084', '系统管理', 'PUT', '/sys/roles/{id}', () => updateRole(S.roleId, {
  id: S.roleId, roleCode: `${PROBE}_FE_ROLE`, roleName: `${PROBE}联调角色(改)`, dataScope: 4, description: `${PROBE} 联调探针`
}), 'admin')
c('FE-085', '系统管理', 'GET', '/sys/dict-types', () => getDictTypes(), 'admin')
c('FE-086', '系统管理', 'GET', '/sys/dict-types/{typeId}/items', () => getDictItems(S.dictTypeId), 'admin')
c('FE-087', '系统管理', 'GET', '/sys/configs', async () => {
  const r = await getConfigs()
  const rows = Array.isArray(r) ? r : r?.records || []
  const first = rows.find((x) => x?.id)
  S.configId = first?.id
  S.configValue = first?.configValue ?? first?.config_value
  return r
}, 'admin')
c('FE-088', '系统管理', 'PUT', '/sys/configs/{id}', () => updateConfig(S.configId, { configValue: S.configValue }), 'admin')
c('FE-089', '系统管理', 'GET', '/sys/logs/login', () => pageLoginLogs({ current: 1, size: 10 }), 'admin')
c('FE-090', '系统管理', 'GET', '/sys/logs/oper', () => pageOperLogs({ current: 1, size: 10 }), 'admin')

// ---------------------------------------------------------------- 固件采集

async function fixtures() {
  const empPage = await raw('GET', '/employees/page', { params: { current: 1, size: 20 }, token: T.admin })
  const emps = empPage.body?.data?.records || []
  S.empId = emps[0]?.id
  S.empDeptId = emps[0]?.dept_id ?? emps[0]?.deptId ?? 5
  S.empPositionId = emps[0]?.position_id ?? emps[0]?.positionId ?? 1

  const months = await raw('GET', '/attendance-months/page', { params: { current: 1, size: 50, lockStatus: 1 }, token: T.hr })
  const mrows = months.body?.data?.records || []
  S.lockedMonthId = mrows[0]?.id || NO_SUCH_ID

  const dicts = await raw('GET', '/sys/dict-types', { token: T.admin })
  const drows = dicts.body?.data?.records || dicts.body?.data || []
  S.dictTypeId = (Array.isArray(drows) ? drows[0]?.id : null) || 1

  // 自建「探针员工 + 探针账号」承载员工自助页的写操作（打卡/请假/加班/出差/报名/自评）。
  // 若改用演示员工发起这些写操作：审批通过会回写其假期余额、单据也不会被按员工清理，
  // 既污染演示数据，又会让重复运行被 BR-04-01（请假时间重叠）挡下。
  const pe = await raw('POST', '/employees', {
    token: T.hr,
    data: {
      name: `${PROBE}探针账号员工`, gender: 'M', deptId: S.empDeptId, positionId: S.empPositionId,
      jobLevel: 'P5', salary: 10000, phone: '13900000010', email: 'tcp.fe.probe@example.com',
      hireDate: d(-30), education: 3, employeeType: 1, managerId: S.empId
    }
  })
  S.fixtureEmpId = pe.body?.data?.id
  const pu = await raw('POST', '/sys/users', {
    token: T.admin,
    data: {
      username: 'tcp_fe_emp', realName: `${PROBE}联调探针账号`, password: 'TcpFe@12345',
      employeeId: S.fixtureEmpId, deptId: S.empDeptId, roles: ['ROLE_EMPLOYEE']
    }
  })
  const pl = await raw('POST', '/auth/login', { data: { username: 'tcp_fe_emp', password: 'TcpFe@12345' } })
  T.probeEmp = pl.body?.data?.token || ''
  S.fixture = {
    fixtureEmpId: S.fixtureEmpId,
    createEmpHttp: pe.status,
    createUserHttp: pu.status,
    probeLogin: T.probeEmp ? 'OK' : '失败'
  }

  S.handledTodoIds = []
  S.pendingTodoId = undefined
}

// ---------------------------------------------------------------- 执行

const RESULT = {
  startedAt: new Date().toISOString(),
  mockFlag: import.meta.env.VITE_USE_MOCK ?? '(已移除，环境变量不存在)',
  baseApi: import.meta.env.VITE_BASE_API,
  proxyTarget: import.meta.env.VITE_PROXY_TARGET,
  cases: []
}

function netSince(n) {
  return window.__NET__.slice(n).filter((x) => x.url.includes('/api/'))
}

async function runCase(cs) {
  const mark = window.__NET__.length
  let status = 200
  let ok = true
  let message = ''
  try {
    await cs.run()
  } catch (e) {
    ok = false
    status = e?.code || 0
    message = e?.bizMessage || e?.message || String(e)
  }

  const issued = netSince(mark)
  const re = pathToRegExp(cs.path)
  const hit = issued.find((x) => re.test(x.url.replace(HOST, '')) || re.test(x.url))
  const extras = issued.filter((x) => x !== hit).map((x) => `${x.method} ${x.url}`)

  RESULT.cases.push({
    id: cs.id,
    module: cs.module,
    method: cs.method,
    path: cs.path,
    role: cs.role,
    issued: issued.map((x) => `${x.method} ${x.url.replace(HOST, '')}`),
    hit: hit ? `${hit.method} ${hit.url.replace(HOST, '')}` : '',
    extras,
    httpStatus: status,
    bizOk: ok,
    message,
    issuedReal: Boolean(hit)
  })
}

async function main() {
  const log = []

  const la = await raw('POST', '/auth/login', { data: { username: 'admin', password: 'admin123' } })
  T.admin = la.body?.data?.token || ''
  const lh = await raw('POST', '/auth/login', { data: { username: 'lina', password: 'admin123' } })
  T.hr = lh.body?.data?.token || ''
  const lm = await raw('POST', '/auth/login', { data: { username: 'shenjianguo', password: 'admin123' } })
  T.mgr = lm.body?.data?.token || ''
  const le = await raw('POST', '/auth/login', { data: { username: 'linwanqing', password: 'admin123' } })
  T.demo = le.body?.data?.token || ''
  log.push(`预登录：admin=${T.admin ? 'OK' : '失败'} lina=${T.hr ? 'OK' : '失败'} shenjianguo=${T.mgr ? 'OK' : '失败'} linwanqing=${T.demo ? 'OK' : '失败'}`)

  await fixtures()
  log.push(`固件：empId=${S.empId} dept=${S.empDeptId} pos=${S.empPositionId} lockedMonth=${S.lockedMonthId} dictType=${S.dictTypeId}`)
  log.push(`探针员工/账号：${JSON.stringify(S.fixture)}`)

  // 执行顺序：login 先、logout 尾，其余按声明顺序
  const ordered = [
    ...CASES.filter((x) => x.id === 'FE-001'),
    ...CASES.filter((x) => x.id !== 'FE-001' && x.id !== 'FE-091'),
    ...CASES.filter((x) => x.id === 'FE-091')
  ]
  for (const cs of ordered) {
    const tk = { admin: T.admin, hr: T.hr, mgr: T.mgr, demo: T.demo, probeEmp: T.probeEmp, guest: '' }[cs.role] || T.admin
    setToken(tk)
    setToken(tk)
    try {
      await runCase(cs)
    } catch (err) {
      RESULT.cases.push({
        id: cs.id, module: cs.module, method: cs.method, path: cs.path, role: cs.role,
        issued: [], hit: '', extras: [], httpStatus: 0, bizOk: false,
        message: `用例异常：${err && err.message}`, issuedReal: false
      })
    }
    const r = RESULT.cases[RESULT.cases.length - 1]
    log.push(`${r.issuedReal ? 'ISSUED' : 'MISS  '} ${r.id} ${r.method} ${r.path} → HTTP ${r.httpStatus}${r.message ? ' | ' + r.message : ''}`)
  }

  RESULT.finishedAt = new Date().toISOString()
  RESULT.summary = {
    total: RESULT.cases.length,
    issuedReal: RESULT.cases.filter((x) => x.issuedReal).length,
    notIssued: RESULT.cases.filter((x) => !x.issuedReal).length,
    http200: RESULT.cases.filter((x) => x.httpStatus === 200).length
  }
  RESULT.probe = {
    handledTodoIds: S.handledTodoIds || [],
    fixture: S.fixture || {},
    fixtureEmpId: S.fixtureEmpId,
    caseEmpId: S.probeEmpId,
    probeDeptId: S.deptId,
    probePositionId: S.positionId
  }
  RESULT.log = log

  window.__JOINT__ = RESULT
  const pre = document.getElementById('jointresult')
  if (pre) pre.textContent = JSON.stringify(RESULT)
  const kpi = document.getElementById('kpi')
  if (kpi) {
    kpi.innerHTML = `<div>前端请求总数 <b>${RESULT.summary.total}</b></div>
      <div>真实打后端 <b class="ok">${RESULT.summary.issuedReal}</b></div>
      <div>未产生出行 <b class="bad">${RESULT.summary.notIssued}</b></div>
      <div>HTTP 200 <b>${RESULT.summary.http200}</b></div>
      <div>mock 开关 <b>${RESULT.mockFlag}</b></div>`
  }
  document.title = `联调完成 ${RESULT.summary.issuedReal}/${RESULT.summary.total}`
}

main().catch((err) => {
  window.__JOINT_ERROR__ = String(err && err.stack ? err.stack : err)
  const pre = document.getElementById('jointresult')
  if (pre) pre.textContent = JSON.stringify({ fatal: window.__JOINT_ERROR__ })
  document.title = '联调测试异常'
})
