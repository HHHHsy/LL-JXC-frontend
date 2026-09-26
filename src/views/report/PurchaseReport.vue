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
        <el-form-item label="供应商">
          <el-select v-model="searchForm.supplierId" placeholder="请选择供应商" clearable>
            <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="全部（不含已取消）" clearable style="width: 170px">
            <el-option label="全部（不含已取消）" value="" />
            <el-option label="待入库" value="待入库" />
            <el-option label="部分入库" value="部分入库" />
            <el-option label="已入库" value="已入库" />
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
        <el-table-column prop="purchaseDate" label="采购日期" />
        <el-table-column prop="orderNo" label="采购单号" />
        <el-table-column prop="supplierName" label="供应商名称" />
        <el-table-column prop="productName" label="商品名称" />
        <el-table-column prop="quantity" label="数量" />
        <el-table-column prop="receivedQuantity" label="已入库数量" />
        <el-table-column prop="costPrice" label="成本价" />
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
import { purchaseDetail } from '../../api/report'
import { listSupplierAll } from '../../api/supplier'
import { formatAmount } from '../../utils/format'

const searchForm = reactive({
  dateRange: null,
  supplierId: '',
  status: ''
})

const supplierOptions = ref([])
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const tableLoading = ref(false)
const totalQuantity = ref(0)
const totalAmount = ref(0)

onMounted(() => {
  fetchData()
  loadSupplierOptions()
})

async function loadSupplierOptions() {
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
    const params = { pageNum: pageNum.value, pageSize: pageSize.value }
    if (searchForm.supplierId) params.supplierId = searchForm.supplierId
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    const res = await purchaseDetail(params)
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
  searchForm.supplierId = ''
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
      sums[index] = '合计（全部查询结果）'
      return
    }
    if (column.property === 'quantity') {
      sums[index] = totalQuantity.value
      return
    }
    if (column.property === 'costPrice' || column.property === 'receivedQuantity') {
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
