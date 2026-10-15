import request from '@/utils/request'

/** 考核方案分页（F-08-01）：GET /api/performance-plans/page */
export function pagePerfPlans(params) {
  return request({ url: '/performance-plans/page', method: 'get', params })
}

/** 新增考核方案：POST /api/performance-plans */
export function createPerfPlan(data) {
  return request({ url: '/performance-plans', method: 'post', data })
}

/** 发布方案（进入评分中）：PUT /api/performance-plans/{id}/publish */
export function publishPerfPlan(id) {
  return request({ url: `/performance-plans/${id}/publish`, method: 'put' })
}

/** 考核记录分页（F-08-03 按数据范围过滤）：GET /api/performance-records/page */
export function pagePerfRecords(params) {
  return request({ url: '/performance-records/page', method: 'get', params })
}

/** 员工自评：PUT /api/performance-records/{id}/self-score */
export function submitSelfScore(id, data) {
  return request({ url: `/performance-records/${id}/self-score`, method: 'put', data })
}

/** 主管评分：PUT /api/performance-records/{id}/leader-score */
export function submitLeaderScore(id, data) {
  return request({ url: `/performance-records/${id}/leader-score`, method: 'put', data })
}

/** 员工结果确认/申诉（BR-08-01）：PUT /api/performance-records/{id}/confirm */
export function confirmPerfRecord(id, data) {
  return request({ url: `/performance-records/${id}/confirm`, method: 'put', data })
}
