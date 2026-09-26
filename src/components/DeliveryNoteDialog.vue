<template>
  <el-dialog
    v-model="visible"
    title="销售送货单"
    width="920px"
    class="delivery-note-dialog"
    append-to-body
  >
    <div v-loading="loading" class="note-wrapper">
      <div v-if="note" class="note-sheet" :class="{ 'dot-matrix': currentPaper.dotMatrix }">
        <div v-if="currentPaper.dotMatrix" class="note-page-tag">{{ currentPaper.label }}</div>
        <div class="note-header">
          <div class="note-company">{{ note.companyName }}</div>
          <div class="note-title">{{ note.title }}</div>
        </div>

        <div class="note-meta">
          <div class="meta-row">
            <span class="meta-item grow">客户名称：{{ note.customerName || '' }}</span>
            <span class="meta-item grow">地址：{{ note.customerAddress || '' }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-item grow">电话：{{ note.customerPhone || '' }}</span>
            <span class="meta-item grow">送货日期：{{ formatDateSlash(note.saleDate) }}</span>
            <span class="meta-item grow">单据编号：{{ note.orderNo || '' }}</span>
          </div>
        </div>

        <table class="note-table">
          <colgroup>
            <col style="width: 6%" />
            <col style="width: 28%" />
            <col style="width: 20%" />
            <col style="width: 8%" />
            <col style="width: 8%" />
            <col style="width: 10%" />
            <col style="width: 10%" />
            <col style="width: 10%" />
          </colgroup>
          <thead>
            <tr>
              <th>序号</th>
              <th>产品名称</th>
              <th>型号规格</th>
              <th>数量</th>
              <th>单位</th>
              <th>单价</th>
              <th>金额</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in note.items" :key="item.seq">
              <td class="center">{{ item.blank ? '' : item.seq }}</td>
              <td>{{ item.blank ? '' : item.productName }}</td>
              <td>{{ item.blank ? '' : item.spec }}</td>
              <td class="center">{{ item.blank ? '' : item.quantity }}</td>
              <td class="center">{{ item.blank ? '' : item.unit }}</td>
              <td class="right">{{ item.blank ? '' : formatAmount(item.price) }}</td>
              <td class="right">{{ item.blank ? '' : formatAmount(item.amount) }}</td>
              <td>{{ item.blank ? '' : item.remark }}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3" class="center">合计</td>
              <td class="center">{{ note.totalQuantity }}</td>
              <td colspan="2" class="right">金额(大写)：{{ note.totalAmountUpper }}</td>
              <td class="right">{{ formatAmount(note.totalAmount) }}</td>
              <td class="center">金额(小写)</td>
            </tr>
            <tr>
              <td colspan="4" class="pad">送货人：{{ note.deliveryMan }}</td>
              <td colspan="4" class="pad">收货人姓名：</td>
            </tr>
            <tr>
              <td colspan="8" class="pad">备注：{{ note.footerNote }}</td>
            </tr>
            <tr>
              <td colspan="4" class="pad">服务电话：{{ note.servicePhone }}</td>
              <td colspan="4" class="pad">联系地址：{{ note.serviceAddress }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <template #footer>
      <div class="print-panel no-print">
        <el-alert
          v-if="!printReady"
          class="print-block"
          type="warning"
          :closable="false"
          show-icon
          :title="'暂时不能用「直接打印」：' + printBlockReason"
          :description="printBlockHint"
        />

        <div class="print-row">
          <div class="print-paper">
            <span class="print-label">纸张</span>
            <el-radio-group v-model="paper" size="small" @change="handlePaperChange">
              <el-radio-button v-for="item in paperOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </el-radio-button>
            </el-radio-group>
            <el-tooltip :content="currentPaper.hint" placement="top" effect="dark">
              <el-icon class="print-tip"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>

          <div class="print-status" :class="{ 'is-warn': !printReady }">
            <el-icon class="print-status-icon"><Printer /></el-icon>
            <span class="print-status-text" :title="printStatusText">{{ printStatusText }}</span>
            <el-tooltip placement="top" effect="dark">
              <template #content>
                「直接打印」由后端渲染并直接送到打印机，不弹任何窗口（针式机推荐）。<br />
                「浏览器打印」走浏览器打印预览，可临时改纸张/份数；<br />
                点一下要直接出纸（不弹预览），请用「打印模式启动.bat」打开本系统。
              </template>
              <el-icon class="print-tip"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </div>

        <div class="print-actions">
          <el-button link type="primary" @click="handleOpenSettings">打印设置</el-button>
          <el-button @click="visible = false">关闭</el-button>
          <el-divider direction="vertical" />
          <el-button :type="printReady ? '' : 'primary'" :disabled="!note" @click="handlePrint">
            浏览器打印
          </el-button>
          <el-tooltip
            :disabled="printReady || !printBlockReason"
            :content="printBlockReason + '。' + printBlockHint"
            placement="top"
            effect="dark"
          >
            <span class="print-btn-wrap">
              <el-button
                :type="printReady ? 'primary' : ''"
                :disabled="!note || !printReady"
                :loading="printing"
                @click="handleDirectPrint"
              >
                直接打印
              </el-button>
            </span>
          </el-tooltip>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getDeliveryNote } from '../api/saleOrder'
import { getPrinters, printDeliveryNote } from '../api/print'
import { formatAmount, formatDateSlash } from '../utils/format'

const router = useRouter()

/* 后端直连打印：目标打印机与配置（在「系统设置 → 打印设置」里维护） */
const printing = ref(false)
const printTarget = ref('')
const printConfig = ref({})
/* 直连打印是否就绪：没打印机 / 名字对不上 / 选到虚拟 PDF 打印机时提前禁用按钮并说明原因，
   不让用户点了之后只等到一个超时 */
const printReady = ref(true)
const printBlockReason = ref('')
const printBlockHint = ref('')

/** 状态胶囊上的文字：就绪时报目标打印机，未就绪时给出简短结论（详细原因在提示条与悬停里） */
const printStatusText = computed(() => {
  if (!printReady.value) {
    return '直连打印机未就绪'
  }
  return '直连打印机：' + (printTarget.value || 'Windows 默认打印机')
})

/**
 * 纸张 / 打印机模式：
 * - 针式打印机吃「连续纸 + 压感复写」，需要按实际纸张尺寸设置 @page，并留出打印机不可打印的左边缘；
 * - 普通打印机走 A4/A5 单页纸。
 * 这里通过动态注入 @page 规则实现，选择会记在浏览器本地。
 */
const paperOptions = [
  {
    value: 'dot-241-140',
    label: '针式 241×140',
    size: '241mm 140mm',
    margin: '6mm 8mm',
    dotMatrix: true,
    hint: '针式打印机 + 241×140 连续纸（二联/三联送货单常用）。请在打印机驱动里把纸张设为 241×140，缩放 100%，关闭「适应页面」，并在浏览器打印对话框里去掉页眉页脚。'
  },
  {
    value: 'dot-241-93',
    label: '针式 241×93',
    size: '241mm 93mm',
    margin: '5mm 8mm',
    dotMatrix: true,
    hint: '针式打印机 + 241×93 连续纸（单联/小单）。内容较多时会自动续页，建议一单控制在 4~6 行明细。'
  },
  {
    value: 'dot-210-140',
    label: '针式 210×140',
    size: '210mm 140mm',
    margin: '6mm 6mm',
    dotMatrix: true,
    hint: '针式打印机 + 210×140 单页/连续纸。若打印出来右边被切，请在驱动里把纸张宽度设为实际的 210mm。'
  },
  {
    value: 'a5-landscape',
    label: '普通 A5 横向',
    size: 'A5 landscape',
    margin: '8mm',
    dotMatrix: false,
    hint: '激光/喷墨打印机使用 A5 横向单页纸，缩放 100%（默认）。'
  },
  {
    value: 'a4-landscape',
    label: '普通 A4 横向',
    size: 'A4 landscape',
    margin: '10mm',
    dotMatrix: false,
    hint: '激光/喷墨打印机使用 A4 横向单页纸，缩放 100%。'
  }
]

const PAPER_STORAGE_KEY = 'delivery-note-paper'
const paper = ref(localStorage.getItem(PAPER_STORAGE_KEY) || 'dot-241-140')
const currentPaper = computed(() => paperOptions.find(item => item.value === paper.value) || paperOptions[0])

/** 把选中的纸张写进 @page（打印时生效），组件里不再写死纸张 */
function applyPageStyle() {
  let style = document.getElementById('delivery-note-page-style')
  if (!style) {
    style = document.createElement('style')
    style.id = 'delivery-note-page-style'
    document.head.appendChild(style)
  }
  style.textContent = `@page { size: ${currentPaper.value.size}; margin: ${currentPaper.value.margin}; }`
}

function handlePaperChange() {
  localStorage.setItem(PAPER_STORAGE_KEY, paper.value)
  applyPageStyle()
}

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  orderId: { type: [Number, String], default: null }
})
const emit = defineEmits(['update:modelValue'])

