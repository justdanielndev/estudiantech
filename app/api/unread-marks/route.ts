import { NextResponse, NextRequest } from 'next/server'
import { getAuthCookie } from '@/lib/auth'

interface UnreadMark {
  id: string
  fecha: string
  texto: string
  url: string | null
  activo: boolean
  destacado: boolean
}

export async function GET(request: NextRequest) {
  const url = process.env.GET_UNREAD_MARKS_URL
  const cookie = getAuthCookie(request)

  if (!url || !cookie) {
    return NextResponse.json(
      { error: 'Missing environment variables' },
      { status: 500 }
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const numeroElementos = searchParams.get('NumeroElementos') || '3'
    const personaId = searchParams.get('PersonaId')
    const rolBaseId = searchParams.get('RolBaseId') || ''
    const fecha = searchParams.get('Fecha') || new Date().toISOString().split('T')[0]
    const timestamp = Date.now()

    if (!personaId) {
      return NextResponse.json(
        { error: 'Missing PersonaId parameter' },
        { status: 400 }
      )
    }

    const fullUrl = `${url}?NumeroElementos=${numeroElementos}&PersonaId=${personaId}&RolBaseId=${rolBaseId}&Fecha=${fecha}&_=${timestamp}`

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/javascript, */*; q=0.01',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json',
        'priority': 'u=1, i',
        'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-requested-with': 'XMLHttpRequest',
        'cookie': cookie,
        'Referer': `${process.env.EDUCAMOS_BASE_URL!}/`
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch unread marks' },
        { status: response.status }
      )
    }

    const data = await response.json()

    const marks: UnreadMark[] = data.map((mark: any, idx: number) => ({
      id: mark.Id || `mark-${idx}`,
      fecha: mark.Fecha,
      texto: mark.Texto,
      url: mark.Url,
      activo: mark.Activo,
      destacado: mark.Destacado
    }))

    return NextResponse.json({ data: marks })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
