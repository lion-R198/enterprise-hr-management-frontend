<template>
  <div class="app-layout">
    <aside class="app-sidebar" :class="{ collapsed: appStore.sidebarCollapsed }">
      <div class="brand">
        <span class="brand-mark">HR</span>
        <span v-if="!appStore.sidebarCollapsed" class="brand-name">企业人事管理系统</span>
      </div>
      <el-scrollbar class="sidebar-menu">
        <el-menu
          :default-active="route.path"
          :collapse="appStore.sidebarCollapsed"
          :collapse-transition="false"
          unique-opened
        >
          <template v-for="menu in menus" :key="menu.path">
            <!-- 含子菜单 -->
            <el-sub-menu v-if="menu.children && menu.children.length" :index="menu.path">
              <template #title>
                <el-icon><component :is="menu.icon || 'Menu'" /></el-icon>
                <span>{{ menu.title }}</span>
              </template>
              <el-menu-item
                v-for="child in menu.children"
                :key="child.path"
                :index="child.path"
                @click="router.push(child.path)"
              >
                {{ child.title }}
              </el-menu-item>
            </el-sub-menu>
            <!-- 单页菜单 -->
            <el-menu-item
              v-else
              :index="menu.path"
              @click="router.push(menu.path)"
            >
              <el-icon><component :is="menu.icon || 'Menu'" /></el-icon>
              <span>{{ menu.title }}</span>
            </el-menu-item>
          </template>
        </el-menu>
      </el-scrollbar>
      <div class="sidebar-footer mono">v1.0.0 · mock</div>
    </aside>

    <div class="app-main">
      <header class="app-header">
        <el-icon class="collapse-btn" @click="appStore.toggleSidebar()">
          <Expand v-if="appStore.sidebarCollapsed" />
          <Fold v-else />
        </el-icon>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item v-for="c in breadcrumbs" :key="c">{{ c }}</el-breadcrumb-item>
        </el-breadcrumb>
        <div class="header-right">
          <el-tag size="small" effect="plain" class="role-tag">{{ roleLabel }}</el-tag>
          <el-dropdown @command="onCommand">
            <span class="user-entry">
              <el-icon><UserFilled /></el-icon>
              {{ userStore.realName }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>
      <main class="app-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/store/modules/app'
import { useUserStore } from '@/store/modules/user'
import { asyncRoutes } from '@/router/routes'
import { dictLabel } from '@/dict'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

/** 按角色过滤异步路由生成菜单（与守卫同一套 meta.roles 矩阵） */
const menus = computed(() => {
  const roles = userStore.roles
  const normalize = (p) => ('/' + String(p).split('/').filter(Boolean).join('/'))
  const walk = (routes, basePath = '') => {
    const out = []
    for (const r of routes) {
      if (r.meta?.hidden) continue
      const need = r.meta?.roles
      if (need && need.length && !need.some((c) => roles.includes(c))) continue
      // 拼接完整路径：根容器（'/'）下的子路由直接提升为顶级路径
      const full = r.path.startsWith('/')
        ? normalize(r.path)
        : normalize(`${basePath === '/' ? '' : basePath}/${r.path}`) || '/'
      const item = { title: r.meta?.title, icon: r.meta?.icon, path: full }
      if (r.children && r.children.length) {
        const children = walk(r.children, full)
        if (!children.length) continue
        if (full === '/') {
          // 根布局容器的子路由（首页/通知公告）提升为一级菜单
          out.push(...children)
        } else if (children.length === 1 && !children[0].children) {
          // 仅一个可见子路由时上提为一级菜单，避免"套壳"子菜单
          out.push({ ...children[0], title: r.meta?.title || children[0].title, icon: r.meta?.icon || children[0].icon })
        } else {
          out.push({ ...item, children })
        }
      } else {
        // 叶子路由（无 children）本身即菜单项
        out.push(item)
      }
    }
    return out
  }
  // constantRoutes 不参与菜单；仅过滤 asyncRoutes
  return walk(asyncRoutes)
})

const isActive = (path) => route.path === path || route.path.startsWith(path + '/')
void isActive

const breadcrumbs = computed(() => {
  const parts = route.path.split('/').filter(Boolean)
  // 展示前两级标题（/employee/list → 员工信息 / 员工档案）
  return parts.length > 1 ? [parts[0], parts[1]].slice(0, 2) : []
})

const ROLE_NAMES = { ROLE_ADMIN: '系统管理员', ROLE_HR: '人事专员', ROLE_MANAGER: '部门主管', ROLE_FINANCE: '财务人员', ROLE_EMPLOYEE: '普通员工', ROLE_EXECUTIVE: '决策层' }
const roleLabel = computed(() => {
  const roles = userStore.roles || []
  return roles.map((r) => ROLE_NAMES[r] || r).join(' / ')
})

async function onCommand(cmd) {
  if (cmd === 'logout') {
    await userStore.logout()
    router.push('/login')
  }
}
</script>

<style lang="scss" scoped>
.app-layout { display: flex; height: 100%; }

.app-sidebar {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--ehr-sidebar-bg);
  transition: width 0.2s;

  &.collapsed { width: 64px; }

  .brand {
    height: 50px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    overflow: hidden;
    white-space: nowrap;

    .brand-mark {
      background: var(--ehr-primary);
      color: #fff;
      font-family: var(--ehr-mono);
      font-weight: 700;
      font-size: 14px;
      padding: 2px 6px;
      border-radius: 2px;
    }
    .brand-name { color: #e8eef4; font-weight: 600; font-size: 14px; }
  }

  .sidebar-menu { flex: 1; }
  .sidebar-footer {
    padding: 8px 14px;
    color: #5a6f82;
    font-size: 11px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
}

.app-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

.app-header {
  height: var(--ehr-header-height);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 2px solid var(--ehr-primary);
  position: relative;
  z-index: 5;

  .collapse-btn { font-size: 18px; cursor: pointer; color: #4a5768; }

  .header-right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 12px;

    .role-tag { font-family: var(--ehr-mono); }
    .user-entry {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      font-size: 13px;
      color: #24292f;
      outline: none;
    }
  }
}

.app-content { flex: 1; overflow: auto; }
</style>
