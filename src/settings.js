/**
 * 系统级常量配置（纯前端 UI 配置，允许保留在前端）
 */
export default {
  title: '企业人事管理系统',
  // 演示账号（仅 mock 通道使用，对接真实后端后由账号体系下发）
  demoAccounts: [
    { username: 'admin', password: '123456', label: '系统管理员', role: 'ROLE_ADMIN' },
    { username: 'hr01', password: '123456', label: '人事专员', role: 'ROLE_HR' },
    { username: 'mgr01', password: '123456', label: '部门主管', role: 'ROLE_MANAGER' },
    { username: 'fin01', password: '123456', label: '财务人员', role: 'ROLE_FINANCE' },
    { username: 'emp01', password: '123456', label: '普通员工', role: 'ROLE_EMPLOYEE' }
  ],
  // 合同到期预警天数（与 sys_config 同步的展示层兜底值）
  contractWarnDays: [30, 60]
}
