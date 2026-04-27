import express from 'express'
import { db } from '../firebase/admin.js'
import { validateStudent, handleValidationErrors } from '../middleware/validate.js'
import paymentsRouter from './payments.js'

const router = express.Router()

// Mount payments as a sub-resource of students
router.use('/:id/payments', paymentsRouter)

// GET all students
router.get('/', async (req, res) => {
  try {
    // Optimization: Calculate 'isPending' on the server 
    // or ideally fetch it from a denormalized field
    const snapshot = await db.collection('students').orderBy('name').get()
    
    const students = snapshot.docs.map(d => {
      const data = d.data();
      // Simple logic: if server already updated this field on payment, use it.
      // If not, we provide a default.
      return {
        ...data,
        id: d.id,
        isPending: data.isPending ?? false 
      }
    })
    res.json(students)
  } catch (error) {
    console.error('Error fetching students:', error)
    res.status(500).json({ error: 'Failed to fetch students' })
  }
})

// GET single student
router.get('/:id([a-zA-Z0-9_-]+)', async (req, res) => {
  try {
    // Ensure ID is a clean string
    const studentId = String(req.params.id).trim()
    const docSnap = await db.collection('students').doc(studentId).get()

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Student not found' })
    }

    res.json({ ...docSnap.data(), id: docSnap.id })
  } catch (error) {
    console.error(`Error fetching student [${req.params.id}]:`, error)
    res.status(500).json({
      error: 'Failed to fetch student',
      details: error.message // Added for easier debugging
    })
  }
})

// POST new student
router.post('/', validateStudent, handleValidationErrors, async (req, res) => {
  try {
    const { name, dob, category, fatherName, motherName, fatherMobile, motherMobile, joinDate, admissionFee, monthlyFee } = req.body

    const docRef = await db.collection('students').add({
      name,
      dob,
      category,
      fatherName,
      motherName,
      fatherMobile,
      motherMobile,
      joinDate,
      admissionFee: parseInt(admissionFee),
      monthlyFee: parseInt(monthlyFee),
      createdAt: new Date(),
      isPending: true // New students start as pending until first payment
    })

    res.status(201).json({
      id: docRef.id,
      name,
      dob,
      category,
      fatherName,
      motherName,
      fatherMobile,
      motherMobile,
      joinDate,
      admissionFee: parseInt(admissionFee),
      monthlyFee: parseInt(monthlyFee)
    })
  } catch (error) {
    console.error('Error creating student:', error)
    res.status(500).json({ error: 'Failed to create student' })
  }
})

// PUT update student
router.put('/:id([a-zA-Z0-9_-]+)', async (req, res) => {
  try {
    const studentId = String(req.params.id).trim()
    const docRef = db.collection('students').doc(studentId)

    // Check if document exists
    const docSnap = await docRef.get()
    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Student not found' })
    }

    // Update only provided fields
    const updateData = {}
    const allowedFields = ['name', 'dob', 'category', 'fatherName', 'motherName', 'fatherMobile', 'motherMobile', 'joinDate', 'admissionFee', 'monthlyFee', 'status', 'pause_date', 'resume_date']

    allowedFields.forEach(field => {
      if (field in req.body) {
        const value = req.body[field]
        if (field === 'admissionFee' || field === 'monthlyFee') {
          updateData[field] = parseInt(value)
        } else {
          updateData[field] = value
        }
      }
    })

    await docRef.update(updateData)

    const updatedSnap = await docRef.get()
    res.json({ ...updatedSnap.data(), id: updatedSnap.id })
  } catch (error) {
    console.error('Error updating student:', error)
    res.status(500).json({ error: 'Failed to update student' })
  }
})

// DELETE student
router.delete('/:id([a-zA-Z0-9_-]+)', async (req, res) => {
  try {
    const studentId = String(req.params.id).trim()
    const studentRef = db.collection('students').doc(studentId)

    // Check if document exists
    const docSnap = await studentRef.get()
    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Student not found' })
    }

    // Delete all payments in subcollection first
    const paymentsSnapshot = await db.collection('students').doc(studentId).collection('payments').get()

    for (const paymentDoc of paymentsSnapshot.docs) {
      await paymentDoc.ref.delete()
    }

    // Delete the student document
    await studentRef.delete()

    res.json({ message: 'deleted' })
  } catch (error) {
    console.error('Error deleting student:', error)
    res.status(500).json({ error: 'Failed to delete student' })
  }
})

export default router
