<template>
  <div class="page-container">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">岗位管理（F-03-03）</span>
        <el-button v-if="canEdit" type="primary" size="small" @click="openCreate">新增岗位</el-button>
      </div>
      <div class="panel-body">
        <el-form inline>
          <el-form-item label="所属部门">
            <el-select v-model="query.deptId" clearable style="width: 180px">
              <el-option v-for="d in depts" :key="d.id" :label="d.name" :value="d.id" />
            </el-select>
          </el-form-item>
          <el-form-item><el-button type="primary" @click="load">查 询</el-button></el-form-item>
        </el-form>
        <el-table :data="list.records" border>
          <el-table-column prop="position_code" label="岗位编码" width="110"><template #default="{ row }"><span class="mono">{{ row.position_code }}</span></template></el-table-column>
          <el-table-column prop="position_name" label="岗位名称" min-width="150" />
          <el-table-column label="岗位序列" width="110"><template #default="{ row }">{{ dictLabel('positionSeq', row.position_seq) }}</template></el-table-column>
          <el-table-column prop="job_level" label="职级范围" width="90"><template #default="{ row }"><span class="mono">{{ row.job_level || '-' }}</span></template></el-table-column>
          <el-table-column prop="dept_name" label="所属部门" min-width="120" />
          <el-table-column label="在岗/编制" width="100"><template #default="{ row }"><span class="mono">{{ row.employeeCount }}/{{ row.headcount_limit || '∞' }}</span></template></el-table-column>
          <el-table-column label="操作" width="90" fixed="right">
            <template #default="{ row }">
              <el-button v-if="canEdit" size="small" link type="primary" @click="openEdit(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="query.current" class="pager" background layout="total, prev, pager, next" :total="list.total" :page-size="query.size" @current-change="load" />
      </div>
    </div>

    <el-dialog v-model="editVisible" :title="isEdit ? '编辑岗位' : '新增岗位'" width="480px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="岗位编码" required><el-input v-model="form.positionCode" :disabled="isEdit" class="mono" /></el-form-item>
        <el-form-item label="岗位名称" required><el-input v-model="form.positionName" /></el-form-item>
        <el-form-item label="岗位序列">
          <el-select v-model="form.positionSeq" style="width: 100%">
            <el-option v-for="d in getDict('positionSeq')" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="职级范围"><el-input v-model="form.jobLevel" placeholder="如 P4-P7" class="mono" /></el-form-item>
        <el-form-item label="编制上限"><el-input-number v-model="form.headcountLimit" :min="0" style="width: 100%" /></el-form-item>
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
import { ElMessage } from 'element-plus'
import { getDepts, getPositions, createPosition, updatePosition } from '@/api/dept'
import { getDict, dictLabel } from '@/dict'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const canEdit = computed(() => userStore.roles.includes('ROLE_HR') || userStore.roles.includes('ROLE_ADMIN'))
const query = reactive({ current: 1, size: 20, deptId: null })
const list = ref({ records: [], total: 0 })
const depts = ref([])
const editVisible = ref(false)
const isEdit = ref(false)
const form = reactive({})

async function load() {
  list.value = await getPositions(query)
}
function openCreate() {
  isEdit.value = false
  Object.assign(form, { positionCode: '', positionName: '', positionSeq: 2, jobLevel: '', headcountLimit: 0 })
  editVisible.value = true
}
function openEdit(row) {
  isEdit.value = true
  Object.assign(form, row)
  editVisible.value = true
}
async function onSave() {
  if (!form.positionCode || !form.positionName) return ElMessage.warning('编码与名称为必填')
  if (isEdit.value) await updatePosition(form.id, form)
  else await createPosition(form)
  ElMessage.success('保存成功')
  editVisible.value = false
  load()
}

onMounted(async () => {
  load()
  depts.value = await getDepts()
})
</script>

<style scoped>
.pager { margin-top: 12px; justify-content: flex-end; }
</style>
