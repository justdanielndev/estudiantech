import { NextResponse, NextRequest } from 'next/server'
import { getAuthCookie } from '@/lib/auth'

interface RawIncidencia {
  Fecha: string
  Hora: string
  Materia: string
  Clase: string
  Tipo: string
  ComentarioMateria: string
  ComentarioDia: string
  Justificacion: string
}

interface Incidencia {
  id: string
  fecha: string
  hora: string
  materia: string
  clase: string
  tipo: string
  comentarioMateria: string
  comentarioDia: string
  justificacion: string
  fechaCompleta: Date
}

export async function POST(request: NextRequest) {  
  const baseUrl = process.env.EDUCAMOS_BASE_URL!
  const cookie = getAuthCookie(request)

  const searchParams = request.nextUrl.searchParams
  const personaId = searchParams.get('personaId')
  const evaluacionId = searchParams.get('evaluacionId') || '00000000-0000-0000-0000-000000000000'
  const mostrarPendientesVer = searchParams.get('mostrarPendientesVer') || 'false'
  const cmbTiposIncidencia = searchParams.get('cmbTiposIncidencia') || ''
  const mostrarSoloNoJustificadas = searchParams.get('mostrarSoloNoJustificadas') || 'false'

  if (!personaId) {
    console.warn('[getincidencias] Missing required param: personaId')
    return NextResponse.json(
      { 
        error: 'Missing required param: personaId',
        data: []
      },
      { status: 200 }
    )
  }

  try {
    const formData = new URLSearchParams()
    formData.append('PersonaId', personaId)
    formData.append('EvaluacionId', evaluacionId)
    formData.append('MostrarPendientesVer', mostrarPendientesVer)
    formData.append('cmbTiposIncidencia', cmbTiposIncidencia)
    formData.append('MostrarSoloNoJustificadas', mostrarSoloNoJustificadas)
    formData.append('Pagina', '0')
    formData.append('OrdenarPor', 'Fecha')
    formData.append('OrdenarModo', 'DESC')
    formData.append('OperacionGrid', '')
    formData.append('NumTotalElemsGrid', '2147483647')
    formData.append('FilasPorPagina', '2147483647')
    formData.append('X-Requested-With', 'XMLHttpRequest')

    const url = `${baseUrl}/Evaluacion/PasarLista/BuscarListadoIncidenciasHome`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'accept-language': 'es-ES,es;q=0.9',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'origin': baseUrl,
        'priority': 'u=1, i',
        'referer': `${baseUrl}/Evaluacion/PasarLista/MisIncidencias`,
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
      body: formData.toString()
    })

    if (!response.ok) {
      console.error('[getincidencias] Educamos API error:', response.status)
      return NextResponse.json(
        { error: `Failed to fetch incidents data: ${response.status}` },
        { status: response.status }
      )
    }

    const html = await response.text()

    const incidencias = parseIncidenciasFromHtml(html)

    return NextResponse.json({ data: incidencias })
  } catch (error) {
    console.error('[getincidencias] ERROR:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function parseIncidenciasFromHtml(html: string): Incidencia[] {
  const incidencias: Incidencia[] = []
  
  const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/)
  if (!tbodyMatch) {
    return incidencias
  }
  
  const tbodyContent = tbodyMatch[1]
  
  const rowPattern = /<tr>([\s\S]*?)<\/tr>/g
  let rowMatch

  while ((rowMatch = rowPattern.exec(tbodyContent)) !== null) {
    const rowContent = rowMatch[1]
    
    const cellPattern = /<td[^>]*data-dataCell="true"[^>]*>([\s\S]*?)<\/td>/g
    const cells: string[] = []
    let cellMatch
    
    while ((cellMatch = cellPattern.exec(rowContent)) !== null) {
      const cellContent = cellMatch[1].trim()
      
      const spanMatch = cellContent.match(/<span[^>]*title='([^']*)'/)
      if (spanMatch !== null) {
        cells.push(spanMatch[1])
      } else {
        const plainText = cellContent.replace(/<[^>]*>/g, '').trim()
        cells.push(plainText)
      }
    }
    
    if (cells.length >= 8) {
      const fecha = cells[0]?.trim() || ''
      const hora = cells[1]?.trim() || ''
      const materia = cells[2]?.trim() || ''
      const clase = cells[3]?.trim() || ''
      const tipo = cells[4]?.trim() || ''
      const comentarioMateria = cells[5]?.trim() || ''
      const comentarioDia = cells[6]?.trim() || ''
      const justificacion = cells[7]?.trim() || ''
      
      if (!fecha || !fecha.match(/\d{2}\/\d{2}\/\d{4}/)) {
        continue
      }
      
      const [day, month, year] = fecha.split('/').map(Number)
      const fechaCompleta = new Date(year, month - 1, day)
      
      incidencias.push({
        id: `${fecha}-${hora}-${materia}`.replace(/[^a-z0-9]/gi, ''),
        fecha,
        hora,
        materia,
        clase,
        tipo,
        comentarioMateria,
        comentarioDia,
        justificacion,
        fechaCompleta
      })
    }
  }
    
  incidencias.sort((a, b) => b.fechaCompleta.getTime() - a.fechaCompleta.getTime())
  
  return incidencias
}
