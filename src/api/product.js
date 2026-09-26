import request from '../utils/request'
export const listProduct = (params) => request.get('/product/list', { params })
export const listProductAll = (params) => request.get('/product/all', { params })
export const addProduct = (data) => request.post('/product', data)
export const updateProduct = (data) => request.put('/product', data)
export const deleteProduct = (id) => request.delete(`/product/${id}`)
export const previewProductImport = (formData) => request.post('/product/import/preview', formData)
export const importProducts = (formData) => request.post('/product/import', formData)
export const downloadProductTemplate = () => request.get('/product/import/template', { responseType: 'blob' })
