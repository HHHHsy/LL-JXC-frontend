import request from '../utils/request'
export const listSupplier = (params) => request.get('/supplier/list', { params })
export const listSupplierAll = () => request.get('/supplier/all')
export const addSupplier = (data) => request.post('/supplier', data)
export const updateSupplier = (data) => request.put('/supplier', data)
export const deleteSupplier = (id) => request.delete(`/supplier/${id}`)
