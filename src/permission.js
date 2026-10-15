import { useUserStore } from '@/store/modules/user'
import { asyncRoutes } from '@/router/routes'
import { getToken } from '@/utils/auth'

/**
 * 路由守卫（RBAC 三层控制的第一层：菜单/路由权限）
 *  - 未登录：仅允许访问 /login，其余重定向登录页并记录来源
 *  - 已登录：首次进入时拉取用户信息 → 按 meta.roles 过滤动态路由并注册
 *  - meta.roles 为空数组：所有角色可见
 */
const WHITE_LIST = ['/login']

export function setupPermission(router) {
  router.beforeEach(async (to, from, next) => {
    document.title = `${to.meta?.title || ''} - 企业人事管理系统`.replace(/^ - /, '')
    const token = getToken()

    if (!token) {
      if (WHITE_LIST.includes(to.path)) return next()
      return next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }

    if (to.path === '/login') {
      // 已登录访问登录页 → 直接进首页
      return next('/')
    }

    const userStore = useUserStore()
    // 刷新后内存态丢失：重新拉取用户信息（fail-close，失败即登出）
    if (!userStore.roles.length) {
      try {
        await userStore.getInfo()
      } catch (e) {
        await userStore.logout()
        return next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
      }
      registerAsyncRoutes(router, userStore.roles)
      // replace 重新进入目标路由，确保动态路由已注册
      return next({ path: to.path, query: to.query, hash: to.hash, replace: true })
    }
    next()
  })
}

/** 递归过滤角色路由并注册（roles 为空数组 = 不限角色）；不可变过滤，不修改原路由表 */
export function registerAsyncRoutes(router, roles) {
  const filter = (routes) =>
    routes
      .filter((r) => {
        const need = r.meta?.roles
        return !need || need.length === 0 || need.some((code) => roles.includes(code))
      })
      .map((r) => (r.children ? { ...r, children: filter(r.children) } : r))
      .filter((r) => !r.children || r.children.length > 0)

  filter(asyncRoutes).forEach((r) => router.addRoute(r))
}
