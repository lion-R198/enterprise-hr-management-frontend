<template>
  <div class="page-container">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">出差管理（F-04-04，出差期间视为出勤）</span>
        <el-button type="primary" size="small" @click="openApply">申请出差</el-button>
      </div>
      <div class="panel-body">
        <el-tabs v-model="query.tab">
          <el-tab-pane label="我的申请" name="mine" />
          <el-tab-pane v-if="canApprove" label="部门审批" name="approve" />
        </el-tabs>
        <el-table :data="list.records" border size="small">
          <el-table-column prop="request_no" label="单号" width="110"><template #default="{ row }"><span class="mono">{{ row.request_no }}</span></template></el-table-column>
          <el-table-column prop="employee_name" label="申请人" width="80" />
          <el-table-column prop="destination" label="目的地" width="90" />
          <el-table-column prop="purpose" label="事由" min-width="150" show-overflow-tooltip />
          <el-table-column prop="start_time" label="开始" width="90"><template #default="{ row }"><span class="mono">{{ row.start_time.slice(0, 10) }}</span></template></el-table-column>
          <el-table-column prop="end_time" label="结束" width="90"><template #default="{ row }"><span class="mono">{{ row.end_time.slice(0, 10) }}</span></template></el-table-column>
          <el-table-column prop="days" label="天数" width="65"><template #default="{ row }"><span class="mono">{{ row.days }}</span></template></el-table-column>
          <el-table-column label="预算" width="90"><template #default="{ row }"><span class="mono">¥{{ Number(row.budget_amount).toLocaleString() }}</span></template></el-table-column>
          <el-table-column label="状态" width="85"><template #default="{ row }"><el-tag size="small" :type="dictTag('approvalStatus', row.approval_status)">{{ dictLabel('approvalStatus', row.approval_status) }}</el-tag></template></el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <template v-if="row.approval_status === 1">
                <el-button size="small" link type="success" @click="onApprove(row, 2)">通过</el-button>
                <el-button size="small" link type="danger" @click="onApprove(row, 3)">驳回</el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="query.current" class="pager" background layout="total, prev, pager, next" :total="list.total" :page-size="query.size" @current-change="load" />
      </div>
    </div>

    <el-dialog v-model="applyVisible" title="出差申请" width="500px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="目的地" required><el-input v-model="form.destination" placeholder="如 上海" /></el-form-item>
        <el-form-item label="开始时间" required><el-date-picker v-model="form.startTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" /></el-form-item>
        <el-form-item label="结束时间" required><el-date-picker v-model="form.endTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" /></el-form-item>
        <el-form-item label="天数" required><el-input-number v-model="form.days" :min="0.5" :step="0.5" :precision="1" style="width: 100%" /></el-form-item>
        <el-form-item label="交通方式">
          <el-select v-model="form.transport" style="width: 100%">
            <el-option v-for="d in getDict('transport')" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="预算(元)"><el-input-number v-model="form.budgetAmount" :min="0" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="事由"><el-input v-model="form.purpose" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applyVisible = false">取 消</el-button>
        <el-button type="primary" @click="onSubmit">提交审批</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { pageTrips, createTrip, approveTrip } from '@/api/attendance'
import { getDict, dictLabel, dictTag } from '@/dict'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const canApprove = computed(() => userStore.roles.some((r) => ['ROLE_MANAGER', 'ROLE_HR'].includes(r)))
const query = reactive({ current: 1, size: 10, tab: 'mine' })
const list = ref({ records: [], total: 0 })
const applyVisible = ref(false)
const form = reactive({ destination: '', startTime: '', endTime: '', days: 1, transport: 2, budgetAmount: 0, purpose: '' })

async function load() {
  const params = { ...query }
  params.all = query.tab === 'approve' ? 'true' : undefined
  list.value = await pageTrips(params)
}

function openApply() {
  Object.assign(form, { destination: '', startTime: '', endTime: '', days: 1, transport: 2, budgetAmount: 0, purpose: '' })
  applyVisible.value = true
}
async function onSubmit() {
  if (!form.destination || !form.startTime || !form.endTime) return ElMessage.warning('请填写目的地与起止时间')
  await createTrip(form)
  ElMessage.success('出差申请已提交')
  applyVisible.value = false
  load()
}
async function onApprove(row, result) {
  const action = result === 2 ? '通过' : '驳回'
  await ElMessageBox.confirm(`确认${action}出差单 ${row.request_no}？`, `${action}确认`)
  await approveTrip(row.id, { result, opinion: '' })
  ElMessage.success(`已${action}`)
  load()
}

onMounted(load)
</script>

<style scoped>
.pager { margin-top: 12px; justify-content: flex-end; }
</style>
