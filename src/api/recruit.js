import request from '@/utils/request'

/** 招聘需求分页（F-06-01）：GET /api/recruit-requests/page */
export function pageRecruitRequests(params) {
  return request({ url: '/recruit-requests/page', method: 'get', params })
}

/** 提报招聘需求（主管提报 BR-06-02）：POST /api/recruit-requests */
export function createRecruitRequest(data) {
  return request({ url: '/recruit-requests', method: 'post', data })
}

/** 需求审批：PUT /api/recruit-requests/{id}/approve */
export function approveRecruitRequest(id, data) {
  return request({ url: `/recruit-requests/${id}/approve`, method: 'put', data })
}

/** 候选人分页（F-06-03）：GET /api/candidates/page */
export function pageCandidates(params) {
  return request({ url: '/candidates/page', method: 'get', params })
}

/** 录入候选人：POST /api/candidates */
export function createCandidate(data) {
  return request({ url: '/candidates', method: 'post', data })
}

/** 推进候选人阶段（BR-06-01 状态流转）：PUT /api/candidates/{id}/stage */
export function changeCandidateStage(id, data) {
  return request({ url: `/candidates/${id}/stage`, method: 'put', data })
}

/** 面试记录列表（F-06-04）：GET /api/interview-records */
export function getInterviewRecords(params) {
  return request({ url: '/interview-records', method: 'get', params })
}

/** 安排面试/录入评价：POST /api/interview-records */
export function createInterviewRecord(data) {
  return request({ url: '/interview-records', method: 'post', data })
}

/** Offer 列表（F-06-05）：GET /api/offers/page */
export function pageOffers(params) {
  return request({ url: '/offers/page', method: 'get', params })
}

/** 发送 Offer：PUT /api/offers/{id}/send */
export function sendOffer(id) {
  return request({ url: `/offers/${id}/send`, method: 'put' })
}

/** 确认 Offer 结果：PUT /api/offers/{id}/status */
export function changeOfferStatus(id, data) {
  return request({ url: `/offers/${id}/status`, method: 'put', data })
}
