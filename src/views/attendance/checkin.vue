<template>
  <div class="page-container">
    <!-- 今日打卡（F-04-01） -->
    <el-row :gutter="12">
      <el-col :span="8">
        <div class="panel punch-card">
          <div class="panel-header"><span class="panel-title">今日打卡</span></div>
          <div class="panel-body" style="text-align: center">
            <div class="punch-time mono">{{ clock }}</div>
            <div class="punch-date">{{ todayStr }}</div>
            <div class="punch-status">
              <el-tag v-if="todayRecord?.first_check_in" type="success" size="small">上班 {{ todayRecord.first_check_in.slice(11, 16) }}</el-tag>
              <el-tag v-else type="info" size="small">未打上班卡</el-tag>
              <el-tag v-if="todayRecord?.last_check_out" type="success" size="small">下班 {{ todayRecord.last_check_out.slice(11, 16) }}</el-tag>
              <el-tag v-else type="info" size="small">未打下班卡</el-tag>
              <el-tag v-if="todayRecord?.late_minutes > 0" type="warning" size="small">迟到 {{ todayRecord.late_minutes }} 分钟</el-tag>
            </div>
            <div style="margin-top: 18px; display: flex; gap: 10px; justify-content: center">
              <el-button type="primary" size="large" :disabled="!!todayRecord?.first_check_in" :loading="punching" @click="onCheckin">上班打卡</el-button>
              <el-button type="warning" size="large" :disabled="!todayRecord?.first_check_in || !!todayRecord?.last_check_out" :loading="punching" @click="onCheckout">下班打卡</el-button>
            </div>
            <div class="text-muted" style="margin-top: 12px; font-size: 12px">班次：{{ shift?.shift_name }}（{{ shift?.work_start?.slice(0, 5) }} - {{ shift?.work_end?.slice(0, 5) }}，容忍 {{ shift?.late_tolerance }} 分钟）</div>
          </div>
        </div>
      </el-col>
      <el-col :span="16">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">打卡记录（近 14 天）</span>
            <span class="text-muted" style="font-size: 12px">异常类型：迟到 / 早退 / 缺卡 / 旷工</span>
          </div>
          <div class="panel-body">
            <el-table :data="records.records" border size="small" max-height="360">
              <el-table-column prop="attendance_date" label="日期" width="100"><template #default="{ row }"><span class="mono">{{ row.attendance_date }}</span></template></el-table-column>
              <el-table-column prop="employee_name" label="员工" width="80" />
              <el-table-column prop="first_check_in" label="上班打卡" width="90"><template #default="{ row }"><span class="mono">{{ row.first_check_in?.slice(11, 16) || '-' }}</span></template></el-table-column>
              <el-table-column prop="last_check_out" label="下班打卡" width="90"><template #default="{ row }"><span class="mono">{{ row.last_check_out?.slice(11, 16) || '-' }}</span></template></el-table-column>
              <el-table-column prop="work_hours" label="工时(h)" width="80"><template #default="{ row }"><span class="mono">{{ row.work_hours }}</span></template></el-table-column>
              <el-table-column label="考勤结果" width="90">
                <template #default="{ row }"><el-tag size="small" :type="dictTag('attendanceStatus', row.attendance_status)">{{ dictLabel('attendanceStatus', row.attendance_status) }}</el-tag></template>
              </el-table-column>
              <el-table-column prop="remark" label="备注" min-width="110" show-overflow-tooltip />
            </el-table>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getToday, checkin, checkout, pageAttendance } from '@/api/attendance'
import { dictLabel, dictTag } from '@/dict'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const todayRecord = ref(null)
const shift = ref(null)
const records = ref({ records: [], total: 0 })
const clock = ref('')
const punching = ref(false)
const todayStr = computed(() => {
  const d = new Date()
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} 星期${week}`
})

let timer = null
async function load() {
  const t = await getToday()
  todayRecord.value = t.record
  shift.value = t.shift
  records.value = await pageAttendance({ current: 1, size: 14 })
}

async function onCheckin() {
  punching.value = true
  try {
    const r = await checkin()
    ElMessage.success(`上班打卡成功：${r.checkinTime.slice(11, 16)}${r.checkinTime.slice(11) > '09:05:00' ? '（已计迟到）' : ''}`)
    load()
  } finally {
    punching.value = false
  }
}
async function onCheckout() {
  punching.value = true
  try {
    const r = await checkout()
    ElMessage.success(`下班打卡成功：${r.checkoutTime.slice(11, 16)}`)
    load()
  } finally {
    punching.value = false
  }
}

onMounted(() => {
  load()
  timer = setInterval(() => {
    clock.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  }, 1000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.punch-time { font-size: 40px; font-weight: 700; color: #1f2d3d; margin-top: 6px; }
.punch-date { color: #6b7684; margin: 4px 0 10px; }
.punch-status { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; }
</style>
