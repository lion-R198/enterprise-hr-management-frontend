<template>
  <div class="page-container">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">员工档案（F-02-01 / F-02-06）</span>
        <el-button v-if="canEdit" type="primary" size="small" @click="openCreate">入职办理</el-button>
      </div>
      <div class="panel-body">
        <!-- 查询区 -->
        <el-form inline class="search-form">
          <el-form-item label="关键字">
            <el-input v-model="query.keyword" placeholder="姓名 / 工号 / 手机号" clearable style="width: 200px" @keyup.enter="search" />
          </el-form-item>
          <el-form-item label="部门">
            <el-select v-model="query.deptId" clearable filterable placeholder="全部" style="width: 170px">
              <el-option v-for="d in depts" :key="d.id" :label="d.name" :value="d.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="在职状态">
            <el-select v-model="query.status" clearable placeholder="全部" style="width: 130px">
              <el-option v-for="d in getDict('employeeStatus')" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="search">查 询</el-button>
            <el-button @click="reset">重 置</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="list.records" border size="default" :row-class-name="rowClass">
          <el-table-column prop="emp_no" label="工号" width="80"><template #default="{ row }"><span class="mono">{{ row.emp_no }}</span></template></el-table-column>
          <el-table-column prop="name" label="姓名" width="90" />
          <el-table-column label="性别" width="60"><template #default="{ row }">{{ dictLabel('gender', row.gender) }}</template></el-table-column>
          <el-table-column prop="dept_name" label="部门" min-width="110" show-overflow-tooltip />
          <el-table-column prop="position" label="职位" min-width="120" show-overflow-tooltip />
          <el-table-column prop="job_level" label="职级" width="70"><template #default="{ row }"><span class="mono">{{ row.job_level || '-' }}</span></template></el-table-column>
          <el-table-column prop="phone" label="手机号" width="120"><template #default="{ row }"><span class="mono">{{ row.phone }}</span></template></el-table-column>
          <el-table-column prop="hire_date" label="入职日期" width="105"><template #default="{ row }"><span class="mono">{{ row.hire_date }}</span></template></el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag size="small" :type="dictTag('employeeStatus', row.status)">{{ dictLabel('employeeStatus', row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="210" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="primary" @click="openDetail(row)">详情</el-button>
              <el-button v-if="canEdit && row.status !== 0" size="small" link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button v-if="canChange && row.status === 2" size="small" link type="success" @click="onRegular(row)">转正</el-button>
              <el-button v-if="canChange && row.status !== 0" size="small" link type="danger" @click="openResign(row)">离职</el-button>
              <el-button v-if="canEdit && row.status !== 0" size="small" link type="danger" @click="onDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="query.current"
          v-model:page-size="query.size"
          class="pager"
          background
          layout="total, sizes, prev, pager, next"
          :total="list.total"
          :page-sizes="[10, 20, 50]"
          @current-change="load"
          @size-change="load"
        />
      </div>
    </div>

    <!-- 新增 / 编辑 -->
    <el-dialog v-model="editVisible" :title="isCreate ? '入职办理（自动生成工号）' : `编辑员工：${form.name || ''}`" width="680px">
      <el-form ref="editFormRef" :model="form" :rules="editRules" label-width="90px">
        <el-row>
          <el-col :span="12"><el-form-item label="姓名" prop="name"><el-input v-model="form.name" :disabled="!isCreate" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="用工性质">
              <el-select v-model="form.employeeType" style="width: 100%">
                <el-option v-for="d in getDict('employeeType')" :key="d.value" :label="d.label" :value="d.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门" prop="deptId">
              <el-select v-model="form.deptId" filterable style="width: 100%">
                <el-option v-for="d in depts" :key="d.id" :label="d.name" :value="d.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="岗位" prop="positionId">
              <el-select v-model="form.positionId" filterable style="width: 100%">
                <el-option v-for="p in positions" :key="p.id" :label="p.position_name" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="职级"><el-input v-model="form.jobLevel" placeholder="如 P5 / M2" class="mono" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="基本薪资" prop="salary"><el-input-number v-model="form.salary" :min="0" :precision="2" :controls="false" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="手机号" prop="phone"><el-input v-model="form.phone" class="mono" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="邮箱" prop="email"><el-input v-model="form.email" class="mono" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="入职日期"><el-date-picker v-model="form.hireDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="学历">
            <el-select v-model="form.education" style="width: 100%">
              <el-option v-for="d in getDict('education')" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取 消</el-button>
        <el-button type="primary" @click="onSave">保 存</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" title="员工档案详情" size="560px">
      <el-descriptions v-if="detail" :column="2" border size="small">
        <el-descriptions-item label="工号"><span class="mono">{{ detail.emp_no }}</span></el-descriptions-item>
        <el-descriptions-item label="姓名">{{ detail.name }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ dictLabel('gender', detail.gender) }}</el-descriptions-item>
        <el-descriptions-item label="年龄">{{ detail.age ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ detail.dept_name }}</el-descriptions-item>
        <el-descriptions-item label="职位">{{ detail.position }}</el-descriptions-item>
        <el-descriptions-item label="职级"><span class="mono">{{ detail.job_level || '-' }}</span></el-descriptions-item>
        <el-descriptions-item label="用工性质">{{ dictLabel('employeeType', detail.employee_type) }}</el-descriptions-item>
        <el-descriptions-item label="手机号"><span class="mono">{{ detail.phone }}</span></el-descriptions-item>
        <el-descriptions-item label="邮箱"><span class="mono">{{ detail.email }}</span></el-descriptions-item>
        <el-descriptions-item label="身份证（脱敏）" :span="2"><span class="mono">{{ detail.id_card }}</span></el-descriptions-item>
        <el-descriptions-item label="学历">{{ dictLabel('education', detail.education) }}</el-descriptions-item>
        <el-descriptions-item label="毕业院校">{{ detail.graduate_school }}</el-descriptions-item>
        <el-descriptions-item label="入职日期"><span class="mono">{{ detail.hire_date }}</span></el-descriptions-item>
        <el-descriptions-item label="转正日期"><span class="mono">{{ detail.regular_date || '-' }}</span></el-descriptions-item>
        <el-descriptions-item label="直属主管">{{ detail.manager_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag size="small" :type="dictTag('employeeStatus', detail.status)">{{ dictLabel('employeeStatus', detail.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="银行卡（脱敏）" :span="2"><span class="mono">{{ detail.bank_account }}</span></el-descriptions-item>
        <el-descriptions-item label="居住地址" :span="2">{{ detail.address }}</el-descriptions-item>
      </el-descriptions>
      <h4 style="margin: 16px 0 8px">异动轨迹（F-02-03）</h4>
      <el-timeline>
        <el-timeline-item v-for="c in changes" :key="c.id" :timestamp="c.effect_date" :type="dictTag('changeType', c.change_type) || 'primary'">
          <b>{{ dictLabel('changeType', c.change_type) }}</b>
          <span v-if="c.after_position"> · {{ c.after_position }}</span>
          <div v-if="c.reason" class="text-muted" style="font-size: 12px">{{ c.reason }}</div>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-if="detail && !changes.length" description="暂无异动记录" :image-size="50" />
    </el-drawer>

    <!-- 离职办理 -->
    <el-dialog v-model="resignVisible" title="离职办理（F-02-04）" width="460px">
      <el-form label-width="90px">
        <el-form-item label="员工"><span>{{ resignTarget?.name }}（{{ resignTarget?.emp_no }}）</span></el-form-item>
        <el-form-item label="离职原因" required>
          <el-input v-model="resignReason" type="textarea" :rows="3" placeholder="请填写离职原因，将记入异动历史留痕" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resignVisible = false">取 消</el-button>
        <el-button type="danger" @click="onResign">确认离职</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { pageEmployees, createEmployee, updateEmployee, deleteEmployee, changeEmployeeStatus, getEmployee, getEmployeeChanges } from '@/api/employee'
import { getDepts, getPositions } from '@/api/dept'
import { getDict, dictLabel, dictTag } from '@/dict'
import { confirmAction } from '@/utils/request'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const roles = computed(() => userStore.roles)
const canEdit = computed(() => roles.value.includes('ROLE_HR') || roles.value.includes('ROLE_ADMIN'))
const canChange = computed(() => roles.value.includes('ROLE_HR'))

const query = reactive({ current: 1, size: 10, keyword: '', deptId: null, status: null })
const list = ref({ records: [], total: 0 })
const depts = ref([])
const positions = ref([])
const editVisible = ref(false)
const isCreate = ref(true)
const editFormRef = ref()
const detailVisible = ref(false)
const detail = ref(null)
const changes = ref([])
const resignVisible = ref(false)
const resignTarget = ref(null)
const resignReason = ref('')

const form = reactive({})
const editRules = {
  name: [{ required: true, message: '姓名必填（BR-02-02）', trigger: 'blur' }],
  deptId: [{ required: true, message: '部门必填（BR-02-02）', trigger: 'change' }],
  positionId: [{ required: true, message: '岗位必填（BR-02-02）', trigger: 'change' }]
}

const rowClass = ({ row }) => (row.status === 0 ? 'row-left' : '')

async function load() {
  list.value = await pageEmployees(query)
}
function search() {
  query.current = 1
  load()
}
function reset() {
  Object.assign(query, { keyword: '', deptId: null, status: null })
  search()
}

function openCreate() {
  isCreate.value = true
  Object.assign(form, { name: '', gender: 'M', deptId: null, positionId: null, jobLevel: '', salary: null, phone: '', email: '', hireDate: '', education: null, employeeType: 1 })
  editVisible.value = true
}
function openEdit(row) {
  isCreate.value = false
  Object.assign(form, row, { deptId: row.dept_id, positionId: row.position_id })
  editVisible.value = true
}

async function onSave() {
  await editFormRef.value.validate()
  if (isCreate.value) {
    const res = await createEmployee(form)
    ElMessage.success(`入职办理完成，工号已生成：${res.empNo}（BR-02-01）`)
  } else {
    await updateEmployee(form.id, form)
    ElMessage.success('保存成功')
  }
  editVisible.value = false
  load()
}

async function openDetail(row) {
  detail.value = await getEmployee(row.id)
  changes.value = (await getEmployeeChanges(row.id)).records
  detailVisible.value = true
}

async function onRegular(row) {
  await confirmAction(`确认为 ${row.name} 办理转正？转正后状态变更为"在职"。`, '转正确认')
  await changeEmployeeStatus(row.id, { status: 1, reason: '试用期转正' })
  ElMessage.success('转正完成，已记入异动历史')
  load()
}

function openResign(row) {
  resignTarget.value = row
  resignReason.value = ''
  resignVisible.value = true
}
async function onResign() {
  if (!resignReason.value.trim()) return ElMessage.warning('离职原因为必填（BR-02-04 留痕要求）')
  await changeEmployeeStatus(resignTarget.value.id, { status: 0, reason: resignReason.value })
  ElMessage.success('离职办理完成，账号停用、状态变更已留痕')
  resignVisible.value = false
  load()
}

async function onDelete(row) {
  await confirmAction(`确认删除员工 ${row.name}（${row.emp_no}）？删除为逻辑删除，历史考勤/薪资/绩效数据保留可追溯（BR-02-03）。`, '删除确认')
  await deleteEmployee(row.id)
  ElMessage.success('已删除（逻辑删除）')
  load()
}

onMounted(async () => {
  load()
  depts.value = await getDepts()
  positions.value = (await getPositions({ size: 100 })).records
})
</script>

<style scoped>
.search-form :deep(.el-form-item) { margin-bottom: 10px; }
.pager { margin-top: 12px; justify-content: flex-end; }
:deep(.row-left) { color: #9aa5b1; background: #fafbfc; }
</style>
