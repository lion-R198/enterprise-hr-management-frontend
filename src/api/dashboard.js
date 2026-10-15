import request from '@/utils/request'

/** 首页指标卡（按角色数据范围过滤 BR-01-01）：GET /api/dashboard/summary */
export function getSummary() {
  return request({ url: '/dashboard/summary', method: 'get' })
}

/** 待办事项（F-01-02）：GET /api/dashboard/todos */
export function getTodos() {
  return request({ url: '/dashboard/todos', method: 'get' })
}

/** 通知公告（F-01-03）：GET /api/dashboard/notices */
export function getNotices() {
  return request({ url: '/dashboard/notices', method: 'get' })
}

/** 图表分析（F-01-04）：GET /api/dashboard/charts */
export function getCharts() {
  return request({ url: '/dashboard/charts', method: 'get' })
}

/** 处理待办：PUT /api/dashboard/todos/{id}/handle */
export function handleTodo(id, data) {
  return request({ url: `/dashboard/todos/${id}/handle`, method: 'put', data })
}
