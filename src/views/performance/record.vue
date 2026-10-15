<template>
  <div class="page-container">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">绩效评分与确认（F-08-03，自评 → 主管评 → 员工确认 BR-08-01）</span>
      </div>
      <div class="panel-body">
        <el-form inline>
          <el-form-item label="考核方案">
            <el-select v-model="query.planId" clearable style="width: 240px" @change="search">
              <el-option v-for="p in plans" :key="p.id" :label="p.plan_name" :value="p.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="流程状态">
            <el-select v-model="query.status" clearable style="width: 140px" @change="search">
              <el-option v-for="d in getDict('perfStatus')" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item>
        </el-form>

        <el-table :data="list.records" border size="small">
          <el-table-column prop="plan_name" label="方案" min-width="150" show-overflow-tooltip />
          <el-table-column prop="employee_name" label="员工" width="80" />
          <el-table-column prop="dept_name" label="部门" min-width="100" />
          <el-table-column prop="self_score" label="自评" width="70" align="center"><template #default="{ row }"><span class="mono">{{ row.self_score ?? '-' }}</span></template></el-table-column>
          <el-table-column prop="leader_score" label="主管评" width="70" align="center"><template #default="{ row }"><span class="mono">{{ row.leader_score ?? '-' }}</span></template></el-table-column>
          <el-table-column prop="final_score" label="总分" width="70" align="center"><template #default="{ row }"><b class="mono">{{ row.final_score ?? '-' }}</b></template></el-table-column>
          <el-table-column label="等级" width="90">
            <template #default="{ row }">
              <el-tag v-if="row.grade" size="small" :type="dictTag('perfGrade', row.grade)">{{ dictLabel('perfGrade', row.grade) }}</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }"><el-tag size="small" :type="dictTag('perfStatus', row.status)">{{ dictLabel('perfStatus', row.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="确认" width="90">
            <template #default="{ row }"><el-tag v-if="row.employee_confirm_status" size="small" :type="dictTag('confirmStatus', row.employee_confirm_status)">{{ dictLabel('confirmStatus', row.employee_confirm_status) }}</el-tag><span v-else class="text-muted">—</span></template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === 1 && isMine(row)" size="small" link type="primary" @click="openSelf(row)">自评</el-button>
              <el-button v-if="row.status === 2 && isLeader(row)" size="small" link type="primary" @click="openLeader(row)">主管评分</el-button>
              <el-button v-if="row.status === 4 && isMine(row)" size="small" link type="success" @click="onConfirm(row)">确认结果</el-button>
              <el-button v-if="row.status === 4 && isMine(row)" size="small" link type="danger" @click="onAppeal(row)">申诉</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="query.current" class="pager" background layout="total, prev, pager, next" :total="list.total" :page-size="query.size" @current-change="load" />
      </div>
    </div>

    <el-dialog v-model="scoreVisible" :title="scoreTitle" width="420px">
      <el-form label-width="90px">
        <el-form-item label="员工"><span>{{ current?.employee_name }}</span></el-form-item>
        <el-form-item :label="isSelf ? '自评分' : '主管评分'" required>
          <el-input-number v-model="score" :min="0" :max="100" :precision="1" style="width: 100%" />
        </el-form-item>
      </el-form>
      <div v-if="!isSelf" class="text-muted" style="font-size: 12px; padding-left: 90px">总分 = 自评×20% + 主管评×70% + 复核×10%，等级自动判定</div>
      <template #footer>
        <el-button @click="scoreVisible = false">取 消</el-button>
        <el-button type="primary" @click="onSubmitScore">提 交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { pagePerfRecords, pagePerfPlans, submitSelfScore, submitLeaderScore, confirmPerfRecord } from '@/api/performance'
import { getDict, dictLabel, dictTag } from '@/dict'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const query = reactive({ current: 1, size: 20, planId: null, status: null })
const list = ref({ records: [], total: 0 })
const plans = ref([])
const scoreVisible = ref(false)
const current = ref(null)
const isSelf = ref(true)
const score = ref(80)

const scoreTitle = computed(() => (isSelf.value ? '员工自评' : '主管评分'))
const isMine = (row) => row.employee_id === userStore.employeeId
const isLeader = (row) => userStore.roles.includes('ROLE_HR') || (userStore.roles.includes('ROLE_MANAGER') && row.dept_id === userStore.deptId)

async function load() {
  list.value = await pagePerfRecords(query)
}
function search() {
  query.current = 1
  load()
}

function openSelf(row) {
  current.value = row
  isSelf.value = true
  score.value = 80
  scoreVisible.value = true
}
function openLeader(row) {
  current.value = row
  isSelf.value = false
  score.value = 75
  scoreVisible.value = true
}
async function onSubmitScore() {
  if (isSelf.value) {
    await submitSelfScore(current.value.id, { score: score.value })
    ElMessage.success('自评已提交，等待主管评分')
  } else {
    const r = await submitLeaderScore(current.value.id, { score: score.value })
    ElMessage.success(`评分完成：总分 ${r.finalScore}，等级 ${r.grade}`)
  }
  scoreVisible.value = false
  load()
}

async function onConfirm(row) {
  await ElMessageBox.confirm('确认接受考核结果？确认后流程完成并进入归档（BR-08-02 归档后锁定）。', '结果确认')
  await confirmPerfRecord(row.id, {})
  ElMessage.success('已确认')
  load()
}
async function onAppeal(row) {
  const { value } = await ElMessageBox.prompt('请在规定期限内提出申诉，填写申诉理由（BR-08-01）', '绩效申诉', { inputPlaceholder: '申诉理由', type: 'warning' })
  await confirmPerfRecord(row.id, { appeal: true, reason: value || '' })
  ElMessage.success('申诉已提交，等待处理')
  load()
}

onMounted(async () => {
  load()
  plans.value = (await pagePerfPlans({ current: 1, size: 50 })).records
})
</script>

<style scoped>
.pager { margin-top: 12px; justify-content: flex-end; }
</style>
