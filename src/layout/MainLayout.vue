<template>
  <el-container style="height: 100vh">
    <!-- 侧边栏 -->
    <el-aside width="220px" style="background-color: #304156">
      <div class="logo">
        <h2 style="color: #fff; text-align: center; padding: 16px 0; margin: 0;">LL进销存系统</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
        style="border-right: none"
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </el-menu-item>

        <el-sub-menu index="1">
          <template #title>
            <el-icon><Folder /></el-icon>
            <span>基础数据</span>
          </template>
          <el-menu-item index="/product">商品管理</el-menu-item>
          <el-menu-item index="/customer">客户管理</el-menu-item>
          <el-menu-item index="/supplier">供应商管理</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="2">
          <template #title>
            <el-icon><ShoppingCart /></el-icon>
            <span>采购管理</span>
          </template>
          <el-menu-item index="/purchase-order">采购订单</el-menu-item>
          <el-menu-item index="/purchase-receive">采购入库</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="3">
          <template #title>
            <el-icon><Sell /></el-icon>
            <span>销售管理</span>
          </template>
          <el-menu-item index="/sale-order">销售订单</el-menu-item>
          <el-menu-item index="/sale-ship">销售出库</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="4">
          <template #title>
            <el-icon><Box /></el-icon>
            <span>仓库管理</span>
          </template>
          <el-menu-item index="/inventory-query">库存查询</el-menu-item>
          <el-menu-item index="/inventory-log">库存流水</el-menu-item>
          <el-menu-item index="/inventory-check">库存盘点</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="5">
          <template #title>
            <el-icon><DataAnalysis /></el-icon>
            <span>统计报表</span>
          </template>
          <el-menu-item index="/purchase-report">采购明细表</el-menu-item>
          <el-menu-item index="/sale-report">销售明细表</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="6">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/settings">系统设置</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <el-header style="background: #fff; border-bottom: 1px solid #e6e6e6; display: flex; align-items: center; justify-content: space-between; padding: 0 20px;">
        <h3 style="margin: 0;">{{ currentTitle }}</h3>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="color: #666;">{{ realName }}</span>
          <el-button type="danger" size="small" @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      <el-main style="background: #f0f2f5;">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { logout, getCurrentUser } from '../api/auth'

const route = useRoute()
const router = useRouter()
const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta?.title || '')
const realName = ref('')

onMounted(async () => {
  realName.value = localStorage.getItem('realName') || '管理员'
  try {
    // 顺带校验令牌是否仍然有效，并同步最新的用户信息
    const res = await getCurrentUser()
    if (res.code === 200 && res.data.realName) {
      realName.value = res.data.realName
      localStorage.setItem('realName', realName.value)
    }
  } catch (e) {
    // 401 已由 request 响应拦截器统一处理
  }
})

async function handleLogout() {
  try {
    // 通知服务端作废令牌，避免令牌在有效期内仍可使用
    await logout()
  } catch (e) {
    // 网络异常也要保证本地退出
  }
  localStorage.removeItem('token')
  localStorage.removeItem('realName')
  router.push('/login')
}
</script>

<style scoped>
.logo {
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
</style>
