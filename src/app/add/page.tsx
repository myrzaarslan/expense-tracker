'use client'

import ExpenseForm from '../../components/expenseForm'
import useLocalStorageState from 'use-local-storage-state'

type FormValues = {
  amount: number
  note?: string
  category: 'Food' | 'Transport' | 'Education' | 'Shopping' | 'Entertainment' | 'Other'
  date: Date
}

type Expense = FormValues & {
  id: string
  createdAt: string
}

export default function Add() {
  const [, setExpenses] = useLocalStorageState<Expense[]>('expenses', {
    defaultValue: [],
  })

  const handleCreate = (exp: FormValues) => {
    const newExp: Expense = {
      id: crypto.randomUUID(),
      createdAt: exp.date.toISOString(),
      ...exp,
    }
    setExpenses(prev => [newExp, ...prev])
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-lg space-y-6">
        <h1 className="text-2xl font-bold text-center">Add Expense</h1>
        <div className="p-6 border rounded-lg shadow bg-white">
          <ExpenseForm onCreate={handleCreate} />
        </div>
      </div>
    </div>
  )
}