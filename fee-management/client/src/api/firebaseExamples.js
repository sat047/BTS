/**
 * FIREBASE USAGE EXAMPLES
 * 
 * This file demonstrates how to use Firebase Firestore
 * alongside the existing Express API architecture.
 */

// ============================================
// EXAMPLE 1: Real-time Student List
// ============================================

import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/api/firebase'

function StudentListWithRealtimeUpdates() {
  const [students, setStudents] = useState([])

  useEffect(() => {
    // Listen to students collection in real-time
    const unsubscribe = onSnapshot(
      collection(db, 'students'),
      (snapshot) => {
        const studentsList = []
        snapshot.forEach((doc) => {
          studentsList.push({ id: doc.id, ...doc.data() })
        })
        setStudents(studentsList)
      },
      (error) => console.error('Error:', error)
    )

    // Cleanup subscription
    return () => unsubscribe()
  }, [])

  return (
    <div>
      {students.map((student) => (
        <div key={student.id}>{student.name}</div>
      ))}
    </div>
  )
}

// ============================================
// EXAMPLE 2: Real-time Payment Updates
// ============================================

import { query, where } from 'firebase/firestore'

function PaymentHistoryRealtime({ studentId }) {
  const [payments, setPayments] = useState([])

  useEffect(() => {
    const q = query(
      collection(db, 'students', studentId, 'payments'),
      where('type', '==', 'monthly')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const paymentsList = []
      snapshot.forEach((doc) => {
        paymentsList.push({ id: doc.id, ...doc.data() })
      })
      setPayments(paymentsList)
    })

    return () => unsubscribe()
  }, [studentId])

  return (
    <table>
      <tbody>
        {payments.map((payment) => (
          <tr key={payment.id}>
            <td>{payment.paymentDate}</td>
            <td>₹{payment.amount}</td>
            <td>{payment.type}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ============================================
// EXAMPLE 3: Hybrid Approach (Recommended)
// ============================================

/*
STRATEGY: Keep sensitive operations on backend,
use Firebase for real-time updates and caching.

1. Student data: Query via Express API
2. Real-time updates: Use Firebase listeners
3. User authentication: Keep on server with JWT
4. Payment recording: Still use Express API
*/

function HybridStudentProfile({ studentId }) {
  const [student, setStudent] = useState(null)
  const [realtimePayments, setRealtimePayments] = useState([])

  // Fetch student data from Express API (server-controlled)
  useEffect(() => {
    const fetchStudent = async () => {
      const response = await fetch(`/api/students/${studentId}`)
      const data = await response.json()
      setStudent(data)
    }
    fetchStudent()
  }, [studentId])

  // Get real-time payment updates from Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'students', studentId, 'payments'),
      (snapshot) => {
        const payments = []
        snapshot.forEach((doc) => {
          payments.push({ id: doc.id, ...doc.data() })
        })
        setRealtimePayments(payments)
      }
    )
    return () => unsubscribe()
  }, [studentId])

  if (!student) return <div>Loading...</div>

  return (
    <div>
      <h2>{student.name}</h2>
      <p>Monthly Fee: ₹{student.monthlyFee}</p>
      <h3>Recent Payments (Real-time)</h3>
      {realtimePayments.map((payment) => (
        <div key={payment.id}>
          {payment.paymentDate} - ₹{payment.amount}
        </div>
      ))}
    </div>
  )
}

// ============================================
// EXAMPLE 4: Dashboard with Real-time Stats
// ============================================

import { getDocs } from 'firebase/firestore'

async function calculateDashboardStats() {
  try {
    // Get students
    const studentsSnapshot = await getDocs(collection(db, 'students'))
    const totalStudents = studentsSnapshot.size

    // Calculate collected amount
    let totalCollected = 0
    for (const studentDoc of studentsSnapshot.docs) {
      const paymentsSnapshot = await getDocs(
        collection(db, 'students', studentDoc.id, 'payments')
      )
      paymentsSnapshot.forEach((paymentDoc) => {
        totalCollected += paymentDoc.data().amount
      })
    }

    return {
      totalStudents,
      totalCollected
    }
  } catch (error) {
    console.error('Error calculating stats:', error)
  }
}

// ============================================
// EXAMPLE 5: Using Firebase for Caching
// ============================================

import { enableIndexedDbPersistence } from 'firebase/firestore'

// Call once at app startup
try {
  await enableIndexedDbPersistence(db)
  console.log('Offline persistence enabled')
} catch (err) {
  if (err.code === 'failed-precondition') {
    console.log('Multiple tabs open, offline persistence disabled')
  } else if (err.code === 'unimplemented') {
    console.log('Browser does not support offline persistence')
  }
}

// Data will now be cached automatically

// ============================================
// EXAMPLE 6: Batch Operations
// ============================================

import { writeBatch } from 'firebase/firestore'

async function recordMultiplePayments(studentId, payments) {
  const batch = writeBatch(db)

  payments.forEach((payment) => {
    const paymentRef = doc(
      db,
      'students',
      studentId,
      'payments',
      `payment_${Date.now()}`
    )
    batch.set(paymentRef, payment)
  })

  await batch.commit()
  console.log('All payments recorded')
}

// ============================================
// EXAMPLE 7: Query with Filters
// ============================================

import { orderBy, limit } from 'firebase/firestore'

async function getRecentPayments(studentId, limitCount = 5) {
  const q = query(
    collection(db, 'students', studentId, 'payments'),
    orderBy('paymentDate', 'desc'),
    limit(limitCount)
  )

  const querySnapshot = await getDocs(q)
  const payments = []
  querySnapshot.forEach((doc) => {
    payments.push({ id: doc.id, ...doc.data() })
  })
  return payments
}

// ============================================
// EXAMPLE 8: Error Handling
// ============================================

async function safeFirestoreQuery(collectionName) {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    if (error.code === 'permission-denied') {
      console.error('Access denied - check Firestore security rules')
    } else if (error.code === 'unavailable') {
      console.error('Firestore temporarily unavailable')
    } else {
      console.error('Query failed:', error.message)
    }
    return []
  }
}

// ============================================
// EXPORT EXAMPLES
// ============================================

export {
  StudentListWithRealtimeUpdates,
  PaymentHistoryRealtime,
  HybridStudentProfile,
  calculateDashboardStats,
  recordMultiplePayments,
  getRecentPayments,
  safeFirestoreQuery
}
