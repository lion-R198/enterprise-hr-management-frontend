<template>
  <div class="page-container">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">加班申请（F-04-03）</span>
        <el-button type="primary" size="small" @click="openApply">申请加班</el-button>
      </div>
      <div class="panel-body">
        <el-tabs v-model="query.tab">
          <el-tab-pane label="我的申请" name="mine" />
          <el-tab-pane v-if="canApprove" label="部门审批" name="approve" />
        </el-tabs>
        <el-table :data="list.records" border size="small">
          <el-table-column prop="request_no" label="单号" width="110"><template #default="{ row }"><span class="mono">{{ row.request_no }}</span></template></el-table-column>
          <el-table-column prop="employee_name" label="申请人" width="80" />
          <el-table-column prop="overtime_date" label="加班日期" width="100"><template #default="{ row }"><span class="mono">{{ row.overtime_date }}</span></template></el-table-column>
          <el-table-column label="时段" width="120"><template #default="{ row }"><span class="mono">{{ row.start_time?.slice(0, 5) }} - {{ row.end_time?.slice(0, 5) }}</span></template></el-table-column>
          <el-table-column prop="hours" label="时长(h)" width="75"><template #default="{ row }"><span class="mono">{{ row.hours }}</span></template></el-table-column>
          <el-table-column label="类型" width="95"><template #default="{ row }">{{ dictLabel('overtimeType', row.overtime_type) }}</template></el-table-column>
          <el-table-column label="补偿" width="70"><template #default="{ row }">{{ dictLabel('compensateType', row.compensate_type) }}</template></el-table-column>
          <el-table-column prop="reason" label="事由" min-width="130" show-overflow-tooltip />
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

    <el-dialog v-model="applyVisible" title="加班申请" width="500px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="加班日期" required><el-date-picker v-model="form.overtimeDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        <el-form-item label="开始时间" required><el-time-select v-model="form.startTime" start="18:00" step="00:30" end="23:30" style="width: 100%" /></el-form-item>
        <el-form-item label="结束时间" required><el-time-select v-model="form.endTime" start="19:00" step="00:30" end="23:59" style="width: 100%" /></el-form-item>
        <el-form-item label="时长(小时)" required><el-input-number v-model="form.hours" :min="0.5" :step="0.5" :precision="1" style="width: 100%" /></el-form-item>
        <el-form-item label="加班类型">
          <el-select v-model="form.overtimeType" style="width: 100%">
            <el-option v-for="d in getDict('overtimeType')" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="补偿方式">
          <el-radio-group v-model="form.compensateType">
            <el-radio v-for="d in getDict('compensateType')" :key="d.value" :value="d.value">{{ d.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="事由"><el-input v-model="form.reason" type="textarea" :rows="2" /></el-form-item>
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
import { pageOvertimeRequests, createOvertimeRequest, approveOvertimeRequest } from '@/api/attendance'
import { getDict, dictLabel, dictTag } from '@/dict'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const canApprove = computed(() => userStore.roles.some((r) => ['ROLE_MANAGER', 'ROLE_HR'].includes(r)))
const query = reactive({ current: 1, size: 10, tab: 'mine' })
const list = ref({ records: [], total: 0 })
const applyVisible = ref(false)
const form = reactive({ overtimeDate: '', startTime: '', endTime: '', hours: 2, overtimeType: 1, compensateType: 1, reason: '' })

async function load() {
  const params = { ...query }
  params.all = query.tab === 'approve' ? 'true' : undefined
  list.value = await pageOvertimeRequests(params)
}

function openApply() {
  Object.assign(form, { overtimeDate: '', startTime: '', endTime: '', hours: 2, overtimeType: 1, compensateType: 1, reason: '' })
  applyVisible.value = true
}
async function onSubmit() {
  if (!form.overtimeDate || !form.startTime || !form.endTime) return ElMessage.warning('请填写加班日期与时段')
  await createOvertimeRequest(form)
  ElMessage.success('加班申请已提交')
  applyVisible.value = false
  load()
}
async function onApprove(row, result) {
  const action = result === 2 ? '通过' : '驳回'
  await ElMessageBox.confirm(`确认${action}加班单 ${row.request_no}？`, `${action}确认`)
  await approveOvertimeRequest(row.id, { result, opinion: '' })
  ElMessage.success(`已${action}`)
  load()
}

onMounted(load)
</script>

<style scoped>
.pager { margin-top: 12px; justify-content: flex-end; }
</style>
