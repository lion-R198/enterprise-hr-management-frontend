<template>
  <div class="page-container">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">简历筛选与面试（F-06-03 / F-06-04，BR-06-01 状态流转）</span>
        <el-button type="primary" size="small" @click="openCreate">录入候选人</el-button>
      </div>
      <div class="panel-body">
        <el-form inline>
          <el-form-item label="阶段">
            <el-select v-model="query.stage" clearable style="width: 130px" @change="search">
              <el-option v-for="d in getDict('candidateStage')" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="姓名">
            <el-input v-model="query.keyword" clearable style="width: 140px" @keyup.enter="search" />
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="talentOnly" @change="search">只看人才库</el-checkbox>
          </el-form-item>
        </el-form>

        <el-table :data="list.records" border size="small">
          <el-table-column prop="name" label="姓名" width="80" />
          <el-table-column prop="position_name" label="应聘岗位" min-width="120" />
          <el-table-column prop="graduate_school" label="毕业院校" min-width="110" />
          <el-table-column prop="work_years" label="工作年限" width="80" align="center" />
          <el-table-column prop="current_company" label="当前公司" min-width="100" />
          <el-table-column label="期望薪资" width="90" align="right"><template #default="{ row }"><span class="mono">{{ row.expect_salary ? (row.expect_salary / 1000) + 'k' : '-' }}</span></template></el-table-column>
          <el-table-column label="阶段" width="90">
            <template #default="{ row }"><el-tag size="small" :type="dictTag('candidateStage', row.stage)">{{ dictLabel('candidateStage', row.stage) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="人才库" width="90">
            <template #default="{ row }">
              <el-tag v-if="row.is_talent" size="small" type="warning">已入库</el-tag>
              <span v-else class="text-muted">—</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="primary" @click="viewInterviews(row)">面试记录</el-button>
              <el-button v-if="[1, 2, 3].includes(row.stage)" size="small" link type="primary" @click="arrangeInterview(row)">安排面试</el-button>
              <el-button v-if="[2, 3].includes(row.stage)" size="small" link type="success" @click="nextStage(row, 4)">进入待录用</el-button>
              <el-button v-if="row.stage === 4" size="small" link type="success" @click="nextStage(row, 5)">确认录用</el-button>
              <el-button v-if="[1, 2, 3, 4].includes(row.stage)" size="small" link type="danger" @click="eliminate(row)">淘汰</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="query.current" class="pager" background layout="total, prev, pager, next" :total="list.total" :page-size="query.size" @current-change="load" />
      </div>
    </div>

    <!-- 录入候选人 -->
    <el-dialog v-model="createVisible" title="录入候选人" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="招聘需求" required>
          <el-select v-model="form.recruitRequestId" style="width: 100%">
            <el-option v-for="r in requests" :key="r.id" :label="`${r.request_no} ${r.position_name}`" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-row>
          <el-col :span="12"><el-form-item label="姓名" required><el-input v-model="form.name" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="工作年限"><el-input-number v-model="form.workYears" :min="0" :max="30" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="学历">
          <el-select v-model="form.education" style="width: 100%">
            <el-option v-for="d in getDict('education')" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="form.source" style="width: 100%">
            <el-option v-for="d in getDict('candidateSource')" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="当前公司"><el-input v-model="form.currentCompany" /></el-form-item>
        <el-form-item label="期望薪资"><el-input-number v-model="form.expectSalary" :min="0" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="联系电话"><el-input v-model="form.phone" class="mono" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取 消</el-button>
        <el-button type="primary" @click="onCreate">保 存</el-button>
      </template>
    </el-dialog>

    <!-- 安排面试 -->
    <el-dialog v-model="interviewVisible" :title="`安排面试：${current?.name}`" width="520px">
      <el-form :model="iForm" label-width="90px">
        <el-form-item label="面试类型">
          <el-select v-model="iForm.interviewType" style="width: 100%">
            <el-option v-for="d in getDict('interviewType')" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="面试时间"><el-date-picker v-model="iForm.interviewTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" /></el-form-item>
        <el-form-item label="地点/链接"><el-input v-model="iForm.interviewPlace" placeholder="会议室 / 腾讯会议链接" /></el-form-item>
        <el-form-item label="面试评分"><el-input-number v-model="iForm.score" :min="0" :max="100" style="width: 100%" placeholder="0-100" /></el-form-item>
        <el-form-item label="面试结论">
          <el-select v-model="iForm.conclusion" clearable style="width: 100%">
            <el-option v-for="d in getDict('interviewConclusion')" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="面试评价"><el-input v-model="iForm.evaluation" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="interviewVisible = false">取 消</el-button>
        <el-button type="primary" @click="onSaveInterview">保 存</el-button>
      </template>
    </el-dialog>

    <!-- 面试记录 -->
    <el-dialog v-model="recordVisible" :title="`面试记录：${current?.name}`" width="640px">
      <el-table :data="interviews" border size="small">
        <el-table-column prop="round_no" label="轮次" width="60" align="center" />
        <el-table-column label="类型" width="80"><template #default="{ row }">{{ dictLabel('interviewType', row.interview_type) }}</template></el-table-column>
        <el-table-column prop="interview_time" label="时间" width="150"><template #default="{ row }"><span class="mono">{{ row.interview_time || '待安排' }}</span></template></el-table-column>
        <el-table-column prop="interviewer_name" label="面试官" width="80" />
        <el-table-column prop="score" label="评分" width="60" align="center" />
        <el-table-column label="结论" width="70"><template #default="{ row }"><el-tag v-if="row.conclusion" size="small" :type="dictTag('interviewConclusion', row.conclusion)">{{ dictLabel('interviewConclusion', row.conclusion) }}</el-tag><span v-else>-</span></template></el-table-column>
        <el-table-column prop="evaluation" label="评价" min-width="140" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { pageCandidates, createCandidate, changeCandidateStage, getInterviewRecords, createInterviewRecord } from '@/api/recruit'
