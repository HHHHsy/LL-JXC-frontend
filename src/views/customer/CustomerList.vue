<template>
  <div>
    <!-- 搜索区 -->
    <el-card style="margin-bottom: 16px">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="客户编码">
          <el-input v-model="searchForm.code" placeholder="客户编码" clearable />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input v-model="searchForm.name" placeholder="客户名称" clearable />
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
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="code" label="客户编码" />
        <el-table-column prop="name" label="客户名称" />
        <el-table-column prop="contact" label="联系人" />
        <el-table-column prop="phone" label="联系电话" />
        <el-table-column prop="address" label="地址" />
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
        <el-form-item label="客户编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入客户编码" />
        </el-form-item>
        <el-form-item label="客户名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contact" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" placeholder="请输入地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listCustomer, addCustomer, updateCustomer, deleteCustomer } from '../../api/customer'

const searchForm = reactive({
  code: '',
  name: ''
})

const form = reactive({
  code: '',
  name: '',
  contact: '',
  phone: '',
  address: ''
})

const rules = {
  code: [{ required: true, message: '请输入客户编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }]
}

const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const tableLoading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增客户')
const formRef = ref(null)
const editId = ref(null)

onMounted(() => {
  fetchData()
})

async function fetchData() {
  tableLoading.value = true
  try {
    const res = await listCustomer({
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

function handleAdd() {
  dialogTitle.value = '新增客户'
  editId.value = null
  Object.assign(form, {
    code: '',
    name: '',
    contact: '',
    phone: '',
    address: ''
  })
  formRef.value?.clearValidate()
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = '编辑客户'
  editId.value = row.id
  Object.assign(form, {
    code: row.code,
    name: row.name,
    contact: row.contact || '',
    phone: row.phone || '',
    address: row.address || ''
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
      ? await updateCustomer({ ...data, id: editId.value })
      : await addCustomer(data)
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
  ElMessageBox.confirm('确定要删除该客户吗？已被销售单据引用的客户无法删除。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        const res = await deleteCustomer(row.id)
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
