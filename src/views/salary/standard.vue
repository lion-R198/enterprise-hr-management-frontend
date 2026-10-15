<template>
  <div class="page-container">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">薪资标准（F-05-01，按职级模板套用）</span>
        <el-button type="primary" size="small" @click="openCreate">新增标准</el-button>
      </div>
      <div class="panel-body">
        <el-table :data="list.records" border>
          <el-table-column prop="standard_code" label="标准编码" width="130"><template #default="{ row }"><span class="mono">{{ row.standard_code }}</span></template></el-table-column>
          <el-table-column prop="standard_name" label="标准名称" min-width="130" />
          <el-table-column label="岗位序列" width="110"><template #default="{ row }">{{ dictLabel('positionSeq', row.position_seq) }}</template></el-table-column>
          <el-table-column prop="job_level" label="职级" width="80"><template #default="{ row }"><span class="mono">{{ row.job_level || '-' }}</span></template></el-table-column>
          <el-table-column label="基本工资" width="110" align="right"><template #default="{ row }"><span class="mono">{{ formatMoney(row.base_salary) }}</span></template></el-table-column>
          <el-table-column label="岗位工资" width="110" align="right"><template #default="{ row }"><span class="mono">{{ formatMoney(row.post_salary) }}</span></template></el-table-column>
          <el-table-column label="绩效工资基数" width="120" align="right"><template #default="{ row }"><span class="mono">{{ formatMoney(row.performance_salary) }}</span></template></el-table-column>
          <el-table-column label="固定补贴" width="110" align="right"><template #default="{ row }"><span class="mono">{{ formatMoney(row.allowance) }}</span></template></el-table-column>
          <el-table-column label="月标准合计" width="120" align="right">
            <template #default="{ row }"><b class="mono">{{ formatMoney(row.base_salary + row.post_salary + row.performance_salary + row.allowance) }}</b></template>
          </el-table-column>
          <el-table-column prop="effective_date" label="生效日期" width="105"><template #default="{ row }"><span class="mono">{{ row.effective_date }}</span></template></el-table-column>
        </el-table>
        <el-pagination v-model:current-page="query.current" class="pager" background layout="total, prev, pager, next" :total="list.total" :page-size="query.size" @current-change="load" />
      </div>
    </div>

    <el-dialog v-model="createVisible" title="新增薪资标准" width="520px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="标准编码" required><el-input v-model="form.standardCode" placeholder="如 STD-TECH-P6" class="mono" /></el-form-item>
        <el-form-item label="标准名称" required><el-input v-model="form.standardName" /></el-form-item>
        <el-form-item label="岗位序列">
          <el-select v-model="form.positionSeq" style="width: 100%">
            <el-option v-for="d in getDict('positionSeq')" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用职级"><el-input v-model="form.jobLevel" class="mono" /></el-form-item>
        <el-form-item label="基本工资"><el-input-number v-model="form.baseSalary" :min="0" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="岗位工资"><el-input-number v-model="form.postSalary" :min="0" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="绩效工资基数"><el-input-number v-model="form.performanceSalary" :min="0" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="固定补贴"><el-input-number v-model="form.allowance" :min="0" :controls="false" style="width: 100%" /></el-form-item>
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
import { pageSalaryStandards, createSalaryStandard } from '@/api/salary'
import { getDict, dictLabel } from '@/dict'
import { formatMoney } from '@/utils/format'

const query = reactive({ current: 1, size: 10 })
const list = ref({ records: [], total: 0 })
const createVisible = ref(false)
const form = reactive({})

async function load() {
  list.value = await pageSalaryStandards(query)
}
function openCreate() {
  Object.assign(form, { standardCode: '', standardName: '', positionSeq: 2, jobLevel: '', baseSalary: 0, postSalary: 0, performanceSalary: 0, allowance: 0 })
  createVisible.value = true
}
async function onCreate() {
  if (!form.standardCode || !form.standardName) return ElMessage.warning('编码与名称为必填')
  await createSalaryStandard(form)
  ElMessage.success('已保存')
  createVisible.value = false
  load()
}

onMounted(load)
</script>

<style scoped>
.pager { margin-top: 12px; justify-content: flex-end; }
</style>
