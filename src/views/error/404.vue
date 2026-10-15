<template>
  <div class="page-container">
    <div class="panel" style="padding: 80px 0; text-align: center">
      <h1 class="mono" style="font-size: 72px; margin: 0; color: var(--ehr-primary)">404</h1>
      <p style="color: #6b7684">页面不存在或已被移除</p>
      <el-button type="primary" @click="$router.replace('/dashboard')">返回首页</el-button>
    </div>
  </div>
</template>
