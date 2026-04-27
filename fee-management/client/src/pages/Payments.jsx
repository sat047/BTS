import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import SummaryCard from '../components/SummaryCard'
import client from '../api/client'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterType, setFilterType] = useState('last-month')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15 // Changed to 15 transactions per page

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [paymentsRes, studentsRes] = await Promise.all([
        client.get('/dashboard/all-payments', {
          params: { page: 1, pageSize: 1000 } // Fetch a larger set for client-side filtering and then pagination
        }),
        client.get('/students')
      ])

      // Handle both old format (array) and new format (object with data/pagination)
      const paymentsData = Array.isArray(paymentsRes.data) ? paymentsRes.data : paymentsRes.data.data
      setPayments(paymentsData)
      setStudents(studentsRes.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredData = () => {
    let filteredP = [...payments]
    let filteredS = [...students]
    let start, end;

    if (filterType === 'last-month') {
      start = new Date()
      start.setDate(start.getDate() - 30)
      start.setHours(0, 0, 0, 0)
      end = new Date()
      end.setHours(23, 59, 59, 999)
    } else if (filterType === 'custom' && fromDate && toDate) {
      start = new Date(fromDate)
      start.setHours(0, 0, 0, 0)
      end = new Date(toDate)
      end.setHours(23, 59, 59, 999)
    }

    if (start && end) {
      filteredP = filteredP.filter(p => {
        const d = new Date(p.paymentDate)
        return d >= start && d <= end
      })
      filteredS = filteredS.filter(s => {
        const d = new Date(s.joinDate)
        return d >= start && d <= end
      })
    }

    return {
      filteredPayments: filteredP,
      totalPaymentsAmount: filteredP.reduce((sum, p) => sum + p.amount, 0),
      admissionsCount: filteredS.length
    }
  }

  const { filteredPayments, totalPaymentsAmount, admissionsCount } = getFilteredData()
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleFilterChange = (type) => {
    setFilterType(type)
    setCurrentPage(1)
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Payments</h1>

        {/* Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <SummaryCard
            title="Total Admissions (Selected Range)"
            value={`${admissionsCount} Students`}
            color="indigo"
          />
          <SummaryCard
            title="Total Payments Received (Selected Range)"
            value={`₹${totalPaymentsAmount}`}
            color="green"
          />
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          
          <div className="space-y-4">
            {/* Filter Type Selection */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="filter-type"
                  value="last-month"
                  checked={filterType === 'last-month'}
                  onChange={() => handleFilterChange('last-month')}
                  className="mr-2"
                />
                <span className="text-gray-700">Last 1 Month</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="filter-type"
                  value="custom"
                  checked={filterType === 'custom'}
                  onChange={() => handleFilterChange('custom')}
                  className="mr-2"
                />
                <span className="text-gray-700">Custom Range</span>
              </label>
            </div>

            {/* Custom Date Range */}
            {filterType === 'custom' && (
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-indigo-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">S.No.</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Student Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Payment Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPayments.length > 0 ? (
                paginatedPayments.map((payment, index) => (
                  <tr
                    key={payment.id} // Use payment.id for unique key
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 text-sm text-gray-800">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{payment.studentName}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      <span className="capitalize">{payment.type || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">₹{payment.amount}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>

            <div className="flex space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-md transition ${
                    page === currentPage
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  )
}
