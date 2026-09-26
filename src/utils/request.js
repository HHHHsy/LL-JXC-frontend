import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器：自动携带 Token
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = token
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 文件下载（模板导出等）直接返回二进制内容，不做 Result 解析
    if (response.config && response.config.responseType === 'blob') {
      return response.data
    }
    const res = response.data
    if (res.code === 200) {
      return res
    } else {
      ElMessage.error(res.msg || '请求失败')
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
  },
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('realName')
      ElMessage.error('登录已过期，请重新登录')
      window.location.href = '/login'
      return Promise.reject(error)
    }
    ElMessage.error(describeError(error))
    return Promise.reject(error)
  }
)

/** 把 axios 的英文错误翻译成能看懂、能照做的中文提示 */
function describeError(error) {
  const serverMsg = error.response?.data?.msg
  if (serverMsg) {
    return serverMsg
  }
  const isTimeout = error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '')
  if (isTimeout) {
    // 送货单「直接打印」超时基本都是打印机侧卡住（离线/缺纸/虚拟打印机弹保存框）
    return '请求超时：服务器长时间没有响应。若是「直接打印」，通常是打印机离线、缺纸，或选到了虚拟 PDF 打印机（会等「另存为」窗口）'
  }
  if (error.message === 'Network Error') {
    return '连不上服务器，请确认后端程序是否已启动'
  }
  return error.message || '网络错误'
}

export default request
