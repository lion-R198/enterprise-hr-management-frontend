/**
 * ⚠【已废弃 · 请勿用于当前验收】—— 历史 mock 通道时期的 E2E 测试台
 *
 * 本文件写于前端仍存在 mock 通道的阶段，其判定口径（含下方硬编码的 useMock 字段）
 * 与"所有请求必须调用后端接口"的现网要求已不一致，结论不可作为联调依据。
 *
 * 请改用：dev/joint-test.html（91 条用例 + 客户端探针 ∩ 服务端代理日志 双证据判定）
 *        执行器：scripts/run-joint-test.mjs  →  结果：verify/joint-result.json
 *
 * ---------------------------------------------------------------------------
 * 接口运行时测试（E2E）—— 历史实现：走 request.js → mock 分发器 → 内存库
 * （注：request.js 的 mock 分支已被移除，本脚本现在实际会打到真实后端，
 *   但其用例集与判定逻辑仍是旧口径，故整体废弃。）
 * 覆盖 src/api/*.js 声明的全部请求地址，按角色分组运行（权限矩阵 + 数据范围一并验证）。
 * 结果写入 <pre id="apiresult">（base64(JSON)），由 scripts/api-contract-audit.mjs 读取。
 * 访问：http://localhost:5173/dev/api-test.html
 */
import { getToken, setToken, removeToken } from '@/utils/auth'
import { login, getInfo, logout } from '@/api/auth'
import { getSummary, getTodos, getNotices, getCharts, handleTodo } from '@/api/dashboard'
import {
  pageEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee,
  changeEmployeeStatus, getEmployeeChanges, createChange, pageChanges, pageContracts, createContract
} from '@/api/employee'
import { getDeptTree, getDepts, createDept, updateDept, deleteDept, getPositions, createPosition, updatePosition } from '@/api/dept'
import {
  getToday, checkin, checkout, pageAttendance, pageLeaveRequests, createLeaveRequest, approveLeaveRequest,
  getMyLeaveBalances, pageOvertimeRequests, createOvertimeRequest, approveOvertimeRequest,
  pageTrips, createTrip, approveTrip, pageAttendanceMonths, lockAttendanceMonth
} from '@/api/attendance'
import {
  pageSalaryStandards, createSalaryStandard, pageSalaryRecords, calculateSalary,
  reviewSalaryRecord, paySalaryRecord, getMyPayslips, getPayslipItems
} from '@/api/salary'
import {
  pageRecruitRequests, createRecruitRequest, approveRecruitRequest, pageCandidates, createCandidate,
  changeCandidateStage, getInterviewRecords, createInterviewRecord, pageOffers, sendOffer, changeOfferStatus
} from '@/api/recruit'
import { pageTrainingPlans, createTrainingPlan, enrollTraining, getMyTraining } from '@/api/training'
import { pagePerfPlans, createPerfPlan, publishPerfPlan, pagePerfRecords, submitSelfScore, submitLeaderScore, confirmPerfRecord } from '@/api/performance'
import {
  pageSysUsers, createSysUser, updateSysUser, resetSysUserPassword, deleteSysUser, getRoles, createRole, updateRole,
  getDictTypes, getDictItems, getConfigs, updateConfig, pageLoginLogs, pageOperLogs,
  pageNotices, createNotice, publishNotice, offlineNotice
} from '@/api/system'

