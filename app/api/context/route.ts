import { NextResponse, NextRequest } from 'next/server'
import { getAuthCookie } from '@/lib/auth'

export interface ContextData {
  cdnUrl: string
  schoolName: string
  logo: string
  variant: string
  roleBase: string
  rolColegioId: string
  calendarId: string
  culture: string
  personaId: string
  personaLanguageId: string
}

function parseContextResponse(text: string): ContextData {
  try {
    const match = text.match(/SM\.Edu\.Contexto = SM\.Edu\.Contexto \|\| ({[\s\S]*?});/)
    if (!match) throw new Error('Could not parse context response')
    
    const jsonStr = match[1]
    const contextObj = eval(`(${jsonStr})`)
    
    return {
      cdnUrl: contextObj.CdnUrl,
      schoolName: contextObj.NombreColegio,
      logo: contextObj.LogoColegio,
      variant: contextObj.Variante,
      roleBase: contextObj.RoleBase,
      rolColegioId: contextObj.RolColegioId,
      calendarId: contextObj.CalendarioEscolar,
      culture: contextObj.Culture,
      personaId: contextObj.PersonaId,
      personaLanguageId: contextObj.PersonaIdiomaId,
    }
  } catch (err) {
    console.error('Error parsing context:', err)
    throw err
  }
}

export async function GET(request: NextRequest) {
  const url = process.env.GET_CONTEXT_URL
  const cookie = getAuthCookie(request)

  if (!url || !cookie) {
    return NextResponse.json(
      { error: 'Missing environment variables' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'referer': `${process.env.EDUCAMOS_BASE_URL!}/`,
        'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'script',
        'sec-fetch-mode': 'no-cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'cookie': cookie
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch context' },
        { status: response.status }
      )
    }

    const text = await response.text()
    
    try {
      const contextData = parseContextResponse(text)
      return NextResponse.json({ data: contextData })
    } catch (parseError) {
      return NextResponse.json(
        { error: 'auth_invalid', details: 'Session expired or invalid' },
        { status: 401 }
      )
    }
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
