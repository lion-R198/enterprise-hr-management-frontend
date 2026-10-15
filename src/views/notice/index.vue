<template>
  <div class="page-container">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">通知公告管理（F-01-03）</span>
        <el-button type="primary" size="small" @click="openCreate">发布新公告</el-button>
      </div>
      <div class="panel-body">
        <el-table :data="list.records" border size="default">
          <el-table-column type="index" label="#" width="50" />
          <el-table-column prop="title" label="标题" min-width="260" show-overflow-tooltip />
          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="dictTag('noticeType', row.notice_type)" effect="plain">
                {{ dictLabel('noticeType', row.notice_type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag size="small" :type="dictTag('noticeStatus', row.status)">{{ dictLabel('noticeStatus', row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="publisher_name" label="发布人" width="90" />
          <el-table-column prop="publish_time" label="发布时间" width="160" />
          <el-table-column prop="read_count" label="已读" width="70" />
          <el-table-column label="操作" width="170" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === 1" size="small" type="primary" link @click="onPublish(row)">发布</el-button>
              <el-button v-if="row.status === 2" size="small" type="warning" link @click="onOffline(row)">下架</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="query.current"
          class="pager"
          background
          layout="total, prev, pager, next"
          :total="list.total"
          :page-size="query.size"
          @current-change="load"
        />
      </div>
    </div>

    <el-dialog v-model="createVisible" title="发布公告" width="640px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.noticeType" style="width: 200px">
            <el-option v-for="d in getDict('noticeType')" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="发布范围">
          <el-radio-group v-model="form.targetScope">
            <el-radio :value="1">全体</el-radio>
            <el-radio :value="2">指定部门</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="置顶">
          <el-switch v-model="form.isTop" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="正文">
          <el-input v-model="form.content" type="textarea" :rows="6" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取 消</el-button>
        <el-button type="primary" @click="onCreate">保存草稿并发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { pageNotices, createNotice, publishNotice, offlineNotice } from '@/api/system'
import { getDict, dictLabel, dictTag } from '@/dict'

const list = ref({ records: [], total: 0 })
const query = reactive({ current: 1, size: 10, status: '' })
const createVisible = ref(false)
const form = reactive({ title: '', content: '', noticeType: 3, targetScope: 1, isTop: 0 })

async function load() {
  list.value = await pageNotices(query)
}

function openCreate() {
  Object.assign(form, { title: '', content: '', noticeType: 3, targetScope: 1, isTop: 0 })
  createVisible.value = true
}

async function onCreate() {
  if (!form.title) return ElMessage.warning('请填写标题')
  await createNotice({ ...form })
  ElMessage.success('公告已发布')
  createVisible.value = false
  load()
}

async function onPublish(row) {
  await ElMessageBox.confirm(`确认发布公告《${row.title}》？`, '发布确认')
  await publishNotice(row.id)
  ElMessage.success('已发布')
  load()
}

async function onOffline(row) {
  await ElMessageBox.confirm(`确认下架公告《${row.title}》？`, '下架确认')
  await offlineNotice(row.id)
  ElMessage.success('已下架')
  load()
}

onMounted(load)
</script>

<style scoped>
.pager { margin-top: 12px; justify-content: flex-end; }
</style>