const visible = ref(props.modelValue)
const loading = ref(false)
const note = ref(null)

watch(() => props.modelValue, (value) => {
  visible.value = value
  if (value && props.orderId) {
    applyPageStyle()
    loadPrintInfo()
    loadNote()
  }
})

/** 读取打印机配置，用于提示"直连打印机：xxx"并判断能否直接打印 */
async function loadPrintInfo() {
  try {
    const res = await getPrinters()
    if (res.code === 200) {
      printConfig.value = res.data.config || {}
      printReady.value = res.data.directPrintReady !== false
      printBlockReason.value = res.data.directPrintReason || ''
      printBlockHint.value = res.data.directPrintHint || ''
      if (printReady.value) {
        const configured = printConfig.value.printerName
        printTarget.value = res.data.effectivePrinter || configured || '（Windows 默认打印机）'
      } else {
        printTarget.value = ''
      }
    }
  } catch (e) {
    printTarget.value = ''
  }
}

/** 后端直连打印：无弹窗，直接送打印机 */
async function handleDirectPrint() {
  if (!props.orderId) {
    return
  }
  // 按钮在未就绪时是禁用的；这里再兜一层，避免状态过期后仍发出请求
  if (!printReady.value) {
    ElMessage.warning(printBlockReason.value + '。' + printBlockHint.value)
    return
  }
  printing.value = true
  try {
    const res = await printDeliveryNote(props.orderId, {})
    if (res.code === 200) {
      const data = res.data
      ElMessage.success(
        `已送打印机：${data.printer}｜${data.paper}｜${data.copies} 份` +
        (data.pages > 1 ? `｜共 ${data.pages} 页` : '')
      )
    }
  } catch (e) {
    // 失败原因（打印机没就绪、超时等）由响应拦截器统一提示；
    // 失败后刷新一次打印机状态，让按钮与提示条回到当前真实情况
    loadPrintInfo()
  } finally {
    printing.value = false
  }
}

