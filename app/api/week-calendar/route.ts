import { NextResponse, NextRequest } from 'next/server'
import { getAuthCookie } from '@/lib/auth'

export interface WeekCalendarEvent {
  id: string
  subjectName: string
  subjectShortName: string
  className: string
  classShortName: string
  dayOfWeek: number
  startTime: string
  endTime: string
  startDate: string
  endDate: string
  isBreak: boolean
  hasExam: boolean
  hasTasks: boolean
  hasIncidences: boolean
  sessionId: string
}

export interface WeekCalendarResponse {
  weekStart: string
  weekEnd: string
  events: WeekCalendarEvent[]
}

interface ApiEventItem {
  ClaseHorarioSesionId: string | null
  ClaseMateriaNombre: string
  ClaseMateriaNombreReducido: string | null
  ClaseNombre: string | null
  ClaseNombreReducido: string | null
  DiaSemanaId: number
  HoraInicio: string
  HoraFin: string
  FechaInicio: string
  FechaFin: string
  EsActividadNoLectiva: boolean
  NumExamenes: number
  NumTareas: number
  NumIncidencias: number
  RejillaHorariaDiaSesionId: string
}

interface ApiResponse {
  FechaInicio: string
  FechaFin: string
  DiaSemanaInicio: number
  DiaSemanaFin: number
  EventosEscolares: ApiEventItem[]
}

function parseApiEvent(event: ApiEventItem): WeekCalendarEvent {
  return {
    id: event.ClaseHorarioSesionId || event.RejillaHorariaDiaSesionId,
    subjectName: event.ClaseMateriaNombre || '',
    subjectShortName: event.ClaseMateriaNombreReducido || '',
    className: event.ClaseNombre || '',
    classShortName: event.ClaseNombreReducido || '',
    dayOfWeek: event.DiaSemanaId,
    startTime: event.HoraInicio.substring(0, 5),
    endTime: event.HoraFin.substring(0, 5),
    startDate: event.FechaInicio,
    endDate: event.FechaFin,
    isBreak: event.EsActividadNoLectiva,
    hasExam: event.NumExamenes > 0,
    hasTasks: event.NumTareas > 0,
    hasIncidences: event.NumIncidencias > 0,
    sessionId: event.ClaseHorarioSesionId || event.RejillaHorariaDiaSesionId,
  }
}

export async function POST(request: NextRequest) {
  const url = process.env.DOWNLOAD_WEEK_CALENDAR_URL
  const cookie = getAuthCookie(request)

  if (!url) {
    return NextResponse.json(
      { error: 'Missing DOWNLOAD_WEEK_CALENDAR_URL environment variable' },
      { status: 500 }
    )
  }

  if (!cookie) {
    return NextResponse.json(
      { error: 'Missing authentication' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { personaId, fechaHoy, diaSemanaInicio = 1, diaSemanaFin = 7 } = body

    if (!personaId || !fechaHoy) {
      return NextResponse.json(
        { error: 'Missing required parameters: personaId, fechaHoy' },
        { status: 400 }
      )
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json, text/javascript, */*; q=0.01',
        'accept-language': 'es-ES,es;q=0.9',
        'content-type': 'application/json;charset=UTF-8',
        'origin': process.env.EDUCAMOS_BASE_URL!,
        'referer': `${process.env.EDUCAMOS_BASE_URL!}/Agenda/Semanal`,
        'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        'x-requested-with': 'XMLHttpRequest',
        'cookie': cookie
      },
      body: JSON.stringify({
        fechaHoy,
        diaSemanaInicio,
        diaSemanaFin,
        PersonaId: personaId,
        AlumnoIdCuandoRolBaseEsTutor: ''
      })
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch week calendar' },
        { status: response.status }
      )
    }

    const data: ApiResponse = await response.json()

    const events = data.EventosEscolares
      .map(parseApiEvent)
      .sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) {
          return a.dayOfWeek - b.dayOfWeek
        }
        return a.startTime.localeCompare(b.startTime)
      })

    const result: WeekCalendarResponse = {
      weekStart: data.FechaInicio,
      weekEnd: data.FechaFin,
      events
    }

    return NextResponse.json({ data: result })
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
