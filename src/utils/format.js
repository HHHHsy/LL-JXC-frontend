/**
 * 通用格式化工具。
 */

/**
 * 后端 LocalDateTime 序列化为 ISO 字符串（2024-01-31T10:00:00），
 * 直接渲染会带 "T"，这里统一转成 "2024-01-31 10:00:00"。
 */
export function formatDateTime(value) {
  if (!value) return ''
  return String(value).replace('T', ' ').slice(0, 19)
}

/** 金额格式化：保留两位小数 */
export function formatAmount(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return '0.00'
  return num.toFixed(2)
}

/** 日期格式化为 2026/9/15（送货单等纸质单据习惯写法） */
export function formatDateSlash(value) {
  if (!value) return ''
  const parts = String(value).slice(0, 10).split('-')
  if (parts.length !== 3) return String(value)
  return `${parts[0]}/${Number(parts[1])}/${Number(parts[2])}`
}
