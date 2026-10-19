import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ connected: false })
  response.cookies.delete('anilist_access_token')
  response.cookies.delete('anilist_oauth_state')
  return response
}
