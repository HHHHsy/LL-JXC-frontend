<template>
  <el-dialog
    :title="title"
    :model-value="modelValue"
    width="980px"
    @update:model-value="$emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <el-alert v-if="hint" type="info" :closable="false" show-icon style="margin-bottom: 12px" :title="hint" />

    <el-form label-width="110px">
      <el-form-item label="Excel 文件" required>
        <input ref="fileRef" type="file" accept=".xlsx,.xls" @change="handleFileChange" />
        <span v-if="fileName" style="margin-left: 8px; color: #67c23a">{{ fileName }}</span>
        <el-button v-if="templateApi" link type="primary" style="margin-left: 12px" @click="handleDownloadTemplate">
          下载示例模板
        </el-button>
      </el-form-item>

      <!-- 各业务自己的额外表单项（供应商、日期等） -->
      <slot name="form-extra" :form="form" />

      <el-form-item label="忽略问题行">
        <el-switch v-model="form.skipErrorRows" />
        <span style="margin-left: 8px; color: #909399">开启后只导入没有问题的行</span>
      </el-form-item>
    </el-form>

    <div style="margin-bottom: 12px">
      <el-button type="primary" plain :loading="previewLoading" :disabled="!file" @click="handlePreview">
        解析预览
      </el-button>
      <span v-if="preview" style="margin-left: 12px; color: #606266">{{ summaryText }}</span>
    </div>

    <el-table v-if="preview" :data="preview.rows" border size="small" max-height="360">
      <el-table-column prop="rowNo" label="行号" width="60" />
      <el-table-column
        v-for="col in columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
        show-overflow-tooltip
      />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag v-if="row.status === 'OK'" type="success" size="small">已匹配</el-tag>
          <el-tag v-else-if="row.status === 'NEW'" type="warning" size="small">可新增</el-tag>
          <el-tag v-else type="danger" size="small">错误</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="说明" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <span :style="{ color: row.status === 'ERROR' ? '#f56c6c' : '#909399' }">
            {{ row.status === 'OK' && row.matchedProductCode ? ('匹配商品：' + row.matchedProductCode) : row.message }}
          </span>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="preview && preview.skipped && preview.skipped.length" style="margin-top: 8px; color: #909399; font-size: 12px">
      {{ preview.skipped.join('；') }}
    </div>

    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="importLoading" :disabled="!canImport" @click="handleImport">
        确认导入
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Excel 导入' },
  hint: { type: String, default: '' },
  columns: { type: Array, default: () => [] },
  /** 调用方持有的响应式表单对象（本组件会绑定 skipErrorRows） */
  form: { type: Object, required: true },
  previewApi: { type: Function, required: true },
  importApi: { type: Function, required: true },
  templateApi: { type: Function, default: null },
  summary: { type: Function, default: null },
  validate: { type: Function, default: null },
  successMessage: { type: Function, default: null }
})

const emit = defineEmits(['update:modelValue', 'done'])

const fileRef = ref(null)
const file = ref(null)
const fileName = ref('')
const preview = ref(null)
const previewLoading = ref(false)
const importLoading = ref(false)

const summaryText = computed(() => {
  if (!preview.value) return ''
  if (props.summary) return props.summary(preview.value)
  return `共 ${preview.value.rows.length} 行，问题 ${preview.value.errorRows} 行`
})

const canImport = computed(() => {
  const p = preview.value
  if (!p) return false
  if (p.errorRows > 0 && !props.form.skipErrorRows) return false
  return true
})

function handleFileChange(event) {
  const selected = event.target.files && event.target.files[0]
  file.value = selected || null
  fileName.value = selected ? selected.name : ''
  preview.value = null
}

function buildFormData() {
  const data = new FormData()
  data.append('file', file.value)
  return data
}

async function handlePreview() {
  if (!file.value) {
    ElMessage.warning('请先选择 Excel 文件')
    return
  }
  previewLoading.value = true
  try {
    const res = await props.previewApi(buildFormData(), props.form)
    if (res.code === 200) {
      preview.value = res.data
      if (res.data.errorRows > 0) {
        ElMessage.warning(`解析完成，有 ${res.data.errorRows} 行存在问题，请查看「说明」列`)
      } else {
        ElMessage.success(`解析完成，共 ${res.data.rows.length} 行可导入`)
      }
    }
  } catch (e) {
    // 失败原因由响应拦截器统一提示
  } finally {
    previewLoading.value = false
  }
}

async function handleImport() {
  if (props.validate) {
    const message = props.validate(props.form)
    if (message) {
      ElMessage.warning(message)
      return
    }
  }
  if (!preview.value) {
    ElMessage.warning('请先解析预览')
    return
  }
  importLoading.value = true
  try {
    const res = await props.importApi(buildFormData(), props.form)
    if (res.code === 200) {
      ElMessage.success(props.successMessage ? props.successMessage(res.data) : '导入成功')
      emit('update:modelValue', false)
      emit('done', res.data)
    }
  } catch (e) {
    // 失败原因由响应拦截器统一提示
  } finally {
    importLoading.value = false
  }
}

async function handleDownloadTemplate() {
  try {
    const blob = await props.templateApi()
    const url = URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    link.download = `${props.title.replace(/[（(].*?[)）]/g, '')}示例.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (e) {
    // 拦截器已提示
  }
}

function handleClose() {
  file.value = null
  fileName.value = ''
  preview.value = null
  if (fileRef.value) {
    fileRef.value.value = ''
  }
}
</script>
