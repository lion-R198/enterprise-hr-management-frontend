<template>
  <div class="login-page">
    <!-- 左侧品牌区（硬核工业风） -->
    <div class="brand-side">
      <div class="brand-logo mono">HR-SYS</div>
      <h1 class="brand-title">企业人事管理系统</h1>
      <p class="brand-sub">ENTERPRISE HR MANAGEMENT PLATFORM</p>
      <ul class="brand-points mono">
        <li>// 员工全生命周期管理</li>
        <li>// 考勤 · 薪资 · 绩效 · 招聘一体化</li>
        <li>// RBAC 分级授权 · 数据可追溯</li>
      </ul>
    </div>

    <!-- 右侧登录表单 -->
    <div class="form-side">
      <div class="login-box">
        <h2 class="login-title">账号登录</h2>
        <el-form ref="formRef" :model="form" :rules="rules" size="large" @keyup.enter="onLogin">
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="登录账号" :prefix-icon="User" clearable />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="密码" :prefix-icon="Lock" show-password />
          </el-form-item>
          <el-button class="login-btn" type="primary" size="large" :loading="loading" @click="onLogin">
            {{ loading ? '正在验证…' : '登 录' }}
          </el-button>
        </el-form>

        <el-divider><span class="demo-tip">演示账号（点击填充，密码 123456）</span></el-divider>
        <div class="demo-accounts">
          <div
            v-for="acc in settings.demoAccounts"
            :key="acc.username"
            class="demo-item"
            @click="fill(acc)"
          >
            <span class="mono">{{ acc.username }}</span>
            <span class="demo-label">{{ acc.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import settings from '@/settings'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)

const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

function fill(acc) {
  form.username = acc.username
  form.password = acc.password
}

async function onLogin() {
  await formRef.value.validate()
  loading.value = true
  try {
    await userStore.login({ ...form })
    ElMessage.success('登录成功')
    router.push(route.query.redirect ? decodeURIComponent(route.query.redirect) : '/')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  display: flex;
  height: 100%;
  background: #0f1820;
}

.brand-side {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 8%;
  background:
    linear-gradient(135deg, rgba(14, 95, 216, 0.18), rgba(15, 24, 32, 0) 55%),
    repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(255, 255, 255, 0.03) 48px),
    repeating-linear-gradient(90deg, transparent, transparent 47px, rgba(255, 255, 255, 0.03) 48px),
    #101b26;

  .brand-logo {
    display: inline-block;
    width: fit-content;
    color: #fff;
    background: var(--ehr-primary);
    font-weight: 700;
    padding: 4px 12px;
    letter-spacing: 2px;
    margin-bottom: 28px;
    border-left: 4px solid #c9a227;
  }
  .brand-title { color: #f2f6fa; font-size: 34px; margin: 0 0 8px; letter-spacing: 4px; }
  .brand-sub { color: #5f7d96; font-family: var(--ehr-mono); letter-spacing: 3px; margin: 0 0 40px; }
  .brand-points {
    list-style: none;
    padding: 0;
    margin: 0;
    color: #7d97ad;
    font-size: 13px;
    line-height: 2.2;
  }
}

.form-side {
  width: 480px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}

.login-box {
  width: 360px;
  background: #fff;
  border: 1px solid var(--ehr-border);
  border-top: 3px solid var(--ehr-primary);
  padding: 32px 32px 24px;

  .login-title { font-size: 18px; margin: 0 0 22px; color: #1f2d3d; }
  .login-btn { width: 100%; margin-top: 4px; letter-spacing: 6px; }

  .demo-tip { font-size: 12px; color: #8a94a0; }
  .demo-accounts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .demo-item {
    flex: 1 1 30%;
    border: 1px solid var(--ehr-border);
    padding: 6px 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    font-size: 12px;
    transition: all 0.15s;

    .mono { color: var(--ehr-primary); font-weight: 600; }
    .demo-label { color: #6b7684; }
    &:hover { border-color: var(--ehr-primary); background: #f2f7ff; }
  }
}
</style>