watch(visible, (value) => {
  emit('update:modelValue', value)
})

async function loadNote() {
  loading.value = true
  note.value = null
  try {
    const res = await getDeliveryNote(props.orderId)
    if (res.code === 200) {
      note.value = res.data
    }
  } catch (e) {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}

function handlePrint() {
  if (!note.value) {
    ElMessage.warning('送货单尚未加载完成')
    return
  }
  // 确保 @page 与当前选择一致再调起打印
  applyPageStyle()
  window.print()
}

/** 抬头/送货人等信息在「系统设置」里维护 */
function handleOpenSettings() {
  visible.value = false
  router.push('/settings')
}
</script>

<style>
/* 送货单版式：接近 A5 横向纸质单据；打印时只输出这张单据 */
.note-sheet {
  position: relative;
  border: 1px solid #000;
  padding: 10px 14px 14px;
  color: #000;
  background: #fff;
  font-size: 13px;
  line-height: 1.4;
}

/* 针式打印机模式：纯黑白、无底纹、更紧凑，方便复写纸透印到二联/三联 */
.note-sheet.dot-matrix {
  font-size: 12px;
  padding: 6px 8px 8px;
}

.note-sheet.dot-matrix .note-company {
  font-size: 20px;
  letter-spacing: 1px;
}

.note-sheet.dot-matrix .note-title {
  font-size: 16px;
  letter-spacing: 4px;
}

.note-sheet.dot-matrix .note-table th,
.note-sheet.dot-matrix .note-table td {
  height: 20px;
  padding: 2px 3px;
}

/* 预览里提示当前纸张模式（不打印） */
.note-page-tag {
  position: absolute;
  right: 6px;
  top: 4px;
  font-size: 10px;
  color: #c0c4cc;
}

/* 打印操作区：上面一行是纸张与打印机状态，下面一行是按钮，层次清楚不挤在一起 */
.print-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}

