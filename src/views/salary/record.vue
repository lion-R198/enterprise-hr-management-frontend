<template>
  <div class="page-container">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">薪资核算与发放（F-05-02 / F-05-03）</span>
        <el-button v-if="canFinance" type="primary" size="small" @click="calcVisible = true">发起月度核算</el-button>
      </div>
      <div class="panel-body">
        <el-form inline>
          <el-form-item label="月份">
            <el-date-picker v-model="period" type="month" value-format="YYYY-M" clearable style="width: 140px" @change="search" />
          </el-form-item>
          <el-form-item label="关键字">
            <el-input v-model="query.keyword" placeholder="姓名/工号" clearable style="width: 150px" @keyup.enter="search" />
          </el-form-item>
          <el-form-item label="发放状态">
            <el-select v-model="query.payStatus" clearable style="width: 120px" @change="search">
              <el-option v-for="d in getDict('payStatus')" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item>
        </el-form>

        <el-table :data="list.records" border size="small">
          <el-table-column prop="emp_no" label="工号" width="75"><template #default="{ row }"><span class="mono">{{ row.emp_no }}</span></template></el-table-column>
          <el-table-column prop="employee_name" label="姓名" width="80" />
          <el-table-column prop="dept_name" label="部门" min-width="100" />
          <el-table-column label="月份" width="75"><template #default="{ row }"><span class="mono">{{ row.salary_year }}-{{ String(row.salary_month).padStart(2, '0') }}</span></template></el-table-column>
          <el-table-column label="应发" width="100" align="right"><template #default="{ row }"><span class="mono">{{ formatMoney(row.gross_pay) }}</span></template></el-table-column>
          <el-table-column label="社保(个人)" width="95" align="right"><template #default="{ row }"><span class="mono">{{ formatMoney(row.social_personal, { symbol: false }) }}</span></template></el-table-column>
          <el-table-column label="公积金(个人)" width="100" align="right"><template #default="{ row }"><span class="mono">{{ formatMoney(row.fund_personal, { symbol: false }) }}</span></template></el-table-column>
          <el-table-column label="个税" width="90" align="right"><template #default="{ row }"><span class="mono">{{ formatMoney(row.tax_amount, { symbol: false }) }}</span></template></el-table-column>
          <el-table-column label="实发" width="105" align="right"><template #default="{ row }"><b class="mono">{{ formatMoney(row.net_pay) }}</b></template></el-table-column>
          <el-table-column label="状态" width="85">
            <template #default="{ row }"><el-tag size="small" :type="dictTag('payStatus', row.pay_status)">{{ dictLabel('payStatus', row.pay_status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="130" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.pay_status === 1 && canFinance" size="small" link type="primary" @click="onReview(row)">复核</el-button>
              <el-button v-if="row.pay_status === 2 && canFinance" size="small" link type="success" @click="onPay(row)">发放</el-button>
              <el-button size="small" link @click="viewDetail(row)">明细</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="query.current" class="pager" background layout="total, prev, pager, next" :total="list.total" :page-size="query.size" @current-change="load" />
      </div>
    </div>

    <!-- 发起核算 -->
    <el-dialog v-model="calcVisible" title="发起月度核算（BR-05-02）" width="440px">
      <el-alert type="warning" :closable="false" show-icon style="margin-bottom: 14px" title="核算前校验：当月考勤月报必须全部封账；核算 → 复核 → 发放三级流转，复核人与核算人不得相同（BR-05-03）" />
      <el-form label-width="80px">
        <el-form-item label="核算月份" required>
          <el-date-picker v-model="calcPeriod" type="month" value-format="YYYY-M" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="calcVisible = false">取 消</el-button>
        <el-button type="primary" @click="onCalculate">开始核算</el-button>
      </template>
    </el-dialog>

    <!-- 薪资明细 -->
    <el-dialog v-model="detailVisible" title="薪资明细（salary_item）" width="560px">
      <el-descriptions v-if="detail" :column="2" border size="small" style="margin-bottom: 14px">
        <el-descriptions-item label="员工">{{ detail.record.employee_name }}</el-descriptions-item>
        <el-descriptions-item label="月份"><span class="mono">{{ detail.record.salary_year }}-{{ String(detail.record.salary_month).padStart(2, '0') }}</span></el-descriptions-item>
      </el-descriptions>
      <template v-for="group in detailGroups" :key="group.type">
        <div class="group-title">{{ group.title }}</div>
        <el-table :data="group.items" size="small" border>
          <el-table-column prop="item_name" label="项目" />
          <el-table-column prop="item_amount" label="金额" width="120" align="right"><template #default="{ row }"><span class="mono">{{ formatMoney(row.item_amount) }}</span></template></el-table-column>
          <el-table-column prop="remark" label="口径说明" min-width="150" />
        </el-table>
      </template>
      <div class="net-line mono">实发合计：{{ formatMoney(detail?.record?.net_pay) }}</div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { pageSalaryRecords, calculateSalary, reviewSalaryRecord, paySalaryRecord, getPayslipItems } from '@/api/salary'
