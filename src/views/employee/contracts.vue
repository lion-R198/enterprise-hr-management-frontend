<template>
  <div class="page-container">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">合同管理（F-02-05，到期预警 30/60 天）</span>
        <el-button type="primary" size="small" @click="openCreate">签订/续签合同</el-button>
      </div>
      <div class="panel-body">
        <el-table :data="list.records" border :row-class-name="rowClass">
          <el-table-column prop="contract_no" label="合同编号" width="110"><template #default="{ row }"><span class="mono">{{ row.contract_no }}</span></template></el-table-column>
          <el-table-column prop="employee_name" label="乙方" width="90" />
          <el-table-column label="类型" width="110"><template #default="{ row }">{{ dictLabel('contractType', row.contract_type) }}</template></el-table-column>
          <el-table-column prop="start_date" label="生效日期" width="105"><template #default="{ row }"><span class="mono">{{ row.start_date }}</span></template></el-table-column>
          <el-table-column prop="end_date" label="到期日期" width="105"><template #default="{ row }"><span class="mono">{{ row.end_date || '无固定期限' }}</span></template></el-table-column>
          <el-table-column label="到期剩余" width="110">
            <template #default="{ row }">
              <span v-if="row.end_date" class="mono" :style="warnColor(row)">{{ remainDays(row) }}</span>
              <span v-else class="text-muted">—</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90"><template #default="{ row }"><el-tag size="small" :type="dictTag('contractStatus', row.status)">{{ dictLabel('contractStatus', row.status) }}</el-tag></template></el-table-column>
          <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        </el-table>
        <el-pagination v-model:current-page="query.current" class="pager" background layout="total, prev, pager, next" :total="list.total" :page-size="query.size" @current-change="load" />
      </div>
    </div>

    <el-dialog v-model="createVisible" title="签订/续签合同" width="520px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="员工" required>
          <el-select v-model="form.employeeId" filterable style="width: 100%">
            <el-option v-for="e in emps" :key="e.id" :label="`${e.emp_no} ${e.name}`" :value="e.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="合同类型">
          <el-select v-model="form.contractType" style="width: 100%">
            <el-option v-for="d in getDict('contractType')" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="生效日期" required>
          <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="到期日期">
          <el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" placeholder="留空为无固定期限" />
        </el-form-item>
        <el-form-item label="试用期(月)"><el-input-number v-model="form.probationMonths" :min="0" :max="6" style="width: 100%" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取 消</el-button>
        <el-button type="primary" @click="onCreate">保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { pageContracts, createContract } from '@/api/employee'
import { pageEmployees } from '@/api/employee'
import { getDict, dictLabel, dictTag } from '@/dict'

const query = reactive({ current: 1, size: 10 })
const list = ref({ records: [], total: 0 })
const emps = ref([])
const createVisible = ref(false)
const form = reactive({ employeeId: null, contractType: 1, startDate: '', endDate: '', probationMonths: 3 })

async function load() {
  list.value = await pageContracts(query)
}

function remainDays(row) {
  const diff = Math.ceil((new Date(row.end_date) - new Date()) / 86400000)
  return diff < 0 ? '已到期' : `${diff} 天`
}
function warnColor(row) {
  const diff = Math.ceil((new Date(row.end_date) - new Date()) / 86400000)
  if (diff < 0) return { color: '#9aa5b1' }
  if (diff <= 30) return { color: '#c45656', fontWeight: 700 }
  if (diff <= 60) return { color: '#b88230', fontWeight: 700 }
  return {}
}
const rowClass = ({ row }) => {
  if (!row.end_date) return ''
  const diff = Math.ceil((new Date(row.end_date) - new Date()) / 86400000)
  return diff <= 30 ? 'row-danger' : diff <= 60 ? 'row-warn' : ''
}

function openCreate() {
  Object.assign(form, { employeeId: null, contractType: 1, startDate: '', endDate: '', probationMonths: 3 })
  createVisible.value = true
}
async function onCreate() {
  if (!form.employeeId || !form.startDate) return ElMessage.warning('请填写员工与生效日期')
  await createContract(form)
  ElMessage.success('合同已签订')
  createVisible.value = false
  load()
}

onMounted(async () => {
  load()
  emps.value = (await pageEmployees({ current: 1, size: 100, status: 1 })).records
})
</script>

<style scoped>
.pager { margin-top: 12px; justify-content: flex-end; }
:deep(.row-danger) { background: #fdf0f0; }
:deep(.row-warn) { background: #fdf7ec; }
</style>
