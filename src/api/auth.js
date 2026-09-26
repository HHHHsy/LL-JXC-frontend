import request from '../utils/request'

export const login = (data) => request.post('/login', data)
export const logout = () => request.post('/logout')
export const getCurrentUser = () => request.get('/current-user')
