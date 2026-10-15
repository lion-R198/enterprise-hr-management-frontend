<template>
  <div class="page-container">
    <el-row :gutter="12">
      <el-col :span="14">
        <div class="panel">
          <div class="panel-header"><span class="panel-title">我的培训档案（F-07-06）</span></div>
          <div class="panel-body">
            <el-table :data="data.records" border size="small">
              <el-table-column prop="course_name" label="课程" min-width="180" show-overflow-tooltip />
              <el-table-column label="类型" width="90"><template #default="{ row }">{{ dictLabel('trainType', row.train_type) }}</template></el-table-column>
              <el-table-column prop="hours" label="学时" width="60" align="center" />
              <el-table-column prop="train_date" label="培训日期" width="100"><template #default="{ row }"><span class="mono">{{ row.train_date }}</span></template></el-table-column>
              <el-table-column prop="exam_score" label="成绩" width="60" align="center" />
              <el-table-column label="结果" width="80"><template #default="{ row }"><el-tag size="small" :type="dictTag('passStatus', row.pass_status)">{{ dictLabel('passStatus', row.pass_status) }}</el-tag></template></el-table-column>
            </el-table>
            <div class="summary mono">累计学时：{{ data.totalHours ?? 0 }} h</div>
          </div>
        </div>
      </el-col>
      <el-col :span="10">
        <div class="panel">
          <div class="panel-header"><span class="panel-title">我的报名</span></div>
          <div class="panel-body">
            <div v-for="e in data.enrolls || []" :key="e.id" class="enroll-item">
              <el-tag size="small" :type="dictTag('trainPlanStatus', e.status)">{{ dictLabel('trainPlanStatus', e.status) }}</el-tag>
              <span class="enroll-name">{{ e.plan_name }}</span>
              <span class="text-muted mono">{{ (e.start_date || '').slice(5) }}</span>
            </div>
            <el-empty v-if="!(data.enrolls || []).length" description="暂无报名" :image-size="50" />
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getMyTraining } from '@/api/training'
import { dictLabel, dictTag } from '@/dict'

const data = ref({})
onMounted(async () => {
  data.value = await getMyTraining()
})
</script>

<style scoped>
.summary { margin-top: 12px; color: #0e5fd8; font-weight: 700; }
.enroll-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 0;
  border-bottom: 1px solid #eef1f4;
  font-size: 13px;
  .enroll-name { flex: 1; }
}
</style>
