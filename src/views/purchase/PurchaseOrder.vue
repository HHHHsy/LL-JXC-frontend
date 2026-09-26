<template>
  <div>
    <!-- 搜索区 -->
    <el-card style="margin-bottom: 16px">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="订单编号">
          <el-input v-model="searchForm.orderNo" placeholder="订单编号" clearable />
        </el-form-item>
        <el-form-item label="供应商">
          <el-select v-model="searchForm.supplierId" placeholder="请选择供应商" clearable>
            <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="待入库" value="待入库" />
            <el-option label="部分入库" value="部分入库" />
            <el-option label="已入库" value="已入库" />
            <el-option label="已取消" value="已取消" />
          </el-select>
        </el-form-item>
        <el-form-item label="采购日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
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
        <el-button type="success" @click="handleImportOpen">导入采购清单</el-button>
      </div>
      <el-table :data="tableData" border stripe v-loading="tableLoading">
        <el-table-column prop="orderNo" label="订单编号" />
        <el-table-column prop="supplierName" label="供应商名称" />
        <el-table-column prop="purchaseDate" label="采购日期" />
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="330">
          <template #default="{ row }">
            <el-button v-if="row.status === '待入库'" type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.status === '待入库'" type="warning" size="small" @click="handleCancel(row)">取消订单</el-button>
            <el-button v-if="row.status === '待入库' || row.status === '已取消'" type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            <el-button type="info" size="small" @click="handleDetail(row)">查看详情</el-button>
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
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="700px" @close="handleDialogClose">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="供应商" prop="supplierId">
          <el-select v-model="form.supplierId" placeholder="请选择供应商">
            <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="采购日期" prop="purchaseDate">
          <el-date-picker v-model="form.purchaseDate" type="date" placeholder="请选择采购日期" value-format="YYYY-MM-DD" />
        </el-form-item>
      </el-form>

      <!-- 订单明细子表格 -->
      <div style="margin-top: 16px">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px">
          <span style="font-weight: bold">订单明细</span>
          <el-button type="primary" size="small" @click="handleAddDetail">添加明细</el-button>
        </div>
        <el-table :data="details" border>
          <el-table-column label="商品" width="220">
            <template #default="{ row }">
              <el-select v-model="row.productId" placeholder="请选择商品" filterable>
                <el-option v-for="p in productOptions" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="180">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" :min="1" />
            </template>
          </el-table-column>
          <el-table-column label="成本价" width="180">
            <template #default="{ row }">
              <el-input-number v-model="row.costPrice" :min="0" :precision="2" />
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="{ $index }">
              <el-button type="danger" size="small" @click="handleRemoveDetail($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 采购清单 Excel 导入（公共组件） -->
    <ExcelImportDialog
      v-model="importVisible"
      title="导入采购清单"
      hint="按清单表头自动识别列：型号名称/商品名称（必填）、数量（必填）、参考规格型号、单位、单价(元)、金额(元)、参考适合车型；空行与「合计/总计」行会自动跳过。"
      :columns="importColumns"
      :form="importForm"
      :preview-api="doPreviewImport"
      :import-api="doImport"
      :template-api="downloadPurchaseTemplate"
      :summary="importSummary"
      :validate="validateImport"
      :success-message="importSuccess"
      @done="fetchData"
    >
      <template #form-extra="{ form }">
        <el-form-item label="供应商" required>
          <el-select v-model="form.supplierId" placeholder="请选择供应商" style="width: 260px">
            <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="采购日期" required>
          <el-date-picker v-model="form.purchaseDate" type="date" placeholder="请选择采购日期" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="未匹配的商品">
          <el-radio-group v-model="form.autoCreateProduct">
            <el-radio :value="true">自动建档（编码自动生成，成本价=清单单价）</el-radio>
            <el-radio :value="false">不建档（作为错误行提示）</el-radio>
          </el-radio-group>
        </el-form-item>
      </template>
    </ExcelImportDialog>

    <!-- 查看详情弹窗 -->
    <el-dialog title="订单详情" v-model="detailVisible" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单编号">{{ detailOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ detailOrder.supplierName }}</el-descriptions-item>
        <el-descriptions-item label="采购日期">{{ detailOrder.purchaseDate }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTagType(detailOrder.status)">{{ detailOrder.status }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <el-table :data="detailDetails" border style="margin-top: 16px">
        <el-table-column prop="productName" label="商品名称" />
        <el-table-column prop="quantity" label="数量" />
        <el-table-column prop="receivedQuantity" label="已入库数量" />
        <el-table-column prop="costPrice" label="成本价" />
        <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
        <el-table-column label="小计">
          <template #default="{ row }">
            {{ (row.quantity * row.costPrice).toFixed(2) }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  listPurchaseOrder,
  addPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  cancelPurchaseOrder,
  getPurchaseOrder,
  previewPurchaseImport,
  importPurchaseOrder,
  downloadPurchaseTemplate
} from '../../api/purchaseOrder'
import { listSupplierAll } from '../../api/supplier'
import { listProductAll } from '../../api/product'
import ExcelImportDialog from '../../components/ExcelImportDialog.vue'

const searchForm = reactive({
  orderNo: '',
  supplierId: '',
  status: '',
  dateRange: null
})

const form = reactive({
  supplierId: '',
  purchaseDate: ''
})

const rules = {
  supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
  purchaseDate: [{ required: true, message: '请选择采购日期', trigger: 'change' }]
}

const details = ref([])

const supplierOptions = ref([])
const productOptions = ref([])

const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const tableLoading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增采购订单')
const formRef = ref(null)
const editId = ref(null)

const detailVisible = ref(false)
const detailOrder = reactive({})
const detailDetails = ref([])

/* ---------------- 采购清单 Excel 导入 ---------------- */
const importVisible = ref(false)
const importForm = reactive({
  supplierId: '',
  purchaseDate: '',
  autoCreateProduct: true,
  skipErrorRows: false
})
const importColumns = [
  { prop: 'productName', label: '采购型号名称', minWidth: 180 },
  { prop: 'spec', label: '参考规格型号', minWidth: 120 },
  { prop: 'unit', label: '单位', width: 60 },
  { prop: 'quantity', label: '数量', width: 70 },
  { prop: 'unitPrice', label: '单价', width: 80 },
  { prop: 'carModels', label: '参考适合车型', minWidth: 160 }
]

function handleImportOpen() {
  importForm.supplierId = ''
  importForm.purchaseDate = new Date().toISOString().slice(0, 10)
  importForm.autoCreateProduct = true
  importForm.skipErrorRows = false
  importVisible.value = true
}

function doPreviewImport(formData, form) {
  formData.append('autoCreateProduct', form.autoCreateProduct)
  return previewPurchaseImport(formData)
}

function doImport(formData, form) {
  formData.append('supplierId', form.supplierId)
  formData.append('purchaseDate', form.purchaseDate)
  formData.append('autoCreateProduct', form.autoCreateProduct)
  formData.append('skipErrorRows', form.skipErrorRows)
  return importPurchaseOrder(formData)
}

function validateImport(form) {
  if (!form.supplierId) {
    return '请选择供应商'
  }
  if (!form.purchaseDate) {
    return '请选择采购日期'
  }
  return null
}

function importSummary(p) {
  return `工作表「${p.sheetName}」共 ${p.totalRows} 行：可导入 ${p.rows.length} 行` +
    `（已匹配 ${p.matchedRows} / 将新建 ${p.newProductRows} / 问题 ${p.errorRows}），` +
    `跳过 ${p.skippedRows} 行，合计 ${p.totalQuantity} 件 / ${p.totalAmount} 元`
}

function importSuccess(r) {
  return `导入成功：采购单 ${r.orderNo}，明细 ${r.detailCount} 行，新建商品 ${r.createdProductCount} 个，` +
    `合计 ${r.totalQuantity} 件 / ${r.totalAmount} 元` +
    (r.skippedRowCount > 0 ? `，跳过 ${r.skippedRowCount} 行` : '')
}

onMounted(() => {
  fetchData()
  loadOptions()
})

async function loadOptions() {
  try {
    const res1 = await listSupplierAll()
    if (res1.code === 200) {
      supplierOptions.value = res1.data
    }
    const res2 = await listProductAll()
    if (res2.code === 200) {
      productOptions.value = res2.data
    }
  } catch (e) {
    // 拦截器已提示
  }
}

async function fetchData() {
  tableLoading.value = true
  try {
    const params = { ...searchForm }
    if (params.dateRange && params.dateRange.length === 2) {
      params.startDate = params.dateRange[0]
      params.endDate = params.dateRange[1]
    }
    delete params.dateRange
    if (!params.status) {
      delete params.status
    }
    params.pageNum = pageNum.value
    params.pageSize = pageSize.value
    const res = await listPurchaseOrder(params)
    if (res.code === 200) {
      tableData.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } finally {
    tableLoading.value = false
  }
}

function statusTagType(status) {
  const map = { '待入库': 'warning', '部分入库': 'warning', '已入库': 'success', '已取消': 'info' }
  return map[status] || 'info'
}

function handleSearch() {
  pageNum.value = 1
  fetchData()
}

function handleReset() {
  searchForm.orderNo = ''
  searchForm.supplierId = ''
  searchForm.status = ''
  searchForm.dateRange = null
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
  dialogTitle.value = '新增采购订单'
  editId.value = null
  form.supplierId = ''
  form.purchaseDate = ''
  details.value = []
  formRef.value?.clearValidate()
  dialogVisible.value = true
}

async function handleEdit(row) {
  dialogTitle.value = '编辑采购订单'
  editId.value = row.id
  try {
    const res = await getPurchaseOrder(row.id)
    if (res.code === 200) {
      const { order, details: dts } = res.data
      form.supplierId = order.supplierId
      form.purchaseDate = order.purchaseDate
      details.value = dts.map(d => ({
        id: d.id,
        productId: d.productId,
        quantity: d.quantity,
        costPrice: d.costPrice
      }))
      formRef.value?.clearValidate()
      dialogVisible.value = true
    }
  } catch (e) {
    // 拦截器已提示
  }
}

function handleDetail(row) {
  detailOrder.orderNo = row.orderNo
  detailOrder.supplierName = row.supplierName
  detailOrder.purchaseDate = row.purchaseDate
  detailOrder.status = row.status
  detailDetails.value = []
  getPurchaseOrder(row.id)
    .then(res => {
      if (res.code === 200) {
        detailDetails.value = res.data.details || []
      }
    })
    .catch(() => {})
  detailVisible.value = true
}

function handleDialogClose() {
  details.value = []
}

function handleAddDetail() {
  details.value.push({ productId: '', quantity: 1, costPrice: 0 })
}

function handleRemoveDetail(index) {
  details.value.splice(index, 1)
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (details.value.length === 0) {
    ElMessage.warning('请至少添加一条订单明细')
    return
  }
  for (let i = 0; i < details.value.length; i++) {
    const d = details.value[i]
    if (!d.productId) {
      ElMessage.warning(`第${i + 1}行明细请选择商品`)
      return
    }
    if (!d.quantity || d.quantity <= 0) {
      ElMessage.warning(`第${i + 1}行明细数量必须大于0`)
      return
    }
  }
  const data = {
    order: {
      supplierId: form.supplierId,
      purchaseDate: form.purchaseDate,
      status: '待入库'
    },
    details: details.value.map(d => ({
      productId: d.productId,
      quantity: d.quantity,
      costPrice: d.costPrice
    }))
  }
  submitting.value = true
  try {
    let res
    if (editId.value) {
      data.order.id = editId.value
      res = await updatePurchaseOrder(data)
    } else {
      res = await addPurchaseOrder(data)
    }
    if (res.code === 200) {
      ElMessage.success(editId.value ? '编辑成功' : '新增成功')
      dialogVisible.value = false
      fetchData()
    }
  } catch (e) {
    // 拦截器已提示
  } finally {
    submitting.value = false
  }
}

function handleCancel(row) {
  ElMessageBox.confirm(`确定要取消订单 ${row.orderNo} 吗？取消后订单不可再入库。`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        const res = await cancelPurchaseOrder(row.id)
        if (res.code === 200) {
          ElMessage.success('订单已取消')
          fetchData()
        }
      } catch (e) {
        // 拦截器已提示
      }
    })
    .catch(() => {})
}

function handleDelete(row) {
  ElMessageBox.confirm('确定要删除该采购订单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        const res = await deletePurchaseOrder(row.id)
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
