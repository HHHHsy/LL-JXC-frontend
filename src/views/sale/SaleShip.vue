<template>
  <div>
    <!-- 搜索区 -->
    <el-card style="margin-bottom: 16px">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="订单编号">
          <el-input v-model="searchForm.orderNo" placeholder="订单编号" clearable />
        </el-form-item>
        <el-form-item label="客户">
          <el-select v-model="searchForm.customerId" placeholder="请选择客户" clearable filterable @change="handleSearch">
            <el-option v-for="c in customerOptions" :key="c.id" :label="c.name" :value="c.id" />
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
      <el-table :data="tableData" border stripe v-loading="tableLoading">
        <el-table-column type="index" label="序号" width="60" :index="i => (pageNum - 1) * pageSize + i + 1" />
        <el-table-column prop="orderNo" label="订单编号" />
        <el-table-column prop="customerName" label="客户名称" />
        <el-table-column prop="saleDate" label="销售日期" />
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleShip(row)">出库</el-button>
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

    <!-- 出库弹窗 -->
    <el-dialog title="销售出库" v-model="shipVisible" width="800px">
      <el-descriptions :column="2" border style="margin-bottom: 16px">
        <el-descriptions-item label="订单编号">{{ shipOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ shipOrder.customerName }}</el-descriptions-item>
        <el-descriptions-item label="销售日期">{{ shipOrder.saleDate }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ shipOrder.status }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="shipDetails" border>
        <el-table-column prop="productName" label="商品名称" />
        <el-table-column prop="quantity" label="订单数量" />
        <el-table-column prop="shippedQty" label="已出库数量" />
        <el-table-column label="可出库数量">
          <template #default="{ row }">
            {{ row.quantity - (row.shippedQty || 0) }}
          </template>
        </el-table-column>
        <el-table-column label="本次出库数量" width="180">
          <template #default="{ row }">
            <el-input-number
              v-model="row.shipQty"
              :min="0"
              :max="row.quantity - (row.shippedQty || 0)"
              :disabled="row.quantity - (row.shippedQty || 0) <= 0"
            />
          </template>
        </el-table-column>
      </el-table>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        style="margin-top: 12px"
        title="支持分批出库：本次只填要出库的数量即可（填 0 表示本次不出该商品）；库存不足时提交会给出具体缺货数量。"
      />
      <template #footer>
        <el-button @click="shipVisible = false">取消</el-button>
        <el-button type="primary" @click="handleShipSubmit" :loading="shipLoading">确认出库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { listSaleOrder, shipStock, getSaleOrder } from '../../api/saleOrder'
import { listCustomerAll } from '../../api/customer'

const searchForm = reactive({
  orderNo: '',
  customerId: '',
  dateRange: null
})

const customerOptions = ref([])

const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const tableLoading = ref(false)
const shipVisible = ref(false)
const shipLoading = ref(false)
const shipOrder = reactive({})
const shipDetails = ref([])
const currentOrderId = ref(null)

onMounted(() => {
  fetchData()
  loadCustomers()
})

async function loadCustomers() {
  try {
    const res = await listCustomerAll()
    if (res.code === 200) {
      customerOptions.value = res.data
    }
  } catch (e) {
    // 拦截器已提示
  }
}

async function fetchData() {
  tableLoading.value = true
  try {
    const params = { ...searchForm }
    // 待出库 + 部分出库 的订单都可以继续出库
    params.status = '待出库,部分出库'
    if (params.dateRange && params.dateRange.length === 2) {
      params.startDate = params.dateRange[0]
      params.endDate = params.dateRange[1]
    }
    delete params.dateRange
    if (!params.customerId) {
      delete params.customerId
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

async function handleShip(row) {
  currentOrderId.value = row.id
  shipOrder.orderNo = row.orderNo
  shipOrder.customerName = row.customerName
  shipOrder.saleDate = row.saleDate
  shipOrder.status = row.status
  try {
    const res = await getSaleOrder(row.id)
    if (res.code === 200) {
      shipDetails.value = (res.data.details || []).map(d => ({
        id: d.id,
        productId: d.productId,
        productName: d.productName,
        quantity: d.quantity,
        shippedQty: d.shippedQuantity || 0,
        salePrice: d.salePrice,
        shipQty: d.quantity - (d.shippedQuantity || 0)
      }))
      shipVisible.value = true
    }
  } catch (e) {
    // 拦截器已提示
  }
}

async function handleShipSubmit() {
  const rows = shipDetails.value
  // 至少一行要出库，其余可以填 0（分批出库）
  const pending = rows.filter(d => Number(d.shipQty) > 0)
  if (pending.length === 0) {
    ElMessage.warning('请至少录入一条出库数量')
    return
  }
  for (let i = 0; i < rows.length; i++) {
    const d = rows[i]
    const max = d.quantity - (d.shippedQty || 0)
    const qty = Number(d.shipQty) || 0
    if (qty < 0) {
      ElMessage.warning(`第${i + 1}行本次出库数量不能为负数`)
      return
    }
    if (qty > max) {
      ElMessage.warning(`第${i + 1}行本次出库数量不能超过可出库数量 ${max}`)
      return
    }
  }
  const details = pending.map(d => ({
    id: d.id,
    productId: d.productId,
    quantity: Number(d.shipQty)
  }))
  shipLoading.value = true
  try {
    const res = await shipStock(currentOrderId.value, details)
    if (res.code === 200) {
      ElMessage.success('出库成功')
      shipVisible.value = false
      fetchData()
    }
  } catch (e) {
    // 库存不足等失败原因（含具体商品与缺货数量）由响应拦截器统一提示
  } finally {
    shipLoading.value = false
  }
}
</script>
