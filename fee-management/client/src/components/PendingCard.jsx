import React from 'react'

export default function PendingCard({ totalPendingAmount, pendingMonthsDisplay }) {
  const hasPending = totalPendingAmount > 0

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <p className="text-gray-600 text-sm font-medium">Pending</p>
      <p className={`text-3xl font-bold mt-2 ${hasPending ? 'text-red-600' : 'text-gray-900'}`}>
        ₹{totalPendingAmount}
      </p>
      <p className="text-gray-600 text-xs mt-3 leading-relaxed">
        {hasPending ? (
          <>
            <span className="font-medium">Missing:</span> {pendingMonthsDisplay}
          </>
        ) : (
          'No pending payments'
        )}
      </p>
    </div>
  )
}
