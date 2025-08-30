'use client'

import useLocalStorageState from 'use-local-storage-state'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Expense = {
  id: string
  amount: number
  note?: string
  category: string
  createdAt: string
}

export default function ExpensesPage() {
  const [expenses] = useLocalStorageState<Expense[]>('expenses', {
    defaultValue: [],
  })

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">All Expenses</h1>
                  <Link href='/add'>
                <Button>New Expense</Button>
            </Link>
      <ul className="space-y-3">
        {expenses?.map(e => (
          <li key={e.id} className="border rounded p-3">
            <strong>${e.amount}</strong> · {e.category}
            {e.note && <div className="text-sm text-gray-500">{e.note}</div>}
            <div className="text-xs text-gray-400">
              {new Date(e.createdAt).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
