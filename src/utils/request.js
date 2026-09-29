import axios from 'axios'
import { ElMessage } from 'element-plus'
import { notifyError } from './notify'

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
      notifyError(res.msg || '操作失败，请稍后再试')
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
  },
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('realName')
      notifyError('登录已过期，请重新登录', '需要重新登录')
      window.location.href = '/login'
      return Promise.reject(error)
    }
    notifyError(describeError(error))
    return Promise.reject(error)
  }
)

/**
 * 把各类报错统一翻译成能看懂、能照做的中文提示，绝不透出英文原文。
 * 优先级：后端返回的中文说明 > 按状态码翻译 > 按错误类型翻译 > 通用兜底。
 */
function describeError(error) {
  // 后端正常抛出的业务异常会带 Result.msg（已经是中文），直接用
  const serverMsg = error.response?.data?.msg
  if (serverMsg) {
    return serverMsg
  }

  // 没有消息体时按 HTTP 状态码给出人话解释
  const status = error.response?.status
  const statusText = {
    400: '提交的内容有误，请检查后重试',
    403: '当前账号没有权限执行这个操作',
    404: '要访问的功能不存在，请联系管理员检查',
    405: '操作方式不受支持，请联系管理员检查',
    408: '请求超时，请稍后重试',
    500: '服务器出了点问题，请稍后重试；若反复出现请联系管理员',
    502: '服务器暂时不可用，请稍后重试',
    503: '服务正在维护或暂时不可用，请稍后重试',
    504: '服务器响应超时，请稍后重试'
  }
  if (status && statusText[status]) {
    return statusText[status]
  }

  const isTimeout = error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '')
  if (isTimeout) {
    // 送货单「直接打印」超时基本都是打印机侧卡住（离线/缺纸/虚拟打印机弹保存框）
    return '请求超时：服务器长时间没有响应。若是「直接打印」，通常是打印机离线、缺纸，或选到了虚拟 PDF 打印机（会等「另存为」窗口）'
  }
  if (error.message === 'Network Error') {
    return '连不上服务器，请确认网络是否正常、后端程序是否已启动'
  }
  return '网络异常，请稍后重试；若反复出现请联系管理员'
}

export default request
