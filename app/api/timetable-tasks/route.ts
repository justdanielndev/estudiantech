import { NextResponse, NextRequest } from 'next/server'
import { getAuthCookie } from '@/lib/auth'

export interface TimetableTask {
  id: string
  name: string
  fecha: string
  tipo: string
  visto: boolean
}

export async function POST(request: NextRequest) {
  const url = process.env.GET_TIMETABLE_TASKS_URL
  const cookie = getAuthCookie(request)

  if (!url || !cookie) {
    return NextResponse.json(
      { error: 'Missing environment variables' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { claseHorarioSesionId, fecha } = body

    if (!claseHorarioSesionId || !fecha) {
      return NextResponse.json(
        { error: 'Missing claseHorarioSesionId or fecha' },
        { status: 400 }
      )
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json, text/javascript, */*; q=0.01',
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
        ClaseHorarioSesionId: claseHorarioSesionId,
        Fecha: fecha,
        ActualizarCache: false
      })
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch timetable tasks' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    const tasks: TimetableTask[] = (data || []).map((task: any) => ({
      id: task.TareaId,
      name: task.Nombre,
      fecha: task.Fecha,
      tipo: task.TipoTareaNombre,
      visto: task.Visto
    }))

    return NextResponse.json({ data: tasks })
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
