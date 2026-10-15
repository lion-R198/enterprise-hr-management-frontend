<template>
  <div class="page-container">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">考勤月报统计（F-04-06，BR-04-03 封账后禁改）</span>
        <el-button type="primary" size="small" @click="onLockAll">封账当月筛选结果</el-button>
      </div>
      <div class="panel-body">
        <el-form inline>
          <el-form-item label="月份">
            <el-date-picker v-model="period" type="month" value-format="YYYY-M" clearable style="width: 140px" @change="search" />
          </el-form-item>
          <el-form-item label="封账状态">
            <el-select v-model="query.lockStatus" clearable style="width: 120px" @change="search">
              <el-option v-for="d in getDict('lockStatus')" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item>
        </el-form>
        <el-table :data="list.records" border size="small">
          <el-table-column prop="employee_name" label="员工" width="80" />
          <el-table-column prop="dept_name" label="部门" min-width="110" />
          <el-table-column label="月份" width="90"><template #default="{ row }"><span class="mono">{{ row.record_year }}-{{ String(row.record_month).padStart(2, '0') }}</span></template></el-table-column>
          <el-table-column prop="should_days" label="应出勤" width="75" align="center" />
          <el-table-column prop="actual_days" label="实出勤" width="75" align="center" />
          <el-table-column label="迟到" width="60" align="center"><template #default="{ row }"><span :class="{ 'num-warn': row.late_count > 0 }">{{ row.late_count }}</span></template></el-table-column>
          <el-table-column label="早退" width="60" align="center">{{ 0 }}</el-table-column>
          <el-table-column label="旷工" width="60" align="center"><template #default="{ row }"><span :class="{ 'num-danger': row.absent_count > 0 }">{{ row.absent_count }}</span></template></el-table-column>
          <el-table-column label="缺卡" width="60" align="center"><template #default="{ row }"><span :class="{ 'num-warn': row.missing_count > 0 }">{{ row.missing_count }}</span></template></el-table-column>
          <el-table-column prop="leave_days" label="请假(天)" width="80" align="center" />
          <el-table-column prop="overtime_hours" label="加班(h)" width="75" align="center" />
          <el-table-column prop="trip_days" label="出差(天)" width="80" align="center" />
          <el-table-column label="封账" width="85">
            <template #default="{ row }">
              <el-tag size="small" :type="dictTag('lockStatus', row.lock_status)">{{ dictLabel('lockStatus', row.lock_status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.lock_status === 0 && canLock" size="small" link type="primary" @click="onLock(row)">封账</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="query.current" class="pager" background layout="total, prev, pager, next" :total="list.total" :page-size="query.size" @current-change="load" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { pageAttendanceMonths, lockAttendanceMonth } from '@/api/attendance'
import { getDict, dictLabel, dictTag } from '@/dict'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const canLock = computed(() => userStore.roles.some((r) => ['ROLE_HR', 'ROLE_ADMIN'].includes(r)))
const period = ref(null)
const query = reactive({ current: 1, size: 20, year: null, month: null, lockStatus: null })
const list = ref({ records: [], total: 0 })

async function load() {
  list.value = await pageAttendanceMonths(query)
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

async function onLock(row) {
  await ElMessageBox.confirm(`确认封账 ${row.employee_name} 的 ${row.record_year}-${row.record_month} 月报？封账后不可修改（BR-04-03），并作为薪资核算输入（BR-05-02）。`, '封账确认')
  await lockAttendanceMonth(row.id)
  ElMessage.success('已封账')
  load()
}

async function onLockAll() {
  const unlocked = list.value.records.filter((r) => r.lock_status === 0)
  if (!unlocked.length) return ElMessage.info('筛选结果中无未封账月报')
  await ElMessageBox.confirm(`将封账筛选结果中 ${unlocked.length} 条未封账月报，确认继续？`, '批量封账')
  for (const r of unlocked) {
    await lockAttendanceMonth(r.id)
  }
  ElMessage.success(`已封账 ${unlocked.length} 条`)
  load()
}

onMounted(load)
</script>

<style scoped>
.pager { margin-top: 12px; justify-content: flex-end; }
.num-warn { color: #b88230; font-weight: 700; }
.num-danger { color: #c45656; font-weight: 700; }
</style>
