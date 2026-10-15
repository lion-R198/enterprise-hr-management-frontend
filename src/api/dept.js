import request from '@/utils/request'

/** 组织架构树（F-03-01）：GET /api/depts/tree */
export function getDeptTree() {
  return request({ url: '/depts/tree', method: 'get' })
}

/** 部门列表（扁平）：GET /api/depts */
export function getDepts() {
  return request({ url: '/depts', method: 'get' })
}

/** 新增部门（F-03-02）：POST /api/depts */
export function createDept(data) {
  return request({ url: '/depts', method: 'post', data })
}

/** 修改部门：PUT /api/depts/{id} */
export function updateDept(id, data) {
  return request({ url: `/depts/${id}`, method: 'put', data })
}

/** 删除部门（有在职员工时后端拒绝 BR-03-02）：DELETE /api/depts/{id} */
export function deleteDept(id) {
  return request({ url: `/depts/${id}`, method: 'delete' })
}

/** 岗位列表（F-03-03）：GET /api/positions */
export function getPositions(params) {
  return request({ url: '/positions', method: 'get', params })
}

/** 新增岗位：POST /api/positions */
export function createPosition(data) {
  return request({ url: '/positions', method: 'post', data })
}

/** 修改岗位：PUT /api/positions/{id} */
export function updatePosition(id, data) {
  return request({ url: `/positions/${id}`, method: 'put', data })
}
