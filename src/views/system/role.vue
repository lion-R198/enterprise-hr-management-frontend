<template>
  <div class="page-container">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">角色权限（F-09-02，数据范围决定行级权限 NF-07）</span>
        <el-button type="primary" size="small" @click="openCreate">新增角色</el-button>
      </div>
      <div class="panel-body">
        <el-table :data="list.records" border>
          <el-table-column prop="role_code" label="角色编码" width="160"><template #default="{ row }"><span class="mono">{{ row.role_code }}</span></template></el-table-column>
          <el-table-column prop="role_name" label="角色名称" width="110" />
          <el-table-column label="数据范围" width="130"><template #default="{ row }">{{ dictLabel('dataScope', row.data_scope) }}</template></el-table-column>
          <el-table-column prop="description" label="职责描述" min-width="240" show-overflow-tooltip />
          <el-table-column label="类型" width="90">
            <template #default="{ row }"><el-tag size="small" :type="row.role_type === 1 ? 'danger' : 'info'">{{ row.role_type === 1 ? '系统内置' : '自定义' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }"><el-tag size="small" :type="dictTag('commonStatus', row.status)">{{ dictLabel('commonStatus', row.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="primary" @click="openEdit(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="editVisible" :title="isCreate ? '新增角色' : '编辑角色'" width="480px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="角色编码" required><el-input v-model="form.roleCode" :disabled="!isCreate" class="mono" placeholder="如 ROLE_AUDIT" /></el-form-item>
        <el-form-item label="角色名称" required><el-input v-model="form.roleName" /></el-form-item>
        <el-form-item label="数据范围">
          <el-select v-model="form.dataScope" style="width: 100%">
            <el-option v-for="d in getDict('dataScope')" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取 消</el-button>
        <el-button type="primary" @click="onSave">保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getRoles, createRole, updateRole } from '@/api/system'
import { getDict, dictLabel, dictTag } from '@/dict'

const list = ref({ records: [], total: 0 })
const editVisible = ref(false)
const isCreate = ref(true)
const form = reactive({})

async function load() {
  list.value = await getRoles()
}
function openCreate() {
  isCreate.value = true
  Object.assign(form, { roleCode: '', roleName: '', dataScope: 4, description: '' })
  editVisible.value = true
}
function openEdit(row) {
  isCreate.value = false
  Object.assign(form, { id: row.id, roleCode: row.role_code, roleName: row.role_name, dataScope: row.data_scope, description: row.description })
  editVisible.value = true
}
async function onSave() {
  if (!form.roleCode || !form.roleName) return ElMessage.warning('编码与名称必填')
  if (isCreate.value) await createRole(form)
  else await updateRole(form.id, form)
  ElMessage.success('保存成功')
  editVisible.value = false
  load()
}

onMounted(load)
</script>
