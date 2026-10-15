<template>
  <div class="page-container">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">我的薪资条（F-05-06，密码验证在对接真实后端后启用）</span>
      </div>
      <div class="panel-body">
        <el-table :data="list.records" border>
          <el-table-column label="薪资月份" width="100"><template #default="{ row }"><span class="mono">{{ row.salary_year }}-{{ String(row.salary_month).padStart(2, '0') }}</span></template></el-table-column>
          <el-table-column label="基本工资" width="110" align="right"><template #default="{ row }"><span class="mono">{{ formatMoney(row.base_salary) }}</span></template></el-table-column>
          <el-table-column label="岗位工资" width="110" align="right"><template #default="{ row }"><span class="mono">{{ formatMoney(row.post_salary) }}</span></template></el-table-column>
          <el-table-column label="绩效工资" width="110" align="right"><template #default="{ row }"><span class="mono">{{ formatMoney(row.performance_salary) }}</span></template></el-table-column>
          <el-table-column label="应发合计" width="115" align="right"><template #default="{ row }"><span class="mono">{{ formatMoney(row.gross_pay) }}</span></template></el-table-column>
          <el-table-column label="个人缴纳合计" width="125" align="right">
            <template #default="{ row }"><span class="mono">{{ formatMoney(row.social_personal + row.fund_personal + row.tax_amount) }}</span></template>
          </el-table-column>
          <el-table-column label="实发合计" width="115" align="right"><template #default="{ row }"><b class="mono" style="color: #c45656">{{ formatMoney(row.net_pay) }}</b></template></el-table-column>
          <el-table-column label="状态" width="85">
            <template #default="{ row }"><el-tag size="small" :type="dictTag('payStatus', row.pay_status)">{{ dictLabel('payStatus', row.pay_status) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="primary" @click="viewDetail(row)">查看明细</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-alert style="margin-top: 12px" type="info" :closable="false" show-icon title="薪资数据加密存储，查看与导出操作将写入审计日志（BR-05-05）" />
      </div>
    </div>

    <el-dialog v-model="detailVisible" :title="`薪资条明细 ${detail ? detail.record.salary_year + '-' + String(detail.record.salary_month).padStart(2, '0') : ''}`" width="560px">
      <template v-for="group in detailGroups" :key="group.type">
        <div class="group-title">{{ group.title }}</div>
        <el-table :data="group.items" size="small" border>
          <el-table-column prop="item_name" label="项目" />
          <el-table-column prop="item_amount" label="金额" width="120" align="right"><template #default="{ row }"><span class="mono">{{ formatMoney(row.item_amount) }}</span></template></el-table-column>
          <el-table-column prop="remark" label="说明" min-width="140" />
        </el-table>
      </template>
      <div class="net-line mono">实发合计：{{ formatMoney(detail?.record?.net_pay) }}</div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getMyPayslips, getPayslipItems } from '@/api/salary'
import { dictLabel, dictTag } from '@/dict'
import { formatMoney } from '@/utils/format'

const list = ref({ records: [], total: 0 })
const detailVisible = ref(false)
const detail = ref(null)

const detailGroups = computed(() => {
  if (!detail.value) return []
  const g = [
    { type: 1, title: '应发项', items: [] },
    { type: 2, title: '扣款项', items: [] }
  ]
  for (const it of detail.value.items) g.find((x) => x.type === it.item_type)?.items.push(it)
  return g.filter((x) => x.items.length)
})

async function viewDetail(row) {
  detail.value = await getPayslipItems(row.id)
  detailVisible.value = true
}

onMounted(async () => {
  list.value = await getMyPayslips()
})
</script>

<style scoped>
.group-title { font-weight: 600; margin: 12px 0 6px; color: #1f2d3d; }
.net-line { margin-top: 14px; text-align: right; font-size: 15px; font-weight: 700; color: #c45656; }
</style>
