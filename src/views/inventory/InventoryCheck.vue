<template>
  <div>
    <!-- 盘点单列表搜索区 -->
    <el-card style="margin-bottom: 16px">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="盘点单号">
          <el-input v-model="searchForm.checkNo" placeholder="盘点单号" clearable />
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

    <!-- 盘点单列表 -->
    <el-card>
      <div style="margin-bottom: 16px">
        <el-button type="primary" @click="handleAdd">新增盘点单</el-button>
      </div>
      <el-table :data="tableData" border stripe v-loading="tableLoading">
        <el-table-column prop="checkNo" label="盘点单号" />
        <el-table-column prop="checkDate" label="盘点日期" />
        <el-table-column prop="remark" label="备注" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleDetail(row)">查看详情</el-button>
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

    <!-- 新增盘点单弹窗 -->
    <el-dialog title="新增盘点单" v-model="dialogVisible" width="800px" @close="handleDialogClose">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="盘点日期" prop="checkDate">
          <el-date-picker v-model="form.checkDate" type="date" placeholder="请选择盘点日期" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>

      <!-- 商品选择区 -->
      <div style="margin-top: 16px; margin-bottom: 16px">
        <div style="display: flex; align-items: center; gap: 12px">
          <span style="white-space: nowrap">选择商品：</span>
          <el-select
            v-model="selectedProductIds"
            multiple
            filterable
            placeholder="请选择商品（可多选，含零库存商品）"
            style="flex: 1"
          >
            <el-option
              v-for="p in productOptions"
              :key="p.id"
              :label="p.name + '（系统库存：' + (p.stockQuantity || 0) + '）'"
              :value="p.id"
            />
          </el-select>
          <el-button type="primary" @click="handleConfirmSelect">确认选择</el-button>
        </div>
      </div>

      <!-- 明细表格 -->
      <el-table :data="details" border stripe>
        <el-table-column prop="productName" label="商品名称" />
        <el-table-column label="系统库存数量">
          <template #default="{ row }">
            <span>{{ row.systemQuantity }}</span>
          </template>
        </el-table-column>
        <el-table-column label="实盘数量" width="180">
          <template #default="{ row }">
            <el-input-number v-model="row.actualQuantity" :min="0" />
          </template>
        </el-table-column>
        <el-table-column label="盈亏数量" width="100">
          <template #default="{ row }">
            <span :style="{ color: diffOf(row) === 0 ? '' : diffOf(row) > 0 ? '#67c23a' : '#f56c6c' }">
              {{ diffOf(row) > 0 ? '+' + diffOf(row) : diffOf(row) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ $index }">
            <el-button type="danger" size="small" @click="details.splice($index, 1)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        style="margin-top: 12px"
        title="提交后系统会按数据库中的最新库存重新计算盈亏，并自动生成盘盈/盘亏流水并修正库存。"
      />

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">提交</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情弹窗 -->
    <el-dialog title="盘点单详情" v-model="detailVisible" width="800px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="盘点单号">{{ detailCheck.checkNo }}</el-descriptions-item>
        <el-descriptions-item label="盘点日期">{{ detailCheck.checkDate }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detailCheck.remark }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="detailDetails" border stripe style="margin-top: 16px">
        <el-table-column prop="productName" label="商品名称" />
        <el-table-column prop="systemQuantity" label="系统库存数量" />
        <el-table-column prop="actualQuantity" label="实盘数量" />
        <el-table-column prop="diffQuantity" label="盈亏数量" />
      </el-table>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { listInventoryCheck, addInventoryCheck, getInventoryCheck } from '../../api/inventoryCheck'
import { listProductAll } from '../../api/product'

const searchForm = reactive({
  checkNo: '',
  dateRange: null
})

const form = reactive({
  checkDate: '',
  remark: ''
})

const rules = {
  checkDate: [{ required: true, message: '请选择盘点日期', trigger: 'change' }]
}

const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const tableLoading = ref(false)
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const productOptions = ref([])
const selectedProductIds = ref([])
const details = ref([])

const detailVisible = ref(false)
const detailCheck = reactive({})
const detailDetails = ref([])

onMounted(() => {
  fetchData()
  loadProducts()
})

async function loadProducts() {
  try {
    // 零库存商品也要能盘点（盘盈场景）
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
    if (searchForm.checkNo) params.checkNo = searchForm.checkNo
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    const res = await listInventoryCheck(params)
    if (res.code === 200) {
      tableData.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } finally {
    tableLoading.value = false
  }
}

function diffOf(row) {
  const actual = row.actualQuantity === null || row.actualQuantity === undefined
    ? row.systemQuantity
    : row.actualQuantity
  return (actual || 0) - (row.systemQuantity || 0)
}

function handleSearch() {
  pageNum.value = 1
  fetchData()
}

function handleReset() {
  searchForm.checkNo = ''
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
  form.checkDate = ''
  form.remark = ''
  selectedProductIds.value = []
  details.value = []
  formRef.value?.clearValidate()
  dialogVisible.value = true
}

function handleDialogClose() {
  selectedProductIds.value = []
  details.value = []
}

function handleConfirmSelect() {
  if (selectedProductIds.value.length === 0) {
    ElMessage.warning('请选择商品')
    return
  }
  const currentIds = details.value.map(d => d.productId)
  let added = 0
  selectedProductIds.value.forEach(id => {
    if (!currentIds.includes(id)) {
      const product = productOptions.value.find(p => p.id === id)
      if (product) {
        details.value.push({
          productId: product.id,
          productName: product.name,
          systemQuantity: product.stockQuantity || 0,
          actualQuantity: product.stockQuantity || 0
        })
        added++
      }
    }
  })
  selectedProductIds.value = []
  ElMessage.success(added > 0 ? `已添加 ${added} 个商品到明细` : '所选商品已在明细中')
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (details.value.length === 0) {
    ElMessage.warning('请至少添加一条盘点明细')
    return
  }
  const data = {
    check: {
      checkDate: form.checkDate,
      remark: form.remark
    },
    // 系统库存由后端按数据库最新值重新计算，前端只提交实盘数量
    details: details.value.map(d => ({
      productId: d.productId,
      actualQuantity: d.actualQuantity === null || d.actualQuantity === undefined
        ? d.systemQuantity
        : d.actualQuantity
    }))
  }
  submitting.value = true
  try {
    const res = await addInventoryCheck(data)
    if (res.code === 200) {
      ElMessage.success('新增盘点单成功')
      dialogVisible.value = false
      fetchData()
    }
  } catch (e) {
    // 失败原因（如实盘数量非法）由响应拦截器统一提示
  } finally {
    submitting.value = false
  }
}

async function handleDetail(row) {
  detailCheck.checkNo = row.checkNo
  detailCheck.checkDate = row.checkDate
  detailCheck.remark = row.remark
  detailDetails.value = []
  detailVisible.value = true
  try {
    const res = await getInventoryCheck(row.id)
    if (res.code === 200) {
      detailDetails.value = res.data.details || []
    }
  } catch (e) {
    // 拦截器已提示
  }
}
</script>
