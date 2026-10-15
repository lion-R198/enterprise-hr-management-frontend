<template>
  <div class="page-container">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">招聘需求（F-06-01，主管提报 → HR 审批）</span>
        <el-button type="primary" size="small" @click="openCreate">提报需求</el-button>
      </div>
      <div class="panel-body">
        <el-table :data="list.records" border>
          <el-table-column prop="request_no" label="需求单号" width="110"><template #default="{ row }"><span class="mono">{{ row.request_no }}</span></template></el-table-column>
          <el-table-column prop="dept_name" label="需求部门" min-width="110" />
          <el-table-column prop="position_name" label="岗位" min-width="130" />
          <el-table-column label="人数（已录/需求）" width="130" align="center">
            <template #default="{ row }"><span class="mono">{{ row.hired_count }}/{{ row.recruit_count }}</span></template>
          </el-table-column>
          <el-table-column label="薪资区间" width="150" align="right">
            <template #default="{ row }"><span class="mono">{{ row.salary_min ? `${(row.salary_min / 1000)}k-${(row.salary_max / 1000)}k` : '-' }}</span></template>
          </el-table-column>
          <el-table-column label="紧急度" width="90"><template #default="{ row }"><el-tag size="small" :type="dictTag('recruitUrgency', row.urgency)">{{ dictLabel('recruitUrgency', row.urgency) }}</el-tag></template></el-table-column>
          <el-table-column prop="hope_arrive_date" label="期望到岗" width="105"><template #default="{ row }"><span class="mono">{{ row.hope_arrive_date }}</span></template></el-table-column>
          <el-table-column label="审批" width="85"><template #default="{ row }"><el-tag size="small" :type="dictTag('recruitApproval', row.approval_status)">{{ dictLabel('recruitApproval', row.approval_status) }}</el-tag></template></el-table-column>
          <el-table-column label="需求状态" width="85"><template #default="{ row }"><el-tag size="small" :type="dictTag('recruitStatus', row.status)">{{ dictLabel('recruitStatus', row.status) }}</el-tag></template></el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.approval_status === 1 && canApprove" size="small" link type="success" @click="onApprove(row, 2)">通过</el-button>
              <el-button v-if="row.approval_status === 1 && canApprove" size="small" link type="danger" @click="onApprove(row, 3)">驳回</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="query.current" class="pager" background layout="total, prev, pager, next" :total="list.total" :page-size="query.size" @current-change="load" />
      </div>
    </div>

    <el-dialog v-model="createVisible" title="提报招聘需求（BR-06-02 候选中不占编制）" width="560px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="需求部门" required>
          <el-select v-model="form.requestDeptId" style="width: 100%">
            <el-option v-for="d in depts" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="招聘岗位" required><el-input v-model="form.positionName" placeholder="如 Java开发工程师" /></el-form-item>
        <el-form-item label="招聘人数" required><el-input-number v-model="form.recruitCount" :min="1" style="width: 100%" /></el-form-item>
        <el-form-item label="职级"><el-input v-model="form.jobLevel" class="mono" placeholder="如 P5" /></el-form-item>
        <el-row>
          <el-col :span="12"><el-form-item label="薪资下限"><el-input-number v-model="form.salaryMin" :min="0" :controls="false" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="薪资上限"><el-input-number v-model="form.salaryMax" :min="0" :controls="false" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="学历要求">
          <el-select v-model="form.educationReq" style="width: 100%">
            <el-option v-for="d in getDict('education')" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="紧急程度">
          <el-radio-group v-model="form.urgency">
            <el-radio v-for="d in getDict('recruitUrgency')" :key="d.value" :value="d.value">{{ d.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="期望到岗"><el-date-picker v-model="form.hopeArriveDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        <el-form-item label="岗位职责"><el-input v-model="form.jobDescription" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="任职要求"><el-input v-model="form.jobRequirement" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取 消</el-button>
        <el-button type="primary" @click="onCreate">提 交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { pageRecruitRequests, createRecruitRequest, approveRecruitRequest } from '@/api/recruit'
import { getDepts } from '@/api/dept'
import { getDict, dictLabel, dictTag } from '@/dict'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const canApprove = computed(() => userStore.roles.some((r) => ['ROLE_HR', 'ROLE_ADMIN'].includes(r)))
const query = reactive({ current: 1, size: 10 })
const list = ref({ records: [], total: 0 })
const depts = ref([])
const createVisible = ref(false)
const form = reactive({})

async function load() {
  list.value = await pageRecruitRequests(query)
}
function openCreate() {
  Object.assign(form, { requestDeptId: null, positionName: '', recruitCount: 1, jobLevel: '', salaryMin: null, salaryMax: null, educationReq: 3, urgency: 1, hopeArriveDate: '', jobDescription: '', jobRequirement: '' })
  createVisible.value = true
}
async function onCreate() {
  if (!form.requestDeptId || !form.positionName) return ElMessage.warning('请填写需求部门与岗位')
  const r = await createRecruitRequest(form)
  ElMessage.success(`需求已提报：${r.requestNo}，等待 HR 审批`)
  createVisible.value = false
  load()
}
async function onApprove(row, result) {
  const action = result === 2 ? '通过' : '驳回'
  await ElMessageBox.confirm(`确认${action}招聘需求 ${row.request_no}（${row.position_name} × ${row.recruit_count}）？`, `${action}确认`)
  await approveRecruitRequest(row.id, { result })
  ElMessage.success(`已${action}`)
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
