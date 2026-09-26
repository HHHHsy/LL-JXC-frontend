import request from '../utils/request'
export const addInventoryCheck = (data) => request.post('/inventory-check', data)
export const getInventoryCheck = (id) => request.get(`/inventory-check/${id}`)
export const listInventoryCheck = (params) => request.get('/inventory-check/list', { params })
