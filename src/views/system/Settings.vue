<template>
  <div>
    <el-card v-loading="loading">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-weight: bold">送货单设置</span>
          <span style="color: #909399; font-size: 12px">保存后立即对之后打开/打印的送货单生效</span>
        </div>
      </template>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
        title="这里的内容会印在送货单上：公司抬头、送货人、页脚备注、本店服务电话与地址。工位/门店信息变了改这里即可，不用改程序配置。"
      />
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
        title="注意：送货单顶部「电话 / 地址」取的是客户档案里的联系电话与地址，客户没填写就是空白，不会用本店服务电话代替；本页的「服务电话 / 联系地址」只打印在单据最下面一行。"
      />

      <el-form :model="form" label-width="120px" style="max-width: 680px">
        <el-form-item label="公司名称">
          <el-input v-model="form.companyName" placeholder="如：巴马瓦尔塔蓄电池" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="单据标题">
          <el-input v-model="form.title" placeholder="送货单" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="送货人">
          <el-input v-model="form.deliveryMan" placeholder="默认打印在「送货人」栏" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="服务电话">
          <el-input v-model="form.servicePhone" placeholder="本店服务电话，打印在送货单最下面一行" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="联系地址">
          <el-input v-model="form.serviceAddress" placeholder="如：巴马环城路瓦尔塔蓄电池" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="页脚备注">
          <el-input
            v-model="form.footerNote"
            type="textarea"
            :rows="2"
            maxlength="200"
            show-word-limit
            placeholder="如：请仔细核对产品型号数量，如有误请两日内提出，并出具证明，协商解决"
          />
        </el-form-item>
        <el-form-item label="最少打印行数">
          <el-input-number v-model="form.minRows" :min="1" :max="20" />
          <span style="margin-left: 8px; color: #909399">明细不足该行数时自动补空行，与纸质单据对齐</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
          <el-button @click="fetchData">放弃修改</el-button>
          <el-button link type="primary" @click="handlePreview">去销售订单打印送货单 →</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="printLoading" style="margin-top: 16px">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-weight: bold">打印设置（送货单直连打印）</span>
          <span style="color: #909399; font-size: 12px">保存后送货单里的「直接打印」立即使用这里的打印机与纸张</span>
        </div>
      </template>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
        title="「直接打印」由后端渲染后直接送到打印机，不弹浏览器打印窗口（针式机推荐）。选好针式打印机与 241×140 纸张即可。"
      />

      <el-alert
        v-if="!printReady"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
        :title="'当前不能直接打印：' + printReason"
        :description="printHint"
      />

      <el-form :model="printForm" label-width="120px" style="max-width: 680px">
        <el-form-item label="打印机">
          <el-select
            v-model="printForm.printerName"
            placeholder="使用 Windows 默认打印机"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="p in printers"
              :key="p.name"
              :label="printerLabel(p)"
              :value="p.name"
            />
          </el-select>
          <div v-if="printers.length === 0" style="color: #e6a23c; font-size: 12px; margin-top: 4px">
            未检测到任何打印机，请先在 Windows 里安装打印机驱动
          </div>
          <div v-else-if="selectedPrinterVirtual" style="color: #e6a23c; font-size: 12px; margin-top: 4px">
            选中的是「打印到文件」类虚拟打印机，它不会直接出纸（会弹保存窗口，表现为点了没反应），
            请在 Windows 里装好针式/激光打印机后再来选
          </div>
        </el-form-item>
        <el-form-item label="纸张">
          <el-select v-model="printForm.paper" style="width: 100%">
            <el-option
              v-for="p in papers"
              :key="p.value"
              :label="p.label + '（' + p.size + '）'"
              :value="p.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="份数">
          <el-input-number v-model="printForm.copies" :min="1" :max="5" />
          <span style="margin-left: 8px; color: #909399">二联/三联复写纸填 1 即可</span>
        </el-form-item>
        <el-form-item label="字体 / 字号">
          <el-input v-model="printForm.font" style="width: 160px" placeholder="宋体" />
          <el-input-number v-model="printForm.fontSize" :min="7" :max="14" style="margin-left: 12px" />
          <span style="margin-left: 8px; color: #909399">针式打印建议：宋体 / 9</span>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="printSaving" @click="handleSavePrint">保存</el-button>
          <el-button @click="fetchPrint">放弃修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getDeliveryNoteConfig, saveDeliveryNoteConfig } from '../../api/config'
