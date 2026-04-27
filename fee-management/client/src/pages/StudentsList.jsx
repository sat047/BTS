import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import StudentCard from '../components/StudentCard'
import client from '../api/client'

export default function StudentsList() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusModal, setStatusModal] = useState({ show: false, student: null, date: new Date().toISOString().split('T')[0] })
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      // Now only fetching one small resource
      const response = await client.get('/students')
      setStudents(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || student.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleStatusUpdate = async () => {
    const { student, date } = statusModal
    if (!student) return

    setUpdatingStatus(true)
    const isPausing = student.status !== 'paused'
    try {
      await client.put(`/students/${student.id}`, {
        status: isPausing ? 'paused' : 'active',
        [isPausing ? 'pause_date' : 'resume_date']: date
      })
      setStatusModal({ show: false, student: null, date: new Date().toISOString().split('T')[0] })
      fetchStudents()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
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

  return (
    <>
      <Navbar />
      <div className="fee-container">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <button
            onClick={() => navigate('/students/add')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Add Student
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-lg">{error}</div>
        )}

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'school', 'college', 'professional'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No students found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => {
              return (
                <StudentCard
                  key={student.id}
                  student={student}
                  isPending={student.isPending} // Rely on server-calculated field
                  onView={() => navigate(`/students/${student.id}`)}
                  onEdit={() => navigate(`/students/${student.id}/edit`)}
                  onStatusToggle={() => setStatusModal({ show: true, student, date: new Date().toISOString().split('T')[0] })}
                />
              )
            })}
          </div>
        )}
      </div>

      {statusModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {statusModal.student?.status === 'paused' ? 'Resume Student' : 'Pause Student'}
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select {statusModal.student?.status === 'paused' ? 'Resume' : 'Pause'} Date
              </label>
              <input
                type="date"
                value={statusModal.date}
                onChange={(e) => setStatusModal({ ...statusModal, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusModal({ show: false, student: null, date: '' })}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={updatingStatus}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition font-medium ${
                  statusModal.student?.status === 'paused' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {updatingStatus ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
