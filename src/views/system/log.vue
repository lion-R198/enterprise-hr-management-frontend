<template>
  <div class="page-container">
    <div class="panel">
      <div class="panel-header"><span class="panel-title">日志审计（F-09-06，登录/操作全量留痕 NF-09）</span></div>
      <div class="panel-body">
        <el-tabs v-model="tab" @tab-change="load">
          <el-tab-pane label="登录日志" name="login" />
          <el-tab-pane label="操作日志" name="oper" />
        </el-tabs>

        <!-- 登录日志 -->
        <el-table v-if="tab === 'login'" :data="loginList.records" border size="small">
          <el-table-column prop="login_time" label="登录时间" width="160"><template #default="{ row }"><span class="mono">{{ row.login_time }}</span></template></el-table-column>
          <el-table-column prop="username" label="账号" width="100"><template #default="{ row }"><span class="mono">{{ row.username }}</span></template></el-table-column>
          <el-table-column prop="login_ip" label="IP" width="130"><template #default="{ row }"><span class="mono">{{ row.login_ip }}</span></template></el-table-column>
          <el-table-column prop="browser" label="浏览器" width="110" />
          <el-table-column prop="os" label="操作系统" width="110" />
          <el-table-column label="结果" width="80">
            <template #default="{ row }"><el-tag size="small" :type="dictTag('loginStatus', row.login_status)">{{ dictLabel('loginStatus', row.login_status) }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="message" label="信息" min-width="120" />
        </el-table>

        <!-- 操作日志 -->
        <el-table v-else :data="operList.records" border size="small">
          <el-table-column prop="oper_time" label="操作时间" width="160"><template #default="{ row }"><span class="mono">{{ row.oper_time }}</span></template></el-table-column>
          <el-table-column prop="username" label="操作人" width="90"><template #default="{ row }"><span class="mono">{{ row.username }}</span></template></el-table-column>
          <el-table-column prop="module" label="模块" width="100" />
          <el-table-column label="类型" width="80">
            <template #default="{ row }"><el-tag size="small" :type="dictTag('operType', row.oper_type)">{{ dictLabel('operType', row.oper_type) }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="oper_desc" label="描述" min-width="150" />
          <el-table-column prop="request_url" label="请求地址" min-width="180"><template #default="{ row }"><span class="mono">{{ row.request_url }}</span></template></el-table-column>
          <el-table-column prop="cost_time" label="耗时(ms)" width="85" align="center"><template #default="{ row }"><span class="mono">{{ row.cost_time }}</span></template></el-table-column>
          <el-table-column label="结果" width="70">
            <template #default="{ row }"><el-tag size="small" :type="row.oper_status ? 'success' : 'danger'">{{ row.oper_status ? '成功' : '失败' }}</el-tag></template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { pageLoginLogs, pageOperLogs } from '@/api/system'
import { dictLabel, dictTag } from '@/dict'

const tab = ref('login')
const loginList = ref({ records: [], total: 0 })
const operList = ref({ records: [], total: 0 })

async function load() {
  if (tab.value === 'login') loginList.value = await pageLoginLogs({ current: 1, size: 20 })
  else operList.value = await pageOperLogs({ current: 1, size: 20 })
}
load()
</script>
