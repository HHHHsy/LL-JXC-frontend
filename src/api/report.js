import request from '../utils/request'
export const purchaseDetail = (params) => request.get('/report/purchase-detail', { params })
export const saleDetail = (params) => request.get('/report/sale-detail', { params })
