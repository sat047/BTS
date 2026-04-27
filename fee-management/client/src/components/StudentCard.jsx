import React from 'react'
import FeeStatusBadge from './FeeStatusBadge'

const categoryColors = {
  school: 'bg-blue-100 text-blue-800',
  college: 'bg-purple-100 text-purple-800',
  professional: 'bg-amber-100 text-amber-800'
}

export default function StudentCard({ student, isPending, onView, onEdit, onStatusToggle }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{student.name}</h3>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${categoryColors[student.category]}`}>
            {student.category.charAt(0).toUpperCase() + student.category.slice(1)}
          </span>
          {student.status === 'paused' && (
            <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded ml-2 text-[10px] font-bold uppercase tracking-wider">
              Paused
            </span>
          )}
        </div>
        <FeeStatusBadge isPending={isPending} />
      </div>
      
      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <p><span className="font-medium">Mobile:</span> {student.fatherMobile}</p>
        <p><span className="font-medium">Monthly Fee:</span> ₹{student.monthlyFee}</p>
        {(student.pause_date || student.resume_date) && (
          <p className="text-[11px] italic text-gray-500">
            {student.status === 'paused' 
              ? `Paused: ${new Date(student.pause_date).toLocaleDateString()}`
              : student.resume_date ? `Resumed: ${new Date(student.resume_date).toLocaleDateString()}` : ''}
          </p>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onView}
          className="flex-1 min-w-[70px] px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
        >
          View
        </button>
        <button
          onClick={onEdit}
          className="flex-1 min-w-[70px] px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
        >
          Edit
        </button>
        <button
          onClick={onStatusToggle}
          className={`flex-1 min-w-[70px] px-3 py-2 rounded-lg transition text-sm font-medium ${
            student.status === 'paused'
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
          }`}
        >
          {student.status === 'paused' ? 'Resume' : 'Pause'}
        </button>
      </div>
    </div>
  )
}
