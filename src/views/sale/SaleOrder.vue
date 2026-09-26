<template>
  <div>
    <!-- 搜索区 -->
    <el-card style="margin-bottom: 16px">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="订单编号">
          <el-input v-model="searchForm.orderNo" placeholder="订单编号" clearable />
        </el-form-item>
        <el-form-item label="客户">
          <el-select v-model="searchForm.customerId" placeholder="请选择客户" clearable>
            <el-option v-for="c in customerOptions" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="待出库" value="待出库" />
            <el-option label="部分出库" value="部分出库" />
            <el-option label="已出库" value="已出库" />
            <el-option label="已取消" value="已取消" />
          </el-select>
        </el-form-item>
        <el-form-item label="销售日期">
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
      </div>
      <el-table :data="tableData" border stripe v-loading="tableLoading">
        <el-table-column prop="orderNo" label="订单编号" />
        <el-table-column prop="customerName" label="客户名称" />
        <el-table-column prop="saleDate" label="销售日期" />
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="330">
          <template #default="{ row }">
            <el-button v-if="row.status === '待出库'" type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.status === '待出库'" type="warning" size="small" @click="handleCancel(row)">取消订单</el-button>
            <el-button v-if="row.status === '待出库' || row.status === '已取消'" type="danger" size="small" @click="handleDelete(row)">删除</el-button>
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
        <el-form-item label="客户" prop="customerId">
          <el-select v-model="form.customerId" placeholder="请选择客户">
            <el-option v-for="c in customerOptions" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="销售日期" prop="saleDate">
          <el-date-picker v-model="form.saleDate" type="date" placeholder="请选择销售日期" value-format="YYYY-MM-DD" />
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
          <el-table-column label="销售价" width="180">
            <template #default="{ row }">
              <el-input-number v-model="row.salePrice" :min="0" :precision="2" />
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

    <!-- 查看详情弹窗 -->
    <el-dialog title="订单详情" v-model="detailVisible" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单编号">{{ detailOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ detailOrder.customerName }}</el-descriptions-item>
        <el-descriptions-item label="销售日期">{{ detailOrder.saleDate }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTagType(detailOrder.status)">{{ detailOrder.status }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <el-table :data="detailDetails" border style="margin-top: 16px">
        <el-table-column prop="productName" label="商品名称" />
        <el-table-column prop="quantity" label="数量" />
        <el-table-column prop="shippedQuantity" label="已出库数量" />
        <el-table-column prop="salePrice" label="销售价" />
        <el-table-column label="小计">
          <template #default="{ row }">
            {{ (row.quantity * row.salePrice).toFixed(2) }}
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
  listSaleOrder,
  addSaleOrder,
  updateSaleOrder,
  deleteSaleOrder,
  cancelSaleOrder,
  getSaleOrder
} from '../../api/saleOrder'
import { listCustomerAll } from '../../api/customer'
import { listProductAll } from '../../api/product'

const searchForm = reactive({
  orderNo: '',
  customerId: '',
  status: '',
  dateRange: null
})

const form = reactive({
  customerId: '',
  saleDate: ''
})

const rules = {
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  saleDate: [{ required: true, message: '请选择销售日期', trigger: 'change' }]
}

const details = ref([])

const customerOptions = ref([])
const productOptions = ref([])

const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const tableLoading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增销售订单')
const formRef = ref(null)
const editId = ref(null)

const detailVisible = ref(false)
const detailOrder = reactive({})
const detailDetails = ref([])

onMounted(() => {
  fetchData()
  loadOptions()
})

async function loadOptions() {
  try {
    const res1 = await listCustomerAll()
    if (res1.code === 200) {
      customerOptions.value = res1.data
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
    const res = await listSaleOrder(params)
    if (res.code === 200) {
      tableData.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } finally {
    tableLoading.value = false
  }
}

function statusTagType(status) {
  const map = { '待出库': 'warning', '部分出库': 'warning', '已出库': 'success', '已取消': 'info' }
  return map[status] || 'info'
}

function handleSearch() {
  pageNum.value = 1
  fetchData()
}

function handleReset() {
  searchForm.orderNo = ''
  searchForm.customerId = ''
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
  dialogTitle.value = '新增销售订单'
  editId.value = null
  form.customerId = ''
  form.saleDate = ''
  details.value = []
  formRef.value?.clearValidate()
  dialogVisible.value = true
}

async function handleEdit(row) {
  dialogTitle.value = '编辑销售订单'
  editId.value = row.id
  try {
    const res = await getSaleOrder(row.id)
    if (res.code === 200) {
      const { order, details: dts } = res.data
      form.customerId = order.customerId
      form.saleDate = order.saleDate
      details.value = dts.map(d => ({
        id: d.id,
        productId: d.productId,
        quantity: d.quantity,
        salePrice: d.salePrice
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
  detailOrder.customerName = row.customerName
  detailOrder.saleDate = row.saleDate
  detailOrder.status = row.status
  detailDetails.value = []
  getSaleOrder(row.id)
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
  details.value.push({ productId: '', quantity: 1, salePrice: 0 })
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
      customerId: form.customerId,
      saleDate: form.saleDate,
      status: '待出库'
    },
    details: details.value.map(d => ({
      productId: d.productId,
      quantity: d.quantity,
      salePrice: d.salePrice
    }))
  }
  submitting.value = true
  try {
    let res
    if (editId.value) {
      data.order.id = editId.value
      res = await updateSaleOrder(data)
    } else {
      res = await addSaleOrder(data)
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
  ElMessageBox.confirm(`确定要取消订单 ${row.orderNo} 吗？取消后订单不可再出库。`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        const res = await cancelSaleOrder(row.id)
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
  ElMessageBox.confirm('确定要删除该销售订单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        const res = await deleteSaleOrder(row.id)
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
