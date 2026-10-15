import { dayOffset } from '@/utils/format'

/**
 * 【已归档 · 不再被任何代码引用】
 *
 * 前后端联调要求：前端所有请求必须调用后端接口，演示数据以 MySQL(enterprise_hr) 为准。
 * 本文件已从请求链路上移除，请勿继续修改；保留仅为追溯历史 mock 数据口径。
 *
 * ---------------------------------------------------------------------------
 * 模拟数据库（内存态，历史实现）
 * 数据口径与 enterprise_hr_schema.sql 严格对齐：
 *  - 字段名与 DDL 一致（蛇形命名）
 *  - 枚举值与字段注释一致（业务字典同源）
 *  - 敏感字段（身份证/手机号/银行卡）在数据层直接脱敏存储（NF-08）
 *  - 日期使用相对偏移，保证演示数据永远新鲜
 */
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260915)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const rint = (min, max) => Math.floor(rand() * (max - min + 1)) + min
const money = (n) => Math.round(n * 100) / 100

const maskId = (n) => {
  const areas = ['110101', '310104', '440305', '330106']
  const a = pick(areas)
  const y = rint(1975, 2000)
  const seq = String(rint(1, 599)).padStart(3, '0')
  return a + y + String(rint(1, 12)).padStart(2, '0') + String(rint(1, 28)).padStart(2, '0') + seq
}
const maskPhone = () => '1' + pick(['3', '5', '7', '8']) + pick(['0', '1', '3', '5', '7', '8', '9']) + '****' + String(rint(0, 9999)).padStart(4, '0')

// ---------------- 部门（dept） ----------------
export const depts = [
  { id: 1, dept_code: 'D1001', name: '华信科技集团', parent_id: null, leader: '', leader_id: null, dept_type: 1, dept_level: 1, dept_path: '/1/', headcount_limit: 0, phone: '010-88886001', sort_no: 1, status: 1 },
  { id: 2, dept_code: 'D1002', name: '人力资源部', parent_id: 1, leader: '', leader_id: null, dept_type: 3, dept_level: 2, dept_path: '/1/2/', headcount_limit: 8, phone: '010-88886002', sort_no: 1, status: 1 },
  { id: 3, dept_code: 'D1003', name: '财务部', parent_id: 1, leader: '', leader_id: null, dept_type: 3, dept_level: 2, dept_path: '/1/3/', headcount_limit: 6, phone: '010-88886003', sort_no: 2, status: 1 },
  { id: 4, dept_code: 'D1004', name: '技术研发中心', parent_id: 1, leader: '', leader_id: null, dept_type: 2, dept_level: 2, dept_path: '/1/4/', headcount_limit: 60, phone: '010-88886004', sort_no: 3, status: 1 },
  { id: 5, dept_code: 'D1005', name: '市场运营部', parent_id: 1, leader: '', leader_id: null, dept_type: 2, dept_level: 2, dept_path: '/1/5/', headcount_limit: 30, phone: '010-88886005', sort_no: 4, status: 1 },
  { id: 6, dept_code: 'D1006', name: '研发一部', parent_id: 4, leader: '', leader_id: null, dept_type: 3, dept_level: 3, dept_path: '/1/4/6/', headcount_limit: 20, phone: '010-88886006', sort_no: 1, status: 1 },
  { id: 7, dept_code: 'D1007', name: '研发二部', parent_id: 4, leader: '', leader_id: null, dept_type: 3, dept_level: 3, dept_path: '/1/4/7/', headcount_limit: 20, phone: '010-88886007', sort_no: 2, status: 1 },
  { id: 8, dept_code: 'D1008', name: '测试部', parent_id: 4, leader: '', leader_id: null, dept_type: 3, dept_level: 3, dept_path: '/1/4/8/', headcount_limit: 15, phone: '010-88886008', sort_no: 3, status: 1 },
  { id: 9, dept_code: 'D1009', name: '市场部', parent_id: 5, leader: '', leader_id: null, dept_type: 3, dept_level: 3, dept_path: '/1/5/9/', headcount_limit: 15, phone: '010-88886009', sort_no: 1, status: 1 },
  { id: 10, dept_code: 'D1010', name: '客户服务部', parent_id: 5, leader: '', leader_id: null, dept_type: 3, dept_level: 3, dept_path: '/1/5/10/', headcount_limit: 12, phone: '010-88886010', sort_no: 2, status: 1 }
]

// ---------------- 岗位（position） ----------------
export const positions = [
  { id: 1, position_code: 'P-ADM-001', position_name: '总经理', position_seq: 1, job_level: 'M5', dept_id: 1, headcount_limit: 1, sort_no: 1, status: 1 },
  { id: 2, position_code: 'P-HR-001', position_name: '人事经理', position_seq: 1, job_level: 'M2', dept_id: 2, headcount_limit: 1, sort_no: 1, status: 1 },
  { id: 3, position_code: 'P-HR-002', position_name: '人事专员', position_seq: 3, job_level: 'P4-P5', dept_id: 2, headcount_limit: 4, sort_no: 2, status: 1 },
  { id: 4, position_code: 'P-FIN-001', position_name: '财务经理', position_seq: 1, job_level: 'M2', dept_id: 3, headcount_limit: 1, sort_no: 1, status: 1 },
  { id: 5, position_code: 'P-FIN-002', position_name: '财务专员', position_seq: 3, job_level: 'P3-P5', dept_id: 3, headcount_limit: 4, sort_no: 2, status: 1 },
  { id: 6, position_code: 'P-TECH-001', position_name: '技术总监', position_seq: 1, job_level: 'M4', dept_id: 4, headcount_limit: 1, sort_no: 1, status: 1 },
  { id: 7, position_code: 'P-TECH-002', position_name: 'Java开发工程师', position_seq: 2, job_level: 'P4-P7', dept_id: 6, headcount_limit: 10, sort_no: 1, status: 1 },
  { id: 8, position_code: 'P-TECH-003', position_name: '前端开发工程师', position_seq: 2, job_level: 'P4-P7', dept_id: 7, headcount_limit: 8, sort_no: 1, status: 1 },
  { id: 9, position_code: 'P-TECH-004', position_name: '测试工程师', position_seq: 2, job_level: 'P3-P6', dept_id: 8, headcount_limit: 8, sort_no: 1, status: 1 },
  { id: 10, position_code: 'P-MKT-001', position_name: '市场专员', position_seq: 3, job_level: 'P3-P5', dept_id: 9, headcount_limit: 8, sort_no: 1, status: 1 },
  { id: 11, position_code: 'P-SRV-001', position_name: '客服专员', position_seq: 4, job_level: 'P2-P4', dept_id: 10, headcount_limit: 10, sort_no: 1, status: 1 }
]

