import express from 'express'
import { db } from '../firebase/admin.js'

const router = express.Router()

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function isMonthlyPending(student, payments) {
  if (student.status === 'paused') return false

  const today = new Date()
  const joinDay = new Date(student.joinDate).getDate()
  const dueThisMonth = new Date(today.getFullYear(), today.getMonth(), joinDay)
  const currentMonthKey = getMonthKey()
  const paidThisMonth = payments.some(
    p => p.type === 'monthly' && p.forMonth === currentMonthKey
  )
  return today >= dueThisMonth && !paidThisMonth
}

// Generate all months from admission date to current month
function generateMonthsRange(student) {
  const months = []
  const startDate = new Date(student.joinDate)
  const currentDate = new Date()
  
  const pauseKey = student.pause_date ? getMonthKey(new Date(student.pause_date)) : null
  const resumeKey = student.resume_date ? getMonthKey(new Date(student.resume_date)) : null

  let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  const end = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

  while (current <= end) {
    const currentKey = getMonthKey(current)
    
    let isPaused = false
    if (pauseKey && currentKey > pauseKey) {
      isPaused = true
      if (resumeKey && currentKey >= resumeKey) {
        isPaused = false
      }
    }

    if (!isPaused) {
      months.push(currentKey)
    }
    current.setMonth(current.getMonth() + 1)
  }

  return months
}

// Get pending months for a student
function getPendingMonths(student, payments) {
  const allMonths = generateMonthsRange(student)
  const paidMonths = new Set(
    payments
      .filter(p => p.type === 'monthly' && p.forMonth)
      .map(p => p.forMonth)
  )

  const pendingMonths = allMonths.filter(month => !paidMonths.has(month))
  return pendingMonths
}

// Format month key to MM/YYYY
function formatMonthDisplay(monthKey) {
  const [year, month] = monthKey.split('-')
  return `${month}/${year}`
}

// GET dashboard summary (OPTIMIZED - parallel queries)
router.get('/summary', async (req, res) => {
  try {
    // Fetch all students and all payments in parallel (only 2 queries total)
    const [studentsSnapshot, paymentsSnapshot] = await Promise.all([
      db.collection('students').get(),
      db.collectionGroup('payments').get()
    ])

    const students = studentsSnapshot.docs.map(d => ({
      ...d.data(),
      id: d.id
    }))

    // Group payments by studentId in memory for O(1) lookup
    const paymentsByStudent = new Map()
    paymentsSnapshot.docs.forEach(doc => {
      const p = doc.data()
      if (!paymentsByStudent.has(p.studentId)) {
        paymentsByStudent.set(p.studentId, [])
      }
      paymentsByStudent.get(p.studentId).push(p)
    })

    let totalCollected = 0
    let totalPendingAmount = 0
    const pendingStudents = []
    const allPendingMonths = new Set()

    // Process results
    for (const student of students) {
      const payments = paymentsByStudent.get(student.id) || []

      // Sum collected
      totalCollected += payments.reduce((sum, p) => sum + p.amount, 0)

      // Check if pending this month
      if (isMonthlyPending(student, payments)) {
        // Calculate pending months for this student
        const studentPendingMonths = getPendingMonths(student, payments)
        const studentPendingAmount = studentPendingMonths.length * student.monthlyFee
        const pendingMonthsFormatted = studentPendingMonths
          .map(month => formatMonthDisplay(month))
          .join(', ')

        pendingStudents.push({
          ...student,
          pendingMonths: studentPendingMonths,
          pendingMonthsDisplay: pendingMonthsFormatted,
          pendingAmount: studentPendingAmount
        })

        totalPendingAmount += studentPendingAmount
        studentPendingMonths.forEach(month => allPendingMonths.add(month))
      }
    }

    // Format pending months for display
    const pendingMonthsDisplay = Array.from(allPendingMonths)
      .sort()
      .map(formatMonthDisplay)
      .join(', ')

    res.json({
      totalStudents: students.length,
      totalCollected,
      pendingStudents,
      pendingCount: pendingStudents.length,
      pendingAmount: totalPendingAmount,
      totalPendingAmount,
      pendingMonthsDisplay
    })
  } catch (error) {
    console.error('Error fetching dashboard summary:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard summary' })
  }
})

// GET all payments across all students (OPTIMIZED - parallel queries + pagination)
router.get('/all-payments', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const pageSize = parseInt(req.query.pageSize) || 100

    // Fetch all students and all payments in parallel
    const [studentsSnapshot, paymentsSnapshot] = await Promise.all([
      db.collection('students').get(),
      db.collectionGroup('payments').get()
    ])

    // Create a student lookup map for names
    const studentMap = {}
    studentsSnapshot.docs.forEach(d => {
      studentMap[d.id] = d.data().name
    })

    const allPayments = paymentsSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        studentName: studentMap[data.studentId] || 'Unknown'
      }
    })

    // Sort by payment date descending
    allPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))

    // Apply pagination
    const total = allPayments.length
    const startIndex = (page - 1) * pageSize
    const paginatedPayments = allPayments.slice(startIndex, startIndex + pageSize)

    res.json({
      data: paginatedPayments,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error('Error fetching all payments:', error)
    res.status(500).json({ error: 'Failed to fetch payments' })
  }
})

export default router
