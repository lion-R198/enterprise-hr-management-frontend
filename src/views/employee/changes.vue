<template>
  <div class="page-container">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">异动记录（F-02-03 调动转岗）</span>
      </div>
      <div class="panel-body">
        <el-form inline>
          <el-form-item label="异动类型">
            <el-select v-model="query.changeType" clearable style="width: 140px">
              <el-option v-for="d in getDict('changeType')" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="search">查 询</el-button>
            <el-button v-if="canOperate" type="primary" plain @click="openCreate">办理异动</el-button>
          </el-form-item>
        </el-form>
        <el-table :data="list.records" border>
          <el-table-column prop="apply_no || id" label="单号" width="90"><template #default="{ row }"><span class="mono">#{{ row.id }}</span></template></el-table-column>
          <el-table-column prop="employee_name" label="员工" width="90" />
          <el-table-column label="类型" width="90">
            <template #default="{ row }"><el-tag size="small" :type="dictTag('changeType', row.change_type)">{{ dictLabel('changeType', row.change_type) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="异动前" min-width="140">
            <template #default="{ row }">{{ row.before_dept_name || '-' }} / {{ row.before_position || '-' }}</template>
          </el-table-column>
          <el-table-column label="异动后" min-width="140">
            <template #default="{ row }">{{ row.after_dept_name || '-' }} / {{ row.after_position || '-' }}</template>
          </el-table-column>
          <el-table-column label="薪资变化" width="150">
            <template #default="{ row }">
              <span class="mono">{{ row.before_salary ?? '-' }} → {{ row.after_salary ?? '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="effect_date" label="生效日期" width="105"><template #default="{ row }"><span class="mono">{{ row.effect_date }}</span></template></el-table-column>
          <el-table-column prop="reason" label="原因" min-width="140" show-overflow-tooltip />
        </el-table>
        <el-pagination v-model:current-page="query.current" class="pager" background layout="total, prev, pager, next" :total="list.total" :page-size="query.size" @current-change="load" />
      </div>
    </div>

    <el-dialog v-model="createVisible" title="办理异动" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="员工" required>
          <el-select v-model="form.employeeId" filterable style="width: 100%">
            <el-option v-for="e in emps" :key="e.id" :label="`${e.emp_no} ${e.name}（${e.position || ''}）`" :value="e.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="异动类型" required>
          <el-select v-model="form.changeType" style="width: 100%">
            <el-option v-for="d in getDict('changeType').filter((x) => [3, 4, 5, 6].includes(x.value))" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="调至部门">
          <el-select v-model="form.afterDeptId" clearable style="width: 100%">
            <el-option v-for="d in depts" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="调至岗位">
          <el-select v-model="form.afterPositionId" clearable style="width: 100%">
            <el-option v-for="p in positions" :key="p.id" :label="p.position_name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="调整后薪资"><el-input-number v-model="form.afterSalary" :min="0" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="生效日期" required>
          <el-date-picker v-model="form.effectDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="异动原因"><el-input v-model="form.reason" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取 消</el-button>
        <el-button type="primary" @click="onCreate">保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { pageChanges, createChange } from '@/api/employee'
import { getDepts, getPositions } from '@/api/dept'
import { pageEmployees } from '@/api/employee'
import { getDict, dictLabel, dictTag } from '@/dict'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const canOperate = computed(() => userStore.roles.includes('ROLE_HR') || userStore.roles.includes('ROLE_ADMIN'))
const query = reactive({ current: 1, size: 10, changeType: null })
const list = ref({ records: [], total: 0 })
const depts = ref([])
const positions = ref([])
const emps = ref([])
const createVisible = ref(false)
const form = reactive({ employeeId: null, changeType: null, afterDeptId: null, afterPositionId: null, afterSalary: null, effectDate: '', reason: '' })

async function load() {
  list.value = await pageChanges(query)
}
function search() { query.current = 1; load() }

function openCreate() {
  Object.assign(form, { employeeId: null, changeType: null, afterDeptId: null, afterPositionId: null, afterSalary: null, effectDate: '', reason: '' })
  createVisible.value = true
}
async function onCreate() {
  if (!form.employeeId || !form.changeType || !form.effectDate) return ElMessage.warning('请填写员工、类型与生效日期')
  await createChange(form)
  ElMessage.success('异动已生效，主数据已同步更新')
  createVisible.value = false
  load()
}

onMounted(async () => {
  load()
  depts.value = await getDepts()
  positions.value = (await getPositions({ size: 100 })).records
  emps.value = (await pageEmployees({ current: 1, size: 100, status: 1 })).records
})
</script>

<style scoped>
.pager { margin-top: 12px; justify-content: flex-end; }
</style>
