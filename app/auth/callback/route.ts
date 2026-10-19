import { NextResponse, type NextRequest } from 'next/server'
import {
  ANILIST_COMPLETE_PATH,
  ANILIST_TOKEN_URL,
  getAnilistOAuthConfig,
  getRequestOrigin,
} from '@/lib/anilist-oauth'

function fail(origin: string, reason: string) {
  const home = new URL('/', origin)
  home.searchParams.set('anilist', 'error')
  home.searchParams.set('reason', reason)
  return NextResponse.redirect(home)
}

export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request)
  const url = new URL(request.url)

  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const errorDescription = url.searchParams.get('error_description')
  const state = url.searchParams.get('state')

  if (error) {
    const description = errorDescription ? `${error}: ${errorDescription}` : error
    return fail(origin, `AniList rejected the sign-in (${description}).`)
  }
  if (!code) {
    return fail(origin, 'AniList did not return an authorization code.')
  }

  // CSRF protection. AniList echoes the state back; if it is present it has to
  // match the cookie we set in /api/anilist/connect.
  const expectedState = request.cookies.get('anilist_oauth_state')?.value
  if (expectedState && state && state !== expectedState) {
    return fail(origin, 'The sign-in request could not be verified. Please try again.')
  }

  const config = getAnilistOAuthConfig(request)
  if (!config) {
    return fail(
      origin,
      'AniList is not configured. Add ANILIST_CLIENT_ID and ANILIST_CLIENT_SECRET to your environment.',
    )
  }

  // The token endpoint expects standard OAuth form parameters. The body and
  // the content type have to agree: if AniList cannot parse the body it never
  // sees `grant_type` and answers with "unsupported_grant_type".
  //
  // `redirect_uri` is validated by AniList against the URL registered in the
  // developer settings, so it has to be byte for byte identical to it.
  const response = await fetch(ANILIST_TOKEN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      code,
    }).toString(),
  })

  if (!response.ok) {
    const detail = await response.text()
    console.error('[anilist] token exchange failed', response.status, detail)
    if (detail.includes('invalid_client')) {
      return fail(
        origin,
        `AniList rejected the client credentials or the redirect URI (${config.redirectUri}). ` +
          'The redirect URI must exactly match the one registered at anilist.co/settings/developer.',
      )
    }
    return fail(
      origin,
      `AniList rejected the token exchange (HTTP ${response.status}). ${detail}`,
    )
  }

  const token = await response.json()
  if (!token?.access_token) {
    return fail(origin, 'AniList did not return an access token.')
  }

  // Hand the token to the browser app. The fragment is never sent to the
  // server, and the completion page replaces the URL right after reading it.
  const landing = new URL(ANILIST_COMPLETE_PATH, origin)
  landing.hash = `access_token=${encodeURIComponent(token.access_token)}`

  const redirect = NextResponse.redirect(landing)
  redirect.cookies.set('anilist_access_token', token.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: token.expires_in ?? 31536000,
  })
  redirect.cookies.delete('anilist_oauth_state')
  return redirect
}
