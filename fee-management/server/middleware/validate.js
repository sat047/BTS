import { body, validationResult } from 'express-validator'

export const validateStudent = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('dob').isISO8601().withMessage('Invalid date of birth'),
  body('category').isIn(['school', 'college', 'professional']).withMessage('Invalid category'),
  body('fatherName').trim().notEmpty().withMessage('Father name is required'),
  body('motherName').trim().notEmpty().withMessage('Mother name is required'),
  body('fatherMobile').trim().matches(/^\d{10}$/).withMessage('Father mobile must be 10 digits'),
  body('motherMobile').trim().matches(/^\d{10}$/).withMessage('Mother mobile must be 10 digits'),
  body('joinDate').isISO8601().withMessage('Invalid join date'),
  body('admissionFee').isInt({ min: 0 }).withMessage('Admission fee must be a positive number'),
  body('monthlyFee').isInt({ min: 0 }).withMessage('Monthly fee must be a positive number'),
]

export const validatePayment = [
  body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive number'),
  body('paymentDate').isISO8601().withMessage('Invalid payment date'),
  body('forMonth').matches(/^\d{4}-\d{2}$/).withMessage('forMonth must be in YYYY-MM format'),
  body('type').isIn(['admission', 'monthly']).withMessage('Invalid payment type'),
  body('note').optional().trim(),
]

export const validateLogin = [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),
]

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  next()
}
