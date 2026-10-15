<template>
  <div class="page-container">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">考核方案（F-08-01，BR-08-03 等级分布可强制）</span>
        <el-button type="primary" size="small" @click="openCreate">新增方案</el-button>
      </div>
      <div class="panel-body">
        <el-table :data="list.records" border>
          <el-table-column prop="plan_code" label="方案编号" width="110"><template #default="{ row }"><span class="mono">{{ row.plan_code }}</span></template></el-table-column>
          <el-table-column prop="plan_name" label="方案名称" min-width="170" />
          <el-table-column label="周期" width="75"><template #default="{ row }">{{ dictLabel('periodType', row.period_type) }}</template></el-table-column>
          <el-table-column label="考核区间" width="190"><template #default="{ row }"><span class="mono">{{ row.start_date }} ~ {{ row.end_date }}</span></template></el-table-column>
          <el-table-column label="权重（自评/主管/复核）" width="170" align="center">
            <template #default="{ row }"><span class="mono">{{ row.self_weight }} / {{ row.leader_weight }} / {{ row.review_weight }}</span></template>
          </el-table-column>
          <el-table-column prop="recordCount" label="考核人数" width="85" align="center" />
          <el-table-column label="状态" width="85"><template #default="{ row }"><el-tag size="small" :type="dictTag('perfPlanStatus', row.status)">{{ dictLabel('perfPlanStatus', row.status) }}</el-tag></template></el-table-column>
          <el-table-column label="操作" width="90" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === 1" size="small" link type="primary" @click="onPublish(row)">发 布</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="query.current" class="pager" background layout="total, prev, pager, next" :total="list.total" :page-size="query.size" @current-change="load" />
      </div>
    </div>

    <el-dialog v-model="createVisible" title="新增考核方案" width="560px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="方案名称" required><el-input v-model="form.planName" placeholder="如 2026年Q4绩效考核" /></el-form-item>
        <el-form-item label="考核周期">
          <el-select v-model="form.periodType" style="width: 100%">
            <el-option v-for="d in getDict('periodType')" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="考核年度" required><el-input-number v-model="form.planYear" :min="2024" :max="2030" style="width: 100%" /></el-form-item>
        <el-form-item label="开始日期"><el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        <el-form-item label="截止日期"><el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        <el-form-item label="等级规则"><el-input v-model="form.gradeRule" class="mono" /></el-form-item>
        <el-form-item label="强制分布">
          <el-switch v-model="form.forceDistribution" :active-value="1" :inactive-value="0" />
          <el-input v-if="form.forceDistribution" v-model="form.distributionRule" class="mono" style="margin-left: 10px; width: 240px" placeholder="S:10,A:20,B:50,C:15,D:5" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取 消</el-button>
        <el-button type="primary" @click="onCreate">保 存（草稿）</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { pagePerfPlans, createPerfPlan, publishPerfPlan } from '@/api/performance'
import { getDict, dictLabel, dictTag } from '@/dict'

const query = reactive({ current: 1, size: 10 })
const list = ref({ records: [], total: 0 })
const createVisible = ref(false)
const form = reactive({})

async function load() {
  list.value = await pagePerfPlans(query)
}
function openCreate() {
  Object.assign(form, { planName: '', periodType: 2, planYear: 2026, startDate: '', endDate: '', gradeRule: 'S:90+,A:80-89,B:70-79,C:60-69,D:<60', forceDistribution: 0, distributionRule: '' })
  createVisible.value = true
}
async function onCreate() {
  if (!form.planName) return ElMessage.warning('请填写方案名称')
  await createPerfPlan(form)
  ElMessage.success('方案已保存（草稿）')
  createVisible.value = false
  load()
}
async function onPublish(row) {
  await ElMessageBox.confirm(`发布方案「${row.plan_name}」？发布后将自动为全体在职员工生成考核记录并进入评分中。`, '发布确认')
  await publishPerfPlan(row.id)
  ElMessage.success('方案已发布，考核记录已生成')
  load()
}

onMounted(load)
</script>

<style scoped>
.pager { margin-top: 12px; justify-content: flex-end; }
</style>
