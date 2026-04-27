import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import PaymentModal from '../components/PaymentModal'
import FeeStatusBadge from '../components/FeeStatusBadge'
import client from '../api/client'
import { isMonthlyPending, calcSummary, formatDate, formatMonth, getPendingMonths } from '../utils/feeCalculator'

export default function StudentProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusDate, setStatusDate] = useState(new Date().toISOString().split('T')[0])
  const [statusLoading, setStatusLoading] = useState(false)

  useEffect(() => {
    fetchStudentData()
  }, [id])

  const fetchStudentData = async () => {
    try {
      const studentResponse = await client.get(`/students/${id}`)
      setStudent(studentResponse.data)
      
      const paymentsResponse = await client.get(`/students/${id}/payments`)
      setPayments(paymentsResponse.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch student')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return
    }

    try {
      await client.delete(`/students/${id}`)
      navigate('/students')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete student')
    }
  }

  const handlePaymentSuccess = () => {
    fetchStudentData()
  }

  const handleStatusChange = async () => {
    setStatusLoading(true)
    const isPausing = student.status !== 'paused'
    try {
      await client.put(`/students/${id}`, {
        status: isPausing ? 'paused' : 'active',
        [isPausing ? 'pause_date' : 'resume_date']: statusDate
      })
      setShowStatusModal(false)
      fetchStudentData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status')
    } finally {
      setStatusLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="fee-container">
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </>
    )
  }

  if (error || !student) {
    return (
      <>
        <Navbar />
        <div className="fee-container">
          <div className="p-4 bg-red-50 text-red-800 rounded-lg">{error}</div>
        </div>
      </>
    )
  }

  const isPending = isMonthlyPending(student, payments)
  const summary = calcSummary(student, payments)
  const pendingItems = getPendingMonths(student, payments)

  return (
    <>
      <Navbar />
      <div className="fee-container">
        <button
          onClick={() => navigate('/students')}
          className="text-indigo-600 hover:text-indigo-800 font-medium mb-4"
        >
          ← Back to Students
        </button>

        {/* Student Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="mb-3">
              <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {student.category.charAt(0).toUpperCase() + student.category.slice(1)}
                </span>
                {student.status === 'paused' && (
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-bold uppercase">
                    Paused
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowStatusModal(true)}
                className={`px-4 py-2 rounded-lg transition font-medium ${
                  student.status === 'paused' 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {student.status === 'paused' ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={() => navigate(`/students/${id}/edit`)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Date of Birth</p>
              <p className="font-medium text-gray-900">{formatDate(student.dob)}</p>
            </div>
            <div>
              <p className="text-gray-600">Join Date</p>
              <p className="font-medium text-gray-900">{formatDate(student.joinDate)}</p>
            </div>
            <div>
              <p className="text-gray-600">Father</p>
              <p className="font-medium text-gray-900">{student.fatherName}</p>
              <p className="text-gray-600">{student.fatherMobile}</p>
            </div>
            <div>
              <p className="text-gray-600">Mother</p>
              <p className="font-medium text-gray-900">{student.motherName}</p>
              <p className="text-gray-600">{student.motherMobile}</p>
            </div>
            <div>
              <p className="text-gray-600">Admission Fee</p>
              <p className="font-medium text-gray-900">₹{student.admissionFee}</p>
            </div>
            <div>
              <p className="text-gray-600">Monthly Fee</p>
              <p className="font-medium text-gray-900">₹{student.monthlyFee}/month</p>
            </div>
            {student.pause_date && (
              <div>
                <p className="text-gray-600">Pause Date</p>
                <p className="font-medium text-gray-900">{formatDate(student.pause_date)}</p>
              </div>
            )}
            {student.resume_date && (
              <div>
                <p className="text-gray-600">Resume Date</p>
                <p className="font-medium text-gray-900">{formatDate(student.resume_date)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Fee Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Fee Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <p className="text-gray-600 text-xs sm:text-sm">Total Expected</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">₹{summary.totalExpected}</p>
            </div>
            <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
              <p className="text-gray-600 text-xs sm:text-sm">Total Paid</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">₹{summary.totalPaid}</p>
            </div>
            <div className={`${summary.pending > 0 ? 'bg-red-50' : 'bg-green-50'} p-3 sm:p-4 rounded-lg`}>
              <p className="text-gray-600 text-xs sm:text-sm">Pending</p>
              <p className={`text-xl sm:text-2xl font-bold mt-1 ${summary.pending > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{summary.pending}
              </p>
              {summary.pending > 0 && pendingItems.length > 0 && (
                <p className="text-xs text-red-600 mt-2 font-medium">
                  Missing: {pendingItems.join(', ')}
                </p>
              )}
            </div>
            <div className="bg-indigo-50 p-3 sm:p-4 rounded-lg">
              <p className="text-gray-600 text-xs sm:text-sm">This Month</p>
              <div className="mt-2">
                <FeeStatusBadge isPending={isPending} />
              </div>
            </div>
          </div>
        </div>

        {/* Payments Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Add Payment
            </button>
          </div>

          {payments.length === 0 ? (
            <p className="text-gray-600">No payments recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Month</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{formatDate(payment.paymentDate)}</td>
                      <td className="py-3 px-4">{formatMonth(payment.forMonth)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          payment.type === 'admission' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {payment.type === 'admission' ? 'Admission' : 'Monthly'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">₹{payment.amount}</td>
                      <td className="py-3 px-4 text-gray-600">{payment.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal
          studentId={id}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {student.status === 'paused' ? 'Resume Student' : 'Pause Student'}
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select {student.status === 'paused' ? 'Resume' : 'Pause'} Date
              </label>
              <input
                type="date"
                value={statusDate}
                onChange={(e) => setStatusDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                disabled={statusLoading}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition font-medium ${
                  student.status === 'paused' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {statusLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
