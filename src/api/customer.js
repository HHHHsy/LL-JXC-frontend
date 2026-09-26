import request from '../utils/request'
export const listCustomer = (params) => request.get('/customer/list', { params })
export const listCustomerAll = () => request.get('/customer/all')
export const addCustomer = (data) => request.post('/customer', data)
export const updateCustomer = (data) => request.put('/customer', data)
export const deleteCustomer = (id) => request.delete(`/customer/${id}`)
