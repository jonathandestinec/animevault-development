import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const clientId = process.env.ANILIST_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: 'AniList is not configured.' }, { status: 503 })

  const origin = new URL(request.url).origin
  const redirectUri = `${origin}/api/anilist/callback`
  const authorize = new URL('https://anilist.co/api/v2/oauth/authorize')
  authorize.searchParams.set('client_id', clientId)
  authorize.searchParams.set('redirect_uri', redirectUri)
  authorize.searchParams.set('response_type', 'code')
  return NextResponse.redirect(authorize)
}
