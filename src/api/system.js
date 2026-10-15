import request from '@/utils/request'

// ---------------- 用户管理（F-09-01） ----------------
export function pageSysUsers(params) {
  return request({ url: '/sys/users/page', method: 'get', params })
}
export function createSysUser(data) {
  return request({ url: '/sys/users', method: 'post', data })
}
export function updateSysUser(id, data) {
  return request({ url: `/sys/users/${id}`, method: 'put', data })
}
export function resetSysUserPassword(id) {
  return request({ url: `/sys/users/${id}/password/reset`, method: 'put' })
}
export function deleteSysUser(id) {
  return request({ url: `/sys/users/${id}`, method: 'delete' })
}

// ---------------- 角色权限（F-09-02） ----------------
export function getRoles(params) {
  return request({ url: '/sys/roles', method: 'get', params })
}
export function createRole(data) {
  return request({ url: '/sys/roles', method: 'post', data })
}
export function updateRole(id, data) {
  return request({ url: `/sys/roles/${id}`, method: 'put', data })
}

// ---------------- 数据字典（F-09-04） ----------------
export function getDictTypes() {
  return request({ url: '/sys/dict-types', method: 'get' })
}
export function getDictItems(typeId) {
  return request({ url: `/sys/dict-types/${typeId}/items`, method: 'get' })
}

// ---------------- 参数配置（F-09-05） ----------------
export function getConfigs(params) {
  return request({ url: '/sys/configs', method: 'get', params })
}
export function updateConfig(id, data) {
  return request({ url: `/sys/configs/${id}`, method: 'put', data })
}

// ---------------- 日志审计（F-09-06） ----------------
export function pageLoginLogs(params) {
  return request({ url: '/sys/logs/login', method: 'get', params })
}
export function pageOperLogs(params) {
  return request({ url: '/sys/logs/oper', method: 'get', params })
}

// ---------------- 通知公告（F-01-03，管理端） ----------------
export function pageNotices(params) {
  return request({ url: '/notices/page', method: 'get', params })
}
export function createNotice(data) {
  return request({ url: '/notices', method: 'post', data })
}
export function publishNotice(id) {
  return request({ url: `/notices/${id}/publish`, method: 'put' })
}
export function offlineNotice(id) {
  return request({ url: `/notices/${id}/offline`, method: 'put' })
}
