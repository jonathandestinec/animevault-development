import { NextResponse } from 'next/server'
import {
  ANILIST_AUTHORIZE_URL,
  getAnilistOAuthConfig,
  getRequestOrigin,
} from '@/lib/anilist-oauth'

export async function GET(request: Request) {
  const origin = getRequestOrigin(request)
  const config = getAnilistOAuthConfig(request)

  if (!config) {
    const home = new URL('/', origin)
    home.searchParams.set('anilist', 'error')
    home.searchParams.set(
      'reason',
      'AniList is not configured. Add ANILIST_CLIENT_ID and ANILIST_CLIENT_SECRET to your environment.',
    )
    return NextResponse.redirect(home)
  }

  // CSRF protection: the state is echoed back by AniList and verified in the
  // callback route against the cookie we set here.
  const state = crypto.randomUUID()

  const authorize = new URL(ANILIST_AUTHORIZE_URL)
  authorize.searchParams.set('client_id', config.clientId)
  authorize.searchParams.set('redirect_uri', config.redirectUri)
  authorize.searchParams.set('response_type', 'code')
  authorize.searchParams.set('state', state)

  const response = NextResponse.redirect(authorize)
  response.cookies.set('anilist_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })
  return response
}
