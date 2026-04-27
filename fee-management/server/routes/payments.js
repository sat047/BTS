import express from 'express'
import { db } from '../firebase/admin.js'
import { validatePayment, handleValidationErrors } from '../middleware/validate.js'

const router = express.Router({ mergeParams: true })

// GET all payments for a student
router.get('/', async (req, res) => {
  try {
    // id comes from the parent route's :id parameter
    const studentId = String(req.params.id).trim()

    // Verify student exists
    const studentSnap = await db.collection('students').doc(studentId).get()
    if (!studentSnap.exists) {
      return res.status(404).json({ error: 'Student not found' })
    }

    // Fetch payments sorted by date descending
    const snapshot = await db.collection('students').doc(studentId).collection('payments').orderBy('paymentDate', 'desc').get()

    const payments = snapshot.docs.map(d => ({
      ...d.data(),
      id: d.id
    }))

    res.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    res.status(500).json({ error: 'Failed to fetch payments' })
  }
})

// POST new payment
router.post('/', validatePayment, handleValidationErrors, async (req, res) => {
  try {
    const studentId = String(req.params.id).trim()
    const { amount, paymentDate, forMonth, type, note } = req.body

    // Verify student exists
    const studentSnap = await db.collection('students').doc(studentId).get()
    if (!studentSnap.exists) {
      return res.status(404).json({ error: 'Student not found' })
    }

    const docRef = await db.collection('students').doc(studentId).collection('payments').add({
      studentId,
      amount: parseInt(amount),
      paymentDate,
      forMonth,
      type,
      note: note || '',
      createdAt: new Date()
    })

    // Performance Win: Update the student document immediately
    // This makes the StudentsList fetch O(1)
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const isPayingCurrentMonth = forMonth === currentMonthKey;
    
    if (type === 'monthly' && isPayingCurrentMonth) {
      await db.collection('students').doc(studentId).update({
        isPending: false,
        lastPaymentDate: paymentDate,
        lastPaidMonth: forMonth
      });
    }

    res.status(201).json({
      id: docRef.id,
      studentId,
      amount: parseInt(amount),
      paymentDate,
      forMonth,
      type,
      note: note || ''
    })
  } catch (error) {
    console.error('Error creating payment:', error)
    res.status(500).json({ error: 'Failed to create payment' })
  }
})

export default router
