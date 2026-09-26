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
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区 -->
    <el-card>
      <el-table :data="tableData" border stripe v-loading="tableLoading" @row-click="handleRowClick">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="code" label="商品编码" />
        <el-table-column prop="name" label="商品名称" />
        <el-table-column prop="spec" label="规格型号" />
        <el-table-column prop="unit" label="单位" />
        <el-table-column prop="stockQuantity" label="当前库存数量" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click.stop="handleShowLog(row)">流水</el-button>
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

    <!-- 库存流水明细弹窗 -->
    <el-dialog title="库存流水明细" v-model="logDialogVisible" width="800px">
      <el-table :data="logData" border stripe v-loading="logLoading" max-height="420">
        <el-table-column label="变动时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.changeTime) }}</template>
        </el-table-column>
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
      <div style="color: #909399; font-size: 12px; margin-top: 8px">
        最多显示该商品最近 100 条流水，完整记录请到「库存流水」页面按商品查询。
      </div>
      <template #footer>
        <el-button @click="logDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { listProduct } from '../../api/product'
import { listInventoryLog } from '../../api/inventoryLog'
import { formatDateTime } from '../../utils/format'

const searchForm = reactive({
  code: '',
  name: ''
})

const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const tableLoading = ref(false)

const logDialogVisible = ref(false)
const logLoading = ref(false)
const logData = ref([])
const currentProductId = ref(null)

onMounted(() => {
  fetchData()
})

async function fetchData() {
  tableLoading.value = true
  try {
    const res = await listProduct({
      code: searchForm.code,
      name: searchForm.name,
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

function handleRowClick(row) {
  handleShowLog(row)
}

async function handleShowLog(row) {
  currentProductId.value = row.id
  logLoading.value = true
  logData.value = []
  logDialogVisible.value = true
  try {
    const res = await listInventoryLog({ productId: row.id, pageNum: 1, pageSize: 100 })
    if (res.code === 200) {
      logData.value = res.data.list || []
    }
  } catch (e) {
    // 拦截器已提示
  } finally {
    logLoading.value = false
  }
}
</script>
