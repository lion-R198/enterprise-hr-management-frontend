import request from '@/utils/request'

/** 员工分页+多条件查询（F-02-06）：GET /api/employees/page */
export function pageEmployees(params) {
  return request({ url: '/employees/page', method: 'get', params })
}

/** 员工详情：GET /api/employees/{id} */
export function getEmployee(id) {
  return request({ url: `/employees/${id}`, method: 'get' })
}

/** 新增员工/入职办理（F-02-02）：POST /api/employees */
export function createEmployee(data) {
  return request({ url: '/employees', method: 'post', data })
}

/** 修改员工：PUT /api/employees/{id} */
export function updateEmployee(id, data) {
  return request({ url: `/employees/${id}`, method: 'put', data })
}

/** 删除员工（逻辑删除 BR-02-03）：DELETE /api/employees/{id} */
export function deleteEmployee(id) {
  return request({ url: `/employees/${id}`, method: 'delete' })
}

/** 状态变更（离职/转正 BR-02-04）：PUT /api/employees/{id}/status */
export function changeEmployeeStatus(id, data) {
  return request({ url: `/employees/${id}/status`, method: 'put', data })
}

/** 异动记录（F-02-03）：GET /api/employees/{id}/changes */
export function getEmployeeChanges(id) {
  return request({ url: `/employees/${id}/changes`, method: 'get' })
}

/** 办理异动（调岗/调部门/晋升）：POST /api/employee-changes */
export function createChange(data) {
  return request({ url: '/employee-changes', method: 'post', data })
}

/** 异动分页：GET /api/employee-changes/page */
export function pageChanges(params) {
  return request({ url: '/employee-changes/page', method: 'get', params })
}

/** 合同列表（F-02-05）：GET /api/employee-contracts/page */
export function pageContracts(params) {
  return request({ url: '/employee-contracts/page', method: 'get', params })
}

/** 签订/续签合同：POST /api/employee-contracts */
export function createContract(data) {
  return request({ url: '/employee-contracts', method: 'post', data })
}
