import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import SummaryCard from '../components/SummaryCard'
import client from '../api/client'

export default function Dashboard () {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await client.get('/dashboard/summary')
      setData(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard')
    } finally {
      setLoading(false)
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

  if (error) {
    return (
      <>
        <Navbar />
        <div className="fee-container">
          <div className="p-4 bg-red-50 text-red-800 rounded-lg">{error}</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="fee-container">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SummaryCard
            title="Total Students"
            value={data.totalStudents}
            color="indigo"
          />
          <SummaryCard
            title="Pending Amount"
            value={`₹${data.totalPendingAmount}`}
            color="red"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Payments</h2>

          {data.pendingStudents.length === 0 ? (
            <p className="text-gray-600">All payments are up to date ✓</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Pending Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Missing Months</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pendingStudents.map((student) => (
                    <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{student.name}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {student.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-semibold text-red-600">₹{student.pendingAmount}</td>
                      <td className="py-3 px-4 text-gray-600 text-sm">{student.pendingMonthsDisplay}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => navigate(`/students/${student.id}`)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
