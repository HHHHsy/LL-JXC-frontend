import request from '../utils/request'

export const getDeliveryNoteConfig = () => request.get('/config/delivery-note')
export const saveDeliveryNoteConfig = (data) => request.put('/config/delivery-note', data)
