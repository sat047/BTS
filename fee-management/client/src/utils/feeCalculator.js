export function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${date.getFullYear()}`
}

export function formatMonth(monthKey) {
  if (!monthKey || !monthKey.includes('-')) return monthKey
  const [year, month] = monthKey.split('-')
  return `${month}/${year}`
}

export function isMonthlyPending(student, payments) {
  const today = new Date()
  const joinDay = new Date(student.joinDate).getDate()
  const dueThisMonth = new Date(today.getFullYear(), today.getMonth(), joinDay)
  const currentMonthKey = getMonthKey()
  const paidThisMonth = payments.some(
    p => p.type === 'monthly' && p.forMonth === currentMonthKey
  )
  return today >= dueThisMonth && !paidThisMonth
}

export function calcSummary(student, payments) {
  const join = new Date(student.joinDate)
  const now = new Date()
  const monthsElapsed =
    (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth()) + 1
  const totalExpected = student.admissionFee + monthsElapsed * student.monthlyFee
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  return { totalExpected, totalPaid, pending: Math.max(0, totalExpected - totalPaid) }
}

export function getPendingMonths(student, payments) {
  const pending = []
  if (!student?.joinDate) return pending

  // Check if admission fee is paid (if applicable)
  const hasAdmission = payments.some(p => p.type === 'admission')
  if (!hasAdmission && student.admissionFee > 0) {
    pending.push('Admission')
  }

  const join = new Date(student.joinDate)
  const now = new Date()
  
  let current = new Date(join.getFullYear(), join.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth(), 1)

  while (current <= end) {
    const monthKey = getMonthKey(current)
    const isPaid = payments.some(p => p.type === 'monthly' && p.forMonth === monthKey)
    if (!isPaid) pending.push(formatMonth(monthKey))
    current.setMonth(current.getMonth() + 1)
  }
  return pending
}
