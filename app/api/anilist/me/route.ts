import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isAnilistConfigured } from '@/lib/anilist-oauth'

export async function GET() {
  const configured = isAnilistConfigured()
  const token = (await cookies()).get('anilist_access_token')?.value
  if (!token) return NextResponse.json({ configured, connected: false, user: null })

  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ query: `query { Viewer { id name avatar { large } } }` }),
    cache: 'no-store',
  })
  if (!response.ok) return NextResponse.json({ configured, connected: false, user: null })
  const payload = await response.json()
  return NextResponse.json({ configured, connected: true, user: payload.data?.Viewer ?? null })
}
