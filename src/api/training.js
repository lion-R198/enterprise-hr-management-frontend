import request from '@/utils/request'

/** 培训计划分页（F-07-01）：GET /api/training-plans/page */
export function pageTrainingPlans(params) {
  return request({ url: '/training-plans/page', method: 'get', params })
}

/** 新增培训计划：POST /api/training-plans */
export function createTrainingPlan(data) {
  return request({ url: '/training-plans', method: 'post', data })
}

/** 报名（BR-07-01 满员自动关闭）：POST /api/training-plans/{id}/enroll */
export function enrollTraining(id) {
  return request({ url: `/training-plans/${id}/enroll`, method: 'post' })
}

/** 我的培训档案（F-07-06 员工自助查看）：GET /api/training/my */
export function getMyTraining() {
  return request({ url: '/training/my', method: 'get' })
}
