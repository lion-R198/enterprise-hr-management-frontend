<template>
  <div class="page-container">
    <div class="panel">
      <div class="panel-header"><span class="panel-title">参数配置（F-09-05，业务规则可配置 NF-18）</span></div>
      <div class="panel-body">
        <el-table :data="list.records" border>
          <el-table-column prop="config_key" label="参数键" width="220"><template #default="{ row }"><span class="mono">{{ row.config_key }}</span></template></el-table-column>
          <el-table-column prop="config_name" label="参数名称" width="160" />
          <el-table-column prop="config_value" label="参数值" width="140"><template #default="{ row }"><span class="mono" style="color: var(--ehr-primary); font-weight: 600">{{ row.config_value }}</span></template></el-table-column>
          <el-table-column prop="config_group" label="分组" width="100"><template #default="{ row }"><el-tag size="small" effect="plain">{{ row.config_group }}</el-tag></template></el-table-column>
          <el-table-column label="系统内置" width="90" align="center">
            <template #default="{ row }"><el-tag v-if="row.is_system" size="small" type="danger">内置</el-tag><span v-else>-</span></template>
          </el-table-column>
          <el-table-column prop="remark" label="说明" min-width="220" show-overflow-tooltip />
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="primary" @click="openEdit(row)">修改</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="editVisible" :title="`修改参数：${current?.config_name}`" width="440px">
      <el-form label-width="90px">
        <el-form-item label="参数键"><span class="mono">{{ current?.config_key }}</span></el-form-item>
        <el-form-item label="参数值" required><el-input v-model="editValue" class="mono" /></el-form-item>
        <el-form-item label="说明"><span class="text-muted">{{ current?.remark }}</span></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取 消</el-button>
        <el-button type="primary" @click="onSave">保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getConfigs, updateConfig } from '@/api/system'

const list = ref({ records: [], total: 0 })
const editVisible = ref(false)
const current = ref(null)
const editValue = ref('')

async function load() {
  list.value = await getConfigs()
}
function openEdit(row) {
  current.value = row
  editValue.value = row.config_value
  editVisible.value = true
}
async function onSave() {
  await updateConfig(current.value.id, { configValue: editValue.value })
  ElMessage.success('参数已更新，业务规则即时生效')
  editVisible.value = false
  load()
}
load()
</script>
