<template>
  <div class="page-container">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">培训计划（F-07-01，BR-07-01 满员自动关闭报名）</span>
        <el-button type="primary" size="small" @click="openCreate">新增计划</el-button>
      </div>
      <div class="panel-body">
        <el-table :data="list.records" border>
          <el-table-column prop="plan_code" label="计划编号" width="120"><template #default="{ row }"><span class="mono">{{ row.plan_code }}</span></template></el-table-column>
          <el-table-column prop="plan_name" label="计划名称" min-width="200" show-overflow-tooltip />
          <el-table-column label="类型" width="90"><template #default="{ row }">{{ dictLabel('trainType', row.train_type) }}</template></el-table-column>
          <el-table-column label="对象范围" width="90">
            <template #default="{ row }">{{ ['全体', '指定部门', '指定岗位', '指定人员'][row.target_scope - 1] }}</template>
          </el-table-column>
          <el-table-column label="预算" width="100" align="right"><template #default="{ row }"><span class="mono">¥{{ Number(row.budget_amount).toLocaleString() }}</span></template></el-table-column>
          <el-table-column prop="start_date" label="开始" width="100"><template #default="{ row }"><span class="mono">{{ row.start_date }}</span></template></el-table-column>
          <el-table-column prop="end_date" label="结束" width="100"><template #default="{ row }"><span class="mono">{{ row.end_date }}</span></template></el-table-column>
          <el-table-column prop="enrollCount" label="已报名" width="75" align="center" />
          <el-table-column label="状态" width="85"><template #default="{ row }"><el-tag size="small" :type="dictTag('trainPlanStatus', row.status)">{{ dictLabel('trainPlanStatus', row.status) }}</el-tag></template></el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button v-if="[2, 3].includes(row.status)" size="small" link type="primary" @click="onEnroll(row)">报 名</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="query.current" class="pager" background layout="total, prev, pager, next" :total="list.total" :page-size="query.size" @current-change="load" />
      </div>
    </div>

    <el-dialog v-model="createVisible" title="新增培训计划" width="520px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="计划名称" required><el-input v-model="form.planName" /></el-form-item>
        <el-form-item label="所属年度" required><el-input-number v-model="form.planYear" :min="2024" :max="2030" style="width: 100%" /></el-form-item>
        <el-form-item label="培训类型">
          <el-select v-model="form.trainType" style="width: 100%">
            <el-option v-for="d in getDict('trainType')" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="预算(元)"><el-input-number v-model="form.budgetAmount" :min="0" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="开始日期"><el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        <el-form-item label="结束日期"><el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        <el-form-item label="计划说明"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
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
import { ElMessage } from 'element-plus'
import { pageTrainingPlans, createTrainingPlan, enrollTraining } from '@/api/training'
import { getDict, dictLabel, dictTag } from '@/dict'

const query = reactive({ current: 1, size: 10 })
const list = ref({ records: [], total: 0 })
const createVisible = ref(false)
const form = reactive({})

async function load() {
  list.value = await pageTrainingPlans(query)
}
function openCreate() {
  Object.assign(form, { planName: '', planYear: 2026, trainType: 2, budgetAmount: 0, startDate: '', endDate: '', description: '' })
  createVisible.value = true
}
async function onCreate() {
  if (!form.planName) return ElMessage.warning('请填写计划名称')
  await createTrainingPlan(form)
  ElMessage.success('计划已保存（草稿）')
  createVisible.value = false
  load()
}
async function onEnroll(row) {
  await enrollTraining(row.id)
  ElMessage.success('报名成功')
  load()
}

onMounted(load)
</script>

<style scoped>
.pager { margin-top: 12px; justify-content: flex-end; }
</style>
