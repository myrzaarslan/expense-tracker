'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { useEffect, useRef, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import NearbySearch from './NearbySearch'

const placeSchema = z.object({
  placeId: z.string(),
  label: z.string(),
  lat: z.number(),
  lng: z.number()
})

const formSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  note: z.string().max(140, 'Note too long').optional(),
  category: z.enum(['Food', 'Transport', 'Education', 'Shopping', 'Entertainment', 'Other']),
  date: z.date(),
  place: placeSchema.optional()
})

type FormValues = z.infer<typeof formSchema>

type Props = {
  onCreate?: (exp: FormValues) => void
}

export default function ExpenseForm({ onCreate }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      note: '',
      category: 'Food',
      date: new Date(),
      place: undefined
    }
  })

  function onSubmit(values: FormValues) {
    onCreate?.(values)
    form.reset({ amount: 0, note: '', category: 'Food', date: new Date(), place: undefined })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='amount'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  placeholder='0'
                  value={Number.isNaN(field.value) ? '' : field.value}
                  onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                />
              </FormControl>
              <FormDescription>Enter the amount of expense.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='date'
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>Select the date of the expense.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='note'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Input placeholder='Optional note...' {...field} />
              </FormControl>
              <FormDescription>Write notes if you have any.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='category'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select category' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {['Food', 'Transport', 'Education', 'Shopping', 'Entertainment', 'Other'].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Choose the expense category.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Controller
          control={form.control}
          name='place'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Place (optional)</FormLabel>
              <FormControl>
                <PlaceAutocomplete
                  value={field.value ?? null}
                  onChange={(p) => field.onChange(p)}
                />
              </FormControl>
              <FormDescription>
                Start typing to search with Google Places. Pick a suggestion to attach a location.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <FormLabel>Nearby Search</FormLabel>
          <FormDescription>
            Search for places near your location or use the map center.
          </FormDescription>
          <NearbySearch
            onPlaceSelect={(place) => {
              form.setValue('place', place)
            }}
            center={{ lat: 40.758, lng: -73.985 }}
          />
        </div>

        <Button type='submit'>Submit</Button>
      </form>
    </Form>
  )
}


type PlaceValue = z.infer<typeof placeSchema> | null

function newSessionToken() {
  return crypto.randomUUID()
}

interface PlaceSuggestion {
  placePrediction?: {
    placeId?: string
    structuredFormat?: {
      mainText?: { text?: string }
      secondaryText?: { text?: string }
    }
    text?: { text?: string }
  }
  id?: string
  location?: {
    latitude?: number
    longitude?: number
  }
  displayName?: {
    text?: string
  }
}

function PlaceAutocomplete({
  value,
  onChange
}: {
  value: PlaceValue
  onChange: (v: PlaceValue) => void
}) {
  const [q, setQ] = useState(value?.label ?? '')
  const [suggests, setSuggests] = useState<PlaceSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const tokenRef = useRef<string>(newSessionToken())
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (!value) setQ('')
    else setQ(value.label)
  }, [value])

  const safeJson = async (r: Response) => {
    const text = await r.text()
    try { return JSON.parse(text) } catch { return { _nonJson: true, text } }
  }

  const fetchAutocomplete = useCallback(async (text: string) => {
    setLoading(true)
    try {
      const r = await fetch('/api/places/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text, sessionToken: tokenRef.current })
      })
      const data = await safeJson(r)
      if (!r.ok) {
        console.warn('Autocomplete failed:', data)
        setSuggests([])
        return
      }
      setSuggests(Array.isArray(data.suggestions) ? data.suggestions : [])
    } catch (e) {
      console.error(e)
      setSuggests([])
    } finally {
      setLoading(false)
    }
  }, [])

  const pick = async (s: PlaceSuggestion) => {
    const pp = s?.placePrediction
    const pid = pp?.placeId
    if (!pid) return
    const r = await fetch('/api/places/details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeId: pid })
    })
    const data = await safeJson(r)
    if (!r.ok) {
      console.warn('Details failed:', data)
      return
    }
    const lat = data?.location?.latitude
    const lng = data?.location?.longitude
    const label = data?.displayName?.text ?? pp?.structuredFormat?.mainText?.text ?? pp?.text?.text ?? 'Selected place'
    if (typeof lat === 'number' && typeof lng === 'number') {
      onChange({ placeId: data.id ?? pid, label, lat, lng })
      setQ(label)
      setSuggests([])
      tokenRef.current = crypto.randomUUID()
    }
  }

  useEffect(() => {
    if (!q) {
      setSuggests([])
      return
    }
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => fetchAutocomplete(q), 200)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [q, fetchAutocomplete])

  const clear = () => {
    onChange(null)
    setQ('')
    setSuggests([])
    tokenRef.current = newSessionToken()
  }

  return (
    <div className='relative'>
      <div className='flex gap-2'>
        <input
          className='w-full border rounded px-3 py-2'
          placeholder='Search a place...'
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {value && (
          <button type='button' onClick={clear} className='text-sm px-3 py-2 border rounded'>
            Clear
          </button>
        )}
      </div>

      {loading && <div className='absolute right-3 top-2 text-sm'>…</div>}

      {suggests.length > 0 && (
        <ul className='absolute z-20 mt-1 w-full bg-white border rounded shadow max-h-64 overflow-auto'>
          {suggests.map((s, i) => {
            const main = s.placePrediction?.structuredFormat?.mainText?.text ?? s.placePrediction?.text?.text ?? ''
            const secondary = s.placePrediction?.structuredFormat?.secondaryText?.text ?? ''
            return (
              <li
                key={i}
                className='px-3 py-2 hover:bg-neutral-100 cursor-pointer'
                onClick={() => pick(s)}
              >
                <div className='font-medium'>{main}</div>
                {secondary && <div className='text-xs text-neutral-600'>{secondary}</div>}
              </li>
            )
          })}
        </ul>
      )}

      {value && (
        <div className='mt-2 text-xs text-neutral-600'>
          Selected: <span className='font-medium'>{value.label}</span> ({value.lat.toFixed(5)},{' '}
          {value.lng.toFixed(5)})
        </div>
      )}
    </div>
  )
}