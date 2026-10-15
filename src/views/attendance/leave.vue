<template>
  <div class="page-container">
    <el-row :gutter="12">
      <!-- 假期余额（BR-04-02） -->
      <el-col :span="7">
        <div class="panel">
          <div class="panel-header"><span class="panel-title">我的假期余额（2026）</span></div>
          <div class="panel-body">
            <div v-for="b in balances" :key="b.id" class="balance-item">
              <div class="balance-name">{{ b.leave_type_name }}</div>
              <el-progress :percentage="Math.round((b.used_days / b.total_days) * 100)" :stroke-width="12" :format="() => `${b.remain_days}/${b.total_days}天`" />
            </div>
            <el-empty v-if="!balances.length" description="暂无假期数据" :image-size="50" />
          </div>
        </div>
      </el-col>

      <!-- 请假单列表 -->
      <el-col :span="17">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">请假申请（F-04-02）</span>
            <el-button type="primary" size="small" @click="openApply">我要请假</el-button>
          </div>
          <div class="panel-body">
            <el-tabs v-model="query.tab">
              <el-tab-pane label="我的申请" name="mine" />
              <el-tab-pane v-if="canApprove" label="部门审批" name="approve" />
            </el-tabs>
            <el-table :data="list.records" border size="small">
              <el-table-column prop="request_no" label="单号" width="110"><template #default="{ row }"><span class="mono">{{ row.request_no }}</span></template></el-table-column>
              <el-table-column prop="employee_name" label="申请人" width="80" />
              <el-table-column prop="leave_type_name" label="假别" width="70" />
              <el-table-column prop="start_time" label="开始" width="90"><template #default="{ row }"><span class="mono">{{ row.start_time.slice(0, 10) }}</span></template></el-table-column>
              <el-table-column prop="end_time" label="结束" width="90"><template #default="{ row }"><span class="mono">{{ row.end_time.slice(0, 10) }}</span></template></el-table-column>
              <el-table-column prop="days" label="天数" width="65"><template #default="{ row }"><span class="mono">{{ row.days }}</span></template></el-table-column>
              <el-table-column prop="reason" label="事由" min-width="130" show-overflow-tooltip />
              <el-table-column label="状态" width="85"><template #default="{ row }"><el-tag size="small" :type="dictTag('approvalStatus', row.approval_status)">{{ dictLabel('approvalStatus', row.approval_status) }}</el-tag></template></el-table-column>
              <el-table-column label="操作" width="130" fixed="right">
                <template #default="{ row }">
                  <el-button v-if="row.approval_status === 1" size="small" link type="success" @click="onApprove(row, 2)">通过</el-button>
                  <el-button v-if="row.approval_status === 1" size="small" link type="danger" @click="onApprove(row, 3)">驳回</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination v-model:current-page="query.current" class="pager" background layout="total, prev, pager, next" :total="list.total" :page-size="query.size" @current-change="load" />
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 请假申请 -->
    <el-dialog v-model="applyVisible" title="请假申请" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="假别" required>
          <el-select v-model="form.leaveTypeId" style="width: 100%">
            <el-option v-for="t in leaveTypes" :key="t.id" :label="`${t.type_name}${t.is_paid ? '（带薪）' : '（不带薪）'}`" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" required>
          <el-date-picker v-model="form.startTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束时间" required>
          <el-date-picker v-model="form.endTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
        </el-form-item>
        <el-form-item label="请假天数" required>
          <el-input-number v-model="form.days" :min="0.5" :step="0.5" :precision="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="请假事由">
          <el-input v-model="form.reason" type="textarea" :rows="3" />
        </el-form-item>
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
import { pageLeaveRequests, createLeaveRequest, approveLeaveRequest, getMyLeaveBalances } from '@/api/attendance'
import { dictLabel, dictTag } from '@/dict'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const canApprove = computed(() => userStore.roles.some((r) => ['ROLE_MANAGER', 'ROLE_HR'].includes(r)))

const query = reactive({ current: 1, size: 10, tab: 'mine' })
const list = ref({ records: [], total: 0 })
const balances = ref([])
const leaveTypes = ref([
  { id: 1, type_name: '年假', is_paid: 1 },
  { id: 2, type_name: '病假', is_paid: 1 },
  { id: 3, type_name: '事假', is_paid: 0 },
  { id: 4, type_name: '婚假', is_paid: 1 },
  { id: 5, type_name: '产假', is_paid: 1 }
])
const applyVisible = ref(false)
const form = reactive({ leaveTypeId: null, startTime: '', endTime: '', days: 1, reason: '' })

async function load() {
  const params = { ...query }
  params.mine = query.tab === 'mine' ? 'true' : undefined
  list.value = await pageLeaveRequests(params)
}

function openApply() {
  Object.assign(form, { leaveTypeId: null, startTime: '', endTime: '', days: 1, reason: '' })
  applyVisible.value = true
}
async function onSubmit() {
  if (!form.leaveTypeId || !form.startTime || !form.endTime) return ElMessage.warning('请填写假别与起止时间（BR-04-01）')
  await createLeaveRequest(form)
  ElMessage.success('申请已提交，等待直属主管审批（审批链：直属主管 → 人事）')
  applyVisible.value = false
  load()
  getMyLeaveBalances().then((r) => (balances.value = r.records))
}

async function onApprove(row, result) {
  const action = result === 2 ? '通过' : '驳回'
  const { value: opinion } = await ElMessageBox.prompt(`确认${action}请假单 ${row.request_no}（${row.employee_name} ${row.leave_type_name} ${row.days} 天）？`, `${action}确认`, {
    inputPlaceholder: '审批意见（选填）',
    confirmButtonText: action,
    cancelButtonText: '取 消',
    type: result === 2 ? 'success' : 'warning'
  })
  await approveLeaveRequest(row.id, { result, opinion: value || '' })
  ElMessage.success(`已${action}`)
  load()
}

onMounted(() => {
  load()
  getMyLeaveBalances().then((r) => (balances.value = r.records))
})
</script>

<style scoped>
.pager { margin-top: 12px; justify-content: flex-end; }
.balance-item { margin-bottom: 16px; }
.balance-name { font-size: 13px; margin-bottom: 6px; color: #1f2d3d; }
</style>
