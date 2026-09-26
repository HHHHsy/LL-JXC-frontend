<template>
  <div>
    <!-- 汇总卡片 -->
    <el-row :gutter="16" style="margin-bottom: 16px">
      <el-col :xs="12" :sm="12" :md="6" v-for="card in statCards" :key="card.label">
        <el-card shadow="hover" class="stat-card" :style="{ borderTop: '3px solid ' + card.color }">
          <div class="stat-inner">
            <div>
              <div class="stat-value" :style="{ color: card.color }">{{ card.value }}</div>
              <div class="stat-label">{{ card.label }}</div>
              <div class="stat-sub" v-if="card.sub">{{ card.sub }}</div>
            </div>
            <div class="stat-icon-box" :style="{ background: card.bg }">
              <el-icon :size="28" :color="card.color"><component :is="card.icon" /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区 -->
    <el-row :gutter="16" style="margin-bottom: 16px">
      <el-col :xs="24" :lg="16">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">近6个月采购/销售趋势</span>
              <div class="card-tags">
                <span class="tag tag-buy">采购</span>
                <span class="tag tag-sell">销售</span>
              </div>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card">
          <template #header><span class="card-title">商品分类占比</span></template>
          <div ref="categoryChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card">
          <template #header><span class="card-title">本月热销商品排行</span></template>
          <div ref="topChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card">
          <template #header><span class="card-title">最近出入库记录</span></template>
          <el-table :data="stats.recentLogs" size="small" max-height="300">
            <el-table-column label="时间" width="155">
              <template #default="{ row }">{{ formatDateTime(row.changeTime) }}</template>
            </el-table-column>
            <el-table-column prop="productName" label="商品" min-width="100" show-overflow-tooltip />
            <el-table-column label="类型" width="65">
              <template #default="{ row }">
                <el-tag :type="row.changeType === '入库' ? 'success' : 'danger'" size="small" effect="dark" round>
                  {{ row.changeType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="changeQuantity" label="数量" width="60" />
            <el-table-column prop="relatedOrderNo" label="单号" width="130" show-overflow-tooltip />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, markRaw } from 'vue'
import * as echarts from 'echarts'
import { getDashboardStats } from '../api/dashboard'
import { formatDateTime } from '../utils/format'

const stats = reactive({
  productCount: 0, customerCount: 0, supplierCount: 0, lowStockCount: 0, lowStockThreshold: 10,
  purchaseTrend: [], saleTrend: [], categoryDistribution: [],
  recentLogs: [], topProducts: []
})

const statCards = computed(() => [
  { label: '商品总数', value: stats.productCount, color: '#409EFF', bg: 'rgba(64,158,255,0.1)', icon: 'Box', sub: '种' },
  { label: '客户总数', value: stats.customerCount, color: '#E6A23C', bg: 'rgba(230,162,60,0.1)', icon: 'User', sub: '个' },
  { label: '供应商总数', value: stats.supplierCount, color: '#67C23A', bg: 'rgba(103,194,58,0.1)', icon: 'OfficeBuilding', sub: '个' },
  { label: '低库存预警', value: stats.lowStockCount, color: '#F56C6C', bg: 'rgba(245,108,108,0.1)', icon: 'WarningFilled', sub: `种 (< ${stats.lowStockThreshold})` }
])

const trendChartRef = ref(null)
const categoryChartRef = ref(null)
const topChartRef = ref(null)

let chartInstances = []

onMounted(async () => {
  try {
    const res = await getDashboardStats()
    if (res.code === 200) {
      Object.assign(stats, res.data)
    }
  } catch (e) {
    // 接口失败也要渲染空图表，避免整页空白（提示由响应拦截器统一给出）
  }
  await nextTick()
  initCharts()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstances.forEach(c => c.dispose())
  chartInstances = []
})

function handleResize() {
  chartInstances.forEach(c => c.resize())
}

function initCharts() {
  renderTrendChart()
  renderCategoryChart()
  renderTopChart()
}

function renderTrendChart() {
  if (!trendChartRef.value) return
  const chart = markRaw(echarts.init(trendChartRef.value))
  chartInstances.push(chart)

  const months = stats.purchaseTrend.map(i => i.month)
  const purchaseData = stats.purchaseTrend.map(i => i.amount)
  const saleData = stats.saleTrend.map(i => i.amount)

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: '#e4e7ed',
      textStyle: { color: '#333' },
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(64,158,255,0.05)' } }
    },
    legend: {
      data: ['采购金额', '销售金额'],
      right: 10,
      textStyle: { fontSize: 12 },
      itemWidth: 10, itemHeight: 10
    },
    grid: { left: 55, right: 25, top: 35, bottom: 35 },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      axisTick: { show: false },
      axisLabel: { color: '#999' }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
      axisLabel: { color: '#999', formatter: v => v >= 10000 ? (v / 10000).toFixed(1) + '万' : v }
    },
    series: [
      {
        name: '采购金额', type: 'bar',
        barWidth: 16,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#66b1ff' },
            { offset: 1, color: '#409EFF' }
          ])
        },
        emphasis: {
          itemStyle: { color: '#337ecc' }
        },
        data: purchaseData
      },
      {
        name: '销售金额', type: 'bar',
        barWidth: 16,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#95d475' },
            { offset: 1, color: '#67C23A' }
          ])
        },
        emphasis: {
          itemStyle: { color: '#529b2e' }
        },
        data: saleData
      }
    ]
  })
}

