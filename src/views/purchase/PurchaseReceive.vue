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
      <el-table :data="tableData" border stripe v-loading="tableLoading">
        <el-table-column prop="orderNo" label="订单编号" />
        <el-table-column prop="supplierName" label="供应商名称" />
        <el-table-column prop="purchaseDate" label="采购日期" />
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleReceive(row)">入库</el-button>
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

    <!-- 入库弹窗 -->
    <el-dialog title="采购入库" v-model="receiveVisible" width="800px">
      <el-descriptions :column="2" border style="margin-bottom: 16px">
        <el-descriptions-item label="订单编号">{{ receiveOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ receiveOrder.supplierName }}</el-descriptions-item>
        <el-descriptions-item label="采购日期">{{ receiveOrder.purchaseDate }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ receiveOrder.status }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="receiveDetails" border>
        <el-table-column prop="productName" label="商品名称" />
        <el-table-column prop="quantity" label="订单数量" />
        <el-table-column prop="receivedQty" label="已入库数量" />
        <el-table-column label="可入库数量">
          <template #default="{ row }">
            {{ row.quantity - (row.receivedQty || 0) }}
          </template>
        </el-table-column>
        <el-table-column label="本次入库数量" width="180">
          <template #default="{ row }">
            <el-input-number
              v-model="row.receiveQty"
              :min="0"
              :max="row.quantity - (row.receivedQty || 0)"
              :disabled="row.quantity - (row.receivedQty || 0) <= 0"
            />
          </template>
        </el-table-column>
      </el-table>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        style="margin-top: 12px"
        title="支持分批入库：本次只填要入库的数量即可（填 0 表示本次不入该商品），全部到货后订单状态自动变为“已入库”。"
      />
      <template #footer>
        <el-button @click="receiveVisible = false">取消</el-button>
        <el-button type="primary" @click="handleReceiveSubmit" :loading="receiveLoading">确认入库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { listPurchaseOrder, receiveStock, getPurchaseOrder } from '../../api/purchaseOrder'
import { listSupplierAll } from '../../api/supplier'

const searchForm = reactive({
  orderNo: '',
  supplierId: '',
  dateRange: null
})

const supplierOptions = ref([])

const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const tableLoading = ref(false)
const receiveVisible = ref(false)
const receiveLoading = ref(false)
const receiveOrder = reactive({})
const receiveDetails = ref([])
const currentOrderId = ref(null)

onMounted(() => {
  fetchData()
  loadSuppliers()
})

async function loadSuppliers() {
  try {
    const res = await listSupplierAll()
    if (res.code === 200) {
      supplierOptions.value = res.data
    }
  } catch (e) {
    // 拦截器已提示
  }
}

async function fetchData() {
  tableLoading.value = true
  try {
    const params = { ...searchForm }
    // 待入库 + 部分入库 的订单都可以继续入库
    params.status = '待入库,部分入库'
    if (params.dateRange && params.dateRange.length === 2) {
      params.startDate = params.dateRange[0]
      params.endDate = params.dateRange[1]
    }
    delete params.dateRange
    if (!params.supplierId) {
      delete params.supplierId
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

async function handleReceive(row) {
  currentOrderId.value = row.id
  receiveOrder.orderNo = row.orderNo
  receiveOrder.supplierName = row.supplierName
  receiveOrder.purchaseDate = row.purchaseDate
  receiveOrder.status = row.status
  try {
    const res = await getPurchaseOrder(row.id)
    if (res.code === 200) {
      receiveDetails.value = (res.data.details || []).map(d => ({
        id: d.id,
        productId: d.productId,
        productName: d.productName,
        quantity: d.quantity,
        receivedQty: d.receivedQuantity || 0,
        costPrice: d.costPrice,
        receiveQty: d.quantity - (d.receivedQuantity || 0)
      }))
      receiveVisible.value = true
    }
  } catch (e) {
    // 拦截器已提示
  }
}

async function handleReceiveSubmit() {
  const rows = receiveDetails.value
  // 至少一行要入库，其余可以填 0（分批入库）
  const pending = rows.filter(d => Number(d.receiveQty) > 0)
  if (pending.length === 0) {
    ElMessage.warning('请至少录入一条入库数量')
    return
  }
  for (let i = 0; i < rows.length; i++) {
    const d = rows[i]
    const max = d.quantity - (d.receivedQty || 0)
    const qty = Number(d.receiveQty) || 0
    if (qty < 0) {
      ElMessage.warning(`第${i + 1}行本次入库数量不能为负数`)
      return
    }
    if (qty > max) {
      ElMessage.warning(`第${i + 1}行本次入库数量不能超过可入库数量 ${max}`)
      return
    }
  }
  const details = pending.map(d => ({
    id: d.id,
    productId: d.productId,
    quantity: Number(d.receiveQty)
  }))
  receiveLoading.value = true
  try {
    const res = await receiveStock(currentOrderId.value, details)
    if (res.code === 200) {
      ElMessage.success('入库成功')
      receiveVisible.value = false
      fetchData()
    }
  } catch (e) {
    // 失败原因（如超出可入库数量）由响应拦截器统一提示
  } finally {
    receiveLoading.value = false
  }
}
</script>
