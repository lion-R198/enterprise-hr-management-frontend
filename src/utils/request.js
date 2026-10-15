import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getToken, removeToken } from '@/utils/auth'
import router from '@/router'

/**
 * 统一请求入口（单一通道：真实后端 API）
 *
 * 前后端联调约束：前端所有请求必须调用后端接口，不允许由本地 mock 数据返回。
 * 因此本文件不再保留 mock 分支 —— 请求一律经 axios 实例打到 BASE_API，
 * 由 vite dev server 的 /api 代理转发到后端。
 * 该约束是结构性的：即使有人把 VITE_USE_MOCK 重新置为 true，也不会再走本地数据。
 *
 * 统一响应契约（后端统一结果处理）：{ code, message, data }
 *  - code === 200：resolve(data)
 *  - 其他 code：弹出后端 message 并 reject
 *  - 401：清除令牌并跳转登录
 *
 * 统一异常契约（与后端 GlobalExceptionHandler 对应）：
 * 后端保证「HTTP 状态码 === 业务 code」（400/401/403/404/409/500）。
 * 该约定带来一个必须处理的后果：axios 会把所有非 2xx 响应直接丢进错误分支，
 * 因此错误分支必须从 error.response.data 里取后端 message，
 * 否则用户只会看到 "Request failed with status code 400" 这类无意义的英文提示。
 */
const BASE_API = import.meta.env.VITE_BASE_API || '/api'

/** 后端统一响应体 */
const CODE_SUCCESS = 200
const CODE_UNAUTHORIZED = 401

// ---------------- axios 实例（真实 API 通道） ----------------
const service = axios.create({
  baseURL: BASE_API,
  timeout: 15000
})

service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

/**
 * 构造带业务 code 的错误对象。
 *
 * 保留 code 是为了让调用方可以按业务错误码分支处理（例如 409 冲突时提示"刷新后重试"），
 * 而不仅仅是弹一条提示。
 */
function toBizError(code, message, fallback) {
  const err = new Error(message || fallback || '请求失败')
  err.code = code
  err.bizMessage = message || null
  return err
}

/** 401 统一处理：清理令牌并回登录页（已在登录页则不重复跳转，避免死循环） */
function handleUnauthorized(message) {
  removeToken()
  if (router.currentRoute.value?.path !== '/login') {
    router.push('/login')
  }
  ElMessage.error(message || '登录状态已失效，请重新登录')
}

service.interceptors.response.use(
  (response) => {
    const res = response.data
    // 容错：非标准响应体（网关直出、文件流、纯文本）直接返回原始数据，
    // 不做 code 判断，避免把正常响应误判为失败
    if (res === null || typeof res !== 'object' || res.code === undefined) {
      return res
    }
    if (res.code !== CODE_SUCCESS) {
      if (res.code === CODE_UNAUTHORIZED) {
        handleUnauthorized(res.message)
      } else {
        ElMessage.error(res.message || '请求失败')
      }
      return Promise.reject(toBizError(res.code, res.message))
    }
    return res.data
  },
  (error) => {
    const status = error.response?.status
    const body = error.response?.data
    // 后端异常同样走 {code, message, data} 三段式，优先取其中的中文 message
    const bizMessage = body && typeof body === 'object' ? body.message : null

    if (status === CODE_UNAUTHORIZED) {
      handleUnauthorized(bizMessage)
    } else if (status === 403) {
      ElMessage.error(bizMessage || '没有操作权限')
    } else if (bizMessage) {
      ElMessage.error(bizMessage)
    } else if (!error.response) {
      ElMessage.error('网络异常，请确认后端服务已启动')
    } else {
      ElMessage.error(error.message || '请求失败')
    }
    return Promise.reject(toBizError(status, bizMessage, error.message))
  }
)

/**
 * 统一请求函数
 * @param {{ url:string, method?:string, params?:object, data?:object }} config
 * @returns {Promise<any>} 已解包的 data（契约中的 data 段）
 */
export function request(config) {
  const cfg = { method: 'get', ...config }
  // url 保持相对路径，由 axios baseURL 拼接；
  // 若在此处再拼一次 /api，会得到 /api/api/xxx 从而导致全部 404
  return service(cfg)
}

// ---------------- 业务消息确认（删除类操作二次确认，NF-12） ----------------
export function confirmAction(message, title = '操作确认') {
  return ElMessageBox.confirm(message, title, {
    confirmButtonText: '确 定',
    cancelButtonText: '取 消',
    type: 'warning'
  })
}

export default request
