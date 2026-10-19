import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const token = (await cookies()).get('anilist_access_token')?.value
  if (!token) return NextResponse.json({ connected: false })

  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ query: `query { Viewer { id name avatar { large } } }` }),
    cache: 'no-store',
  })
  if (!response.ok) return NextResponse.json({ connected: false }, { status: 401 })
  const payload = await response.json()
  return NextResponse.json({ connected: true, user: payload.data?.Viewer ?? null })
}