// ---------------- 员工（employee） ----------------
// 演示人物固定；其余按序生成
const FIXED = [
  { name: '王建国', gender: 'M', deptId: 1, posId: 1, position: '总经理', jobLevel: 'M5', salary: 48000, status: 1, hire: -3200, edu: 2 },
  { name: '苏婉', gender: 'F', deptId: 2, posId: 2, position: '人事经理', jobLevel: 'M2', salary: 18500, status: 1, hire: -1500, edu: 3 },
  { name: '李文静', gender: 'F', deptId: 2, posId: 3, position: '人事专员', jobLevel: 'P4', salary: 8200, status: 1, hire: -730, edu: 3 },
  { name: '郑淑芬', gender: 'F', deptId: 3, posId: 4, position: '财务经理', jobLevel: 'M2', salary: 19000, status: 1, hire: -1800, edu: 3 },
  { name: '周慧', gender: 'F', deptId: 3, posId: 5, position: '财务专员', jobLevel: 'P4', salary: 8600, status: 1, hire: -900, edu: 4 },
  { name: '陈志远', gender: 'M', deptId: 4, posId: 6, position: '技术总监', jobLevel: 'M4', salary: 36000, status: 1, hire: -2200, edu: 2 },
  { name: '陈建国', gender: 'M', deptId: 6, posId: 7, position: 'Java开发工程师', jobLevel: 'M1', salary: 26000, status: 1, hire: -1300, edu: 3 },
  { name: '刘畅', gender: 'F', deptId: 7, posId: 8, position: '前端开发工程师', jobLevel: 'M1', salary: 22000, status: 1, hire: -1100, edu: 3 },
  { name: '孙浩然', gender: 'M', deptId: 8, posId: 9, position: '测试工程师', jobLevel: 'M1', salary: 16000, status: 1, hire: -980, edu: 4 },
  { name: '赵美玲', gender: 'F', deptId: 5, posId: 10, position: '市场专员', jobLevel: 'M1', salary: 14000, status: 1, hire: -760, edu: 3 },
  { name: '林小满', gender: 'F', deptId: 6, posId: 7, position: 'Java开发工程师', jobLevel: 'P5', salary: 17500, status: 1, hire: -700, edu: 3 },
  { name: '王浩', gender: 'M', deptId: 6, posId: 7, position: 'Java开发工程师', jobLevel: 'P4', salary: 13000, status: 2, hire: -150, edu: 3 },
  { name: '张启明', gender: 'M', deptId: 6, posId: 7, position: 'Java开发工程师', jobLevel: 'P6', salary: 28000, status: 1, hire: -1600, edu: 2 },
  { name: '黄雨桐', gender: 'F', deptId: 7, posId: 8, position: '前端开发工程师', jobLevel: 'P5', salary: 16500, status: 1, hire: -560, edu: 3 },
  { name: '徐子豪', gender: 'M', deptId: 7, posId: 8, position: '前端开发工程师', jobLevel: 'P4', salary: 12500, status: 1, hire: -420, edu: 4 },
  { name: '宋佳琪', gender: 'F', deptId: 8, posId: 9, position: '测试工程师', jobLevel: 'P4', salary: 11000, status: 1, hire: -350, edu: 4 },
  { name: '马天宇', gender: 'M', deptId: 8, posId: 9, position: '测试工程师', jobLevel: 'P3', salary: 9500, status: 2, hire: -90, edu: 4 },
  { name: '何晓芸', gender: 'F', deptId: 9, posId: 10, position: '市场专员', jobLevel: 'P4', salary: 10500, status: 1, hire: -610, edu: 3 },
  { name: '罗志强', gender: 'M', deptId: 10, posId: 11, position: '客服专员', jobLevel: 'P3', salary: 7800, status: 1, hire: -820, edu: 4 },
  { name: '高婷婷', gender: 'F', deptId: 10, posId: 11, position: '客服专员', jobLevel: 'P2', salary: 6800, status: 1, hire: -240, edu: 5 }
]
const EXTRA_NAMES = ['朱伟杰', '许安琪', '邓浩宇', '韩雪', '曹俊峰', '彭雨欣', '曾子墨', '肖楚河', '田甜', '董思远', '潘嘉怡', '袁朗', '蔡文静', '蒋一鸣', '余思涵', '杜若飞']
const EDU = [1, 2, 3, 3, 3, 4, 4, 5]
const BANKS = ['中国工商银行', '中国建设银行', '招商银行', '中国银行', '交通银行']

export const employees = []
let empSeq = 1
for (const f of FIXED) {
  const id = empSeq
  const dept = depts.find((d) => d.id === f.deptId)
  employees.push({
    id,
    emp_no: `E${String(id).padStart(4, '0')}`,
    name: f.name,
    gender: f.gender,
    age: 2026 - rint(1980, 1999),
    birth_date: `${rint(1980, 1999)}-${String(rint(1, 12)).padStart(2, '0')}-${String(rint(1, 28)).padStart(2, '0')}`,
    id_card: maskId(),
    marital_status: pick([1, 2, 2, 1]),
    political_status: pick([1, 1, 3, 2]),
    phone: maskPhone(),
    email: `emp${String(id).padStart(4, '0')}@huaxin.com`,
    emergency_contact: pick(['王强', '李梅', '张伟', '刘洋', '陈芳']),
    emergency_phone: maskPhone(),
    address: pick(['北京市海淀区', '北京市朝阳区', '上海市浦东新区', '深圳市南山区']) + pick(['中关村大街', '望京街道', '张江路', '科技园南路']) + rint(1, 200) + '号',
    education: f.edu,
    graduate_school: pick(['北京理工大学', '华中科技大学', '武汉大学', '电子科技大学', '北京邮电大学']),
    major: pick(['计算机科学与技术', '软件工程', '人力资源管理', '会计学', '市场营销']),
    graduate_date: `${rint(2008, 2023)}-06-30`,
    dept_id: f.deptId,
    position_id: f.posId,
    position: f.position,
    job_level: f.jobLevel,
    employee_type: f.status === 2 ? 2 : 1,
    hire_date: dayOffset(f.hire),
    regular_date: f.status === 2 ? null : dayOffset(f.hire + 180),
    work_start_date: dayOffset(f.hire),
    leave_date: null,
    leave_reason: null,
    status: f.status,
    manager_id: null,
    salary: f.salary,
    bank_name: pick(BANKS),
    bank_account: '6222****' + String(rint(1000, 9999)),
    remark: ''
  })
  empSeq++
}
for (let i = 0; i < 16; i++) {
  const id = empSeq
  const name = EXTRA_NAMES[i]
  const deptId = pick([6, 6, 7, 7, 8, 8, 9, 10, 2, 3])
  const pos = positions.find((p) => p.dept_id === deptId)
  const status = pick([1, 1, 1, 1, 2])
  const hire = -rint(20, 900)
  employees.push({
    id,
    emp_no: `E${String(id).padStart(4, '0')}`,
    name,
    gender: pick(['M', 'F']),
    age: rint(23, 42),
    birth_date: `${2026 - rint(23, 42)}-${String(rint(1, 12)).padStart(2, '0')}-${String(rint(1, 28)).padStart(2, '0')}`,
    id_card: maskId(),
    marital_status: pick([1, 1, 2, 2]),
    political_status: pick([1, 2, 3]),
    phone: maskPhone(),
    email: `emp${String(id).padStart(4, '0')}@huaxin.com`,
    emergency_contact: pick(['王强', '李梅', '张伟', '刘洋', '陈芳']),
    emergency_phone: maskPhone(),
    address: '北京市海淀区中关村大街' + rint(1, 200) + '号',
    education: pick(EDU),
    graduate_school: pick(['北京理工大学', '华中科技大学', '武汉大学', '电子科技大学', '北京邮电大学']),
    major: pick(['计算机科学与技术', '软件工程', '人力资源管理', '会计学', '市场营销']),
    graduate_date: `${rint(2016, 2024)}-06-30`,
    dept_id: deptId,
    position_id: pos ? pos.id : 7,
    position: pos ? pos.position_name : 'Java开发工程师',
    job_level: pick(['P3', 'P4', 'P5']),
    employee_type: status === 2 ? 2 : 1,
    hire_date: dayOffset(hire),
    regular_date: status === 2 ? null : dayOffset(hire + 180),
    work_start_date: dayOffset(hire),
    leave_date: null,
    leave_reason: null,
    status,
    manager_id: null,
    salary: rint(70, 240) * 100,
    bank_name: pick(BANKS),
    bank_account: '6222****' + String(rint(1000, 9999)),
    remark: ''
  })
  empSeq++
}
// 汇报关系与部门负责人（循环依赖按 schema 后置补齐）
const leaderMap = { 1: 1, 2: 2, 3: 4, 4: 6, 5: 10, 6: 7, 7: 14, 8: 16, 9: 18, 10: 19 }
employees.forEach((e) => {
  const dept = depts.find((d) => d.id === e.dept_id)
  if (dept && leaderMap[dept.id]) {
    e.manager_id = leaderMap[dept.id] === e.id ? (e.dept_id === 6 ? 7 : leaderMap[dept.id]) : leaderMap[dept.id]
    if (e.id !== leaderMap[dept.id]) e.manager_id = leaderMap[dept.id]
    else if (e.dept_id !== 1) e.manager_id = e.dept_id === 2 ? 2 : 6
  }
})
depts.forEach((d) => {
  d.leader_id = leaderMap[d.id] || null
  const l = employees.find((e) => e.id === d.leader_id)
  d.leader = l ? l.name : ''
})

