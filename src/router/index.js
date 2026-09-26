import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layout/MainLayout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '首页' } },
      { path: 'product', name: 'Product', component: () => import('../views/product/ProductList.vue'), meta: { title: '商品管理' } },
      { path: 'customer', name: 'Customer', component: () => import('../views/customer/CustomerList.vue'), meta: { title: '客户管理' } },
      { path: 'supplier', name: 'Supplier', component: () => import('../views/supplier/SupplierList.vue'), meta: { title: '供应商管理' } },
      { path: 'purchase-order', name: 'PurchaseOrder', component: () => import('../views/purchase/PurchaseOrder.vue'), meta: { title: '采购订单' } },
      { path: 'purchase-receive', name: 'PurchaseReceive', component: () => import('../views/purchase/PurchaseReceive.vue'), meta: { title: '采购入库' } },
      { path: 'sale-order', name: 'SaleOrder', component: () => import('../views/sale/SaleOrder.vue'), meta: { title: '销售订单' } },
      { path: 'sale-ship', name: 'SaleShip', component: () => import('../views/sale/SaleShip.vue'), meta: { title: '销售出库' } },
      { path: 'inventory-query', name: 'InventoryQuery', component: () => import('../views/inventory/InventoryQuery.vue'), meta: { title: '库存查询' } },
      { path: 'inventory-log', name: 'InventoryLog', component: () => import('../views/inventory/InventoryLog.vue'), meta: { title: '库存流水' } },
      { path: 'inventory-check', name: 'InventoryCheck', component: () => import('../views/inventory/InventoryCheck.vue'), meta: { title: '库存盘点' } },
      { path: 'purchase-report', name: 'PurchaseReport', component: () => import('../views/report/PurchaseReport.vue'), meta: { title: '采购明细表' } },
      { path: 'sale-report', name: 'SaleReport', component: () => import('../views/report/SaleReport.vue'), meta: { title: '销售明细表' } },
      { path: 'settings', name: 'Settings', component: () => import('../views/system/Settings.vue'), meta: { title: '系统设置' } },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：未登录跳转登录页（依据路由 meta.requiresAuth 判断）
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path === '/login') {
    // 已登录则直接进主页
    return token ? next('/dashboard') : next()
  }
  const needAuth = to.matched.some(record => record.meta && record.meta.requiresAuth)
  if (needAuth && !token) {
    return next('/login')
  }
  next()
})

export default router
