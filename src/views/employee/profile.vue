<template>
  <div class="page-container">
    <div class="panel">
      <div class="panel-header"><span class="panel-title">我的档案</span></div>
      <div class="panel-body">
        <el-descriptions v-if="me" :column="2" border>
          <el-descriptions-item label="工号"><span class="mono">{{ me.emp_no }}</span></el-descriptions-item>
          <el-descriptions-item label="姓名">{{ me.name }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ dictLabel('gender', me.gender) }}</el-descriptions-item>
          <el-descriptions-item label="年龄">{{ me.age ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="部门">{{ me.dept_name }}</el-descriptions-item>
          <el-descriptions-item label="职位">{{ me.position }}</el-descriptions-item>
          <el-descriptions-item label="入职日期"><span class="mono">{{ me.hire_date }}</span></el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag size="small" :type="dictTag('employeeStatus', me.status)">{{ dictLabel('employeeStatus', me.status) }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="手机号"><span class="mono">{{ me.phone }}</span></el-descriptions-item>
          <el-descriptions-item label="邮箱"><span class="mono">{{ me.email }}</span></el-descriptions-item>
          <el-descriptions-item label="学历">{{ dictLabel('education', me.education) }}</el-descriptions-item>
          <el-descriptions-item label="毕业院校">{{ me.graduate_school }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin: 18px 0 8px">我的异动记录</h4>
        <el-table :data="changes" border size="small">
          <el-table-column label="类型" width="90"><template #default="{ row }"><el-tag size="small" :type="dictTag('changeType', row.change_type)">{{ dictLabel('changeType', row.change_type) }}</el-tag></template></el-table-column>
          <el-table-column prop="after_position" label="异动后职位" min-width="140" />
          <el-table-column prop="effect_date" label="生效日期" width="110"><template #default="{ row }"><span class="mono">{{ row.effect_date }}</span></template></el-table-column>
          <el-table-column prop="reason" label="原因" min-width="160" />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getEmployee, getEmployeeChanges } from '@/api/employee'
import { dictLabel, dictTag } from '@/dict'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const me = ref(null)
const changes = ref([])

onMounted(async () => {
  me.value = await getEmployee(userStore.employeeId)
  changes.value = (await getEmployeeChanges(userStore.employeeId)).records
})
</script>
