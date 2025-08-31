import { NextResponse } from "next/server";

export async function POST(req:Request) {
    
    try {
        const { input, sessionToken, locationBias, locationRestriction } = await req.json()

        if (!input || typeof input !== 'string' || input.trim() === "") {
            return NextResponse.json({ suggestions: []})
        }

        const body: Record<string, unknown> = {input}
        if (sessionToken) { body.sessionToken = sessionToken }
        if (locationBias) { body.locationBias = locationBias }
        if (locationRestriction) { body.locationRestriction = locationRestriction }

        const resp = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': process.env.PLACES_API_KEY || '',
            },
            body: JSON.stringify(body),
            cache: 'no-store',
            })

            const text = await resp.text()
            if (!resp.ok) {
            console.error('Autocomplete error:', resp.status, text)
            return NextResponse.json({ error: 'places_autocomplete_failed' }, { status: resp.status })
            }

            return new NextResponse(text, { status: 200, headers: { 'Content-Type': 'application/json' } })
        } catch (e) {
            console.error('Autocomplete route crash:', e)
            return NextResponse.json({ error: 'internal_error' }, { status: 500 })
    }
}
