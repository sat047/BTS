import { useState, useEffect } from 'react'
import { isMonthlyPending } from '../utils/feeCalculator'

export function useFeeStatus(student, payments) {
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (student && payments) {
      setIsPending(isMonthlyPending(student, payments))
    }
  }, [student, payments])

  return { isPending }
}