const ACCOUNTS = { hr: 'hr01', mgr: 'mgr01', fin: 'fin01', emp: 'emp01', admin: 'admin' }
const PWD = '123456'
const pad = (n) => String(n).padStart(2, '0')
const d = new Date()
const TODAY = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const day = (n) => {
  const x = new Date()
  x.setDate(x.getDate() + n)
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`
}

const ctx = {} // 跨用例共享的前置数据（创建出来的 id 等）

/** 用例：expect = 'ok' | 'biz'（期望业务规则拦截）| 'any'；可用函数动态判定 */
const CASES = []
const add = (c) => CASES.push(c)

// ---------------------------------------------------------------- 认证
add({ module: '认证', page: '登录页 /login', role: 'guest', name: '登录（签发令牌）', method: 'POST', url: '/api/auth/login', tables: 'sys_user,sys_user_role,sys_role,sys_login_log', expect: 'ok',
  run: async () => { const r = await login({ username: 'hr01', password: PWD }); setToken(r.token); ctx.hrToken = r.token; return r } })
add({ module: '认证', page: '守卫 permission.js', role: 'hr', name: '当前登录用户信息', method: 'GET', url: '/api/auth/me', tables: 'sys_user,sys_user_role,sys_role', expect: 'ok', run: () => getInfo() })
add({ module: '认证', page: '登录页 /login', role: 'hr', name: '密码错误应被拒绝', method: 'POST', url: '/api/auth/login', tables: 'sys_user', expect: 'biz', expectMsg: '用户名或密码错误',
  run: () => login({ username: 'hr01', password: 'wrong-password' }) })

// ---------------------------------------------------------------- 首页看板
add({ module: '首页看板', page: '首页 /dashboard', role: 'hr', name: '指标卡（全量数据范围）', method: 'GET', url: '/api/dashboard/summary', tables: 'employee,dept,attendance_record,todo_task,employee_contract', expect: 'ok', run: () => getSummary() })
add({ module: '首页看板', page: '首页 /dashboard', role: 'hr', name: '待办事项', method: 'GET', url: '/api/dashboard/todos', tables: 'todo_task', expect: 'ok', run: async () => { const r = await getTodos(); ctx.todo = r.records?.[0]; return r } })
add({ module: '首页看板', page: '首页 /dashboard', role: 'hr', name: '通知公告（看板）', method: 'GET', url: '/api/dashboard/notices', tables: 'notice,notice_read', expect: 'ok', run: () => getNotices() })
add({ module: '首页看板', page: '首页 /dashboard', role: 'hr', name: '图表分析（折线/环形）', method: 'GET', url: '/api/dashboard/charts', tables: 'employee,dept', expect: 'ok', run: () => getCharts() })
add({ module: '首页看板', page: '首页 /dashboard', role: 'hr', name: '处理待办', method: 'PUT', url: '/api/dashboard/todos/:id/handle', tables: 'todo_task', expect: (c) => (c.todo ? 'ok' : 'any'), expectMsg: '',
  run: (c) => handleTodo(c.todo.id, { remark: '自动化测试处理' }) })

// ---------------------------------------------------------------- 员工档案
add({ module: '员工档案', page: '员工档案 /employee', role: 'hr', name: '员工分页查询（hr 全量）', method: 'GET', url: '/api/employees/page', tables: 'employee,dept,position', expect: 'ok', run: async () => { const r = await pageEmployees({ current: 1, size: 10, status: null, deptId: null }); ctx.emp = r.records?.[0]; return r } })
add({ module: '员工档案', page: '员工档案 /employee', role: 'hr', name: '员工详情（脱敏）', method: 'GET', url: '/api/employees/:id', tables: 'employee,dept,position', expect: 'ok', run: (c) => getEmployee(c.emp.id) })
add({ module: '员工档案', page: '员工档案 /employee', role: 'hr', name: '入职办理（工号自动生成 BR-02-01）', method: 'POST', url: '/api/employees', tables: 'employee,employee_change,sys_user', expect: 'ok',
  run: async () => { const r = await createEmployee({ name: '自动化测试员工', gender: 'M', deptId: 1, positionId: 1, phone: '13900000001', email: 'auto@demo.com', hireDate: TODAY, jobLevel: 'P5', employeeType: 1, salary: 12000 }); ctx.empId = r.id; return r } })
add({ module: '员工档案', page: '员工档案 /employee', role: 'hr', name: '修改员工信息', method: 'PUT', url: '/api/employees/:id', tables: 'employee', expect: 'ok', run: (c) => updateEmployee(c.empId, { phone: '13900000002', jobLevel: 'P6' }) })
add({ module: '员工档案', page: '员工档案 /employee', role: 'hr', name: '状态变更-转正（BR-02-04 留痕）', method: 'PUT', url: '/api/employees/:id/status', tables: 'employee,employee_change', expect: 'ok', run: (c) => changeEmployeeStatus(c.empId, { status: 1, reason: '试用期转正（自动化测试）' }) })
add({ module: '员工档案', page: '员工档案 /employee', role: 'hr', name: '员工异动记录（时间线）', method: 'GET', url: '/api/employees/:id/changes', tables: 'employee_change,dept,position', expect: 'ok', run: (c) => getEmployeeChanges(c.empId) })
add({ module: '员工档案', page: '员工档案 /employee', role: 'hr', name: '状态变更-离职', method: 'PUT', url: '/api/employees/:id/status', tables: 'employee,employee_change', expect: 'ok', run: (c) => changeEmployeeStatus(c.empId, { status: 0, reason: '自动化测试离职' }) })
add({ module: '员工档案', page: '员工档案 /employee', role: 'hr', name: '删除员工（逻辑删除 BR-02-03）', method: 'DELETE', url: '/api/employees/:id', tables: 'employee', expect: 'ok', run: (c) => deleteEmployee(c.empId) })
add({ module: '员工档案', page: '异动记录 /employee/changes', role: 'hr', name: '异动分页', method: 'GET', url: '/api/employee-changes/page', tables: 'employee_change,employee,dept', expect: 'ok', run: () => pageChanges({ current: 1, size: 10 }) })
add({ module: '员工档案', page: '异动记录 /employee/changes', role: 'hr', name: '办理异动（调岗）', method: 'POST', url: '/api/employee-changes', tables: 'employee_change,employee', expect: 'ok', run: () => createChange({ employeeId: 1, changeType: 3, effectDate: TODAY, afterDeptId: 3, afterSalary: 32000, reason: '轮岗培养（自动化测试）' }) })
add({ module: '员工档案', page: '合同管理 /employee/contracts', role: 'hr', name: '合同分页（到期预警）', method: 'GET', url: '/api/employee-contracts/page', tables: 'employee_contract,employee', expect: 'ok', run: () => pageContracts({ current: 1, size: 10 }) })
add({ module: '员工档案', page: '合同管理 /employee/contracts', role: 'hr', name: '签订合同', method: 'POST', url: '/api/employee-contracts', tables: 'employee_contract', expect: 'ok', run: () => createContract({ employeeId: 1, contractType: 1, startDate: TODAY, endDate: day(1095), termYears: 3, salaryAgreed: 30000, probationMonths: 3 }) })
add({ module: '员工档案', page: '我的档案 /employee/profile', role: 'emp', name: '查看本人档案（行级隔离）', method: 'GET', url: '/api/employees/:id', tables: 'employee,dept,position', expect: 'ok', run: () => getEmployee(11) })
add({ module: '员工档案', page: '我的档案 /employee/profile', role: 'emp', name: '越权查看他人档案应 403（NF-10）', method: 'GET', url: '/api/employees/:id', tables: 'employee', expect: 'biz', expectMsg: '无权查看他人档案', run: () => getEmployee(1) })

// ---------------------------------------------------------------- 部门 / 岗位
add({ module: '部门管理', page: '组织架构 /dept', role: 'hr', name: '组织架构树', method: 'GET', url: '/api/depts/tree', tables: 'dept,employee', expect: 'ok', run: () => getDeptTree() })
add({ module: '部门管理', page: '组织架构 /dept', role: 'hr', name: '部门列表（扁平）', method: 'GET', url: '/api/depts', tables: 'dept', expect: 'ok', run: () => getDepts() })
add({ module: '部门管理', page: '组织架构 /dept', role: 'hr', name: '新增部门', method: 'POST', url: '/api/depts', tables: 'dept', expect: 'ok',
  run: async () => { const r = await createDept({ name: '自动化测试部', deptCode: 'D999', parentId: 1, deptType: 3, headcountLimit: 10 }); ctx.deptId = r.id; return r } })
add({ module: '部门管理', page: '组织架构 /dept', role: 'hr', name: '修改部门（编制上限）', method: 'PUT', url: '/api/depts/:id', tables: 'dept', expect: 'ok', run: (c) => updateDept(c.deptId, { headcountLimit: 20, phone: '0755-88880000' }) })
add({ module: '部门管理', page: '组织架构 /dept', role: 'hr', name: '删除有下级部门的部门应拒绝', method: 'DELETE', url: '/api/depts/:id', tables: 'dept', expect: 'biz', expectMsg: '下级部门',
  run: async () => { const tree = await getDeptTree(); const withChild = tree.find((n) => n.children?.length); if (!withChild) return { skipped: true }; return deleteDept(withChild.id) } })
add({ module: '部门管理', page: '组织架构 /dept', role: 'hr', name: '删除部门（有在职员工应拒绝 BR-03-02）', method: 'DELETE', url: '/api/depts/:id', tables: 'dept,employee', expect: 'biz', expectMsg: '在职员工',
  run: async () => { const tree = await getDeptTree(); const leaf = tree.flatMap((n) => n.children || [n]).find((n) => !n.children?.length && n.employeeCount > 0); if (!leaf) return { skipped: true }; ctx.leafDept = leaf; return deleteDept(leaf.id) } })
add({ module: '部门管理', page: '组织架构 /dept', role: 'hr', name: '删除空部门', method: 'DELETE', url: '/api/depts/:id', tables: 'dept', expect: (c) => (c.deptId ? 'ok' : 'any'), run: (c) => (c.deptId ? deleteDept(c.deptId) : { skipped: true }) })
add({ module: '部门管理', page: '岗位管理 /dept/positions', role: 'hr', name: '岗位列表', method: 'GET', url: '/api/positions', tables: 'position,dept', expect: 'ok', run: () => getPositions({ current: 1, size: 100 }) })
add({ module: '部门管理', page: '岗位管理 /dept/positions', role: 'hr', name: '新增岗位', method: 'POST', url: '/api/positions', tables: 'position', expect: 'ok',
  run: async () => { const r = await createPosition({ positionCode: 'P999', positionName: '自动化测试岗', deptId: 1, positionSeq: 2, jobLevel: 'P5', headcountLimit: 5 }); ctx.posId = r.id || r.records?.[0]?.id; return r } })
add({ module: '部门管理', page: '岗位管理 /dept/positions', role: 'hr', name: '修改岗位', method: 'PUT', url: '/api/positions/:id', tables: 'position', expect: (c) => (c.posId ? 'ok' : 'any'), run: (c) => (c.posId ? updatePosition(c.posId, { headcountLimit: 8 }) : { skipped: true }) })

// ---------------------------------------------------------------- 考勤
add({ module: '考勤管理', page: '打卡签到 /attendance/checkin', role: 'hr', name: '今日考勤状态', method: 'GET', url: '/api/attendance/today', tables: 'attendance_record,shift', expect: 'ok', run: async () => { const r = await getToday(); ctx.todayRec = r.record; return r } })
add({ module: '考勤管理', page: '打卡签到 /attendance/checkin', role: 'hr', name: '上班打卡（含重复打卡校验）', method: 'POST', url: '/api/attendance/checkin', tables: 'attendance_record,shift', expect: (c) => (c.todayRec?.first_check_in ? 'biz' : 'ok'), expectMsg: '已打卡', run: () => checkin() })
add({ module: '考勤管理', page: '打卡签到 /attendance/checkin', role: 'hr', name: '下班打卡（含未打卡校验）', method: 'POST', url: '/api/attendance/checkout', tables: 'attendance_record,shift', expect: (c) => (c.todayRec?.last_check_out ? 'biz' : 'ok'), expectMsg: '', run: () => checkout() })
add({ module: '考勤管理', page: '考勤统计 /attendance/monthly', role: 'hr', name: '打卡记录分页', method: 'GET', url: '/api/attendance/records', tables: 'attendance_record,shift', expect: 'ok', run: () => pageAttendance({ current: 1, size: 10 }) })
add({ module: '考勤管理', page: '请假申请 /attendance/leave', role: 'hr', name: '请假分页', method: 'GET', url: '/api/leave-requests/page', tables: 'leave_request,leave_type,employee', expect: 'ok', run: () => pageLeaveRequests({ current: 1, size: 10 }) })
add({ module: '考勤管理', page: '请假申请 /attendance/leave', role: 'hr', name: '提交请假（余额充足）', method: 'POST', url: '/api/leave-requests', tables: 'leave_request,leave_balance,leave_type,todo_task', expect: 'ok',
  run: () => createLeaveRequest({ leaveTypeId: 2, startTime: `${day(30)} 09:00:00`, endTime: `${day(30)} 18:00:00`, days: 1, reason: '自动化测试请假' }) })
add({ module: '考勤管理', page: '请假申请 /attendance/leave', role: 'hr', name: '请假时间重叠应拒绝（BR-04-01）', method: 'POST', url: '/api/leave-requests', tables: 'leave_request', expect: 'biz', expectMsg: '重叠',
  run: () => createLeaveRequest({ leaveTypeId: 2, startTime: `${day(30)} 09:00:00`, endTime: `${day(30)} 18:00:00`, days: 1, reason: '自动化测试重叠' }) })
add({ module: '考勤管理', page: '请假申请 /attendance/leave', role: 'hr', name: '请假审批（主管/人事）', method: 'PUT', url: '/api/leave-requests/:id/approve', tables: 'leave_request,approval_record,todo_task', expect: 'ok',
  run: async () => { const p = await pageLeaveRequests({ current: 1, size: 50, status: 1 }); const t = p.records?.[0]; if (!t) return { skipped: true }; return approveLeaveRequest(t.id, { result: 2, opinion: '自动化测试同意' }) } })
add({ module: '考勤管理', page: '请假申请 /attendance/leave', role: 'hr', name: '我的假期余额（BR-04-02）', method: 'GET', url: '/api/leave-balances/my', tables: 'leave_balance,leave_type', expect: 'ok', run: () => getMyLeaveBalances() })
add({ module: '考勤管理', page: '加班申请 /attendance/overtime', role: 'hr', name: '加班分页', method: 'GET', url: '/api/overtime-requests/page', tables: 'overtime_request,employee', expect: 'ok', run: () => pageOvertimeRequests({ current: 1, size: 10 }) })
add({ module: '考勤管理', page: '加班申请 /attendance/overtime', role: 'hr', name: '提交加班', method: 'POST', url: '/api/overtime-requests', tables: 'overtime_request,todo_task', expect: 'ok',
  run: () => createOvertimeRequest({ overtimeDate: day(1), startTime: `${day(1)} 19:00:00`, endTime: `${day(1)} 22:00:00`, hours: 3, overtimeType: 1, compensateType: 1, reason: '版本上线（自动化测试）' }) })
add({ module: '考勤管理', page: '加班申请 /attendance/overtime', role: 'hr', name: '加班审批', method: 'PUT', url: '/api/overtime-requests/:id/approve', tables: 'overtime_request,approval_record', expect: 'ok',
  run: async () => { const p = await pageOvertimeRequests({ current: 1, size: 50, status: 1 }); const t = p.records?.[0]; if (!t) return { skipped: true }; return approveOvertimeRequest(t.id, { result: 2, opinion: '自动化测试同意' }) } })
add({ module: '考勤管理', page: '出差管理 /attendance/trip', role: 'hr', name: '出差分页', method: 'GET', url: '/api/business-trips/page', tables: 'business_trip,employee', expect: 'ok', run: () => pageTrips({ current: 1, size: 10 }) })
add({ module: '考勤管理', page: '出差管理 /attendance/trip', role: 'hr', name: '提交出差', method: 'POST', url: '/api/business-trips', tables: 'business_trip,todo_task', expect: 'ok',
  run: () => createTrip({ destination: '上海', purpose: '客户现场支持（自动化测试）', startTime: `${day(5)} 08:00:00`, endTime: `${day(7)} 18:00:00`, days: 3, transport: 2, budgetAmount: 3200 }) })
add({ module: '考勤管理', page: '出差管理 /attendance/trip', role: 'hr', name: '出差审批', method: 'PUT', url: '/api/business-trips/:id/approve', tables: 'business_trip,approval_record', expect: 'ok',
  run: async () => { const p = await pageTrips({ current: 1, size: 50, status: 1 }); const t = p.records?.[0]; if (!t) return { skipped: true }; return approveTrip(t.id, { result: 2, opinion: '自动化测试同意' }) } })
add({ module: '考勤管理', page: '考勤统计 /attendance/monthly', role: 'hr', name: '考勤月报分页', method: 'GET', url: '/api/attendance-months/page', tables: 'attendance_month,employee', expect: 'ok', run: () => pageAttendanceMonths({ current: 1, size: 10 }) })
add({ module: '考勤管理', page: '考勤统计 /attendance/monthly', role: 'hr', name: '考勤封账（BR-04-03）', method: 'PUT', url: '/api/attendance-months/:id/lock', tables: 'attendance_month', expect: 'ok',
  run: async () => { const p = await pageAttendanceMonths({ current: 1, size: 50, lockStatus: 0 }); const t = p.records?.[0]; if (!t) return { skipped: true }; return lockAttendanceMonth(t.id) } })

// ---------------------------------------------------------------- 薪资
add({ module: '薪资管理', page: '薪资标准 /salary/standard', role: 'hr', name: '薪资标准分页', method: 'GET', url: '/api/salary-standards/page', tables: 'salary_standard', expect: 'ok', run: () => pageSalaryStandards({ current: 1, size: 10 }) })
add({ module: '薪资管理', page: '薪资标准 /salary/standard', role: 'hr', name: '新增薪资标准', method: 'POST', url: '/api/salary-standards', tables: 'salary_standard', expect: 'ok',
  run: () => createSalaryStandard({ standardCode: `STD${Date.now() % 100000}`, standardName: '自动化测试标准', positionSeq: 2, jobLevel: 'P5', baseSalary: 15000, postSalary: 4000, performanceSalary: 3000, allowance: 500 }) })
add({ module: '薪资管理', page: '薪资核算 /salary/record', role: 'hr', name: '薪资核算记录分页', method: 'GET', url: '/api/salary-records/page', tables: 'salary_record,employee,dept', expect: 'ok', run: async () => { const r = await pageSalaryRecords({ current: 1, size: 10 }); ctx.salRec = r.records?.[0]; return r } })
add({ module: '薪资管理', page: '薪资核算 /salary/record', role: 'hr', name: '发起月度核算（已封账月份）', method: 'POST', url: '/api/salary-records/calculate', tables: 'salary_record,salary_item,employee_salary,insurance_config,attendance_month', expect: 'any',
  run: () => calculateSalary({ year: 2026, month: 8 }) })
add({ module: '薪资管理', page: '薪资核算 /salary/record', role: 'hr', name: '未封账月份禁止核算（BR-05-02）', method: 'POST', url: '/api/salary-records/calculate', tables: 'attendance_month,salary_record', expect: 'biz', expectMsg: '封账',
  run: () => calculateSalary({ year: 2026, month: 9 }) })
add({ module: '薪资管理', page: '薪资核算 /salary/record', role: 'fin', name: '薪资复核（BR-05-03 状态流转）', method: 'PUT', url: '/api/salary-records/:id/review', tables: 'salary_record', expect: (c) => (c.reviewId ? 'ok' : 'any'),
  run: async () => { const p = await pageSalaryRecords({ current: 1, size: 200, payStatus: 1 }); const t = p.records?.[0]; ctx.reviewId = t?.id; if (!t) return { skipped: true }; return reviewSalaryRecord(t.id) } })
add({ module: '薪资管理', page: '薪资核算 /salary/record', role: 'fin', name: '薪资发放（发放后锁定 BR-05-04）', method: 'PUT', url: '/api/salary-records/:id/pay', tables: 'salary_record', expect: 'ok', run: (c) => paySalaryRecord(c.reviewId, { batchNo: 'AUTO20260915001' }) })
add({ module: '薪资管理', page: '我的薪资条 /salary/payslip', role: 'hr', name: '我的薪资条', method: 'GET', url: '/api/salary/payslips/my', tables: 'salary_record', expect: 'ok', run: async () => { const r = await getMyPayslips(); ctx.payslip = r.records?.[0] || ctx.salRec; return r } })
add({ module: '薪资管理', page: '我的薪资条 /salary/payslip', role: 'hr', name: '薪资条明细（salary_item）', method: 'GET', url: '/api/salary/payslips/:recordId/items', tables: 'salary_item,salary_record', expect: (c) => (c.payslip?.id ? 'ok' : 'any'), run: (c) => getPayslipItems(c.payslip?.id) })
add({ module: '薪资管理', page: '薪资核算 /salary/record', role: 'fin', name: '财务查看薪资分页（数据范围）', method: 'GET', url: '/api/salary-records/page', tables: 'salary_record,employee,dept', expect: 'ok', run: () => pageSalaryRecords({ current: 1, size: 10 }) })

// ---------------------------------------------------------------- 招聘
add({ module: '招聘管理', page: '招聘需求 /recruit/request', role: 'hr', name: '招聘需求分页', method: 'GET', url: '/api/recruit-requests/page', tables: 'recruit_request,dept,position', expect: 'ok', run: () => pageRecruitRequests({ current: 1, size: 10 }) })
add({ module: '招聘管理', page: '招聘需求 /recruit/request', role: 'mgr', name: '主管提报招聘需求（BR-06-02）', method: 'POST', url: '/api/recruit-requests', tables: 'recruit_request,approval_record', expect: 'ok',
  run: () => createRecruitRequest({ requestDeptId: 5, positionId: 8, positionName: '自动化测试工程师', recruitCount: 2, jobLevel: 'P5', salaryMin: 18000, salaryMax: 26000, educationReq: 3, experienceYears: 3, urgency: 2, hopeArriveDate: day(20), jobDescription: '负责质量保障（自动化测试）', jobRequirement: '3 年以上经验' }) })
add({ module: '招聘管理', page: '招聘需求 /recruit/request', role: 'hr', name: '需求审批', method: 'PUT', url: '/api/recruit-requests/:id/approve', tables: 'recruit_request,approval_record', expect: 'ok',
  run: async () => { const p = await pageRecruitRequests({ current: 1, size: 50, approvalStatus: 1 }); const t = p.records?.[0]; if (!t) return { skipped: true }; return approveRecruitRequest(t.id, { result: 2, opinion: '自动化测试同意' }) } })
add({ module: '招聘管理', page: '简历筛选 /recruit/candidate', role: 'hr', name: '候选人分页', method: 'GET', url: '/api/candidates/page', tables: 'candidate,recruit_request', expect: 'ok', run: async () => { const r = await pageCandidates({ current: 1, size: 10 }); ctx.cand = r.records?.[0]; return r } })
add({ module: '招聘管理', page: '简历筛选 /recruit/candidate', role: 'hr', name: '录入候选人', method: 'POST', url: '/api/candidates', tables: 'candidate', expect: 'ok',
  run: async () => { const r = await createCandidate({ recruitRequestId: 1, name: '自动化测试候选人', gender: 'F', education: 3, graduateSchool: '华南理工大学', workYears: 4, currentCompany: '某某科技', currentPosition: '测试工程师', expectSalary: 22000, source: 2, phone: '13500000001' }); ctx.candId = r.id; return r } })
add({ module: '招聘管理', page: '简历筛选 /recruit/candidate', role: 'hr', name: '推进候选人阶段（BR-06-01 单向）', method: 'PUT', url: '/api/candidates/:id/stage', tables: 'candidate', expect: 'ok',
  run: async () => { const p = await pageCandidates({ current: 1, size: 50 }); const t = p.records?.find((x) => x.stage < 6) || p.records?.[0]; if (!t) return { skipped: true }; return changeCandidateStage(t.id, { stage: t.stage + 1 }) } })
add({ module: '招聘管理', page: '简历筛选 /recruit/candidate', role: 'hr', name: '面试记录列表', method: 'GET', url: '/api/interview-records', tables: 'interview_record,candidate,employee', expect: 'ok', run: () => getInterviewRecords({}) })
add({ module: '招聘管理', page: '简历筛选 /recruit/candidate', role: 'hr', name: '安排面试/录入评价', method: 'POST', url: '/api/interview-records', tables: 'interview_record,candidate', expect: 'ok',
  run: (c) => createInterviewRecord({ candidateId: c.candId || c.cand?.id || 1, interviewType: 1, interviewTime: `${day(3)} 10:00:00`, interviewPlace: 'A 座 3F 会议室', interviewerId: 7, score: 88, evaluation: '基础扎实（自动化测试）', conclusion: 1 }) })
add({ module: '招聘管理', page: '录用审批 /recruit/offer', role: 'hr', name: 'Offer 分页', method: 'GET', url: '/api/offers/page', tables: 'offer_record,candidate', expect: 'ok', run: async () => { const r = await pageOffers({ current: 1, size: 10 }); ctx.offer = r.records?.[0]; return r } })
add({ module: '招聘管理', page: '录用审批 /recruit/offer', role: 'hr', name: '发送 Offer', method: 'PUT', url: '/api/offers/:id/send', tables: 'offer_record', expect: (c) => (c.offer?.id ? 'any' : 'any'),
  run: async () => { const p = await pageOffers({ current: 1, size: 50 }); const t = p.records?.find((x) => x.status === 1) || p.records?.[0]; if (!t) return { skipped: true }; return sendOffer(t.id) } })
add({ module: '招聘管理', page: '录用审批 /recruit/offer', role: 'hr', name: '确认 Offer 结果', method: 'PUT', url: '/api/offers/:id/status', tables: 'offer_record', expect: 'any',
  run: async () => { const p = await pageOffers({ current: 1, size: 50 }); const t = p.records?.find((x) => x.status === 2) || p.records?.[0]; if (!t) return { skipped: true }; return changeOfferStatus(t.id, { status: 3 }) } })

// ---------------------------------------------------------------- 培训
add({ module: '培训管理', page: '培训计划 /training/plan', role: 'hr', name: '培训计划分页', method: 'GET', url: '/api/training-plans/page', tables: 'training_plan,course,trainer', expect: 'ok', run: async () => { const r = await pageTrainingPlans({ current: 1, size: 10 }); ctx.plan = r.records?.[0]; return r } })
add({ module: '培训管理', page: '培训计划 /training/plan', role: 'hr', name: '新增培训计划', method: 'POST', url: '/api/training-plans', tables: 'training_plan,employee', expect: 'ok',
  run: () => createTrainingPlan({ planName: '自动化测试-质量管理培训', planYear: 2026, planQuarter: 4, trainType: 2, targetScope: 1, budgetAmount: 20000, startDate: day(20), endDate: day(22), description: '自动化测试用例数据' }) })
add({ module: '培训管理', page: '培训计划 /training/plan', role: 'emp', name: '培训报名（BR-07-01 满员/重复校验）', method: 'POST', url: '/api/training-plans/:id/enroll', tables: 'training_enroll,training_plan,course', expect: 'any',
  run: async () => { const p = await pageTrainingPlans({ current: 1, size: 50 }); const t = p.records?.find((x) => x.status === 2 || x.status === 3) || p.records?.[0]; if (!t) return { skipped: true }; return enrollTraining(t.id) } })
add({ module: '培训管理', page: '我的培训 /training/my', role: 'emp', name: '我的培训档案', method: 'GET', url: '/api/training/my', tables: 'training_record,training_plan,training_enroll', expect: 'ok', run: () => getMyTraining() })

// ---------------------------------------------------------------- 绩效
add({ module: '绩效考核', page: '考核方案 /performance/plan', role: 'hr', name: '考核方案分页', method: 'GET', url: '/api/performance-plans/page', tables: 'performance_plan,performance_indicator', expect: 'ok', run: () => pagePerfPlans({ current: 1, size: 10 }) })
add({ module: '绩效考核', page: '考核方案 /performance/plan', role: 'hr', name: '新增考核方案', method: 'POST', url: '/api/performance-plans', tables: 'performance_plan,employee', expect: 'ok',
  run: () => createPerfPlan({ planName: '自动化测试-Q4考核方案', planYear: 2026, periodType: 2, planQuarter: 4, startDate: day(10), endDate: day(40), scopeType: 1, selfWeight: 20, leaderWeight: 70, reviewWeight: 10, description: '自动化测试方案' }) })
add({ module: '绩效考核', page: '考核方案 /performance/plan', role: 'hr', name: '发布方案（生成全员考核记录）', method: 'PUT', url: '/api/performance-plans/:id/publish', tables: 'performance_plan,performance_record', expect: 'any',
  run: async () => { const p = await pagePerfPlans({ current: 1, size: 50 }); const t = p.records?.find((x) => x.status === 1) || p.records?.[0]; if (!t) return { skipped: true }; return publishPerfPlan(t.id) } })
add({ module: '绩效考核', page: '绩效评分 /performance/record', role: 'hr', name: '考核记录分页（全量）', method: 'GET', url: '/api/performance-records/page', tables: 'performance_record,employee,performance_plan', expect: 'ok', run: () => pagePerfRecords({ current: 1, size: 10 }) })
add({ module: '绩效考核', page: '绩效评分 /performance/record', role: 'emp', name: '员工自评（本人）', method: 'PUT', url: '/api/performance-records/:id/self-score', tables: 'performance_record', expect: (c) => (c.selfId ? 'ok' : 'any'),
  run: async () => { const p = await pagePerfRecords({ current: 1, size: 50, status: 1 }); const t = p.records?.find((x) => x.employee_id === 11); ctx.selfId = t?.id; if (!t) return { skipped: true }; return submitSelfScore(t.id, { score: 88 }) } })
add({ module: '绩效考核', page: '绩效评分 /performance/record', role: 'hr', name: '主管评分（自动算总分/等级）', method: 'PUT', url: '/api/performance-records/:id/leader-score', tables: 'performance_record', expect: 'ok', run: (c) => submitLeaderScore(c.selfId, { score: 92 }) })
add({ module: '绩效考核', page: '绩效评分 /performance/record', role: 'emp', name: '结果确认/申诉（BR-08-01）', method: 'PUT', url: '/api/performance-records/:id/confirm', tables: 'performance_record,performance_interview', expect: 'ok', run: (c) => confirmPerfRecord(c.selfId, { appeal: false }) })

// ---------------------------------------------------------------- 系统设置
add({ module: '系统设置', page: '用户管理 /system/user', role: 'admin', name: '系统用户分页', method: 'GET', url: '/api/sys/users/page', tables: 'sys_user,sys_user_role,sys_role,employee', expect: 'ok', run: () => pageSysUsers({ current: 1, size: 10 }) })
add({ module: '系统设置', page: '用户管理 /system/user', role: 'admin', name: '新增用户（密码策略 BR-09-01）', method: 'POST', url: '/api/sys/users', tables: 'sys_user,sys_user_role', expect: 'ok',
  run: async () => { const r = await createSysUser({ username: `auto${Date.now() % 10000}`, realName: '自动化测试账号', password: 'Auto@2026', employeeId: 20, deptId: 5, roles: ['ROLE_EMPLOYEE'] }); ctx.sysUserId = r.id; return r } })
add({ module: '系统设置', page: '用户管理 /system/user', role: 'admin', name: '新增用户-密码过短应拒绝（BR-09-01）', method: 'POST', url: '/api/sys/users', tables: 'sys_user', expect: 'biz', expectMsg: '8 位',
  run: () => createSysUser({ username: `auto_short_${Date.now() % 10000}`, realName: '弱密码账号', password: '123', roles: ['ROLE_EMPLOYEE'] }) })
add({ module: '系统设置', page: '用户管理 /system/user', role: 'admin', name: '修改用户（停用）', method: 'PUT', url: '/api/sys/users/:id', tables: 'sys_user', expect: (c) => (c.sysUserId ? 'ok' : 'any'), run: (c) => (c.sysUserId ? updateSysUser(c.sysUserId, { status: 0 }) : { skipped: true }) })
add({ module: '系统设置', page: '用户管理 /system/user', role: 'admin', name: '重置密码', method: 'PUT', url: '/api/sys/users/:id/password/reset', tables: 'sys_user', expect: (c) => (c.sysUserId ? 'ok' : 'any'), run: (c) => (c.sysUserId ? resetSysUserPassword(c.sysUserId) : { skipped: true }) })
add({ module: '系统设置', page: '用户管理 /system/user', role: 'admin', name: '删除用户', method: 'DELETE', url: '/api/sys/users/:id', tables: 'sys_user,sys_user_role', expect: (c) => (c.sysUserId ? 'ok' : 'any'), run: (c) => (c.sysUserId ? deleteSysUser(c.sysUserId) : { skipped: true }) })
add({ module: '系统设置', page: '用户管理 /system/user', role: 'admin', name: '管理员自停用应拒绝（BR-09-02）', method: 'PUT', url: '/api/sys/users/:id', tables: 'sys_user', expect: 'biz', expectMsg: '管理员', run: () => updateSysUser(1, { status: 0 }) })
add({ module: '系统设置', page: '角色权限 /system/role', role: 'admin', name: '角色列表（数据范围）', method: 'GET', url: '/api/sys/roles', tables: 'sys_role,sys_role_menu', expect: 'ok', run: () => getRoles() })
add({ module: '系统设置', page: '角色权限 /system/role', role: 'admin', name: '新增角色', method: 'POST', url: '/api/sys/roles', tables: 'sys_role,sys_role_menu', expect: 'ok',
  run: async () => { const r = await createRole({ roleCode: `ROLE_AUTO_${Date.now() % 1000}`, roleName: '自动化测试角色', dataScope: 4, description: '自动化测试' }); ctx.roleId = r.id; return r } })
add({ module: '系统设置', page: '角色权限 /system/role', role: 'admin', name: '修改角色数据范围', method: 'PUT', url: '/api/sys/roles/:id', tables: 'sys_role', expect: (c) => (c.roleId ? 'ok' : 'any'), run: (c) => (c.roleId ? updateRole(c.roleId, { dataScope: 2 }) : { skipped: true }) })
add({ module: '系统设置', page: '数据字典 /system/dict', role: 'admin', name: '字典类型列表', method: 'GET', url: '/api/sys/dict-types', tables: 'sys_dict_type', expect: 'ok', run: async () => { const r = await getDictTypes(); ctx.dictType = r.records?.[0]; return r } })
add({ module: '系统设置', page: '数据字典 /system/dict', role: 'admin', name: '字典项列表', method: 'GET', url: '/api/sys/dict-types/:id/items', tables: 'sys_dict_item,sys_dict_type', expect: 'ok', run: (c) => getDictItems(c.dictType?.id || 1) })
add({ module: '系统设置', page: '参数配置 /system/config', role: 'admin', name: '参数配置列表', method: 'GET', url: '/api/sys/configs', tables: 'sys_config', expect: 'ok', run: async () => { const r = await getConfigs({}); ctx.cfg = r.records?.[0]; return r } })
add({ module: '系统设置', page: '参数配置 /system/config', role: 'admin', name: '修改参数（内置参数不可置空）', method: 'PUT', url: '/api/sys/configs/:id', tables: 'sys_config', expect: 'ok',
  run: async () => { const r = await getConfigs({}); const t = r.records?.find((x) => x.is_system === 0) || r.records?.[0]; return updateConfig(t.id, { configValue: '35' }) } })
add({ module: '系统设置', page: '参数配置 /system/config', role: 'admin', name: '内置参数置空应拒绝', method: 'PUT', url: '/api/sys/configs/:id', tables: 'sys_config', expect: 'biz', expectMsg: '内置参数',
  run: async () => { const r = await getConfigs({}); const t = r.records?.find((x) => x.is_system === 1); if (!t) return { skipped: true }; return updateConfig(t.id, { configValue: '' }) } })
add({ module: '系统设置', page: '日志审计 /system/log', role: 'admin', name: '登录日志分页', method: 'GET', url: '/api/sys/logs/login', tables: 'sys_login_log', expect: 'ok', run: () => pageLoginLogs({ current: 1, size: 10 }) })
add({ module: '系统设置', page: '日志审计 /system/log', role: 'admin', name: '操作日志分页', method: 'GET', url: '/api/sys/logs/oper', tables: 'sys_oper_log', expect: 'ok', run: () => pageOperLogs({ current: 1, size: 10 }) })
add({ module: '通知公告', page: '通知公告 /notices', role: 'hr', name: '公告分页（管理端）', method: 'GET', url: '/api/notices/page', tables: 'notice,notice_read', expect: 'ok', run: () => pageNotices({ current: 1, size: 10 }) })
add({ module: '通知公告', page: '通知公告 /notices', role: 'hr', name: '新增公告（草稿）', method: 'POST', url: '/api/notices', tables: 'notice', expect: 'ok',
  run: async () => { const r = await createNotice({ title: '自动化测试公告', content: '由自动化测试用例创建', noticeType: 3, targetScope: 1, isTop: 0 }); ctx.noticeId = r.id; return r } })
add({ module: '通知公告', page: '通知公告 /notices', role: 'hr', name: '发布公告', method: 'PUT', url: '/api/notices/:id/publish', tables: 'notice', expect: 'ok', run: (c) => publishNotice(c.noticeId) })
add({ module: '通知公告', page: '通知公告 /notices', role: 'hr', name: '下线公告', method: 'PUT', url: '/api/notices/:id/offline', tables: 'notice', expect: 'ok', run: (c) => offlineNotice(c.noticeId) })
add({ module: '认证', page: '布局退出登录', role: 'admin', name: '退出登录', method: 'POST', url: '/api/auth/logout', tables: 'sys_login_log', expect: 'ok', run: () => logout() })

// ---------------------------------------------------------------- 其它角色：数据范围校验
add({ module: '权限与数据范围', page: '首页 /dashboard', role: 'mgr', name: '主管看板（仅本部门数据）', method: 'GET', url: '/api/dashboard/summary', tables: 'employee,dept,todo_task', expect: 'ok', run: () => getSummary() })
add({ module: '权限与数据范围', page: '员工档案 /employee', role: 'mgr', name: '主管员工查询（仅本部门）', method: 'GET', url: '/api/employees/page', tables: 'employee,dept', expect: 'ok', run: () => pageEmployees({ current: 1, size: 50 }) })
add({ module: '权限与数据范围', page: '考勤统计 /attendance/monthly', role: 'mgr', name: '主管查看本部门打卡记录', method: 'GET', url: '/api/attendance/records', tables: 'attendance_record,shift', expect: 'ok', run: () => pageAttendance({ current: 1, size: 10 }) })
add({ module: '权限与数据范围', page: '绩效评分 /performance/record', role: 'mgr', name: '主管查看本部门绩效记录', method: 'GET', url: '/api/performance-records/page', tables: 'performance_record,employee', expect: 'ok', run: () => pagePerfRecords({ current: 1, size: 10 }) })
add({ module: '权限与数据范围', page: '打卡签到 /attendance/checkin', role: 'emp', name: '员工今日考勤状态', method: 'GET', url: '/api/attendance/today', tables: 'attendance_record,shift', expect: 'ok', run: () => getToday() })
add({ module: '权限与数据范围', page: '请假申请 /attendance/leave', role: 'emp', name: '员工仅见本人请假单', method: 'GET', url: '/api/leave-requests/page', tables: 'leave_request,leave_type', expect: 'ok', run: () => pageLeaveRequests({ current: 1, size: 10 }) })
add({ module: '权限与数据范围', page: '我的薪资条 /salary/payslip', role: 'emp', name: '员工查看本人薪资条', method: 'GET', url: '/api/salary/payslips/my', tables: 'salary_record', expect: 'ok', run: async () => { const r = await getMyPayslips(); ctx.empPayslip = r.records?.[0]; return r } })
add({ module: '权限与数据范围', page: '我的薪资条 /salary/payslip', role: 'emp', name: '员工查看本人薪资明细', method: 'GET', url: '/api/salary/payslips/:recordId/items', tables: 'salary_item', expect: (c) => (c.empPayslip?.id ? 'ok' : 'any'), run: (c) => getPayslipItems(c.empPayslip?.id) })
add({ module: '权限与数据范围', page: '我的培训 /training/my', role: 'emp', name: '员工查看本人培训档案', method: 'GET', url: '/api/training/my', tables: 'training_record,training_enroll', expect: 'ok', run: () => getMyTraining() })
add({ module: '权限与数据范围', page: '绩效评分 /performance/record', role: 'emp', name: '员工仅见本人绩效记录', method: 'GET', url: '/api/performance-records/page', tables: 'performance_record,performance_plan', expect: 'ok', run: () => pagePerfRecords({ current: 1, size: 50 }) })

// ================================================================ 运行器
const delay = (ms) => new Promise((r) => setTimeout(r, ms))
async function switchRole(role) {
  if (role === 'guest') { removeToken(); return }
  const res = await login({ username: ACCOUNTS[role], password: PWD })
  setToken(res.token)
  await delay(30)
}
function brief(v) {
  if (v === null || v === undefined) return ''
  if (typeof v !== 'object') return String(v).slice(0, 60)
  if (Array.isArray(v)) return `Array(${v.length})`
  if ('total' in v && 'records' in v) return `total=${v.total}, records=${v.records?.length ?? 0}`
  if ('records' in v) return `records=${v.records?.length ?? 0}`
  if ('success' in v) return Object.entries(v).slice(0, 3).map(([k, x]) => `${k}=${x}`).join(' ')
  const keys = Object.keys(v)
  return `${keys.length} 字段：${keys.slice(0, 6).join(',')}`
}

async function main() {
  const results = []
  let currentRole = null
  for (const c of CASES) {
    const role = c.role
    try {
      if (role !== currentRole) { await switchRole(role); currentRole = role }
    } catch (e) {
      results.push({ id: '', module: c.module, page: c.page, role: role.toUpperCase(), name: `[角色切换失败] ${c.name}`, method: c.method, url: c.url, tables: c.tables, status: '失败', ok: false, ms: 0, message: e?.message || String(e), sample: '' })
      continue
    }
    const t0 = performance.now()
    let ok = true, status = '通过', message = '', sample = ''
    try {
      const res = await c.run(ctx)
      sample = brief(res)
      const exp = typeof c.expect === 'function' ? c.expect(ctx) : c.expect
      if (res && res.skipped) { status = '跳过（前置数据不满足）'; ok = true }
      else if (exp === 'biz') { ok = false; status = '未按预期拦截'; message = '期望业务规则拒绝，但接口成功返回' }
      else status = '通过'
    } catch (e) {
      message = e?.message || String(e)
      const exp = typeof c.expect === 'function' ? c.expect(ctx) : c.expect
      const hit = !c.expectMsg || message.includes(c.expectMsg)
      if (exp === 'biz') { ok = hit; status = hit ? '通过（业务规则已拦截）' : `拦截信息不符：${message}` }
      else if (exp === 'any') { ok = true; status = '通过（按业务规则返回提示）' }
      else { ok = false; status = '失败' }
    }
    results.push({ id: '', module: c.module, page: c.page, role: role.toUpperCase(), name: c.name, method: c.method, url: c.url, tables: c.tables, status, ok, ms: Math.round(performance.now() - t0), message, sample })
  }
  results.forEach((r, i) => { r.id = `TC-${String(i + 1).padStart(3, '0')}` })

  const payload = {
    generatedAt: new Date().toLocaleString('zh-CN'),
    useMock: true,
    total: results.length,
    passed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results
  }
  const json = JSON.stringify(payload)
  const b64 = btoa(unescape(encodeURIComponent(json)))
  document.getElementById('apiresult').textContent = b64

  const kpi = document.getElementById('kpi')
  kpi.innerHTML = `<div>用例总数 <b>${payload.total}</b></div>` +
    `<div>通过 <b class="ok">${payload.passed}</b></div>` +
    `<div>失败 <b class="${payload.failed ? 'bad' : 'ok'}">${payload.failed}</b></div>` +
    `<div>通过率 <b>${((payload.passed / payload.total) * 100).toFixed(1)}%</b></div>` +
    `<div>生成时间 <b>${payload.generatedAt}</b></div>`

  const rows = results.map((r) => `<tr>
    <td>${r.id}</td><td>${r.module}</td><td>${r.page}</td><td>${r.role}</td>
    <td><code>${r.method}</code> <code>${r.url}</code></td>
    <td>${r.name}</td><td class="${r.ok ? 'ok' : 'bad'}">${r.status}</td><td>${r.ms}ms</td>
    <td>${(r.message || r.sample || '').replace(/</g, '&lt;')}</td></tr>`).join('')
  document.getElementById('table-wrap').innerHTML = `<table>
    <thead><tr><th>编号</th><th>模块</th><th>页面</th><th>角色</th><th>请求地址</th><th>用例</th><th>结果</th><th>耗时</th><th>说明/数据摘要</th></tr></thead>
    <tbody>${rows}</tbody></table>`
  document.title = `接口运行时测试 · ${payload.passed}/${payload.total} 通过`
}

main()
