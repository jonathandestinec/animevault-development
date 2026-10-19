import { NextResponse } from 'next/server'

const ANILIST_API = 'https://graphql.anilist.co'

const searchQuery = `
  query SearchAnime($search: String!) {
    Page(perPage: 12) {
      media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
        id
        title { romaji english native }
        coverImage { large }
        episodes
        status
        averageScore
        genres
        synopsis: description(asHtml: false)
        format
      }
    }
  }
`

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams.get('q')?.trim()
  if (!search) return NextResponse.json({ media: [] })
  if (search.length > 80) return NextResponse.json({ error: 'Search query is too long.' }, { status: 400 })

  const response = await fetch(ANILIST_API, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ query: searchQuery, variables: { search } }),
    next: { revalidate: 60 },
  })

  if (!response.ok) return NextResponse.json({ error: 'AniList search is unavailable.' }, { status: 502 })
  const payload = await response.json()
  return NextResponse.json({ media: payload.data?.Page?.media ?? [] })
}
