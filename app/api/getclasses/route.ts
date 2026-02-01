import { NextResponse, NextRequest } from 'next/server'
import { getAuthCookie } from '@/lib/auth'

export interface StudentClass {
  id: string
  nombre: string
  reducido: string
  nivelEducativoEtapaId: number
  nivelEducativoColegioId: string
  tieneInformeActitudinal: boolean
  esCursoPorCompetencias: boolean
  esVisiblePerfilCompetencias: boolean
  esVisiblePestanaCompetencias: boolean
}

export async function GET(request: NextRequest) {
  const baseUrl = process.env.EDUCAMOS_BASE_URL!
  const cookie = getAuthCookie(request)

  const searchParams = request.nextUrl.searchParams
  const alumnoId = searchParams.get('alumnoId')



  if (!alumnoId) {
    return NextResponse.json(
      { error: 'Missing required param: alumnoId' },
      { status: 400 }
    )
  }

  try {
    const timestamp = Date.now()
    const url = `${baseUrl}/Apis/Evaluacion/EvaluacionFamilia/ObtenerClases?alumnoId=${alumnoId}&_=${timestamp}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/javascript, */*; q=0.01',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json; charset=utf-8',
        'priority': 'u=1, i',
        'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-requested-with': 'XMLHttpRequest',
        'cookie': cookie,
        'Referer': `${baseUrl}/Evaluacion/CalificacionesAlumno`
      }
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('[getclasses] Error response:', text.substring(0, 500))
      return NextResponse.json(
        { error: `Failed to fetch classes: ${response.status}` },
        { status: response.status }
      )
    }

    const data: StudentClass[] = await response.json()
    return NextResponse.json({ data })
  } catch (error) {
    console.error('[getclasses] ERROR:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