import { getPrinters, savePrintConfig } from '../../api/print'

const router = useRouter()

/** 打印机下拉里的说明：标出系统默认与虚拟打印机（虚拟打印机不能直接出纸） */
function printerLabel(p) {
  let label = p.name
  if (p.virtual) {
    label += '（虚拟打印机，不能直接出纸）'
  }
  if (p.default) {
    label += '（系统默认）'
  }
  return label
}

const selectedPrinterVirtual = computed(() => {
  const current = printers.value.find(p => p.name === printForm.printerName)
  return !!current && current.virtual
})

const loading = ref(false)
const saving = ref(false)
const form = reactive({
  companyName: '',
  title: '送货单',
  deliveryMan: '',
  servicePhone: '',
  serviceAddress: '',
  footerNote: '',
  minRows: 4
})

const printLoading = ref(false)
const printSaving = ref(false)
const printers = ref([])
const papers = ref([])
/* 直连打印就绪情况：由后端 /api/print/printers 判断（没打印机 / 名字对不上 / 只有虚拟打印机） */
const printReady = ref(true)
const printReason = ref('')
const printHint = ref('')
const printForm = reactive({
  printerName: '',
  paper: 'dot-241-140',
  copies: 1,
  font: '宋体',
  fontSize: 9
})

onMounted(() => {
  fetchData()
  fetchPrint()
})

async function fetchData() {
  loading.value = true
  try {
    const res = await getDeliveryNoteConfig()
    if (res.code === 200) {
      const data = res.data || {}
      form.companyName = data.companyName || ''
      form.title = data.title || '送货单'
      form.deliveryMan = data.deliveryMan || ''
      form.servicePhone = data.servicePhone || ''
      form.serviceAddress = data.serviceAddress || ''
      form.footerNote = data.footerNote || ''
      form.minRows = Number(data.minRows) > 0 ? Number(data.minRows) : 4
    }
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!form.companyName) {
    ElMessage.warning('请填写公司名称')
    return
  }
  saving.value = true
  try {
    const payload = {
      companyName: form.companyName,
      title: form.title,
      deliveryMan: form.deliveryMan,
      servicePhone: form.servicePhone,
      serviceAddress: form.serviceAddress,
      footerNote: form.footerNote,
      minRows: String(form.minRows)
    }
    const res = await saveDeliveryNoteConfig(payload)
    if (res.code === 200) {
      ElMessage.success('已保存，之后打开的送货单会使用新抬头')
      fetchData()
    }
  } catch (e) {
    // 拦截器已提示
  } finally {
    saving.value = false
  }
}

async function fetchPrint() {
  printLoading.value = true
  try {
    const res = await getPrinters()
    if (res.code === 200) {
      printers.value = res.data.printers || []
      papers.value = res.data.papers || []
      printReady.value = res.data.directPrintReady !== false
      printReason.value = res.data.directPrintReason || ''
      printHint.value = res.data.directPrintHint || ''
      const config = res.data.config || {}
      printForm.printerName = config.printerName || ''
      printForm.paper = config.paper || 'dot-241-140'
      printForm.copies = Number(config.copies) > 0 ? Number(config.copies) : 1
      printForm.font = config.font || '宋体'
      printForm.fontSize = Number(config.fontSize) > 0 ? Number(config.fontSize) : 9
    }
  } catch (e) {
    // 拦截器已提示
  } finally {
    printLoading.value = false
  }
}

async function handleSavePrint() {
  printSaving.value = true
  try {
    const payload = {
      printerName: printForm.printerName || '',
      paper: printForm.paper,
      copies: String(printForm.copies),
      font: printForm.font,
      fontSize: String(printForm.fontSize)
    }
    const res = await savePrintConfig(payload)
    if (res.code === 200) {
      ElMessage.success('打印设置已保存')
      fetchPrint()
    }
  } catch (e) {
    // 拦截器已提示
  } finally {
    printSaving.value = false
  }
}

function handlePreview() {
  router.push('/sale-order')
}
</script>
