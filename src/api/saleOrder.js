import request from '../utils/request'
export const listSaleOrder = (params) => request.get('/sale-order/list', { params })
export const getSaleOrder = (id) => request.get(`/sale-order/${id}`)
export const addSaleOrder = (data) => request.post('/sale-order', data)
export const updateSaleOrder = (data) => request.put('/sale-order', data)
export const deleteSaleOrder = (id) => request.delete(`/sale-order/${id}`)
export const cancelSaleOrder = (id) => request.post(`/sale-order/${id}/cancel`)
export const shipStock = (id, data) => request.post(`/sale-order/${id}/ship`, data)
export const getDeliveryNote = (id) => request.get(`/sale-order/${id}/delivery-note`)
