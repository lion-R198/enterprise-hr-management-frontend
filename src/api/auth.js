import request from '@/utils/request'

/** 登录：POST /api/auth/login */
export function login(data) {
  return request({ url: '/auth/login', method: 'post', data })
}

/** 当前用户信息：GET /api/auth/me */
export function getInfo() {
  return request({ url: '/auth/me', method: 'get' })
}

/** 退出登录：POST /api/auth/logout */
export function logout() {
  return request({ url: '/auth/logout', method: 'post' })
}