// ---------------- 系统用户（sys_user） + 角色（sys_role） ----------------
export const roles = [
  { id: 1, role_code: 'ROLE_ADMIN', role_name: '系统管理员', data_scope: 1, role_type: 1, sort_no: 1, status: 1, description: '系统基础配置与审计，不参与人事业务审批' },
  { id: 2, role_code: 'ROLE_HR', role_name: '人事专员', data_scope: 1, role_type: 1, sort_no: 2, status: 1, description: '员工全生命周期管理、考勤汇总、薪资核算' },
  { id: 3, role_code: 'ROLE_MANAGER', role_name: '部门主管', data_scope: 3, role_type: 1, sort_no: 3, status: 1, description: '本部门员工查看、考勤与请假审批、绩效评分' },
  { id: 4, role_code: 'ROLE_FINANCE', role_name: '财务人员', data_scope: 1, role_type: 1, sort_no: 4, status: 1, description: '薪资标准维护、核算复核与发放' },
  { id: 5, role_code: 'ROLE_EMPLOYEE', role_name: '普通员工', data_scope: 4, role_type: 1, sort_no: 5, status: 1, description: '个人档案与薪资条、考勤打卡、各类申请' },
  { id: 6, role_code: 'ROLE_EXECUTIVE', role_name: '决策层', data_scope: 1, role_type: 2, sort_no: 6, status: 1, description: '跨部门数据看板与报表分析（只读汇总）' }
]

export const users = [
  { id: 1, username: 'admin', password: '123456', real_name: '系统管理员', employee_id: null, dept_id: 1, roles: ['ROLE_ADMIN'], status: 1, last_login_time: dayOffset(-1) + ' 08:55:12' },
  { id: 2, username: 'hr01', password: '123456', real_name: '苏婉', employee_id: 2, dept_id: 2, roles: ['ROLE_HR'], status: 1, last_login_time: dayOffset(-1) + ' 09:02:31' },
  { id: 3, username: 'mgr01', password: '123456', real_name: '陈建国', employee_id: 7, dept_id: 6, roles: ['ROLE_MANAGER'], status: 1, last_login_time: dayOffset(-1) + ' 08:47:05' },
  { id: 4, username: 'fin01', password: '123456', real_name: '周慧', employee_id: 5, dept_id: 3, roles: ['ROLE_FINANCE'], status: 1, last_login_time: dayOffset(-2) + ' 10:11:44' },
  { id: 5, username: 'emp01', password: '123456', real_name: '林小满', employee_id: 11, dept_id: 6, roles: ['ROLE_EMPLOYEE'], status: 1, last_login_time: dayOffset(0) + ' 08:58:20' },
  { id: 6, username: 'exe01', password: '123456', real_name: '王建国', employee_id: 1, dept_id: 1, roles: ['ROLE_EXECUTIVE'], status: 1, last_login_time: dayOffset(-3) + ' 14:22:10' }
]
// 绑定演示账号的员工主数据指针（ employee 反查用）
export const demoEmployeeIds = { hr: 2, manager: 7, finance: 5, employee: 11, executive: 1 }

// ---------------- 班次（shift）/ 假别（leave_type） ----------------
export const shifts = [
  { id: 1, shift_code: 'STD', shift_name: '标准班', work_start: '09:00:00', work_end: '18:00:00', rest_minutes: 60, standard_hours: 8.0, late_tolerance: 5, early_tolerance: 5, status: 1 },
  { id: 2, shift_code: 'DAY', shift_name: '早班', work_start: '08:00:00', work_end: '17:00:00', rest_minutes: 60, standard_hours: 8.0, late_tolerance: 5, status: 1 },
  { id: 3, shift_code: 'NIGHT', shift_name: '晚班', work_start: '14:00:00', work_end: '22:00:00', rest_minutes: 30, standard_hours: 7.5, late_tolerance: 5, status: 1 }
]
export const leaveTypes = [
  { id: 1, type_code: 'ANNUAL', type_name: '年假', is_paid: 1, unit: 1, min_unit: 0.5, max_days_per_year: 10, need_proof: 0, status: 1 },
  { id: 2, type_code: 'SICK', type_name: '病假', is_paid: 1, unit: 1, min_unit: 0.5, max_days_per_year: 0, need_proof: 1, status: 1 },
  { id: 3, type_code: 'PERSONAL', type_name: '事假', is_paid: 0, unit: 1, min_unit: 0.5, max_days_per_year: 0, need_proof: 0, status: 1 },
  { id: 4, type_code: 'MARRIAGE', type_name: '婚假', is_paid: 1, unit: 1, min_unit: 1, max_days_per_year: 10, need_proof: 1, status: 1 },
  { id: 5, type_code: 'MATERNITY', type_name: '产假', is_paid: 1, unit: 1, min_unit: 1, max_days_per_year: 158, need_proof: 1, status: 1 }
]

// ---------------- 考勤记录（attendance_record，近 14 个自然日 × 全员子集） ----------------
export const attendanceRecords = []
const attEmployees = employees.filter((e) => e.status !== 0).slice(0, 20)
for (let d = 13; d >= 0; d--) {
  const date = new Date()
  date.setDate(date.getDate() - d)
  const dow = date.getDay()
  if (dow === 0 || dow === 6) continue
  const dateStr = dayOffset(-d)
  for (const emp of attEmployees) {
    const r = rand()
    // 打卡时间
    const inH = r < 0.86 ? 8 : r < 0.95 ? 9 : 9
    const inM = r < 0.86 ? rint(20, 59) : r < 0.95 ? rint(6, 40) : 0
    const lateMinutes = inH > 9 || (inH === 9 && inM > 5) ? (inH - 9) * 60 + inM - 5 : 0
    const status = lateMinutes > 0 ? (lateMinutes > 60 ? 3 : 2) : 1
    const outMissing = rand() < 0.04
    const outH = outMissing ? null : rint(18, 21)
    attendanceRecords.push({
      id: attendanceRecords.length + 1,
      employee_id: emp.id,
      attendance_date: dateStr,
      shift_id: 1,
      first_check_in: `${dateStr} ${String(inH).padStart(2, '0')}:${String(inM).padStart(2, '0')}:00`,
      last_check_out: outMissing ? null : `${dateStr} ${outH}:${String(rint(0, 59)).padStart(2, '0')}:00`,
      work_hours: outMissing ? 0 : money(outH - 9 + (inM / 60)),
      late_minutes: lateMinutes,
      early_minutes: 0,
      check_in_status: status,
      check_out_status: outMissing ? 3 : 1,
      attendance_status: lateMinutes > 0 ? 2 : outMissing ? 4 : 1,
      source: pick([1, 2]),
      remark: lateMinutes > 0 ? '地铁故障迟到' : ''
    })
  }
}

// ---------------- 假期余额（leave_balance） ----------------
export const leaveBalances = []
for (const emp of attEmployees.slice(0, 12)) {
  for (const lt of leaveTypes.slice(0, 3)) {
    const total = lt.type_code === 'ANNUAL' ? 10 : lt.type_code === 'SICK' ? 15 : 5
    const used = money(rand() * total * 0.6)
    leaveBalances.push({
      id: leaveBalances.length + 1,
      employee_id: emp.id,
      leave_type_id: lt.id,
      balance_year: 2026,
      total_days: total,
      carry_over_days: 0,
      used_days: used,
      remain_days: money(total - used),
      expire_date: '2026-12-31'
    })
  }
}

// ---------------- 请假 / 加班 / 出差申请 ----------------
const LV = (id, empId, typeId, startOff, days, status, approverId, reason) => ({
  id,
  request_no: `LV2026${String(900 + id)}`,
  employee_id: empId,
  leave_type_id: typeId,
  start_time: `${dayOffset(startOff)} 09:00:00`,
  end_time: `${dayOffset(startOff + Math.ceil(days) - 1)} 18:00:00`,
  days,
  reason,
  approval_status: status,
  current_approver_id: status === 1 ? approverId : null,
  apply_time: `${dayOffset(startOff - 2)} 10:00:00`
})
export const leaveRequests = [
  LV(1, 11, 1, 3, 1, 1, 7, '家中有事需要处理'),
  LV(2, 12, 2, 5, 2, 1, 7, '感冒发烧，需就医休养'),
  LV(3, 14, 1, 8, 3, 2, 7, '年假旅行'),
  LV(4, 15, 3, -6, 0.5, 2, 7, '办理银行业务'),
  LV(5, 16, 2, -10, 1, 2, 7, '肠胃炎就医'),
  LV(6, 12, 3, -14, 1, 3, 7, '请假事由不充分，建议调整日期'),
  LV(7, 18, 4, 20, 10, 1, 7, '结婚休假'),
  LV(8, 17, 1, 12, 2, 1, 7, '年假'),
  LV(9, 11, 3, 6, 0.5, 1, 7, '下午前往车管所办理牌照'),
  LV(10, 13, 1, -20, 2, 2, 7, '陪父母体检')
]

