import request from '../utils/request'

/** 可用打印机 + 纸张选项 + 当前打印配置 */
export const getPrinters = () => request.get('/print/printers')

/** 后端直连打印送货单（静默，不弹浏览器窗口）
 *  送印要等打印机响应，后端最多等 jxc.print.timeout-seconds（默认 20 秒），
 *  所以这里把超时放宽到 60 秒，避免后端还没判断完前端就先报超时。 */
export const printDeliveryNote = (orderId, params) =>
  request.post(`/print/delivery-note/${orderId}`, null, { params, timeout: 60000 })

/** 打印设置（打印机/纸张/份数/字体） */
export const getPrintConfig = () => request.get('/config/print')
export const savePrintConfig = (data) => request.put('/config/print', data)
