'use client'

import useLocalStorageState from 'use-local-storage-state'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps'
import { useCallback, useEffect, useState } from 'react'
import PlaceSearch from '@/components/PlaceSearch'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type Expense = {
  id: string
  amount: number
  note?: string
  category: string
  createdAt: string
  place?: {
    placeId: string
    label: string
    lat: number
    lng: number
  }
}

export default function ExpensesPage() {
  const [expenses] = useLocalStorageState<Expense[]>('expenses', {
    defaultValue: [],
  })
  
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markerPos, setMarkerPos] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const filteredExpenses = expenses.filter(expense => {
    if (!selectedDate) return true
    const expenseDate = new Date(expense.createdAt)
    return (
      expenseDate.getDate() === selectedDate.getDate() &&
      expenseDate.getMonth() === selectedDate.getMonth() &&
      expenseDate.getFullYear() === selectedDate.getFullYear()
    )
  })

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const expenseCount = filteredExpenses.length

  const points = filteredExpenses.filter(e => e.place?.lat && e.place?.lng)
  
  const center = points.length > 0 
    ? {
        lat: points.reduce((sum, e) => sum + e.place!.lat, 0) / points.length,
        lng: points.reduce((sum, e) => sum + e.place!.lng, 0) / points.length
      }
    : { lat: 40.758, lng: -73.985 } 

  const onPick = useCallback(async ({ placeId }: { placeId: string; label: string }) => {
    const r = await fetch('/api/places/details', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ placeId }) 
    })
    const place = await r.json()
    const lat = place?.location?.latitude
    const lng = place?.location?.longitude
    if (typeof lat === 'number' && typeof lng === 'number') {
      setMarkerPos({ lat, lng })
    }
  }, [])

  const flyTo = (expense: Expense) => {
    if (map && expense.place) {
      const pos = { lat: expense.place.lat, lng: expense.place.lng }
      map.panTo(pos)
      map.setZoom(18)
      map.setTilt(67.5)
      map.setHeading(20)
    }
  }

  const handleExpenseClick = (expense: Expense) => {
    setSelectedExpense(expense)
    flyTo(expense)
  }

  const handleMarkerClick = (expense: Expense) => {
    setSelectedExpense(expense)
    flyTo(expense)
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <h1 className="text-2xl font-bold">Expenses & Map</h1>
        <div className="flex gap-2">
          <Link href='/add'>
            <Button>New Expense</Button>
          </Link>
        </div>
      </div>

      <div className="bg-white border-b p-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Filter by date:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[200px] pl-3 text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  {selectedDate ? (
                    format(selectedDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${totalAmount.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{expenseCount}</div>
              <div className="text-sm text-gray-600">Expenses</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="w-1/4 bg-white border-r overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Expenses</h2>
            <div className="space-y-3">
              {filteredExpenses?.map(e => (
                <div
                  key={e.id}
                  onClick={() => handleExpenseClick(e)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedExpense?.id === e.id 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-lg text-green-600">
                      ${e.amount}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(e.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <div className="font-medium text-gray-800">{e.category}</div>
                  {e.note && (
                    <div className="text-sm text-gray-600 mt-1">{e.note}</div>
                  )}
                  {e.place && (
                    <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      📍 {e.place.label}
                    </div>
                  )}
                </div>
              ))}
              {filteredExpenses.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No expenses found for selected date
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 relative">
          <Map 
            defaultCenter={center} 
            defaultZoom={15} 
            mapId="YOUR_3D_ENABLED_MAP_ID"
            className="w-full h-full"
          >
            <TiltTo3D onMapLoad={setMap} />
            <PanWhenMarker pos={markerPos} />
            
            {points.map((e) => (
              <AdvancedMarker 
                key={e.id} 
                position={{ lat: e.place!.lat, lng: e.place!.lng }} 
                title={`${e.place!.label} - $${e.amount} (${e.category})`}
                onClick={() => handleMarkerClick(e)}
              >
                <ExpenseMarker 
                  expense={e} 
                  isSelected={selectedExpense?.id === e.id}
                />
              </AdvancedMarker>
            ))}

            {markerPos && (
              <AdvancedMarker position={markerPos}>
                <Pin background="#EF4444" borderColor="#DC2626" glyphColor="#FFFFFF" />
              </AdvancedMarker>
            )}
          </Map>

          {/* Search box */}
          <div className="absolute top-4 left-4 right-4 z-10">
            <PlaceSearch onPick={onPick} />
          </div>
        </div>
      </div>
    </div>
  )
}

function TiltTo3D({ onMapLoad }: { onMapLoad: (map: google.maps.Map) => void }) {
  const map = useMap()
  useEffect(() => { 
    if (map) {
      onMapLoad(map)
      map.moveCamera({ 
        center: map.getCenter()!, 
        zoom: 16, 
        tilt: 67.5, 
        heading: 20 
      })
      map.setOptions({ gestureHandling: "greedy", disableDefaultUI: false })
    }
  }, [map, onMapLoad])
  return null
}

function PanWhenMarker({ pos }: { pos: { lat: number; lng: number } | null }) {
  const map = useMap()
  useEffect(() => { 
    if (map && pos) { 
      map.panTo(pos)
      if ((map.getZoom() ?? 15) < 16) map.setZoom(16) 
    } 
  }, [map, pos])
  return null
}

function ExpenseMarker({ expense, isSelected }: { expense: Expense; isSelected: boolean }) {
  if (!expense.place) return <Pin />
  
  return (
    <div className="relative">
      <Pin 
        background={isSelected ? "#EF4444" : "#4F46E5"}
        borderColor={isSelected ? "#DC2626" : "#3730A3"}
        glyphColor="#FFFFFF"
      />
      {isSelected && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white border rounded-lg shadow-lg p-3 w-56 z-20 animate-fadeIn">
          <div className="text-xl font-bold text-green-600">${expense.amount}</div>
          <div className="text-sm font-medium text-gray-800">{expense.category}</div>
          {expense.note && (
            <div className="text-xs text-gray-600 mt-1">“{expense.note}”</div>
          )}
          <div className="text-xs text-blue-600 mt-1">📍 {expense.place.label}</div>
          <div className="text-xs text-gray-400 mt-1">
            {new Date(expense.createdAt).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  )
}