export const overtimeRequests = [
  { id: 1, request_no: 'OT20260901', employee_id: 11, overtime_date: dayOffset(-3), start_time: '18:30:00', end_time: '22:00:00', hours: 3.5, overtime_type: 1, compensate_type: 2, reason: '版本上线保障', approval_status: 2, apply_time: `${dayOffset(-4)} 17:00:00` },
  { id: 2, request_no: 'OT20260902', employee_id: 12, overtime_date: dayOffset(-1), start_time: '19:00:00', end_time: '21:30:00', hours: 2.5, overtime_type: 1, compensate_type: 1, reason: '紧急缺陷修复', approval_status: 1, current_approver_id: 7, apply_time: `${dayOffset(-1)} 16:40:00` },
  { id: 3, request_no: 'OT20260903', employee_id: 14, overtime_date: dayOffset(2), start_time: '10:00:00', end_time: '16:00:00', hours: 6, overtime_type: 2, compensate_type: 1, reason: '活动页紧急开发', approval_status: 1, current_approver_id: 14, apply_time: `${dayOffset(-1)} 11:20:00` },
  { id: 4, request_no: 'OT20260904', employee_id: 16, overtime_date: dayOffset(-7), start_time: '18:00:00', end_time: '20:00:00', hours: 2, overtime_type: 1, compensate_type: 2, reason: '回归测试', approval_status: 2, apply_time: `${dayOffset(-8)} 15:00:00` }
]

export const businessTrips = [
  { id: 1, request_no: 'BT20260901', employee_id: 7, destination: '上海', purpose: '客户现场技术支持', start_time: `${dayOffset(-5)} 09:00:00`, end_time: `${dayOffset(-3)} 18:00:00`, days: 3, transport: 2, budget_amount: 3500, approval_status: 2, apply_time: `${dayOffset(-9)} 10:00:00` },
  { id: 2, request_no: 'BT20260902', employee_id: 11, destination: '深圳', purpose: '项目投标技术交流', start_time: `${dayOffset(4)} 09:00:00`, end_time: `${dayOffset(6)} 18:00:00`, days: 3, transport: 1, budget_amount: 5200, approval_status: 1, current_approver_id: 7, apply_time: `${dayOffset(-1)} 14:30:00` },
  { id: 3, request_no: 'BT20260903', employee_id: 18, destination: '成都', purpose: '渠道合作伙伴拜访', start_time: `${dayOffset(8)} 09:00:00`, end_time: `${dayOffset(10)} 18:00:00`, days: 3, transport: 2, budget_amount: 4100, approval_status: 1, current_approver_id: 10, apply_time: `${dayOffset(0)} 09:15:00` }
]

// ---------------- 考勤月报（attendance_month） ----------------
export const attendanceMonths = []
for (const emp of attEmployees.slice(0, 12)) {
  // 上月（已封账）
  attendanceMonths.push({
    id: attendanceMonths.length + 1,
    employee_id: emp.id,
    dept_id: emp.dept_id,
    record_year: 2026,
    record_month: 8,
    should_days: 21,
    actual_days: money(19 + rand() * 2),
    late_count: rint(0, 2),
    early_count: 0,
    absent_count: 0,
    missing_count: rint(0, 1),
    leave_days: money(rand() * 3),
    overtime_hours: money(rand() * 12),
    trip_days: rint(0, 3),
    lock_status: 1,
    lock_time: '2026-09-05 10:00:00',
    lock_by: 2
  })
  // 本月（未封账）
  attendanceMonths.push({
    id: attendanceMonths.length + 1,
    employee_id: emp.id,
    dept_id: emp.dept_id,
    record_year: 2026,
    record_month: 9,
    should_days: 21,
    actual_days: money(8 + rand() * 3),
    late_count: rint(0, 1),
    early_count: 0,
    absent_count: 0,
    missing_count: rint(0, 1),
    leave_days: money(rand() * 1.5),
    overtime_hours: money(rand() * 8),
    trip_days: rint(0, 2),
    lock_status: 0,
    lock_time: null,
    lock_by: null
  })
}

// ---------------- 薪资标准（salary_standard） ----------------
export const salaryStandards = [
  { id: 1, standard_code: 'STD-TECH-P4', standard_name: '技术序列 P4', position_seq: 2, job_level: 'P4', base_salary: 8000, post_salary: 3000, performance_salary: 2000, allowance: 500, effective_date: '2026-01-01', status: 1 },
  { id: 2, standard_code: 'STD-TECH-P5', standard_name: '技术序列 P5', position_seq: 2, job_level: 'P5', base_salary: 11000, post_salary: 4000, performance_salary: 3000, allowance: 800, effective_date: '2026-01-01', status: 1 },
  { id: 3, standard_code: 'STD-FUNC-P4', standard_name: '职能序列 P4', position_seq: 3, job_level: 'P4', base_salary: 6500, post_salary: 1500, performance_salary: 1200, allowance: 400, effective_date: '2026-01-01', status: 1 },
  { id: 4, standard_code: 'STD-MGR-M2', standard_name: '管理序列 M2', position_seq: 1, job_level: 'M2', base_salary: 15000, post_salary: 5000, performance_salary: 6000, allowance: 1200, effective_date: '2026-01-01', status: 1 }
]

// ---------------- 月度薪资记录（salary_record，8 月已发放 + 9 月流转中） ----------------
export const salaryRecords = []
let srId = 1
for (const emp of employees.filter((e) => e.status !== 0)) {
  const base = money(emp.salary * 0.7)
  const post = money(emp.salary * 0.2)
  const perf = money(emp.salary * 0.1)
  const allow = 500
  const gross8 = money(base + post + perf + allow + rand() * 800)
  const social8 = money(emp.salary * 0.105)
  const fund8 = money(emp.salary * 0.12)
  const tax8 = money(Math.max(0, (gross8 - 5000 - social8 - fund8) * 0.1))
  salaryRecords.push({
    id: srId++,
    employee_id: emp.id,
    dept_id: emp.dept_id,
    salary_year: 2026,
    salary_month: 8,
    base_salary: base, post_salary: post, performance_salary: perf, allowance: allow,
    overtime_pay: money(rand() * 600), other_add: 0,
    attendance_deduct: money(rand() * 150), other_deduct: 0,
    gross_pay: gross8,
    social_personal: social8, social_company: money(emp.salary * 0.265),
    fund_personal: fund8, fund_company: fund8,
    tax_amount: tax8,
    net_pay: money(gross8 - social8 - fund8 - tax8),
    pay_status: 3,
    pay_date: '2026-09-10',
    pay_batch_no: 'PAY20260910001',
    lock_status: 1,
    audit_by: 4
  })
  const gross9 = money(gross8 + rand() * 200 - 100)
  const social9 = social8
  const fund9 = fund8
  const tax9 = money(Math.max(0, (gross9 - 5000 - social9 - fund9) * 0.1))
  salaryRecords.push({
    id: srId++,
    employee_id: emp.id,
    dept_id: emp.dept_id,
    salary_year: 2026,
    salary_month: 9,
    base_salary: base, post_salary: post, performance_salary: perf, allowance: allow,
    overtime_pay: money(rand() * 600), other_add: 0,
    attendance_deduct: money(rand() * 150), other_deduct: 0,
    gross_pay: gross9,
    social_personal: social9, social_company: money(emp.salary * 0.265),
    fund_personal: fund9, fund_company: fund9,
    tax_amount: tax9,
    net_pay: money(gross9 - social9 - fund9 - tax9),
    pay_status: pick([0, 1, 1, 2, 2, 3]),
    pay_date: null,
    pay_batch_no: null,
    lock_status: 0,
    audit_by: null
  })
}

