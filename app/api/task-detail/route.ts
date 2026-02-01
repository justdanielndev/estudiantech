import { NextResponse, NextRequest } from 'next/server'
import { getAuthCookie } from '@/lib/auth'

export interface TaskDetail {
  title: string
  description: string
  dueDate: string
  professor?: string
  lastModified?: string
  status?: string
}

function decodeHtmlEntities(text: string): string {
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#193;': 'Á',
    '&#225;': 'á',
    '&#201;': 'É',
    '&#233;': 'é',
    '&#205;': 'Í',
    '&#237;': 'í',
    '&#211;': 'Ó',
    '&#243;': 'ó',
    '&#218;': 'Ú',
    '&#250;': 'ú',
    '&#220;': 'Ü',
    '&#252;': 'ü',
    '&#209;': 'Ñ',
    '&#241;': 'ñ',
  }
  
  return text.replace(/&#?\w+;/g, entity => map[entity] || entity)
}

function parseHtmlTaskDetail(html: string): TaskDetail {
  const detail: Partial<TaskDetail> = {}

  const titleMatch = html.match(/<span><b>T[íi]tulo:<\/b><\/span>\s*<p[^>]*>([^<]+)<\/p>/)
  detail.title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : ''

  const descMatch = html.match(/<span><b>Descripci[óo]n:<\/b><\/span>\s*<span[^>]*>([^<]*)<\/span>/)
  detail.description = descMatch ? decodeHtmlEntities(descMatch[1].trim()) : ''

  const dateMatch = html.match(/<span id="fechaEntregaDia"[^>]*><\/span>\s*<span>\s*\(([^)]+)\)<\/span>/)
  detail.dueDate = dateMatch ? dateMatch[1].trim() : ''

  const profMatch = html.match(/<span><b>Profesores de la materia:<\/b><\/span>\s*<p[^>]*>([^<]+)<\/p>/)
  detail.professor = profMatch ? decodeHtmlEntities(profMatch[1].trim()) : ''

  const modMatch = html.match(/<span><b>Fecha y hora de la [úu]ltima modificaci[óo]n:<\/b><\/span>\s*<p[^>]*>([^<]+)<\/p>/)
  detail.lastModified = modMatch ? modMatch[1].trim() : ''

  const statusMatch = html.match(/src='([^']*)'[^>]*title='([^']*)'/)
  detail.status = statusMatch ? statusMatch[2] : ''

  return detail as TaskDetail
}

export async function POST(request: NextRequest) {
  const url = process.env.GET_TASK_DATA_URL
  const cookie = getAuthCookie(request)

  if (!url || !cookie) {
    return NextResponse.json(
      { error: 'Missing environment variables' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { idSeleccion, alumnoPersonaId, leida } = body

    if (!idSeleccion) {
      return NextResponse.json(
        { error: 'Missing idSeleccion' },
        { status: 400 }
      )
    }

    if (!alumnoPersonaId) {
      return NextResponse.json(
        { error: 'Missing alumnoPersonaId' },
        { status: 400 }
      )
    }

    const timestamp = Date.now()
    const fullUrl = `${url}?nocache=${timestamp}`

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json;charset=UTF-8',
        'origin': process.env.EDUCAMOS_BASE_URL!,
        'priority': 'u=1, i',
        'referer': `${process.env.EDUCAMOS_BASE_URL!}/`,
        'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'x-requested-with': 'XMLHttpRequest',
        'cookie': cookie
      },
      body: JSON.stringify({
        idSeleccion,
        alumnoPersonaId: alumnoPersonaId,
        leida: leida || 'True'
      })
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch task detail' },
        { status: response.status }
      )
    }

    const html = await response.text()
    const detail = parseHtmlTaskDetail(html)

    return NextResponse.json({ data: detail })
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
