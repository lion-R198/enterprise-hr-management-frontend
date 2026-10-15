import request from '@/utils/request'

/** 今日考勤状态（F-04-01）：GET /api/attendance/today */
export function getToday() {
  return request({ url: '/attendance/today', method: 'get' })
}

/** 上班打卡：POST /api/attendance/checkin */
export function checkin() {
  return request({ url: '/attendance/checkin', method: 'post' })
}

/** 下班打卡：POST /api/attendance/checkout */
export function checkout() {
  return request({ url: '/attendance/checkout', method: 'post' })
}

/** 我的打卡记录：GET /api/attendance/records */
export function pageAttendance(params) {
  return request({ url: '/attendance/records', method: 'get', params })
}

/** 请假分页（F-04-02）：GET /api/leave-requests/page */
export function pageLeaveRequests(params) {
  return request({ url: '/leave-requests/page', method: 'get', params })
}

/** 提交请假（BR-04-01 时间重叠校验在服务端）：POST /api/leave-requests */
export function createLeaveRequest(data) {
  return request({ url: '/leave-requests', method: 'post', data })
}

/** 请假审批（直属主管→人事 审批链）：PUT /api/leave-requests/{id}/approve */
export function approveLeaveRequest(id, data) {
  return request({ url: `/leave-requests/${id}/approve`, method: 'put', data })
}

/** 我的假期余额（BR-04-02）：GET /api/leave-balances/my */
export function getMyLeaveBalances() {
  return request({ url: '/leave-balances/my', method: 'get' })
}

/** 加班分页（F-04-03）：GET /api/overtime-requests/page */
export function pageOvertimeRequests(params) {
  return request({ url: '/overtime-requests/page', method: 'get', params })
}

/** 提交加班：POST /api/overtime-requests */
export function createOvertimeRequest(data) {
  return request({ url: '/overtime-requests', method: 'post', data })
}

/** 加班审批：PUT /api/overtime-requests/{id}/approve */
export function approveOvertimeRequest(id, data) {
  return request({ url: `/overtime-requests/${id}/approve`, method: 'put', data })
}

/** 出差分页（F-04-04）：GET /api/business-trips/page */
export function pageTrips(params) {
  return request({ url: '/business-trips/page', method: 'get', params })
}

/** 提交出差：POST /api/business-trips */
export function createTrip(data) {
  return request({ url: '/business-trips', method: 'post', data })
}

/** 出差审批：PUT /api/business-trips/{id}/approve */
export function approveTrip(id, data) {
  return request({ url: `/business-trips/${id}/approve`, method: 'put', data })
}

/** 考勤月报分页（F-04-06）：GET /api/attendance-months/page */
export function pageAttendanceMonths(params) {
  return request({ url: '/attendance-months/page', method: 'get', params })
}

/** 封账（BR-04-03 封账后禁改）：PUT /api/attendance-months/{id}/lock */
export function lockAttendanceMonth(id) {
  return request({ url: `/attendance-months/${id}/lock`, method: 'put' })
}
