import request from '../utils/request'
export const listInventoryLog = (params) => request.get('/inventory-log/list', { params })
