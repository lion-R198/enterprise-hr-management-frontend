<template>
  <div class="page-container">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">录用审批（F-06-05，录用后一键推送入职 BR-06-03）</span>
      </div>
      <div class="panel-body">
        <el-table :data="list.records" border>
          <el-table-column prop="offer_no" label="Offer 编号" width="110"><template #default="{ row }"><span class="mono">{{ row.offer_no }}</span></template></el-table-column>
          <el-table-column prop="candidate_name" label="候选人" width="90" />
          <el-table-column prop="position_name" label="录用岗位" min-width="130" />
          <el-table-column prop="dept_name" label="录用部门" min-width="110" />
          <el-table-column prop="job_level" label="定级" width="70"><template #default="{ row }"><span class="mono">{{ row.job_level }}</span></template></el-table-column>
          <el-table-column label="转正月薪" width="100" align="right"><template #default="{ row }"><span class="mono">{{ formatMoney(row.offer_salary) }}</span></template></el-table-column>
          <el-table-column label="试用期月薪" width="100" align="right"><template #default="{ row }"><span class="mono">{{ formatMoney(row.probation_salary) }}</span></template></el-table-column>
          <el-table-column prop="entry_date" label="预计入职" width="100"><template #default="{ row }"><span class="mono">{{ row.entry_date }}</span></template></el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }"><el-tag size="small" :type="dictTag('offerStatus', row.status)">{{ dictLabel('offerStatus', row.status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === 1" size="small" link type="primary" @click="onSend(row)">发送 Offer</el-button>
              <el-button v-if="row.status === 2" size="small" link type="success" @click="onAccept(row)">候选人已接受</el-button>
              <el-button v-if="row.status === 3" size="small" link type="success" @click="onEntry(row)">办理入职（推送）</el-button>
              <el-button v-if="row.status === 2" size="small" link type="danger" @click="onReject(row)">候选人已拒绝</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="query.current" class="pager" background layout="total, prev, pager, next" :total="list.total" :page-size="query.size" @current-change="load" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { pageOffers, sendOffer, changeOfferStatus } from '@/api/recruit'
import { getDict, dictLabel, dictTag } from '@/dict'
import { formatMoney } from '@/utils/format'

const query = reactive({ current: 1, size: 10 })
const list = ref({ records: [], total: 0 })

async function load() {
  list.value = await pageOffers(query)
}

async function onSend(row) {
  await ElMessageBox.confirm(`向候选人「${row.candidate_name}」发送 Offer（${formatMoney(row.offer_salary)}/月）？`, '发送确认')
  await sendOffer(row.id)
  ElMessage.success('Offer 已发送')
  load()
}
async function onAccept(row) {
  await changeOfferStatus(row.id, { status: 3 })
  ElMessage.success('已确认接受，待候选人报到')
  load()
}
async function onReject(row) {
  await ElMessageBox.confirm('确认该候选人已拒绝 Offer？', '确认')
  await changeOfferStatus(row.id, { status: 4 })
  load()
}
async function onEntry(row) {
  await ElMessageBox.confirm(`确认为「${row.candidate_name}」办理入职？将自动生成待入职员工档案并计入招聘完成数（BR-06-03）。`, '入职推送')
  await changeOfferStatus(row.id, { status: 6 })
  ElMessage.success('已推送至员工信息模块（待入职状态），招聘需求完成数已更新')
  load()
}

onMounted(load)
</script>

<style scoped>
.pager { margin-top: 12px; justify-content: flex-end; }
</style>
