'use client'
import { useEffect, useRef, useState } from 'react'

type Suggestion = {
  placePrediction?: {
    placeId: string
    text?: { text: string }
    structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } }
  }
}

function newSessionToken() { return crypto.randomUUID() }

export default function PlaceSearch({ onPick }: { onPick: (p: { placeId: string; label: string }) => void }) {
  const [q, setQ] = useState('')
  const [suggests, setSuggests] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const tokenRef = useRef<string>(newSessionToken())
  const timer = useRef<number | null>(null)

  const fetchAuto = (value: string) => {
    setLoading(true)
    fetch('/api/places/autocomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: value, sessionToken: tokenRef.current })
    })
      .then(r => r.json())
      .then(d => setSuggests(d.suggestions ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!q) { setSuggests([]); return }
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => fetchAuto(q), 200)
    return () => { if (timer.current) window.clearTimeout(timer.current) }
  }, [q])

  const pick = (s: Suggestion) => {
    const pp = s.placePrediction!
    const label = pp.structuredFormat?.mainText?.text ?? pp.text?.text ?? 'Selected place'
    onPick({ placeId: pp.placeId, label })
    tokenRef.current = newSessionToken()
    setSuggests([])
    setQ(label)
  }

  return (
    <div className='relative w-full max-w-xl mx-auto'>
      <input
        className='w-full border rounded px-3 py-2'
        placeholder='Search a place...'
        value={q}
        onChange={e => setQ(e.target.value)}
      />
      {loading && <div className='absolute right-3 top-2 text-sm'>…</div>}
      {suggests.length > 0 && (
        <ul className='absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-64 overflow-auto'>
          {suggests.map((s, i) => {
            const main = s.placePrediction?.structuredFormat?.mainText?.text ?? s.placePrediction?.text?.text ?? ''
            const secondary = s.placePrediction?.structuredFormat?.secondaryText?.text ?? ''
            return (
              <li key={i} className='px-3 py-2 hover:bg-neutral-100 cursor-pointer' onClick={() => pick(s)}>
                <div className='font-medium'>{main}</div>
                {secondary && <div className='text-xs text-neutral-600'>{secondary}</div>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