import { pageRecruitRequests } from '@/api/recruit'
import { getDict, dictLabel, dictTag } from '@/dict'

const query = reactive({ current: 1, size: 10, stage: null, keyword: '', isTalent: undefined })
const talentOnly = ref(false)
const list = ref({ records: [], total: 0 })
const requests = ref([])
const createVisible = ref(false)
const interviewVisible = ref(false)
const recordVisible = ref(false)
const current = ref(null)
const interviews = ref([])
const form = reactive({})
const iForm = reactive({})

async function load() {
  query.isTalent = talentOnly.value ? 1 : undefined
  list.value = await pageCandidates(query)
}
function search() {
  query.current = 1
  load()
}

function openCreate() {
  Object.assign(form, { recruitRequestId: null, name: '', workYears: 3, education: 3, source: 2, currentCompany: '', expectSalary: null, phone: '' })
  createVisible.value = true
}
async function onCreate() {
  if (!form.recruitRequestId || !form.name) return ElMessage.warning('请选择需求并填写姓名')
  await createCandidate(form)
  ElMessage.success('候选人已录入，阶段：待筛选')
  createVisible.value = false
  load()
}

async function nextStage(row, stage) {
  const label = dictLabel('candidateStage', stage)
  await ElMessageBox.confirm(`确认将候选人「${row.name}」推进至「${label}」？状态流转不可回退（BR-06-01）。`, '阶段推进')
  await changeCandidateStage(row.id, { stage })
  ElMessage.success(`已推进至：${label}`)
  load()
}

async function eliminate(row) {
  const { value } = await ElMessageBox.prompt(`确认淘汰候选人「${row.name}」？请填写淘汰原因（留痕）`, '淘汰确认', { inputPlaceholder: '淘汰原因', type: 'warning' })
  await changeCandidateStage(row.id, { stage: 6, remark: value || '' })
  ElMessage.success('已淘汰并记录原因')
  load()
}

async function arrangeInterview(row) {
  current.value = row
  Object.assign(iForm, { interviewType: 1, interviewTime: '', interviewPlace: '', score: null, conclusion: null, evaluation: '' })
  interviewVisible.value = true
}
async function onSaveInterview() {
  await createInterviewRecord({ ...iForm, candidateId: current.value.id })
  ElMessage.success('面试记录已保存')
  interviewVisible.value = false
  load()
}

async function viewInterviews(row) {
  current.value = row
  const r = await getInterviewRecords({ candidateId: row.id })
  interviews.value = r.records
  recordVisible.value = true
}

onMounted(async () => {
  load()
  requests.value = (await pageRecruitRequests({ current: 1, size: 50, status: 1 })).records
})
</script>

<style scoped>
.pager { margin-top: 12px; justify-content: flex-end; }
</style>
