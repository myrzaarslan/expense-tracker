import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { placeId } = await req.json()
    if (!placeId) {
      return NextResponse.json({ error: 'missing_placeId' }, { status: 400 })
    }

    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`

    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': process.env.PLACES_API_KEY || '',
        'X-Goog-FieldMask': 'id,displayName,location',
      },
      cache: 'no-store',
    })

    const text = await resp.text()
    if (!resp.ok) {
      console.error('Details error:', resp.status, text)
      return NextResponse.json({ error: 'places_details_failed' }, { status: resp.status })
    }

    return new NextResponse(text, { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('Details crash:', e)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
