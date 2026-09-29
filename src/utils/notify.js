import { ElNotification } from 'element-plus'

/**
 * 全站统一的错误提示：从屏幕右上角侧边滑入。
 * 所有接口报错只允许走这里，禁止出现英文原文。
 */
export function notifyError(message, title = '操作失败') {
  ElNotification.error({
    title,
    message,
    position: 'top-right',
    duration: 4500,
    showClose: true
  })
}

/**
 * 统一的成功提示（同样侧边滑入，停留时间短一些）。
 */
export function notifySuccess(message, title = '操作成功') {
  ElNotification.success({
    title,
    message,
    position: 'top-right',
    duration: 2200,
    showClose: true
  })
}
