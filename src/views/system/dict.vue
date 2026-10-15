<template>
  <div class="page-container">
    <el-row :gutter="12">
      <!-- 字典类型 -->
      <el-col :span="10">
        <div class="panel">
          <div class="panel-header"><span class="panel-title">字典类型（F-09-04）</span></div>
          <div class="panel-body">
            <el-table
              :data="types.records"
              border
              size="small"
              highlight-current-row
              @current-change="onSelectType"
            >
              <el-table-column prop="dict_type" label="类型编码" width="140"><template #default="{ row }"><span class="mono">{{ row.dict_type }}</span></template></el-table-column>
              <el-table-column prop="dict_name" label="类型名称" width="100" />
              <el-table-column prop="remark" label="关联字段" min-width="130" show-overflow-tooltip />
            </el-table>
            <el-alert style="margin-top: 10px" type="info" :closable="false" title="字典项与数据库字段注释同源；被业务数据引用的字典项禁止删除，仅可停用（BR-09-04）" />
          </div>
        </div>
      </el-col>
      <!-- 字典项 -->
      <el-col :span="14">
        <div class="panel">
          <div class="panel-header"><span class="panel-title">字典项：{{ currentType?.dict_name || '（请选择左侧类型）' }}</span></div>
          <div class="panel-body">
            <el-table :data="items.records" border size="small">
              <el-table-column prop="item_value" label="值" width="90"><template #default="{ row }"><span class="mono">{{ row.item_value }}</span></template></el-table-column>
              <el-table-column prop="item_label" label="显示文本" min-width="110" />
              <el-table-column prop="sort_no" label="排序" width="60" align="center" />
              <el-table-column label="默认" width="70" align="center">
                <template #default="{ row }"><el-tag v-if="row.is_default" size="small" type="success">默认</el-tag><span v-else>-</span></template>
              </el-table-column>
              <el-table-column label="状态" width="80">
                <template #default="{ row }"><el-tag size="small" :type="dictTag('commonStatus', row.status)">{{ dictLabel('commonStatus', row.status) }}</el-tag></template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!currentType" description="选择左侧字典类型查看字典项" :image-size="60" />
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getDictTypes, getDictItems } from '@/api/system'
import { dictLabel, dictTag } from '@/dict'

const types = ref({ records: [], total: 0 })
const items = ref({ records: [], total: 0 })
const currentType = ref(null)

async function onSelectType(row) {
  currentType.value = row
  if (row) items.value = await getDictItems(row.id)
}

async function load() {
  types.value = await getDictTypes()
}
load()
</script>
