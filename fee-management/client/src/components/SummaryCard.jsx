import React from 'react'

export default function SummaryCard({ title, value, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 border-indigo-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    blue: 'bg-blue-50 border-blue-200'
  }

  return (
    <div className={`${colors[color]} border rounded-lg p-6`}>
      <p className="text-gray-600 text-sm font-medium">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  )
}
