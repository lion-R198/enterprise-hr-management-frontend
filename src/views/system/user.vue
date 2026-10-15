<template>
  <div class="page-container">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">用户管理（F-09-01）</span>
        <el-button type="primary" size="small" @click="openCreate">新增账号</el-button>
      </div>
      <div class="panel-body">
        <el-form inline>
          <el-form-item label="关键字">
            <el-input v-model="query.keyword" placeholder="账号/姓名" clearable style="width: 180px" @keyup.enter="search" />
          </el-form-item>
          <el-form-item><el-button type="primary" @click="search">查 询</el-button></el-form-item>
        </el-form>
        <el-table :data="list.records" border size="small">
          <el-table-column prop="username" label="登录账号" width="100"><template #default="{ row }"><span class="mono">{{ row.username }}</span></template></el-table-column>
          <el-table-column prop="real_name" label="姓名" width="90" />
          <el-table-column prop="role_names" label="角色" min-width="140" />
          <el-table-column prop="dept_name" label="部门" min-width="110" />
          <el-table-column prop="last_login_time" label="最后登录" width="160"><template #default="{ row }"><span class="mono">{{ row.last_login_time || '-' }}</span></template></el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }"><el-tag size="small" :type="dictTag('userStatus', row.status)">{{ dictLabel('userStatus', row.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="210" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button size="small" link type="warning" @click="onReset(row)">重置密码</el-button>
              <el-button v-if="row.status === 1" size="small" link type="danger" @click="onToggle(row, 0)">停用</el-button>
              <el-button v-else-if="row.status === 0" size="small" link type="success" @click="onToggle(row, 1)">启用</el-button>
              <el-button v-if="!row.roles?.includes('ROLE_ADMIN')" size="small" link type="danger" @click="onDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="query.current" class="pager" background layout="total, prev, pager, next" :total="list.total" :page-size="query.size" @current-change="load" />
      </div>
    </div>

    <el-dialog v-model="editVisible" :title="isCreate ? '新增账号（初始密码不少于 8 位 BR-09-01）' : '编辑账号'" width="480px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="登录账号" required><el-input v-model="form.username" :disabled="!isCreate" class="mono" /></el-form-item>
        <el-form-item label="姓名" required><el-input v-model="form.realName" /></el-form-item>
        <el-form-item v-if="isCreate" label="初始密码"><el-input v-model="form.password" class="mono" placeholder="≥8 位" /></el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="form.roles" multiple style="width: 100%">
            <el-option v-for="r in roleList" :key="r.role_code" :label="r.role_name" :value="r.role_code" />
          </el-select>
        </el-form-item>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { pageSysUsers, createSysUser, updateSysUser, resetSysUserPassword, deleteSysUser, getRoles } from '@/api/system'
import { dictLabel, dictTag } from '@/dict'

const query = reactive({ current: 1, size: 10, keyword: '' })
const list = ref({ records: [], total: 0 })
const roleList = ref([])
const editVisible = ref(false)
const isCreate = ref(true)
const form = reactive({})

async function load() {
  list.value = await pageSysUsers(query)
}
function search() {
  query.current = 1
  load()
}

function openCreate() {
  isCreate.value = true
  Object.assign(form, { username: '', realName: '', password: '', roles: ['ROLE_EMPLOYEE'] })
  editVisible.value = true
}
function openEdit(row) {
  isCreate.value = false
  Object.assign(form, { id: row.id, username: row.username, realName: row.real_name, roles: [...(row.roles || [])] })
  editVisible.value = true
}
async function onSave() {
  if (!form.username || !form.realName) return ElMessage.warning('账号与姓名必填')
  if (isCreate.value) {
    await createSysUser(form)
    ElMessage.success('账号已创建')
  } else {
    await updateSysUser(form.id, form)
    ElMessage.success('保存成功')
  }
  editVisible.value = false
  load()
}
async function onReset(row) {
  await ElMessageBox.confirm(`确认重置 ${row.username} 的密码？重置后为初始密码 Init@2026。`, '重置确认')
  await resetSysUserPassword(row.id)
  ElMessage.success('密码已重置为 Init@2026')
}
async function onToggle(row, status) {
  try {
    await updateSysUser(row.id, { status })
    ElMessage.success(status === 1 ? '已启用' : '已停用')
  } finally {
    load()
  }
}
async function onDelete(row) {
  await ElMessageBox.confirm(`确认删除账号 ${row.username}？管理员账号受保护不可删除（BR-09-02）。`, '删除确认')
  await deleteSysUser(row.id)
  ElMessage.success('已删除')
  load()
}

onMounted(async () => {
  load()
  roleList.value = (await getRoles()).records
})
</script>

<style scoped>
.pager { margin-top: 12px; justify-content: flex-end; }
</style>
