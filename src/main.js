import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'
import { setupPermission } from './permission'
import '@/styles/index.scss'

const app = createApp(App)
const pinia = createPinia()

// 全局注册 Element Plus 图标（企业后台惯例，模板内 <component :is="icon"> 直接可用）
Object.entries(ElementPlusIconsVue).forEach(([name, component]) => {
  app.component(name, component)
})

app.use(pinia)
app.use(router)
app.use(ElementPlus, { locale: zhCn, size: 'default' })

// 路由守卫：令牌校验 + 动态路由注册 + 角色拦截
setupPermission(router)

// 全局错误兜底（NF-13：错误业务语义化，不暴露堆栈给用户）
app.config.errorHandler = (err, instance, info) => {
  if (import.meta.env.DEV) {
    console.error('[global errorHandler]', err && err.stack ? err.stack : err, '\ninfo:', info)
  }
  import('element-plus').then(({ ElMessage }) => {
    ElMessage.error(import.meta.env.DEV ? err?.message || '系统内部错误' : '系统开小差了，请稍后重试或联系管理员')
  })
}

app.mount('#app')