/** 按薪资记录生成 salary_item 明细（薪资条逐项） */
export function buildSalaryItems(record) {
  const add = (t, code, name, amount, sort, remark) => ({ item_type: t, item_code: code, item_name: name, item_amount: money(amount), sort_no: sort, remark: remark || '' })
  return [
    add(1, 'BASE', '基本工资', record.base_salary, 1),
    add(1, 'POST', '岗位工资', record.post_salary, 2),
    add(1, 'PERF', '绩效工资', record.performance_salary, 3),
    add(1, 'ALLOW', '补贴合计', record.allowance, 4),
    add(1, 'OT', '加班费', record.overtime_pay, 5),
    add(2, 'ATT', '考勤扣款', record.attendance_deduct, 10, '迟到/早退/旷工按参数折算'),
    add(2, 'SOCIAL', '社保个人', record.social_personal, 11, '养老8%+医疗2%+失业0.5%'),
    add(2, 'FUND', '公积金个人', record.fund_personal, 12),
    add(2, 'TAX', '个人所得税', record.tax_amount, 13, '累计预扣法'),
    add(3, 'SOCIAL_C', '社保企业', record.social_company, 20),
    add(3, 'FUND_C', '公积金企业', record.fund_company, 21)
  ]
}

// ---------------- 员工异动（employee_change） ----------------
export const employeeChanges = [
  { id: 1, employee_id: 12, change_type: 1, before_dept_id: null, after_dept_id: 6, before_position: null, after_position: 'Java开发工程师', before_salary: null, after_salary: 13000, effect_date: dayOffset(-150), reason: '校招入职', approval_status: 2, operator_id: 2 },
  { id: 2, employee_id: 11, change_type: 2, before_dept_id: 6, after_dept_id: 6, before_position: 'Java开发工程师', after_position: 'Java开发工程师', before_salary: 15000, after_salary: 17500, effect_date: dayOffset(-520), reason: '试用期转正调薪', approval_status: 2, operator_id: 2 },
  { id: 3, employee_id: 15, change_type: 4, before_dept_id: 6, after_dept_id: 7, before_position: 'Java开发工程师', after_position: '前端开发工程师', before_salary: 12500, after_salary: 12500, effect_date: dayOffset(-90), reason: '项目人员调配', approval_status: 2, operator_id: 2 },
  { id: 4, employee_id: 13, change_type: 5, before_dept_id: 6, after_dept_id: 6, before_position: 'Java开发工程师', after_position: 'Java开发工程师', before_salary: 24000, after_salary: 28000, effect_date: dayOffset(-60), reason: '晋升 P6', approval_status: 2, operator_id: 2 }
]

// ---------------- 劳动合同（employee_contract） ----------------
export const contracts = employees.slice(0, 10).map((e, i) => {
  const start = dayOffset(e.hire_date ? -Math.abs(rint(700, 1000)) : -800)
  const willExpire = i % 3 === 0
  const end = willExpire ? dayOffset(pick([12, 28, 45, 55])) : null
  return {
    id: i + 1,
    contract_no: `CT2026${String(100 + i)}`,
    employee_id: e.id,
    contract_type: i % 5 === 3 ? 4 : 1,
    first_party: '华信科技集团',
    second_party: e.name,
    sign_date: start,
    start_date: start,
    end_date: end,
    term_years: end ? 3 : null,
    salary_agreed: e.salary,
    probation_months: 3,
    status: end ? 1 : 2,
    remark: end ? '' : '无固定期限'
  }
})

// ---------------- 招聘（recruit_request / candidate / interview / offer） ----------------
export const recruitRequests = [
  { id: 1, request_no: 'RC20260901', request_dept_id: 6, position_id: 7, position_name: 'Java开发工程师', recruit_count: 2, hired_count: 1, job_level: 'P5', salary_min: 15000, salary_max: 22000, education_req: 3, experience_years: 3, hope_arrive_date: dayOffset(25), urgency: 2, applicant_id: 7, approval_status: 2, status: 1, job_description: '负责核心交易系统研发', job_requirement: '3年以上 Java 经验，熟悉 Spring Boot/MySQL' },
  { id: 2, request_no: 'RC20260902', request_dept_id: 7, position_id: 8, position_name: '前端开发工程师', recruit_count: 1, hired_count: 0, job_level: 'P5', salary_min: 14000, salary_max: 20000, education_req: 3, experience_years: 3, hope_arrive_date: dayOffset(35), urgency: 1, applicant_id: 14, approval_status: 2, status: 1, job_description: '负责管理端前端研发', job_requirement: '熟悉 Vue3/Element Plus/工程化' },
  { id: 3, request_no: 'RC20260903', request_dept_id: 8, position_id: 9, position_name: '测试工程师', recruit_count: 2, hired_count: 0, job_level: 'P4', salary_min: 9000, salary_max: 13000, education_req: 4, experience_years: 2, hope_arrive_date: dayOffset(18), urgency: 3, applicant_id: 16, approval_status: 1, current_approver_id: 6, status: 1, job_description: '负责平台功能与接口测试', job_requirement: '熟悉自动化测试工具' },
  { id: 4, request_no: 'RC20260904', request_dept_id: 9, position_id: 10, position_name: '市场专员', recruit_count: 1, hired_count: 0, job_level: 'P4', salary_min: 8000, salary_max: 12000, education_req: 3, experience_years: 2, hope_arrive_date: dayOffset(40), urgency: 1, applicant_id: 18, approval_status: 2, status: 1, job_description: '负责区域市场推广', job_requirement: '具备活动组织与文案能力' },
  { id: 5, request_no: 'RC20260801', request_dept_id: 6, position_id: 7, position_name: 'Java开发工程师', recruit_count: 1, hired_count: 1, job_level: 'P4', salary_min: 12000, salary_max: 16000, education_req: 3, experience_years: 1, hope_arrive_date: dayOffset(-10), urgency: 1, applicant_id: 7, approval_status: 2, status: 2, job_description: '校招补员', job_requirement: '应届优先' }
]

export const candidates = [
  { id: 1, recruit_request_id: 1, name: '刘子航', gender: 'M', education: 3, graduate_school: '北京邮电大学', work_years: 4, current_company: '字节跳动', current_position: 'Java工程师', expect_salary: 20000, source: 2, stage: 3, is_talent: 0, phone: maskPhone(), email: 'liuzh@example.com' },
  { id: 2, recruit_request_id: 1, name: '王梦琪', gender: 'F', education: 3, graduate_school: '华中科技大学', work_years: 3, current_company: '美团', current_position: '后端工程师', expect_salary: 18000, source: 2, stage: 2, is_talent: 0, phone: maskPhone(), email: 'wmq@example.com' },
  { id: 3, recruit_request_id: 1, name: '张一鸣', gender: 'M', education: 2, graduate_school: '清华大学', work_years: 6, current_company: '阿里云', current_position: '高级工程师', expect_salary: 28000, source: 4, stage: 4, is_talent: 0, phone: maskPhone(), email: 'zym@example.com' },
  { id: 4, recruit_request_id: 2, name: '李思思', gender: 'F', education: 3, graduate_school: '武汉大学', work_years: 3, current_company: '京东', current_position: '前端工程师', expect_salary: 17000, source: 3, stage: 3, is_talent: 0, phone: maskPhone(), email: 'lss@example.com' },
  { id: 5, recruit_request_id: 2, name: '赵子轩', gender: 'M', education: 4, graduate_school: '深圳大学', work_years: 2, current_company: '腾讯', current_position: '前端工程师', expect_salary: 15000, source: 2, stage: 1, is_talent: 0, phone: maskPhone(), email: 'zzx@example.com' },
  { id: 6, recruit_request_id: 3, name: '陈晓露', gender: 'F', education: 4, graduate_school: '成都电子科大', work_years: 2, current_company: '华为', current_position: '测试工程师', expect_salary: 12000, source: 2, stage: 2, is_talent: 0, phone: maskPhone(), email: 'cxl@example.com' },
  { id: 7, recruit_request_id: 3, name: '孙志刚', gender: 'M', education: 4, graduate_school: '郑州大学', work_years: 1, current_company: '中软国际', current_position: '测试工程师', expect_salary: 9000, source: 5, stage: 6, is_talent: 0, remark: '技术基础薄弱' },
  { id: 8, recruit_request_id: 4, name: '周雅婷', gender: 'F', education: 3, graduate_school: '中国传媒大学', work_years: 3, current_company: '小米', current_position: '市场专员', expect_salary: 11000, source: 2, stage: 5, is_talent: 0, phone: maskPhone(), email: 'zyt@example.com' },
  { id: 9, recruit_request_id: 1, name: '吴俊杰', gender: 'M', education: 3, graduate_school: '东南大学', work_years: 5, current_company: '网易', current_position: 'Java工程师', expect_salary: 22000, source: 3, stage: 6, is_talent: 1, talent_tags: 'Java,高并发,5年经验' },
  { id: 10, recruit_request_id: 2, name: '郑楚楚', gender: 'F', education: 2, graduate_school: '复旦大学', work_years: 5, current_company: '拼多多', current_position: '前端专家', expect_salary: 26000, source: 4, stage: 6, is_talent: 1, talent_tags: 'Vue3,前端架构,专家' }
]