const PIE_COLORS = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#36CFC9', '#A0D911', '#597EF7']

function renderCategoryChart() {
  if (!categoryChartRef.value) return
  const chart = markRaw(echarts.init(categoryChartRef.value))
  chartInstances.push(chart)

  chart.setOption({
    tooltip: {
      trigger: 'item',
      backgroundColor: '#fff',
      borderColor: '#e4e7ed',
      textStyle: { color: '#333' },
      formatter: '{b}: {c} 种 ({d}%)'
    },
    color: PIE_COLORS,
    series: [{
      type: 'pie',
      radius: ['42%', '75%'],
      center: ['50%', '52%'],
      roseType: 'area',
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: {
        color: '#666',
        formatter: '{b}\n{d}%',
        fontSize: 11
      },
      labelLine: { lineStyle: { color: '#ccc' } },
      emphasis: {
        label: { fontSize: 16, fontWeight: 'bold' },
        scaleSize: 10
      },
      data: stats.categoryDistribution.length > 0
        ? stats.categoryDistribution
        : [{ name: '暂无数据', value: 1, itemStyle: { color: '#e0e0e0' } }]
    }]
  })
}

function renderTopChart() {
  if (!topChartRef.value) return
  const chart = markRaw(echarts.init(topChartRef.value))
  chartInstances.push(chart)

  const items = [...stats.topProducts].reverse()
  const names = items.map(i => i.productName)
  const values = items.map(i => i.quantity)

  const maxVal = Math.max(...values, 1)
  const colors = items.map((_, idx) => {
    const ratio = idx / Math.max(items.length - 1, 1)
    const r = Math.round(64 + ratio * 166)
    const g = Math.round(158 - ratio * 80)
    const b = Math.round(255 - ratio * 180)
    return `rgb(${r},${g},${b})`
  })

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#fff',
      borderColor: '#e4e7ed',
      textStyle: { color: '#333' }
    },
    grid: { left: 100, right: 50, top: 10, bottom: 20 },
    xAxis: {
      type: 'value',
      splitLine: { show: false },
      axisLabel: { color: '#999' },
      max: maxVal * 1.2
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#666', fontSize: 12 }
    },
    series: [{
      type: 'bar',
      data: values.map((v, i) => ({
        value: v,
        itemStyle: {
          color: colors[i],
          borderRadius: [0, 6, 6, 0]
        }
      })),
      barWidth: 18,
      label: {
        show: true,
        position: 'right',
        color: '#666',
        fontSize: 12,
        formatter: '{c}'
      }
    }]
  })
}
</script>

<style scoped>
.stat-card {
  margin-bottom: 8px;
}
.stat-card :deep(.el-card__body) {
  padding: 18px 20px;
}
.stat-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stat-value {
  font-size: 30px;
  font-weight: 700;
  line-height: 1.2;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}
.stat-sub {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 2px;
}
.stat-icon-box {
  width: 50px; height: 50px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 12px;
}

.chart-card {
  margin-bottom: 8px;
}
.chart-card :deep(.el-card__header) {
  padding: 14px 20px;
  border-bottom: 1px solid #f0f0f0;
}
.chart-card :deep(.el-card__body) {
  padding: 12px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
.card-tags {
  display: flex;
  gap: 12px;
}
.tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
}
.tag-buy { background: rgba(64,158,255,0.12); color: #409EFF; }
.tag-sell { background: rgba(103,194,58,0.12); color: #67C23A; }

.chart-box {
  width: 100%;
  height: 310px;
}

/* 移动端图表高度自适应 */
@media (max-width: 768px) {
  .chart-box { height: 260px; }
  .stat-value { font-size: 24px; }
}
</style>
