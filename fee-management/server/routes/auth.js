import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { db } from '../firebase/admin.js'
import { validateLogin, handleValidationErrors } from '../middleware/validate.js'

const router = express.Router()

router.post('/login', validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body
    
    // Query admin collection for user with matching email
    const adminSnapshot = await db.collection('admin')
      .where('email', '==', email)
      .limit(1)
      .get()
    
    if (adminSnapshot.empty) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    
    const adminDoc = adminSnapshot.docs[0]
    const adminData = adminDoc.data()
    
    // Compare password with bcrypt hash
    const passwordMatch = await bcrypt.compare(password, adminData.passwordHash)
    
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
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

router.post('/logout', (req, res) => {
  // Stateless logout - client just removes token
  res.json({ message: 'logged out' })
})

export default router
