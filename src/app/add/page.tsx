'use client'

import { useState } from 'react'
import ExpenseForm from '../../components/expenseForm'
import { z } from 'zod'
import Link from 'next/link'

const formSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  note: z.string().max(140, 'Note too long').optional(),
  category: z.enum([
    'Food',
    'Transport',
    'Education',
    'Shopping',
    'Entertainment',
    'Other',
  ]),
})

type FormValues = z.infer<typeof formSchema>

type Expense = FormValues & {
  id: string
  createdAt: string
}

export default function Add() {
  const [expenses, setExpenses] = useState<Expense[]>([])

  const handleCreate = (exp: FormValues) => {
    const newExp: Expense = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
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
        <div className="p-6 border rounded-lg shadow bg-white">
          <h2 className="text-lg font-semibold mb-4">Current Expenses</h2>
          <Link href='/expenses'>View Details</Link>
          <ul className="space-y-3">
            {expenses.map(e => (
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
      </div>
    </div>
  )

}