export const interviewRecords = [
  { id: 1, candidate_id: 1, recruit_request_id: 1, round_no: 1, interview_type: 1, interview_time: `${dayOffset(-6)} 14:00:00`, interview_place: '会议室 A301 / 线上腾讯会议', interviewer_id: 7, score: 82, evaluation: '基础扎实，项目经验匹配', conclusion: 1 },
  { id: 2, candidate_id: 1, recruit_request_id: 1, round_no: 2, interview_type: 2, interview_time: `${dayOffset(-2)} 10:00:00`, interview_place: '会议室 A302', interviewer_id: 6, score: 78, evaluation: '架构设计能力良好', conclusion: 1 },
  { id: 3, candidate_id: 2, recruit_request_id: 1, round_no: 1, interview_type: 1, interview_time: `${dayOffset(2)} 15:00:00`, interview_place: '会议室 A301', interviewer_id: 7, score: null, evaluation: null, conclusion: null },
  { id: 4, candidate_id: 3, recruit_request_id: 1, round_no: 1, interview_type: 1, interview_time: `${dayOffset(-4)} 10:30:00`, interview_place: '线上', interviewer_id: 7, score: 88, evaluation: '技术深度优秀', conclusion: 1 },
  { id: 5, candidate_id: 4, recruit_request_id: 2, round_no: 1, interview_type: 1, interview_time: `${dayOffset(-3)} 16:00:00`, interview_place: '会议室 B201', interviewer_id: 14, score: 75, evaluation: '工程化经验尚可', conclusion: 1 },
  { id: 6, candidate_id: 7, recruit_request_id: 3, round_no: 1, interview_type: 1, interview_time: `${dayOffset(-8)} 09:30:00`, interview_place: '会议室 B202', interviewer_id: 16, score: 45, evaluation: '自动化测试经验不足', conclusion: 3 }
]

export const offerRecords = [
  { id: 1, offer_no: 'OF20260901', candidate_id: 3, recruit_request_id: 1, dept_id: 6, position_id: 7, job_level: 'P6', offer_salary: 26000, probation_months: 3, probation_salary: 20800, entry_date: dayOffset(20), approval_status: 2, status: 2, send_time: `${dayOffset(-1)} 11:00:00`, confirm_time: null },
  { id: 2, offer_no: 'OF20260805', candidate_id: 8, recruit_request_id: 4, dept_id: 9, position_id: 10, job_level: 'P4', offer_salary: 10500, probation_months: 3, probation_salary: 8400, entry_date: dayOffset(-2), approval_status: 2, status: 6, send_time: `${dayOffset(-20)} 10:00:00`, confirm_time: `${dayOffset(-16)} 09:00:00` },
  { id: 3, offer_no: 'OF20260802', candidate_id: 9, recruit_request_id: 5, dept_id: 6, position_id: 7, job_level: 'P4', offer_salary: 14000, probation_months: 3, probation_salary: 11200, entry_date: dayOffset(-8), approval_status: 2, status: 6, send_time: `${dayOffset(-30)} 10:00:00`, confirm_time: `${dayOffset(-28)} 09:00:00` }
]

// ---------------- 培训（training_plan / course / enroll / record） ----------------
export const trainingPlans = [
  { id: 1, plan_code: 'TP2026Q3-01', plan_name: '2026年Q3新员工入职培训', plan_year: 2026, plan_quarter: 3, train_type: 1, target_scope: 1, budget_amount: 30000, actual_amount: 12000, start_date: dayOffset(-7), end_date: dayOffset(3), organizer_id: 2, status: 3, description: '公司制度、企业文化、信息安全' },
  { id: 2, plan_code: 'TP2026Q3-02', plan_name: 'Java 高并发实战进阶', plan_year: 2026, plan_quarter: 3, train_type: 2, target_scope: 2, target_dept_ids: '6,7', budget_amount: 50000, actual_amount: 20000, start_date: dayOffset(6), end_date: dayOffset(20), organizer_id: 2, status: 2, description: 'JVM 调优、分布式锁、消息队列' },
  { id: 3, plan_code: 'TP2026Q3-03', plan_name: '中层管理者领导力工作坊', plan_year: 2026, plan_quarter: 3, train_type: 3, target_scope: 3, budget_amount: 40000, actual_amount: 0, start_date: dayOffset(25), end_date: dayOffset(27), organizer_id: 2, status: 1, description: '目标管理、跨部门协作' },
  { id: 4, plan_code: 'TP2026Q2-01', plan_name: '数据安全与合规培训（必修）', plan_year: 2026, plan_quarter: 2, train_type: 5, target_scope: 1, budget_amount: 15000, actual_amount: 15000, start_date: dayOffset(-80), end_date: dayOffset(-75), organizer_id: 2, status: 4, description: '全员数据安全意识与个保法合规' }
]
export const courses = [
  { id: 1, course_code: 'C001', course_name: '公司制度与企业文化', course_type: 2, category: '通用素质', hours: 4, trainer_id: 2, max_students: 50, status: 1 },
  { id: 2, course_code: 'C002', course_name: '信息安全意识', course_type: 1, category: '合规培训', hours: 2, trainer_id: 3, max_students: 0, status: 1 },
  { id: 3, course_code: 'C003', course_name: 'Java 高并发编程实战', course_type: 2, category: '技术类', hours: 12, trainer_id: 13, max_students: 20, status: 1 },
  { id: 4, course_code: 'C004', course_name: '管理者目标与绩效沟通', course_type: 2, category: '管理类', hours: 8, trainer_id: 1, max_students: 15, status: 1 }
]
export const trainingEnrolls = [
  { id: 1, plan_id: 1, course_id: 1, employee_id: 12, enroll_time: `${dayOffset(-6)} 10:00:00`, sign_in_status: 1, sign_in_time: `${dayOffset(-7)} 08:55:00`, exam_score: 88, pass_status: 1, satisfaction_score: 5 },
  { id: 2, plan_id: 1, course_id: 2, employee_id: 12, enroll_time: `${dayOffset(-6)} 10:05:00`, sign_in_status: 1, sign_in_time: `${dayOffset(-7)} 09:01:00`, exam_score: 92, pass_status: 1, satisfaction_score: 4 },
  { id: 3, plan_id: 1, course_id: 1, employee_id: 17, enroll_time: `${dayOffset(-5)} 14:00:00`, sign_in_status: 0, sign_in_time: null, exam_score: null, pass_status: 0, satisfaction_score: null },
  { id: 4, plan_id: 4, course_id: 2, employee_id: 11, enroll_time: `${dayOffset(-82)} 10:00:00`, sign_in_status: 1, sign_in_time: `${dayOffset(-80)} 09:00:00`, exam_score: 95, pass_status: 1, satisfaction_score: 5 }
]
export const trainingRecords = [
  { id: 1, employee_id: 12, plan_id: 1, course_id: 1, course_name: '公司制度与企业文化', train_type: 1, hours: 4, train_date: dayOffset(-7), exam_score: 88, pass_status: 1, certificate_no: null, archive_year: 2026 },
  { id: 2, employee_id: 12, plan_id: 1, course_id: 2, course_name: '信息安全意识', train_type: 5, hours: 2, train_date: dayOffset(-7), exam_score: 92, pass_status: 1, certificate_no: null, archive_year: 2026 },
  { id: 3, employee_id: 11, plan_id: 4, course_id: 2, course_name: '数据安全与合规培训（必修）', train_type: 5, hours: 2, train_date: dayOffset(-80), exam_score: 95, pass_status: 1, certificate_no: 'CERT2026-0112', archive_year: 2026 },
  { id: 4, employee_id: 14, plan_id: 4, course_id: 2, course_name: '数据安全与合规培训（必修）', train_type: 5, hours: 2, train_date: dayOffset(-80), exam_score: 90, pass_status: 1, certificate_no: 'CERT2026-0114', archive_year: 2026 },
  { id: 5, employee_id: 16, plan_id: 4, course_id: 2, course_name: '数据安全与合规培训（必修）', train_type: 5, hours: 2, train_date: dayOffset(-80), exam_score: 85, pass_status: 1, certificate_no: null, archive_year: 2026 }
]
// ---------------- 通用审批流水（approval_record，多态 biz_type+biz_id） ----------------
export const approvalFlow = []

