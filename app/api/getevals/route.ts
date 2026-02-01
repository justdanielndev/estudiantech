import { NextResponse, NextRequest } from 'next/server'
import { getAuthCookie } from '@/lib/auth'

export interface EvaluationPeriod {
  Id: string
  EvaluacionId: string
  EvaluacionNombre: string
  EvaluacionReducido: string
  ClaseId: string
  NivelEducativoColegioId: string
  TipoEvaluacionId: number
  EvaluacionActiva: boolean
  Bloqueada: boolean
  EstaBloqueada: boolean
  Seleccionada: boolean
  EvaluacionGrupoId: string | null
}

export async function GET(request: NextRequest) {
  const baseUrl = process.env.EDUCAMOS_BASE_URL!
  const cookie = getAuthCookie(request)
  
  const searchParams = request.nextUrl.searchParams
  const claseId = searchParams.get('claseId')
  const nivelEducativoColegioId = searchParams.get('nivelEducativoColegioId')
  const nivelEducativoEtapa = searchParams.get('nivelEducativoEtapa') || '28'
  const tipoPuestaNota = searchParams.get('tipoPuestaNota') || '6'



  if (!claseId || !nivelEducativoColegioId) {
    return NextResponse.json(
      { error: 'Missing required params: claseId, nivelEducativoColegioId' },
      { status: 400 }
    )
  }

  try {
    const timestamp = Date.now()
    const url = `${baseUrl}/Apis/Evaluacion/PuestaNotas/ObtenerEvaluaciones?claseId=${claseId}&tipoPuestaNota=${tipoPuestaNota}&nivelEducativoColegioId=${nivelEducativoColegioId}&nivelEducativoEtapa=${nivelEducativoEtapa}&_=${timestamp}`

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
      console.error('[getevals] Error response:', text.substring(0, 500))
      return NextResponse.json(
        { error: `Failed to fetch evaluations: ${response.status}` },
        { status: response.status }
      )
    }

    const data: EvaluationPeriod[] = await response.json()
    const activeEval = data.find(e => e.Seleccionada || e.EvaluacionActiva)
    return NextResponse.json({ 
      data,
      activeEvaluation: activeEval || null
    })
  } catch (error) {
    console.error('[getevals] ERROR:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
