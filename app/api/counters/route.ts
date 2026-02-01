import { NextResponse, NextRequest } from 'next/server'
import { getAuthCookie } from '@/lib/auth'

export interface Counter {
  TipoElementoResumen: number
  ContadorElementos: number
  Fallo: boolean
  DescripcionFallo: string
  MostrarContador: boolean
}

const COUNTER_TYPES = {
  32: 'calificaciones',
  1: 'circulares',
  2: 'entrevistas',
  64: 'incidencias',
  4: 'reuniones',
  1024: 'encuestas',
} as const

export async function GET(request: NextRequest) {
  let personaId = request.nextUrl.searchParams.get('personaId')
  const rolBaseId = request.nextUrl.searchParams.get('rolBaseId') || '3'
  
  if (!personaId) {
    return NextResponse.json(
      { error: 'Missing personaId parameter' },
      { status: 400 }
    )
  }

  const url = process.env.GET_COUNTERS_URL
  const cookie = getAuthCookie(request)

  if (!url || !cookie) {
    return NextResponse.json(
      { error: 'Missing environment variables' },
      { status: 500 }
    )
  }

  try {
    const timestamp = Date.now()
    const baseUrl = url.endsWith('/') ? url : url + '/'
    const countersUrl = `${baseUrl}?PersonaId=${encodeURIComponent(personaId)}&RolBaseId=${encodeURIComponent(rolBaseId)}&_=${timestamp}`
    const response = await fetch(countersUrl, {
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
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        'x-requested-with': 'XMLHttpRequest',
        'cookie': cookie,
        'Referer': `${process.env.EDUCAMOS_BASE_URL!}/`
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch counters' },
        { status: response.status }
      )
    }

    const text = await response.text()
    
    if (text.trim().startsWith('<')) {
      console.error('[Counters API] Received HTML instead of JSON:', {
        url: countersUrl,
        contentType: response.headers.get('content-type'),
        statusCode: response.status,
        responsePreview: text.substring(0, 500)
      })
      return NextResponse.json(
        { error: 'Authentication failed or session expired' },
        { status: 401 }
      )
    }

    const data = JSON.parse(text) as Counter[]
    
    const counters = data.map(counter => ({
      ...counter,
      name: COUNTER_TYPES[counter.TipoElementoResumen as keyof typeof COUNTER_TYPES] || `unknown_${counter.TipoElementoResumen}`
    }))

    return NextResponse.json({ 
      data: counters,
      count: counters.length
    })
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
