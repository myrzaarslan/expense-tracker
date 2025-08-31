'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold">Expense Tracker</h1>
            <div className="flex items-center space-x-4">
              <Link href="/add">
                <Button 
                  variant={pathname === '/add' ? 'default' : 'ghost'}
                  className={pathname === '/add' ? 'bg-primary text-primary-foreground' : ''}
                >
                  Add Expense
                </Button>
              </Link>
              <Link href="/expenses">
                <Button 
                  variant={pathname === '/expenses' ? 'default' : 'ghost'}
                  className={pathname === '/expenses' ? 'bg-primary text-primary-foreground' : ''}
                >
                  Expenses
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
} 