import { getDict, dictLabel, dictTag } from '@/dict'
import { formatMoney } from '@/utils/format'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const canFinance = computed(() => userStore.roles.includes('ROLE_FINANCE') || userStore.roles.includes('ROLE_HR'))
const period = ref(null)
const query = reactive({ current: 1, size: 20, year: null, month: null, keyword: '', payStatus: null })
const list = ref({ records: [], total: 0 })
const calcVisible = ref(false)
const calcPeriod = ref('')
const detailVisible = ref(false)
const detail = ref(null)

const detailGroups = computed(() => {
  if (!detail.value) return []
  const g = [
    { type: 1, title: '应发项', items: [] },
    { type: 2, title: '扣款项', items: [] },
    { type: 3, title: '企业承担项', items: [] }
  ]
  for (const it of detail.value.items) g.find((x) => x.type === it.item_type)?.items.push(it)
  return g.filter((x) => x.items.length)
})

async function load() {
  list.value = await pageSalaryRecords(query)
}
function search() {
  query.current = 1
  if (period.value) {
    const [y, m] = period.value.split('-')
    query.year = Number(y)
    query.month = Number(m)
  } else {
    query.year = null
    query.month = null
  }
  load()
}

async function onCalculate() {
  if (!calcPeriod.value) return ElMessage.warning('请选择核算月份')
  const [y, m] = calcPeriod.value.split('-')
  await ElMessageBox.confirm(`对 ${y} 年 ${m} 月全员发起薪资核算？核算前将校验考勤封账状态（BR-05-02）。`, '核算确认')
  const r = await calculateSalary({ year: Number(y), month: Number(m) })
  ElMessage.success(`核算完成，生成 ${r.created} 条薪资记录，等待复核`)
  calcVisible.value = false
  load()
}

async function onReview(row) {
  await ElMessageBox.confirm(`确认复核 ${row.employee_name} 的 ${row.salary_year}-${row.salary_month} 薪资？`, '复核确认')
  await reviewSalaryRecord(row.id)
  ElMessage.success('复核完成，可发起发放')
  load()
}

async function onPay(row) {
  await ElMessageBox.confirm(`确认发放 ${row.employee_name} 的 ${row.salary_year}-${row.salary_month} 薪资？发放后记录锁定（BR-05-04）。`, '发放确认')
  await paySalaryRecord(row.id)
  ElMessage.success('发放成功，已生成批次号')
  load()
}

async function viewDetail(row) {
  detail.value = await getPayslipItems(row.id)
  detailVisible.value = true
}

onMounted(load)
</script>

<style scoped>
.pager { margin-top: 12px; justify-content: flex-end; }
.group-title { font-weight: 600; margin: 12px 0 6px; color: #1f2d3d; }
.net-line { margin-top: 14px; text-align: right; font-size: 15px; font-weight: 700; color: #c45656; }
</style>
