<template>
  <div class="page-container">
    <!-- F-01-01 数据概览 -->
    <div class="stat-grid">
      <div v-for="s in statCards" :key="s.key" class="stat-card">
        <div class="stat-value mono">{{ s.value }}</div>
        <div class="stat-label">{{ s.label }}</div>
        <div v-if="s.sub" class="stat-sub">{{ s.sub }}</div>
      </div>
    </div>

    <el-row :gutter="12">
      <!-- F-01-02 待办事项 -->
      <el-col :span="14">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">待办事项</span>
            <el-button link type="primary" size="small" @click="load">刷新</el-button>
          </div>
          <div class="panel-body todo-list">
            <div v-for="t in todos" :key="t.id" class="todo-item">
              <el-tag :type="dictTag('priority', t.priority)" size="small" class="mono">
                P{{ t.priority }}
              </el-tag>
              <el-tag size="small" type="info" effect="plain">{{ dictLabel('todoType', t.task_type) }}</el-tag>
              <span class="todo-title">{{ t.task_title }}</span>
              <span class="text-muted mono">{{ (t.deadline || '').slice(5, 16) }}</span>
              <el-button size="small" type="primary" plain @click="onHandleTodo(t)">去处理</el-button>
            </div>
            <el-empty v-if="!todos.length" description="暂无待办，很好！" :image-size="60" />
          </div>
        </div>
      </el-col>

      <!-- F-01-03 通知公告 -->
      <el-col :span="10">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">通知公告</span>
          </div>
          <div class="panel-body notice-list">
            <div v-for="n in notices" :key="n.id" class="notice-item" @click="viewNotice(n)">
              <el-tag v-if="n.is_top" type="danger" size="small">置顶</el-tag>
              <el-tag size="small" :type="dictTag('noticeType', n.notice_type)" effect="plain">
                {{ dictLabel('noticeType', n.notice_type) }}
              </el-tag>
              <span class="notice-title">{{ n.title }}</span>
              <span class="text-muted mono">{{ (n.publish_time || '').slice(5, 10) }}</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- F-01-04 图表分析 -->
    <el-row :gutter="12" style="margin-top: 12px">
      <el-col :span="12">
        <div class="panel">
          <div class="panel-header"><span class="panel-title">人员流动趋势（近 6 月）</span></div>
          <div class="panel-body"><div ref="trendRef" class="chart" /></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="panel">
          <div class="panel-header"><span class="panel-title">部门人数分布</span></div>
          <div class="panel-body"><div ref="pieRef" class="chart" /></div>
        </div>
      </el-col>
    </el-row>

    <!-- 公告详情 -->
    <el-dialog v-model="noticeVisible" :title="currentNotice?.title" width="640px">
      <div class="text-muted mono" style="margin-bottom: 12px">
        {{ dictLabel('noticeType', currentNotice?.notice_type) }} · {{ currentNotice?.publish_time }}
      </div>
      <div style="line-height: 1.9; white-space: pre-wrap">{{ currentNotice?.content }}</div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { getSummary, getTodos, getNotices, getCharts, handleTodo } from '@/api/dashboard'
import { dictLabel, dictTag } from '@/dict'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const summary = ref({})
const todos = ref([])
const notices = ref([])
const trendRef = ref()
const pieRef = ref()
const noticeVisible = ref(false)
const currentNotice = ref(null)
let trendChart = null
let pieChart = null

const statCards = computed(() => {
  const s = summary.value
  const rate = s.headcountLimit ? Math.round((s.totalEmployees / s.headcountLimit) * 100) : null
  return [
    { key: 'total', label: '在职人数', value: s.totalEmployees ?? '-', sub: '含试用期' },
    { key: 'hired', label: '本月入职', value: s.monthHired ?? '-' },
    { key: 'left', label: '本月离职', value: s.monthLeft ?? '-' },
    { key: 'dept', label: '部门数', value: s.deptCount ?? '-' },
    { key: 'rate', label: '编制占用率', value: rate !== null ? rate + '%' : '-', sub: 'F-03-04' },
    { key: 'abnormal', label: '今日考勤异常', value: s.attendanceAbnormal ?? '-', sub: '迟到/缺卡/旷工' },
    { key: 'pending', label: '待我审批', value: s.pendingApprovals ?? '-' },
    { key: 'contract', label: '合同 60 天内到期', value: s.contractExpiring ?? '-' }
  ]
})

function viewNotice(n) {
  currentNotice.value = n
  noticeVisible.value = true
}

async function onHandleTodo(t) {
  await handleTodo(t.id, { result: 1 })
  ElMessage.success('已处理，请在对应模块完成后续操作')
  load()
}

function renderCharts(data) {
  if (trendRef.value) {
    trendChart = echarts.init(trendRef.value)
    trendChart.setOption({
      color: ['#0e5fd8', '#c9a227'],
      tooltip: { trigger: 'axis' },
      legend: { data: ['入职', '离职'], top: 0 },
      grid: { left: 40, right: 16, top: 32, bottom: 24 },
      xAxis: { type: 'category', data: data.trend.map((t) => t.month) },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        { name: '入职', type: 'line', smooth: false, data: data.trend.map((t) => t.hired) },
        { name: '离职', type: 'line', smooth: false, data: data.trend.map((t) => t.left) }
      ]
    })
  }
  if (pieRef.value) {
    pieChart = echarts.init(pieRef.value)
    pieChart.setOption({
      color: ['#0e5fd8', '#3d7be0', '#7aa3ec', '#c9a227', '#8fa8c0', '#5c6f80', '#2c3e50'],
      tooltip: { trigger: 'item', formatter: '{b}: {c} 人 ({d}%)' },
      legend: { orient: 'vertical', right: 8, top: 'middle', textStyle: { fontSize: 12 } },
      series: [
        {
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['40%', '52%'],
          label: { show: true, formatter: '{b}\n{c} 人' },
          data: data.deptDistribution.filter((d) => d.value > 0)
        }
      ]
    })
  }
}

async function load() {
  const [s, t, n, c] = await Promise.all([getSummary(), getTodos(), getNotices(), getCharts()])
  summary.value = s
  todos.value = t.records
  notices.value = n.records
  renderCharts(c)
}

onMounted(() => {
  load()
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  trendChart?.dispose()
  pieChart?.dispose()
})
function onResize() {
  trendChart?.resize()
  pieChart?.resize()
}
</script>

<style lang="scss" scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
.stat-card {
  background: #fff;
  border: 1px solid var(--ehr-border);
  border-top: 3px solid var(--ehr-primary);
  padding: 14px 12px;

  &:nth-child(3n) { border-top-color: #c9a227; }
  .stat-value { font-size: 24px; font-weight: 700; color: #1f2d3d; }
  .stat-label { color: #6b7684; margin-top: 4px; font-size: 12px; }
  .stat-sub { color: #9aa5b1; font-size: 11px; margin-top: 2px; font-family: var(--ehr-mono); }
}

.todo-list, .notice-list {
  padding: 0 !important;
  max-height: 260px;
  overflow: auto;
}
.todo-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid #eef1f4;
  font-size: 13px;

  .todo-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .mono { font-size: 12px; }
}
.notice-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid #eef1f4;
  cursor: pointer;
  font-size: 13px;

  &:hover { background: #f7f9fb; }
  .notice-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}
.chart { height: 280px; }
</style>
