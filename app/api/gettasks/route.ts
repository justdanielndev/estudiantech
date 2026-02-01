import { NextResponse, NextRequest } from 'next/server'
import { getAuthCookie } from '@/lib/auth'

export interface TaskItem {
  id: string
  subject: string
  title: string
  dueDate: string
  status: 'pending' | 'submitted'
  isUnread: boolean
}

function parseHtmlTasks(html: string): TaskItem[] {
  const tasks: TaskItem[] = []

  const rows = html.split('<tr>')
  
  for (let i = 1; i < rows.length; i++) {
    const rowHtml = rows[i]
    
    const tds = rowHtml.split('</td>')
    if (tds.length < 4) continue

    try {
      const subjectMatch = tds[0].match(/<span[^>]*>([^<]+)<\/span>/)
      const subject = subjectMatch ? subjectMatch[1].trim() : ''

      const titleMatch = tds[1].match(/<span[^>]*>([^<]+)<\/span>/)
      const title = titleMatch ? titleMatch[1].trim() : ''

      const dateMatch = tds[2].match(/<span[^>]*>([^<]+)<\/span>/)
      const dueDate = dateMatch ? dateMatch[1].trim() : ''

      const idMatch = tds[3].match(/data-id='([^']*)'/)
      const srcMatch = tds[3].match(/src='([^']*)'/)
      const leidoMatch = tds[3].match(/data-leido='([^']*)'/)
      
      const taskId = idMatch ? idMatch[1] : `task-${i}`
      const isUnread = leidoMatch ? leidoMatch[1] === 'False' : false
      const imgSrc = srcMatch ? srcMatch[1] : ''
      const isDone = imgSrc.includes('checkok.png')

      if (!subject || !title || !dueDate) continue

      const [day, month, year] = dueDate.split('/')
      const formattedDate = `${year}-${month}-${day}`

      tasks.push({
        id: taskId,
        subject,
        title,
        dueDate: formattedDate,
        status: isDone ? 'submitted' : 'pending',
        isUnread
      })
    } catch (err) {
      console.error('Error parsing task row:', err)
      continue
    }
  }

  return tasks
}

export async function POST(request: NextRequest) {
  const url = process.env.GET_TASKS_URL
  const cookie = getAuthCookie(request)

  if (!url || !cookie) {
    return NextResponse.json(
      { error: 'Missing environment variables' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { fechaInicio: requestFechaInicio, fechaFin: requestFechaFin, alumnoId: requestAlumnoId } = body
    
    if (!requestAlumnoId) {
      return NextResponse.json(
        { error: 'Missing alumnoId' },
        { status: 400 }
      )
    }
    
    const alumnoId = requestAlumnoId
    const today = new Date()
    const defaultFechaInicio = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`
    
    const fechaInicio = (requestFechaInicio || defaultFechaInicio).replace(/\//g, '%2F')
    const fechaFin = (requestFechaFin || '').replace(/\//g, '%2F')

    const formData = new URLSearchParams()
    formData.append('alertaValidacion', 'ValidationSummary')
    formData.append('contexto', 'divListadoTareas')
    formData.append('AlumnoId', alumnoId)
    formData.append('FechaInicio', fechaInicio)
    formData.append('FechaFin', fechaFin)
    formData.append('Pagina', '0')
    formData.append('OrdenarPor', 'Fecha')
    formData.append('OrdenarModo', 'ASC')
    formData.append('OperacionGrid', '')
    formData.append('NumTotalElemsGrid', '100')
    formData.append('FilasPorPagina', '100')
    formData.append('X-Requested-With', 'XMLHttpRequest')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
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
      body: formData.toString()
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: response.status }
      )
    }

    const html = await response.text()
    const tasks = parseHtmlTasks(html)

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
