import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  if (error || !code) return NextResponse.redirect(new URL('/?anilist=error', url.origin))

  const response = await fetch('https://anilist.co/api/v2/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: process.env.ANILIST_CLIENT_ID,
      client_secret: process.env.ANILIST_CLIENT_SECRET,
      redirect_uri: `${url.origin}/api/anilist/callback`,
      code,
    }),
  })

  if (!response.ok) return NextResponse.redirect(new URL('/?anilist=error', url.origin))
  const token = await response.json()
  const redirect = NextResponse.redirect(new URL('/?anilist=connected', url.origin))
  redirect.cookies.set('anilist_access_token', token.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: token.expires_in ?? 31536000,
  })
  return redirect
}