export const trainers = [  { id: 1, trainer_code: 'T001', trainer_name: '王建国', trainer_type: 1, employee_id: 1, expertise: '战略管理', trainer_level: 4, teach_count: 12, avg_score: 4.8, status: 1 },
  { id: 2, trainer_code: 'T002', trainer_name: '苏婉', trainer_type: 1, employee_id: 2, expertise: '人力资源/劳动法', trainer_level: 3, teach_count: 20, avg_score: 4.6, status: 1 },
  { id: 3, trainer_code: 'T003', trainer_name: '陈志远', trainer_type: 1, employee_id: 6, expertise: '技术架构', trainer_level: 4, teach_count: 8, avg_score: 4.9, status: 1 },
  { id: 4, trainer_code: 'T004', trainer_name: '韩明远', trainer_type: 2, employee_id: null, org_name: '极客学院', expertise: 'Java 高并发', trainer_level: 3, hour_rate: 3000, teach_count: 30, avg_score: 4.5, status: 1 }
]

// ---------------- 绩效（performance_plan / record） ----------------
export const perfPlans = [
  { id: 1, plan_code: 'PF2026Q2', plan_name: '2026年Q2绩效考核', period_type: 2, plan_year: 2026, plan_quarter: 2, start_date: dayOffset(-100), end_date: dayOffset(-15), scope_type: 1, grade_rule: 'S:90+,A:80-89,B:70-79,C:60-69,D:<60', force_distribution: 1, distribution_rule: 'S:10,A:20,B:50,C:15,D:5', self_weight: 20, leader_weight: 70, review_weight: 10, creator_id: 2, status: 4 },
  { id: 2, plan_code: 'PF2026Q3', plan_name: '2026年Q3绩效考核', period_type: 2, plan_year: 2026, plan_quarter: 3, start_date: dayOffset(-10), end_date: dayOffset(20), scope_type: 1, grade_rule: 'S:90+,A:80-89,B:70-79,C:60-69,D:<60', force_distribution: 0, distribution_rule: null, self_weight: 20, leader_weight: 70, review_weight: 10, creator_id: 2, status: 3 }
]
export const perfRecords = []
let prId = 1
const perfTargets = employees.filter((e) => [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 3, 5].includes(e.id))
for (const emp of perfTargets) {
  const selfQ2 = rint(70, 95)
  const leaderQ2 = rint(65, 95)
  const finalQ2 = money(selfQ2 * 0.2 + leaderQ2 * 0.7 + (selfQ2 + leaderQ2) / 2 * 0.1)
  const gradeQ2 = finalQ2 >= 90 ? 'S' : finalQ2 >= 80 ? 'A' : finalQ2 >= 70 ? 'B' : finalQ2 >= 60 ? 'C' : 'D'
  perfRecords.push({
    id: prId++,
    plan_id: 1,
    employee_id: emp.id,
    dept_id: emp.dept_id,
    leader_id: emp.manager_id || 7,
    self_score: selfQ2, leader_score: leaderQ2, review_score: null,
    final_score: finalQ2, grade: gradeQ2,
    dept_rank: null,
    employee_confirm_status: 1,
    archive_status: 1, archive_time: '2026-09-01 10:00:00',
    status: 5
  })
  if (prId % 3 === 1) {
    // Q3：部分待自评 / 待主管评 / 待确认
    const st = pick([1, 2, 2, 4])
    perfRecords.push({
      id: prId++,
      plan_id: 2,
      employee_id: emp.id,
      dept_id: emp.dept_id,
      leader_id: emp.manager_id || 7,
      self_score: st === 1 ? null : rint(70, 95),
      leader_score: st === 1 || st === 2 ? null : rint(65, 95),
      review_score: null,
      final_score: null, grade: null,
      dept_rank: null,
      employee_confirm_status: st === 4 ? 0 : 0,
      archive_status: 0, archive_time: null,
      status: st
    })
  }
}

// 保证演示用普通员工（emp01 → employee_id=11）始终有一条"待自评"的 Q3 记录，
// 否则 F-08-03 员工自评链路在演示账号下无数据可操作（自评实测发现的缺口）
if (!perfRecords.some((r) => r.employee_id === 11 && r.plan_id === 2)) {
  const emp11 = employees.find((e) => e.id === 11) || {}
  perfRecords.push({
    id: prId++,
    plan_id: 2,
    employee_id: 11,
    dept_id: emp11.dept_id,
    leader_id: emp11.manager_id || 7,
    self_score: null, leader_score: null, review_score: null,
    final_score: null, grade: null,
    dept_rank: null, employee_confirm_status: 0,
    archive_status: 0, archive_time: null,
    status: 1
  })
}

// ---------------- 首页：公告（notice）与待办（todo_task） ----------------
export const notices = [
  { id: 1, title: '关于 2026 年中秋、国庆放假安排的通知', content: '根据国务院办公厅通知精神，结合公司实际，中秋、国庆放假安排如下：10月1日至10月8日放假调休，共8天。9月28日（周日）、10月11日（周六）正常上班。请各部门提前做好工作安排。', notice_type: 2, publisher_id: 2, publish_time: `${dayOffset(-3)} 09:00:00`, target_scope: 1, is_top: 1, read_count: 186, status: 2 },
  { id: 2, title: '《员工考勤管理制度（2026修订版）》正式发布', content: '修订版考勤制度自 2026 年 9 月 1 日起执行，主要变化：迟到容忍时长由 10 分钟调整为 5 分钟；加班需提前一日提交申请。请全员查阅学习。', notice_type: 1, publisher_id: 2, publish_time: `${dayOffset(-10)} 09:00:00`, target_scope: 1, is_top: 0, read_count: 203, status: 2 },
  { id: 3, title: '2026年Q3绩效考核启动通知', content: 'Q3 绩效考核已于 9 月 5 日启动，请各部门主管于 9 月 25 日前完成下属评分，员工确认截止 9 月 30 日。', notice_type: 3, publisher_id: 2, publish_time: `${dayOffset(-5)} 10:00:00`, target_scope: 1, is_top: 1, read_count: 154, status: 2 },
  { id: 4, title: '关于组织 2026 年度员工健康体检的通知', content: '本年度员工体检安排在 10 月中旬分批进行，具体批次请关注人事部后续通知。', notice_type: 4, publisher_id: 2, publish_time: `${dayOffset(-8)} 14:00:00`, target_scope: 1, is_top: 0, read_count: 97, status: 2 },
  { id: 5, title: '技术中心国庆值班安排（征求意见）', content: '拟安排研发一、二部轮流值班，如有异议请于本周五前反馈至技术总监处。', notice_type: 3, publisher_id: 6, publish_time: `${dayOffset(-1)} 16:00:00`, target_scope: 2, target_dept_ids: '4,6,7,8', is_top: 0, read_count: 36, status: 2 }
]

