import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import studentRoutes from './routes/students.js'
import paymentRoutes from './routes/payments.js'
import dashboardRoutes from './routes/dashboard.js'
import verifyToken from './middleware/verifyToken.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' })
})

// Public routes
app.use('/api/auth', authRoutes)

// Protected routes
app.use('/api/students', verifyToken, studentRoutes)
app.use('/api/payments', verifyToken, paymentRoutes)
app.use('/api/dashboard', verifyToken, dashboardRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
