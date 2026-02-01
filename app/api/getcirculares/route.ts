import { NextResponse, NextRequest } from 'next/server'
import { getAuthCookie } from '@/lib/auth'

interface Circular {
  id: string
  circularId: string
  fecha: string
  asunto: string
  isBold: boolean
  fechaCompleta: Date
}

export async function POST(request: NextRequest) {  
  const baseUrl = process.env.EDUCAMOS_BASE_URL!
  const cookie = getAuthCookie(request)

  const searchParams = request.nextUrl.searchParams
  const personaId = searchParams.get('personaId')

  if (!personaId) {
    console.warn('[getcirculares] Missing required param: personaId')
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
    formData.append('FechaInicio', '')
    const today = new Date()
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`
    formData.append('FechaFin', formattedDate)
    formData.append('Pagina', '0')
    formData.append('OrdenarPor', 'FechaPublicacion')
    formData.append('OrdenarModo', 'DESC')
    formData.append('OperacionGrid', '')
    formData.append('NumTotalElemsGrid', '2147483647')
    formData.append('FilasPorPagina', '2147483647')
    formData.append('X-Requested-With', 'XMLHttpRequest')

    const url = `${baseUrl}/Comunicacion/Circulares/BuscarListadoCircularesHome`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'accept-language': 'es-ES,es;q=0.9',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'origin': baseUrl,
        'priority': 'u=1, i',
        'referer': `${baseUrl}/Comunicacion/Circulares/MisCirculares`,
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
      console.error('[getcirculares] Educamos API error:', response.status)
      return NextResponse.json(
        { error: `Failed to fetch circulares data: ${response.status}` },
        { status: response.status }
      )
    }

    const html = await response.text()
    const circulares = parseCircularesFromHtml(html)

    return NextResponse.json({ data: circulares })
  } catch (error) {
    console.error('[getcirculares] ERROR:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function parseCircularesFromHtml(html: string): Circular[] {
  const circulares: Circular[] = []
  
  const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/)
  if (!tbodyMatch) {
    return circulares
  }
  
  const tbodyContent = tbodyMatch[1]
  
  const rowPattern = /<tr>([\s\S]*?)<\/tr>/g
  let rowMatch

  while ((rowMatch = rowPattern.exec(tbodyContent)) !== null) {
    const rowContent = rowMatch[1]
    
    const cellPattern = /<td[^>]*data-dataCell="true"[^>]*>([\s\S]*?)<\/td>/g
    const cells: { content: string; isBold: boolean }[] = []
    let cellMatch
    
    while ((cellMatch = cellPattern.exec(rowContent)) !== null) {
      const cellContent = cellMatch[1].trim()
      const isBold = cellContent.includes('<b>')
      
      let text = ''
      if (cellContent.includes('<a')) {
        const linkMatch = cellContent.match(/<a[^>]*href='([^']*)'[^>]*>([\s\S]*?)<\/a>/)
        if (linkMatch) {
          text = linkMatch[2].replace(/<[^>]*>/g, '').trim()
        }
      } else {
        text = cellContent.replace(/<[^>]*>/g, '').trim()
      }
      
      cells.push({ content: text, isBold })
    }
    
    if (cells.length >= 2) {
      const fecha = cells[0].content.trim()
      const asunto = cells[1].content.trim()
      const isBoldAsunto = cells[1].isBold
      
      const linkMatch = rowContent.match(/href='\/Comunicacion\/Circulares\/DescargarAdjuntos\?CircularId=([^']*)'/)
      const circularId = linkMatch ? linkMatch[1] : ''
      
      if (!fecha || !fecha.match(/\d{2}\/\d{2}\/\d{4}/) || !circularId) {
        continue
      }
      
      const [day, month, year] = fecha.split('/').map(Number)
      const fechaCompleta = new Date(year, month - 1, day)
      
      circulares.push({
        id: `${fecha}-${circularId}`,
        circularId,
        fecha,
        asunto,
        isBold: isBoldAsunto,
        fechaCompleta
      })
    }
  }
    
  circulares.sort((a, b) => b.fechaCompleta.getTime() - a.fechaCompleta.getTime())
  
  return circulares
}
