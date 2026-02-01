import { NextResponse, NextRequest } from 'next/server'
import type { Evaluation, Mark } from '@/lib/types'
import { getAuthCookie } from '@/lib/auth'

interface RawEntidadCalificable {
  id: string
  nombre: string
  reducido: string
  claseIndice: number
  tipo: number
  esOficial: boolean
  entidadCalificableAlumnoEvaluacionIndice: number
}

interface RawCalificacion {
  alumnoIndice: number
  entidadCalificableIndice: number
  entidadCalificableAlumnoEvaluacionIndice: number
  sistemaCalificacionValorIndice?: number
  valorNota?: number
  calificacionId?: string
}

interface RawSistemaCalificacionValor {
  id: string
  nombre: string
  clave: string
  vNota: number
  vInicio: number
  vFin: number
  aprobado: boolean
  color: string
}

interface RawSistemaCalificacion {
  id: string
  nombreCompleto: string
  valores: RawSistemaCalificacionValor[]
}

interface RawCuadernoCalificacion {
  entidadCalificableAlumnoEvaluacionIndice: number
  sistemaCalificacionValorIndice?: number
  valorNota?: number
  calificacionId?: string
}

interface RawCuaderno {
  calificaciones: RawCuadernoCalificacion[]
  sistemasCalificacion: RawSistemaCalificacion[]
}

interface RawEducamosResponse {
  alumnos?: Array<{ claseAlumnoIndice: number; nombreCompleto: string }>
  entidadesCalificables: RawEntidadCalificable[]
  calificaciones: RawCalificacion[]
  sistemasCalificacion: RawSistemaCalificacion[]
  puestaNotasCuadernoPorEntidadCalificablePadreIndice?: Record<string, RawCuaderno>
}

export async function GET(request: NextRequest) {  
  const baseUrl = process.env.EDUCAMOS_BASE_URL!
  const cookie = getAuthCookie(request)

  const searchParams = request.nextUrl.searchParams
  const nivelEducativoColegioId = searchParams.get('nivelEducativoColegioId')
  const claseId = searchParams.get('claseId')
  const alumnoId = searchParams.get('alumnoId')
  const evaluacionId = searchParams.get('evaluacionId')
  const evaluacionGrupoId = searchParams.get('evaluacionGrupoId') || ''
  const tipoEvaluacionId = searchParams.get('tipoEvaluacionId') || '2'

  if (!nivelEducativoColegioId || !claseId || !alumnoId || !evaluacionId) {
    console.warn('[getevaluation] Missing required params')
    return NextResponse.json(
      { 
        error: 'Missing required params: nivelEducativoColegioId, claseId, alumnoId, evaluacionId',
        data: []
      },
      { status: 200 }
    )
  }

  try {
    const timestamp = Date.now()
    const url = `${baseUrl}/Apis/Evaluacion/EvaluacionFamilia/Obtener?nivelEducativoColegioId=${nivelEducativoColegioId}&claseId=${claseId}&alumnoId=${alumnoId}&evaluacionId=${evaluacionId}&evaluacionGrupoId=${evaluacionGrupoId}&tipoEvaluacionId=${tipoEvaluacionId}&_=${timestamp}`
    
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
        'Referer': `${process.env.EDUCAMOS_BASE_URL!}/`
      }
    })

    if (!response.ok) {
      console.error('[getevaluation] Educamos API error:', response.status)
      return NextResponse.json(
        { error: `Failed to fetch evaluation data: ${response.status}` },
        { status: response.status }
      )
    }

    const data: RawEducamosResponse = await response.json()
    
    const evaluations: Evaluation[] = []
    
    const subjects = data.entidadesCalificables.filter(e => e.tipo === 0)

    const cuadernos = data.puestaNotasCuadernoPorEntidadCalificablePadreIndice || {}
    
    const gradingSystem = data.sistemasCalificacion?.[0]
    
    subjects.forEach((subject) => {
      const subjectIdx = String(subject.entidadCalificableAlumnoEvaluacionIndice)
      const cuaderno = cuadernos[subjectIdx]
      
      let color: string | undefined;
      let gradeLabel = 'Oficial';
      let grades: number[] = [];
      let isPassed = false;
      if (cuaderno) {
        grades = cuaderno.calificaciones
          ?.map(c => c.valorNota)
          .filter((g): g is number => g !== undefined) || [];
      }
      let average: number | undefined = undefined;
      if (grades.length > 0) {
        const sum = grades.reduce((a, b) => a + b, 0);
        average = sum / grades.length;
        isPassed = average >= 5;
      }
      let firstCal = cuaderno?.calificaciones?.find(c => c.valorNota !== undefined);
      if (firstCal) {
        const valorIdx = firstCal.sistemaCalificacionValorIndice;
        const sistema = cuaderno?.sistemasCalificacion?.[0] || gradingSystem;
        if (sistema && valorIdx !== undefined && sistema.valores?.[valorIdx]) {
          const gradeValue = sistema.valores[valorIdx];
          color = gradeValue.color;
          gradeLabel = gradeValue.nombre;
        }
      }

      evaluations.push({
        classId: subject.id,
        className: subject.nombre,
        shortName: subject.reducido,
        marks: [{
          id: subject.id,
          name: subject.nombre,
          shortName: subject.reducido,
          grade: average,
          maxGrade: 10,
          isPassed,
          gradeType: gradeLabel,
          color
        }],
        average: average
      });
    })
    
    return NextResponse.json({ data: evaluations })
  } catch (error) {
    console.error('[getevaluation] ERROR:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
