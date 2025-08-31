import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { 
      latitude, 
      longitude, 
      radius = 1000, 
      includedTypes = [], 
      maxResultCount = 20,
      rankPreference = 'POPULARITY'
    } = await req.json()

    if (!latitude || !longitude || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json({ error: 'missing_coordinates' }, { status: 400 })
    }

    if (radius < 0 || radius > 50000) {
      return NextResponse.json({ error: 'invalid_radius' }, { status: 400 })
    }

    const body: Record<string, unknown> = {
      locationRestriction: {
        circle: {
          center: { latitude, longitude },
          radius
        }
      },
      maxResultCount,
      rankPreference
    }

    if (includedTypes.length > 0) {
      body.includedTypes = includedTypes
    }

    const resp = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.PLACES_API_KEY || '',
        'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.types,places.primaryType,places.formattedAddress'
      },
      body: JSON.stringify(body)
    })

    const text = await resp.text()
    if (!resp.ok) {
      console.error('Nearby search error:', resp.status, text)
      return NextResponse.json(
        { error: 'nearby_search_failed', status: resp.status },
        { status: resp.status }
      )
    }

    return new NextResponse(text, { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    })
  } catch (err) {
    console.error('Nearby search route crash:', err)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
} 