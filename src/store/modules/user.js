import { defineStore } from 'pinia'
import { login as loginApi, getInfo as getInfoApi, logout as logoutApi } from '@/api/auth'
import { getToken, setToken, removeToken } from '@/utils/auth'

/**
 * 用户会话状态：令牌、用户信息、角色集合
 * 角色编码与 sys_role.role_code 同源：ROLE_ADMIN / ROLE_HR / ROLE_MANAGER / ROLE_FINANCE / ROLE_EMPLOYEE / ROLE_EXECUTIVE
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '',
    // 用户信息持久化，避免刷新后白屏等待
    userInfo: JSON.parse(localStorage.getItem('EHR_USER') || 'null') || {},
    roles: []
  }),
  getters: {
    userId: (s) => s.userInfo.id,
    employeeId: (s) => s.userInfo.employeeId,
    realName: (s) => s.userInfo.realName || s.userInfo.username || '',
    deptId: (s) => s.userInfo.deptId,
    isLogin: (s) => !!s.token
  },
  actions: {
    /** 登录：获取令牌并加载用户信息 */
    async login(form) {
      const data = await loginApi(form)
      this.token = data.token
      setToken(data.token)
      this.setUserInfo(data.user)
      return data
    },
    /** 拉取当前用户信息（页面刷新后由路由守卫调用） */
    async getInfo() {
      const user = await getInfoApi()
      this.setUserInfo(user)
      return user
    },
    setUserInfo(user) {
      this.userInfo = user || {}
      this.roles = (user && user.roles) || []
      localStorage.setItem('EHR_USER', JSON.stringify(this.userInfo))
    },
    /** 退出登录：通知后端注销 + 清理本地会话 */
    async logout() {
      try {
        await logoutApi()
      } catch (e) {
        // 后端注销失败不阻断本地登出
      }
      this.token = ''
      this.userInfo = {}
      this.roles = []
      removeToken()
      localStorage.removeItem('EHR_USER')
    }
  }
})
