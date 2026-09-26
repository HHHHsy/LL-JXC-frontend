<template>
  <div>
    <!-- 搜索区 -->
    <el-card style="margin-bottom: 16px">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="商品编码">
          <el-input v-model="searchForm.code" placeholder="商品编码（支持模糊）" clearable />
        </el-form-item>
        <el-form-item label="商品名称">
          <el-input v-model="searchForm.name" placeholder="商品名称" clearable />
        </el-form-item>
        <el-form-item label="商品分类">
          <el-input v-model="searchForm.category" placeholder="商品分类" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区 -->
    <el-card>
      <div style="margin-bottom: 16px">
        <el-button type="primary" @click="handleAdd">新增</el-button>
        <el-button type="success" @click="handleImportOpen">导入商品</el-button>
      </div>
      <el-table :data="tableData" border stripe v-loading="tableLoading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="code" label="商品编码" />
        <el-table-column prop="name" label="商品名称" />
        <el-table-column prop="category" label="商品分类" />
        <el-table-column prop="spec" label="规格型号" />
        <el-table-column prop="unit" label="单位" />
        <el-table-column prop="costPrice" label="成本价" />
        <el-table-column prop="salePrice" label="销售价" />
        <el-table-column prop="stockQuantity" label="当前库存数量" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
        style="margin-top: 16px; justify-content: flex-end"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="商品编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入商品编码" />
        </el-form-item>
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="商品分类">
          <el-input v-model="form.category" placeholder="请输入商品分类，如：电池类、配件类" />
        </el-form-item>
        <el-form-item label="规格型号">
          <el-input v-model="form.spec" placeholder="请输入规格型号" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="form.unit" placeholder="请输入单位" />
        </el-form-item>
        <el-form-item label="成本价" prop="costPrice">
          <el-input-number v-model="form.costPrice" :min="0" :precision="2" style="width: 100%" placeholder="请输入成本价" />
        </el-form-item>
        <el-form-item label="销售价" prop="salePrice">
          <el-input-number v-model="form.salePrice" :min="0" :precision="2" style="width: 100%" placeholder="请输入销售价" />
        </el-form-item>
        <el-alert
          type="info"
          :closable="false"
          show-icon
          title="当前库存数量由采购入库、销售出库、库存盘点自动维护，不支持手工录入。"
        />
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
    <!-- 商品 Excel 导入（公共组件） -->
    <ExcelImportDialog
      v-model="importVisible"
      title="导入商品"
      hint="列按表头中文名识别：商品编码（可留空自动生成）、商品名称（必填）、商品分类、规格型号、单位、成本价、销售价；空行与「合计」行自动跳过；已存在的编码或同名同规格商品会作为错误行提示。"
      :columns="importColumns"
      :form="importForm"
      :preview-api="previewProductImport"
      :import-api="importProducts"
      :template-api="downloadProductTemplate"
      :summary="importSummary"
      :success-message="importSuccess"
      @done="fetchData"
    />
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  listProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  previewProductImport,
  importProducts,
  downloadProductTemplate
} from '../../api/product'
import ExcelImportDialog from '../../components/ExcelImportDialog.vue'

const searchForm = reactive({
  code: '',
  name: '',
  category: ''
})

const form = reactive({
  code: '',
  name: '',
  category: '',
  spec: '',
  unit: '',
  costPrice: undefined,
  salePrice: undefined
})

const rules = {
  code: [{ required: true, message: '请输入商品编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }]
}

const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const tableLoading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增商品')
const formRef = ref(null)
const editId = ref(null)

/* ---------------- 商品 Excel 导入 ---------------- */
const importVisible = ref(false)
const importForm = reactive({ skipErrorRows: false })
const importColumns = [
  { prop: 'code', label: '商品编码', minWidth: 100 },
  { prop: 'name', label: '商品名称', minWidth: 200 },
  { prop: 'category', label: '分类', width: 90 },
  { prop: 'spec', label: '规格型号', minWidth: 130 },
  { prop: 'unit', label: '单位', width: 60 },
  { prop: 'costPrice', label: '成本价', width: 80 },
  { prop: 'salePrice', label: '销售价', width: 80 }
]

function importSummary(p) {
  return `工作表「${p.sheetName}」共 ${p.totalRows} 行：可新增 ${p.newRows} 行，问题 ${p.errorRows} 行，跳过 ${p.skippedRows} 行`
}

function importSuccess(r) {
  return `导入成功：新增商品 ${r.createdCount} 个` + (r.skippedRowCount > 0 ? `，跳过 ${r.skippedRowCount} 行` : '')
}

function handleImportOpen() {
  importForm.skipErrorRows = false
  importVisible.value = true
}

onMounted(() => {
  fetchData()
})

async function fetchData() {
  tableLoading.value = true
  try {
    const res = await listProduct({
      code: searchForm.code,
      name: searchForm.name,
      category: searchForm.category,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    })
    if (res.code === 200) {
      tableData.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } finally {
    tableLoading.value = false
  }
}

function handleSearch() {
  pageNum.value = 1
  fetchData()
}

function handleReset() {
  searchForm.code = ''
  searchForm.name = ''
  searchForm.category = ''
  pageNum.value = 1
  fetchData()
}

function handlePageChange() {
  fetchData()
}

function handleSizeChange() {
  pageNum.value = 1
  fetchData()
}

function handleAdd() {
  dialogTitle.value = '新增商品'
  editId.value = null
  Object.assign(form, {
    code: '',
    name: '',
    category: '',
    spec: '',
    unit: '',
    costPrice: undefined,
    salePrice: undefined
  })
  formRef.value?.clearValidate()
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = '编辑商品'
  editId.value = row.id
  Object.assign(form, {
    code: row.code,
    name: row.name,
    category: row.category || '',
    spec: row.spec || '',
    unit: row.unit || '',
    costPrice: row.costPrice,
    salePrice: row.salePrice
  })
  formRef.value?.clearValidate()
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const data = { ...form }
    const res = editId.value
      ? await updateProduct({ ...data, id: editId.value })
      : await addProduct(data)
    if (res.code === 200) {
      ElMessage.success(editId.value ? '编辑成功' : '新增成功')
      dialogVisible.value = false
      fetchData()
    }
  } catch (e) {
    // 失败提示已由 request 响应拦截器统一处理
  } finally {
    submitting.value = false
  }
}

function handleDelete(row) {
  ElMessageBox.confirm('确定要删除该商品吗？已被采购/销售单据或库存流水引用的商品无法删除。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        const res = await deleteProduct(row.id)
        if (res.code === 200) {
          ElMessage.success('删除成功')
          fetchData()
        }
      } catch (e) {
        // 拦截器已提示
      }
    })
    .catch(() => {})
}
</script>
