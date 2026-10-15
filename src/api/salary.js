import request from '@/utils/request'

/** 薪资标准分页（F-05-01）：GET /api/salary-standards/page */
export function pageSalaryStandards(params) {
  return request({ url: '/salary-standards/page', method: 'get', params })
}

/** 新增薪资标准：POST /api/salary-standards */
export function createSalaryStandard(data) {
  return request({ url: '/salary-standards', method: 'post', data })
}

/** 薪资核算记录分页（F-05-02）：GET /api/salary-records/page */
export function pageSalaryRecords(params) {
  return request({ url: '/salary-records/page', method: 'get', params })
}

/** 发起月度核算（BR-05-02 考勤未封账禁止核算）：POST /api/salary-records/calculate */
export function calculateSalary(data) {
  return request({ url: '/salary-records/calculate', method: 'post', data })
}

/** 复核（BR-05-03 复核人≠核算人）：PUT /api/salary-records/{id}/review */
export function reviewSalaryRecord(id) {
  return request({ url: `/salary-records/${id}/review`, method: 'put' })
}

/** 发放（F-05-03）：PUT /api/salary-records/{id}/pay */
export function paySalaryRecord(id, data) {
  return request({ url: `/salary-records/${id}/pay`, method: 'put', data })
}

/** 我的薪资条（F-05-06）：GET /api/salary/payslips/my */
export function getMyPayslips() {
  return request({ url: '/salary/payslips/my', method: 'get' })
}

/** 薪资条明细（salary_item）：GET /api/salary/payslips/{recordId}/items */
export function getPayslipItems(recordId) {
  return request({ url: `/salary/payslips/${recordId}/items`, method: 'get' })
}
