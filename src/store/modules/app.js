import { defineStore } from 'pinia'

/** 应用全局 UI 状态 */
export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: false
  }),
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    }
  }
})
