import { NextResponse, NextRequest } from 'next/server'
import { getAuthCookie } from '@/lib/auth'

interface SubjectGrade {
  id: string
  name: string
  shortName: string
  grade?: number
  isPassed: boolean
  color?: string
}

interface SubjectDetail {
  id: string
  name: string
  shortName: string
  mainGrade?: number
  isPassed: boolean
  grades: SubjectGrade[]
}

interface RawCalificacion {
  entidadCalificableAlumnoEvaluacionIndice: number
  sistemaCalificacionValorIndice?: number
  valorNota?: number
  calificacionId?: string
}

interface RawEntidadCalificable {
  id: string
  nombre: string
  reducido: string
  tipo: number
  entidadCalificableAlumnoEvaluacionIndice: number
}

interface RawSistemaValor {
  nombre: string
  aprobado: boolean
  color: string
  vNota: number
}

interface RawSistema {
  valores: RawSistemaValor[]
}

interface RawCuaderno {
  calificaciones: RawCalificacion[]
  entidadesCalificables: RawEntidadCalificable[]
  sistemasCalificacion: RawSistema[]
}

interface RawEducamosResponse {
  entidadesCalificables: RawEntidadCalificable[]
  puestaNotasCuadernoPorEntidadCalificablePadreIndice?: Record<string, RawCuaderno>
  sistemasCalificacion: RawSistema[]
}

export async function GET(request: NextRequest) {
  const baseUrl = process.env.EDUCAMOS_BASE_URL!
  const cookie = getAuthCookie(request)

  const searchParams = request.nextUrl.searchParams
  const subjectId = searchParams.get('subjectId')
  const nivelEducativoColegioId = searchParams.get('nivelEducativoColegioId')
  const claseId = searchParams.get('claseId')
  const alumnoId = searchParams.get('alumnoId')
  const evaluacionId = searchParams.get('evaluacionId')
  const evaluacionGrupoId = searchParams.get('evaluacionGrupoId') || ''
  const tipoEvaluacionId = searchParams.get('tipoEvaluacionId') || '2'



  if (!subjectId || !nivelEducativoColegioId || !claseId || !alumnoId || !evaluacionId) {
    return NextResponse.json({ error: 'Missing required params' }, { status: 400 })
  }

  try {
    const timestamp = Date.now()
    const url = `${baseUrl}/Apis/Evaluacion/EvaluacionFamilia/Obtener?nivelEducativoColegioId=${nivelEducativoColegioId}&claseId=${claseId}&alumnoId=${alumnoId}&evaluacionId=${evaluacionId}&evaluacionGrupoId=${evaluacionGrupoId}&tipoEvaluacionId=${tipoEvaluacionId}&_=${timestamp}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/javascript, */*; q=0.01',
        'content-type': 'application/json; charset=utf-8',
        'x-requested-with': 'XMLHttpRequest',
        'cookie': cookie,
        'Referer': `${baseUrl}/Evaluacion/CalificacionesAlumno`
      }
    })

    if (!response.ok) {
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: response.status })
    }

    const data: RawEducamosResponse = await response.json()
    
    const subject = data.entidadesCalificables?.find(e => e.id === subjectId)
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    const subjectIdx = String(subject.entidadCalificableAlumnoEvaluacionIndice)
    const cuaderno = data.puestaNotasCuadernoPorEntidadCalificablePadreIndice?.[subjectIdx]
    
    const grades: SubjectGrade[] = [];
    if (cuaderno) {
      const sistema = cuaderno.sistemasCalificacion?.[0];
      cuaderno.entidadesCalificables?.forEach((entity) => {
        const cal = cuaderno.calificaciones?.find(
          c => c.entidadCalificableAlumnoEvaluacionIndice === entity.entidadCalificableAlumnoEvaluacionIndice
        );
        if (cal) {
          const grade = cal.valorNota;
          const valorIdx = cal.sistemaCalificacionValorIndice;
          let isPassed = grade !== undefined ? grade >= 5 : false;
          let color: string | undefined;
          if (sistema && valorIdx !== undefined && sistema.valores?.[valorIdx]) {
            const gradeValue = sistema.valores[valorIdx];
            isPassed = gradeValue.aprobado;
            color = gradeValue.color;
          }
          grades.push({
            id: entity.id,
            name: entity.nombre,
            shortName: entity.reducido,
            grade,
            isPassed,
            color
          });
        }
      });
    }

    const validGrades = grades.map(g => g.grade).filter((g): g is number => g !== undefined);
    let mainGrade: number | undefined = undefined;
    let mainIsPassed = false;
    if (validGrades.length > 0) {
      const sum = validGrades.reduce((a, b) => a + b, 0);
      mainGrade = sum / validGrades.length;
      mainIsPassed = mainGrade >= 5;
    }

    const result: SubjectDetail = {
      id: subject.id,
      name: subject.nombre,
      shortName: subject.reducido,
      mainGrade,
      isPassed: mainIsPassed,
      grades
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('[getsubjectgrades] ERROR:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
