// Server-side AniList OAuth helpers (authorization code grant).
// The client secret never leaves the server: the browser only ever talks to
// our own /api/anilist/* routes.
//
// Docs: https://anilist.gitbook.io/anilist-apiv2-docs/docs/guide/auth

export const ANILIST_AUTHORIZE_URL = 'https://anilist.co/api/v2/oauth/authorize'
export const ANILIST_TOKEN_URL = 'https://anilist.co/api/v2/oauth/token'

export const ANILIST_REDIRECT_PATH = '/auth/callback'
export const ANILIST_COMPLETE_PATH = '/auth/complete'

export function isAnilistConfigured(): boolean {
  return Boolean(process.env.ANILIST_CLIENT_ID && process.env.ANILIST_CLIENT_SECRET)
}

function firstHeaderValue(request: Request, name: string): string | null {
  const raw = request.headers.get(name)
  if (!raw) return null
  return raw.split(',')[0]?.trim() || null
}

/**
 * The public origin of the incoming request. `x-forwarded-*` headers are
 * checked first so the value stays correct when the app runs behind a proxy
 * (Vercel, ngrok, a reverse proxy, ...).
 */
export function getRequestOrigin(request: Request): string {
  const url = new URL(request.url)
  const protocol = firstHeaderValue(request, 'x-forwarded-proto') || url.protocol.replace(':', '')
  const host = firstHeaderValue(request, 'x-forwarded-host') || request.headers.get('host') || url.host
  return `${protocol}://${host}`
}

/**
 * The redirect URI that is sent to AniList. It MUST match the URL registered
 * in the AniList developer settings exactly, and it MUST be identical in the
 * authorize request and the token exchange.
 */
export function resolveRedirectUri(request: Request): string {
  const configured = process.env.ANILIST_REDIRECT_URI?.trim()
  if (configured) return configured
  return `${getRequestOrigin(request)}${ANILIST_REDIRECT_PATH}`
}

export interface AnilistOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export function getAnilistOAuthConfig(request: Request): AnilistOAuthConfig | null {
  const clientId = process.env.ANILIST_CLIENT_ID
  const clientSecret = process.env.ANILIST_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret, redirectUri: resolveRedirectUri(request) }
}
