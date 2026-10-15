/**
 * 令牌管理（token 存取）
 * 令牌由登录接口下发，持久化于 localStorage，请求层统一附加 Authorization 头。
 */
const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || 'EHR_TOKEN'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}
