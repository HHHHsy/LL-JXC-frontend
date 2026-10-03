<template>
  <div>
    <!-- 搜索区 -->
    <el-card style="margin-bottom: 16px">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="客户">
          <el-select v-model="searchForm.customerId" placeholder="请选择客户" clearable filterable @change="handleSearch">
            <el-option v-for="c in customerOptions" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="全部（不含已取消）" clearable style="width: 170px">
            <el-option label="全部（不含已取消）" value="" />
            <el-option label="待出库" value="待出库" />
            <el-option label="部分出库" value="部分出库" />
            <el-option label="已出库" value="已出库" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区（服务端分页，合计为全部查询结果） -->
    <el-card>
      <el-table :data="tableData" border stripe show-summary :summary-method="getSummaries" v-loading="tableLoading">
        <el-table-column type="index" label="序号" width="60" :index="i => (pageNum - 1) * pageSize + i + 1" />
        <el-table-column prop="saleDate" label="销售日期" />
        <el-table-column prop="orderNo" label="销售单号" />
        <el-table-column prop="customerName" label="客户名称" />
        <el-table-column prop="productName" label="商品名称" />
        <el-table-column prop="quantity" label="数量" />
        <el-table-column prop="shippedQuantity" label="已出库数量" />
        <el-table-column prop="salePrice" label="销售价" />
        <el-table-column label="小计">
          <template #default="{ row }">
            {{ formatAmount(row.subtotal) }}
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
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { saleDetail } from '../../api/report'
import { listCustomerAll } from '../../api/customer'
import { formatAmount } from '../../utils/format'

const searchForm = reactive({
  dateRange: null,
  customerId: '',
  status: ''
})

const customerOptions = ref([])
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const tableLoading = ref(false)
const totalQuantity = ref(0)
const totalAmount = ref(0)

onMounted(() => {
  fetchData()
  loadCustomerOptions()
})

async function loadCustomerOptions() {
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
    const params = { pageNum: pageNum.value, pageSize: pageSize.value }
    if (searchForm.customerId) params.customerId = searchForm.customerId
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    const res = await saleDetail(params)
    if (res.code === 200) {
      tableData.value = res.data.list || []
      total.value = res.data.total || 0
      totalQuantity.value = res.data.totalQuantity || 0
      totalAmount.value = res.data.totalAmount || 0
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
  searchForm.dateRange = null
  searchForm.customerId = ''
  searchForm.status = ''
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

function getSummaries(param) {
  const { columns } = param
  const sums = []
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = ''
      return
    }
    if (index === 1) {
      sums[index] = '合计（全部查询结果）'
      return
    }
    if (column.property === 'quantity') {
      sums[index] = totalQuantity.value
      return
    }
    if (column.property === 'salePrice' || column.property === 'shippedQuantity') {
      sums[index] = '—'
      return
    }
    if (column.label === '小计') {
      sums[index] = formatAmount(totalAmount.value)
      return
    }
    sums[index] = ''
  })
  return sums
}
</script>
