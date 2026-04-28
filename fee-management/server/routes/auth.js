import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { db } from '../firebase/admin.js'
import { validateLogin, handleValidationErrors } from '../middleware/validate.js'

const router = express.Router()

function isFirestoreCredentialError(error) {
  // Check error code directly
  if (error?.code === 16) return true
  
  // Check for Firebase-specific credential errors
  if (error?.code === 'PERMISSION_DENIED') return true
  if (error?.code === 'UNAUTHENTICATED') return true
  
  // Check error messages
  const combinedMessage = [
    error?.message,
    error?.details,
    error?.errorInfo?.message,
    error?.errorInfo?.code
  ].filter(Boolean).join(' ').toLowerCase()

  return (
    /invalid authentication credentials/i.test(combinedMessage)
    || /access token expired/i.test(combinedMessage)
    || /credential/i.test(combinedMessage)
    || /permission denied/i.test(combinedMessage)
    || /unauthenticated/i.test(combinedMessage)
  )
}

router.post('/login', validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured')
      return res.status(503).json({ error: 'Server configuration error. Please try again later.' })
    }

    // Query admin collection for user with matching email
    let adminSnapshot
    try {
      adminSnapshot = await db.collection('admin')
        .where('email', '==', email)
        .limit(1)
        .get()
    } catch (firestoreError) {
      console.error('Firestore query error:', {
        code: firestoreError?.code,
        message: firestoreError?.message,
        stack: firestoreError?.stack
      })

      if (isFirestoreCredentialError(firestoreError)) {
        return res.status(503).json({
          error: 'Firebase server credentials are invalid or expired. Update the service account key and restart the server.'
        })
      }

      // Re-throw for generic error handling
      throw firestoreError
    }

    // Safe empty result check
    if (!adminSnapshot || adminSnapshot.empty) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const adminDoc = adminSnapshot.docs[0]
    const adminData = adminDoc.data()

    // Validate required fields exist before password comparison
    if (!adminData || !adminData.passwordHash) {
      console.error('Admin document missing passwordHash:', { adminId: adminDoc.id })
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Compare password with bcrypt hash
    let passwordMatch
    try {
      passwordMatch = await bcrypt.compare(password, adminData.passwordHash)
    } catch (bcryptError) {
      console.error('Bcrypt comparison error:', {
        message: bcryptError?.message,
        stack: bcryptError?.stack
      })
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Sign JWT token
    const token = jwt.sign(
      { adminId: adminDoc.id, email: adminData.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ token })
  } catch (error) {
    console.error('Login error (unexpected):', {
      code: error?.code,
      message: error?.message,
      stack: error?.stack,
      details: error?.details
    })

    res.status(500).json({ error: 'Login failed. Please try again later.' })
  }
})

router.post('/logout', (req, res) => {
  // Stateless logout - client just removes token
  res.json({ message: 'logged out' })
})

export default router
