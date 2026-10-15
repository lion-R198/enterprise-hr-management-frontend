<template>
  <div class="page-container">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">组织架构（F-03-01 / F-03-02 / F-03-04）</span>
        <el-button v-if="canEdit" type="primary" size="small" @click="openCreate(null)">新增部门</el-button>
      </div>
      <div class="panel-body">
        <el-table :data="tree" border row-key="id" :tree-props="{ children: 'children' }" default-expand-all>
          <el-table-column prop="name" label="部门名称" min-width="220" />
          <el-table-column prop="dept_code" label="编码" width="90"><template #default="{ row }"><span class="mono">{{ row.dept_code }}</span></template></el-table-column>
          <el-table-column label="类型" width="90"><template #default="{ row }"><el-tag size="small" :type="dictTag('deptType', row.dept_type)">{{ dictLabel('deptType', row.dept_type) }}</el-tag></template></el-table-column>
          <el-table-column prop="leader" label="负责人" width="90"><template #default="{ row }">{{ row.leader || '-' }}</template></el-table-column>
          <el-table-column label="编制占用（F-03-04）" width="180">
            <template #default="{ row }">
              <el-progress
                v-if="row.headcount_limit > 0"
                :percentage="Math.min(100, Math.round((row.employeeCount / row.headcount_limit) * 100))"
                :stroke-width="10"
                :color="(row.employeeCount / row.headcount_limit) > 0.9 ? '#c45656' : '#0e5fd8'"
              />
              <span v-else class="text-muted">不限</span>
            </template>
          </el-table-column>
          <el-table-column label="在职/编制" width="100">
            <template #default="{ row }"><span class="mono">{{ row.employeeCount }}/{{ row.headcount_limit || '∞' }}</span></template>
          </el-table-column>
          <el-table-column prop="phone" label="联系电话" width="130"><template #default="{ row }"><span class="mono">{{ row.phone || '-' }}</span></template></el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <template v-if="canEdit">
                <el-button size="small" link type="primary" @click="openCreate(row)">新增下级</el-button>
                <el-button size="small" link type="primary" @click="openEdit(row)">编辑</el-button>
                <el-button size="small" link type="danger" @click="onDelete(row)">删除</el-button>
              </template>
              <span v-else class="text-muted">只读</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="editVisible" :title="editTitle" width="480px">
      <el-form ref="editFormRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="部门编码" prop="deptCode"><el-input v-model="form.deptCode" :disabled="isEdit" class="mono" placeholder="如 D1011" /></el-form-item>
        <el-form-item label="部门名称" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="上级部门">
          <el-select v-model="form.parentId" clearable disabled style="width: 100%" />
        </el-form-item>
        <el-form-item label="组织类型">
          <el-select v-model="form.deptType" style="width: 100%">
            <el-option v-for="d in getDict('deptType')" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="编制上限"><el-input-number v-model="form.headcountLimit" :min="0" style="width: 100%" /></el-form-item>
        <el-form-item label="联系电话"><el-input v-model="form.phone" class="mono" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取 消</el-button>
        <el-button type="primary" @click="onSave">保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDeptTree, createDept, updateDept, deleteDept } from '@/api/dept'
import { getDict, dictLabel, dictTag } from '@/dict'
import { confirmAction } from '@/utils/request'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const canEdit = computed(() => userStore.roles.includes('ROLE_HR') || userStore.roles.includes('ROLE_ADMIN'))

const tree = ref([])
const editVisible = ref(false)
const isEdit = ref(false)
const currentParent = ref(null)
const editFormRef = ref()
const form = reactive({ deptCode: '', name: '', parentId: null, deptType: 3, headcountLimit: 0, phone: '' })
const rules = {
  deptCode: [{ required: true, message: '编码必填（BR-03-01）', trigger: 'blur' }],
  name: [{ required: true, message: '名称必填', trigger: 'blur' }]
}
const editTitle = computed(() => (isEdit.value ? `编辑部门：${form.name}` : currentParent.value ? `新增下级部门（上级：${currentParent.value.name}）` : '新增顶级部门'))

async function load() {
  tree.value = await getDeptTree()
}

function openCreate(parent) {
  isEdit.value = false
  currentParent.value = parent
  Object.assign(form, { deptCode: '', name: '', parentId: parent ? parent.id : null, deptType: 3, headcountLimit: 0, phone: '' })
  editVisible.value = true
}
function openEdit(row) {
  isEdit.value = true
  currentParent.value = null
  Object.assign(form, { id: row.id, deptCode: row.dept_code, name: row.name, parentId: row.parent_id, deptType: row.dept_type, headcountLimit: row.headcount_limit, phone: row.phone })
  editVisible.value = true
}

async function onSave() {
  await editFormRef.value.validate()
  if (isEdit.value) {
    await updateDept(form.id, form)
    ElMessage.success('保存成功')
  } else {
    await createDept(form)
    ElMessage.success('部门已创建')
  }
  editVisible.value = false
  load()
}

async function onDelete(row) {
  await confirmAction(`确认删除部门「${row.name}」？若部门下存在在职员工或下级部门将被拒绝（BR-03-02）。`, '删除确认')
  try {
    await deleteDept(row.id)
    ElMessage.success('已删除')
  } finally {
    load()
  }
}

onMounted(load)
</script>