.print-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px 16px;
  flex-wrap: wrap;
}

.print-paper {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.print-label {
  color: #606266;
  font-size: 13px;
}

.print-tip {
  color: #909399;
  cursor: help;
  flex: none;
}

/* 直连打印机状态：做成小胶囊，未就绪时变橙色，长名字自动省略 */
.print-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  padding: 3px 10px;
  border-radius: 12px;
  background: #f4f4f5;
  color: #606266;
  font-size: 12px;
  line-height: 18px;
}

.print-status.is-warn {
  background: #fdf6ec;
  color: #b88230;
}

.print-status-icon {
  font-size: 13px;
  flex: none;
}

.print-status-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 320px;
}

.print-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

/* 按钮间距统一交给 flex gap，去掉 Element 默认的相邻按钮外边距 */
.print-actions .el-button + .el-button {
  margin-left: 0;
}

.print-actions .el-divider--vertical {
  margin: 0 4px;
}

.print-btn-wrap {
  display: inline-flex;
}

/* 直连打印不可用时的说明条（不打印到纸上） */
.print-block {
  text-align: left;
  margin-bottom: 2px;
}

.note-header {
  text-align: center;
  margin-bottom: 6px;
}

.note-company {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 2px;
}

.note-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 6px;
  margin-top: 2px;
}

.note-meta {
  margin-bottom: 6px;
}

.meta-row {
  display: flex;
  gap: 16px;
  line-height: 1.9;
}

.meta-item.grow {
  flex: 1;
}

.note-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.note-table th,
.note-table td {
  border: 1px solid #000;
  padding: 3px 4px;
  height: 22px;
  word-break: break-all;
}

.note-table th {
  text-align: center;
  font-weight: 700;
}

.note-table .center {
  text-align: center;
}

.note-table .right {
  text-align: right;
}

.note-table .pad {
  padding-left: 6px;
}

.note-table .total-row td {
  font-weight: 700;
}

@media print {
  /* 打印时隐藏应用本体与弹窗外壳，只保留送货单 */
  #app {
    display: none !important;
  }

  .no-print,
  .el-dialog__header,
  .el-dialog__footer,
  .el-loading-mask {
    display: none !important;
  }

  .el-overlay,
  .el-overlay-dialog {
    position: static !important;
    overflow: visible !important;
    background: transparent !important;
  }

  .el-dialog {
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    box-shadow: none !important;
  }

  .el-dialog__body {
    padding: 0 !important;
  }

  .note-sheet {
    border: 1px solid #000 !important;
    font-size: 12px;
  }

  .note-sheet.dot-matrix {
    padding: 0 !important;
    font-size: 12px;
  }

  .note-page-tag {
    display: none !important;
  }

  /* 纸张尺寸不写死在这里：由「打印机类型」动态注入 @page 规则 */
}
</style>
