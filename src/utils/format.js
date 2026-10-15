/**
 * 展示层格式化工具（数据脱敏在 mock/后端数据层完成，此处仅做展示转换）
 */

/** 金额：千分位 + ¥（DECIMAL(12,2) 对应两位小数） */
export function formatMoney(value, { symbol = true } = {}) {
  if (value === null || value === undefined || value === '') return '-'
  const num = Number(value)
  if (Number.isNaN(num)) return '-'
  const formatted = num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return symbol ? `¥${formatted}` : formatted
}

/** 日期时间 yyyy-MM-dd HH:mm */
export function formatDateTime(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** 日期 yyyy-MM-dd */
export function formatDate(value) {
  if (!value) return '-'
  return String(value).slice(0, 10)
}

/** 相对今天偏移 n 天的日期字符串（yyyy-MM-dd），保证 mock 数据永远新鲜 */
export function dayOffset(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  const p = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** 身份证号脱敏：保留前 3 后 2 */
export function maskIdCard(v) {
  if (!v || v.length < 8) return v || '-'
  return v.slice(0, 3) + '***********' + v.slice(-2)
}

/** 手机号脱敏：保留前 3 后 4 */
export function maskPhone(v) {
  if (!v || v.length < 7) return v || '-'
  return v.slice(0, 3) + '****' + v.slice(-4)
}

/** 银行卡号脱敏：保留后 4 位 */
export function maskBankAccount(v) {
  if (!v || v.length < 8) return v || '-'
  return '**** **** **** ' + v.slice(-4)
}