export const todos = [
  { id: 1, receiver_id: 7, task_type: 1, task_title: '请假审批：林小满（年假 1 天）', task_content: 'LV2026901，9月18日', biz_type: 1, biz_id: 1, biz_no: 'LV2026901', priority: 3, deadline: `${dayOffset(1)} 18:00:00`, handle_status: 0 },
  { id: 2, receiver_id: 7, task_type: 1, task_title: '请假审批：王浩（病假 2 天）', task_content: 'LV2026902，需上传病假条', biz_type: 1, biz_id: 2, biz_no: 'LV2026902', priority: 2, deadline: `${dayOffset(2)} 18:00:00`, handle_status: 0 },
  { id: 3, receiver_id: 7, task_type: 1, task_title: '加班审批：王浩（2.5 小时）', task_content: 'OT20260902', biz_type: 2, biz_id: 2, biz_no: 'OT20260902', priority: 2, deadline: `${dayOffset(1)} 18:00:00`, handle_status: 0 },
  { id: 4, receiver_id: 2, task_type: 3, task_title: '转正提醒：王浩（试用期至 10 月 12 日）', task_content: '请提前发起转正评估', biz_type: 4, biz_id: null, biz_no: null, priority: 2, deadline: `${dayOffset(12)} 18:00:00`, handle_status: 0 },
  { id: 5, receiver_id: 2, task_type: 2, task_title: '合同到期预警：宋佳琪（30 天内到期）', task_content: 'CT2026100，请确认是否续签', biz_type: 4, biz_id: null, biz_no: 'CT2026100', priority: 3, deadline: `${dayOffset(28)} 18:00:00`, handle_status: 0 },
  { id: 6, receiver_id: 4, task_type: 1, task_title: '薪资复核：2026 年 9 月批次', task_content: '研发一部核算完成，待财务复核', biz_type: 8, biz_id: null, biz_no: 'PAY202609', priority: 2, deadline: `${dayOffset(5)} 18:00:00`, handle_status: 0 },
  { id: 7, receiver_id: 11, task_type: 4, task_title: '绩效自评：2026年Q3绩效考核', task_content: '请于 9 月 20 日前完成自评', biz_type: 4, biz_id: null, biz_no: 'PF2026Q3', priority: 2, deadline: `${dayOffset(5)} 18:00:00`, handle_status: 0 },
  { id: 8, receiver_id: 11, task_type: 5, task_title: '培训报名：Java 高并发实战进阶', task_content: '名额有限，报名截止 9 月 18 日', biz_type: 4, biz_id: null, biz_no: 'TP2026Q3-02', priority: 1, deadline: `${dayOffset(3)} 18:00:00`, handle_status: 0 }
]

// ---------------- 系统设置：字典 / 参数 / 日志 ----------------
export const dictTypes = [
  { id: 1, dict_type: 'gender', dict_name: '性别', status: 1, remark: 'employee.gender' },
  { id: 2, dict_type: 'education', dict_name: '最高学历', status: 1, remark: 'employee.education' },
  { id: 3, dict_type: 'marital_status', dict_name: '婚姻状况', status: 1, remark: 'employee.marital_status' },
  { id: 4, dict_type: 'employee_status', dict_name: '在职状态', status: 1, remark: 'employee.status' },
  { id: 5, dict_type: 'leave_type', dict_name: '假别', status: 1, remark: 'leave_type.type_code' }
]
export const dictItems = [
  { id: 1, dict_type_id: 1, item_value: 'M', item_label: '男', sort_no: 1, is_default: 1, status: 1 },
  { id: 2, dict_type_id: 1, item_value: 'F', item_label: '女', sort_no: 2, status: 1 },
  { id: 3, dict_type_id: 1, item_value: 'U', item_label: '未知', sort_no: 3, status: 1 },
  { id: 4, dict_type_id: 2, item_value: '1', item_label: '博士', sort_no: 1, status: 1 },
  { id: 5, dict_type_id: 2, item_value: '2', item_label: '硕士', sort_no: 2, status: 1 },
  { id: 6, dict_type_id: 2, item_value: '3', item_label: '本科', sort_no: 3, is_default: 1, status: 1 },
  { id: 7, dict_type_id: 2, item_value: '4', item_label: '大专', sort_no: 4, status: 1 },
  { id: 8, dict_type_id: 2, item_value: '5', item_label: '中专及以下', sort_no: 5, status: 1 },
  { id: 9, dict_type_id: 3, item_value: '1', item_label: '未婚', sort_no: 1, status: 1 },
  { id: 10, dict_type_id: 3, item_value: '2', item_label: '已婚', sort_no: 2, status: 1 },
  { id: 11, dict_type_id: 4, item_value: '1', item_label: '在职', sort_no: 1, is_default: 1, status: 1 },
  { id: 12, dict_type_id: 4, item_value: '2', item_label: '试用', sort_no: 2, status: 1 },
  { id: 13, dict_type_id: 4, item_value: '3', item_label: '待入职', sort_no: 3, status: 1 },
  { id: 14, dict_type_id: 4, item_value: '0', item_label: '离职', sort_no: 4, status: 1 },
  { id: 15, dict_type_id: 5, item_value: '1', item_label: '年假', sort_no: 1, status: 1 },
  { id: 16, dict_type_id: 5, item_value: '2', item_label: '病假', sort_no: 2, status: 1 },
  { id: 17, dict_type_id: 5, item_value: '3', item_label: '事假', sort_no: 3, status: 1 },
  { id: 18, dict_type_id: 5, item_value: '4', item_label: '婚假', sort_no: 4, status: 1 },
  { id: 19, dict_type_id: 5, item_value: '5', item_label: '产假', sort_no: 5, status: 1 }
]

export const configs = [
  { id: 1, config_key: 'attendance.lock.day', config_name: '考勤封账日', config_value: '5', config_group: 'attendance', value_type: 2, is_system: 1, remark: '每月 5 日封账上月考勤（BR-04-03）' },
  { id: 2, config_key: 'attendance.late.tolerance', config_name: '迟到容忍分钟数', config_value: '5', config_group: 'attendance', value_type: 2, is_system: 1, remark: '超出计迟到' },
  { id: 3, config_key: 'salary.tax.threshold', config_name: '个税起征点', config_value: '5000', config_group: 'salary', value_type: 2, is_system: 1, remark: '累计预扣法适用（BR-05 合规）' },
  { id: 4, config_key: 'salary.fund.rate', config_name: '公积金个人比例(%)', config_value: '12', config_group: 'salary', value_type: 2, is_system: 0, remark: '' },
  { id: 5, config_key: 'contract.warn.days', config_name: '合同到期预警天数', config_value: '30,60', config_group: 'system', value_type: 4, is_system: 0, remark: 'F-02-05 到期预警' },
  { id: 6, config_key: 'recruit.offer.probation.rate', config_name: '试用期薪资比例(%)', config_value: '80', config_group: 'recruit', value_type: 2, is_system: 0, remark: 'offer 试用期月薪 = 转正 × 比例' }
]

export const loginLogs = Array.from({ length: 18 }, (_, i) => ({
  id: i + 1,
  user_id: pick([1, 2, 3, 4, 5, 6, null]),
  username: pick(['admin', 'hr01', 'mgr01', 'fin01', 'emp01', 'exe01', 'test01']),
  login_ip: `192.168.1.${rint(2, 250)}`,
  login_location: '北京市 北京市（内网）',
  browser: pick(['Chrome 128', 'Edge 127', 'Chrome 127']),
  os: pick(['Windows 10', 'Windows 11', 'macOS 14']),
  login_status: rand() < 0.85 ? 1 : 0,
  message: '',
  login_time: `${dayOffset(-Math.floor(i / 2))} ${String(rint(8, 19)).padStart(2, '0')}:${String(rint(0, 59)).padStart(2, '0')}:00`
})).map((l) => (l.login_status === 0 ? { ...l, message: pick(['密码错误', '账号已锁定']) } : l))

export const operLogs = Array.from({ length: 16 }, (_, i) => ({
  id: i + 1,
  user_id: pick([2, 3, 4]),
  username: pick(['hr01', 'mgr01', 'fin01']),
  module: pick(['员工信息', '考勤管理', '薪资管理', '招聘管理', '系统设置']),
  oper_type: pick([1, 2, 3, 5, 7]),
  oper_desc: pick(['新增员工档案', '修改员工信息', '删除候选人', '导出员工列表', '审批请假申请', '锁定考勤月报']),
  request_method: pick(['POST', 'PUT', 'DELETE', 'GET']),
  request_url: pick(['/api/employees', '/api/leave-requests/1/approve', '/api/employees/export', '/api/attendance-months/lock']),
  oper_ip: `192.168.1.${rint(2, 250)}`,
  oper_status: rand() < 0.92 ? 1 : 0,
  error_msg: '',
  cost_time: rint(12, 480),
  oper_time: `${dayOffset(-Math.floor(i / 2))} ${String(rint(9, 18)).padStart(2, '0')}:${String(rint(0, 59)).padStart(2, '0')}:00`
})).map((l) => (l.oper_status === 0 ? { ...l, error_msg: '数据校验失败：工号已存在' } : l))
