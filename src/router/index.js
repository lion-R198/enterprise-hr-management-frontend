import { createRouter, createWebHistory } from 'vue-router'
import { constantRoutes } from './routes'

/**
 * 路由实例：仅包含静态常量路由；角色路由由 permission.js 按需注册。
 * 路由表定义见 ./routes.js（独立模块，避免与 Layout 循环依赖）。
 */
const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  scrollBehavior: () => ({ top: 0 })
})

export function resetRouter() {
  // 先快照当前全部路由，再移除动态注册的部分，防止遍历中修改集合
  const current = router.getRoutes().map((r) => ({ path: r.path, name: r.name }))
  current.forEach(({ path, name }) => {
    const isConstant = constantRoutes.some((c) => c.path === path)
    if (!isConstant) router.removeRoute(name || path)
  })
}

export default router
