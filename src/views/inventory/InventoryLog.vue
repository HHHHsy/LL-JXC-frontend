<template>
  <div>
    <!-- 搜索区 -->
    <el-card style="margin-bottom: 16px">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="商品">
          <el-select v-model="searchForm.productId" placeholder="请选择商品" clearable filterable>
            <el-option v-for="p in productOptions" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="变动类型">
          <el-select v-model="searchForm.changeType" placeholder="请选择变动类型" clearable>
            <el-option label="全部" value="" />
            <el-option label="入库" value="入库" />
            <el-option label="出库" value="出库" />
          </el-select>
        </el-form-item>
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
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区 -->
    <el-card>
      <el-table :data="tableData" border stripe v-loading="tableLoading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="变动时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.changeTime) }}</template>
        </el-table-column>
        <el-table-column prop="productName" label="商品名称" />
        <el-table-column label="变动类型">
          <template #default="{ row }">
            <el-tag :type="row.changeType === '入库' ? 'success' : 'danger'">{{ row.changeType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="changeQuantity" label="变动数量" />
        <el-table-column prop="afterStock" label="变动后库存" />
        <el-table-column prop="relatedOrderNo" label="关联单号" />
        <el-table-column prop="remark" label="备注" />
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
import { listInventoryLog } from '../../api/inventoryLog'
import { listProductAll } from '../../api/product'
import { formatDateTime } from '../../utils/format'

const searchForm = reactive({
  productId: '',
  changeType: '',
  dateRange: null
})

const productOptions = ref([])
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const tableLoading = ref(false)

onMounted(() => {
  fetchData()
  loadProductOptions()
})

async function loadProductOptions() {
  try {
    const res = await listProductAll()
    if (res.code === 200) {
      productOptions.value = res.data
    }
  } catch (e) {
    // 拦截器已提示
  }
}

async function fetchData() {
  tableLoading.value = true
  try {
    const params = { pageNum: pageNum.value, pageSize: pageSize.value }
    if (searchForm.productId) params.productId = searchForm.productId
    if (searchForm.changeType) params.changeType = searchForm.changeType
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    const res = await listInventoryLog(params)
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
  searchForm.productId = ''
  searchForm.changeType = ''
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
</script>
