import { NextResponse, NextRequest } from 'next/server'
import { getAuthCookie } from '@/lib/auth'

interface AnnouncementDetail {
  id: string
  title: string
  content: string
  attachmentUrl?: string
  attachmentName?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const url = process.env.GET_ANNOUNCEMENT_URL
  const cookie = getAuthCookie(request)

  if (!url || !cookie) {
    return NextResponse.json(
      { error: 'Missing environment variables' },
      { status: 500 }
    )
  }

  try {
    const formData = new URLSearchParams()
    formData.append('idSeleccion', id)
    formData.append('marcarLeido', 'true')
    formData.append('personaHijoId', '')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/x-www-form-urlencoded',
        'cookie': cookie,
        'Referer': `${process.env.EDUCAMOS_BASE_URL!}/`
      },
      body: formData.toString()
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch announcement' },
        { status: response.status }
      )
    }

    const html = await response.text()

    const detail: AnnouncementDetail = {
      id,
      title: '',
      content: '',
      attachmentUrl: undefined,
      attachmentName: undefined
    }

    const titleMatch = html.match(/id="Anuncio"\s+name="Anuncio"\s+type="hidden"\s+value="([^"]*)"/)
    if (titleMatch) {
      detail.title = titleMatch[1]
    }

    const contentMatch = html.match(/<div\s+id="AvisoDetalleHome"[^>]*>([\s\S]*?)<\/div>\s*<div\s+class="adjunto-aviso-detalle">/)
    if (contentMatch) {
      let content = contentMatch[1]
      
      content = content.replace(/<br\s*\/?>/gi, '\n')
      content = content.replace(/<\/p>/gi, '\n')
      content = content.replace(/<\/div>/gi, '\n')
      
      content = content.replace(/<[^>]*>/g, '')
      
      const htmlEntities: Record<string, string> = {
        '&quot;': '"',
        '&apos;': "'",
        '&nbsp;': ' ',
        '&lt;': '<',
        '&gt;': '>',
        '&amp;': '&',
        '&iacute;': 'í',
        '&aacute;': 'á',
        '&eacute;': 'é',
        '&oacute;': 'ó',
        '&uacute;': 'ú',
        '&Iacute;': 'Í',
        '&Aacute;': 'Á',
        '&Eacute;': 'É',
        '&Oacute;': 'Ó',
        '&Uacute;': 'Ú',
        '&ntilde;': 'ñ',
        '&Ntilde;': 'Ñ',
        '&iexcl;': '¡',
        '&iquest;': '¿',
        '&agrave;': 'à',
        '&egrave;': 'è',
        '&igrave;': 'ì',
        '&ograve;': 'ò',
        '&ugrave;': 'ù',
        '&Agrave;': 'À',
        '&Egrave;': 'È',
        '&Igrave;': 'Ì',
        '&Ograve;': 'Ò',
        '&Ugrave;': 'Ù',
      }
      
      Object.entries(htmlEntities).forEach(([entity, char]) => {
        content = content.replace(new RegExp(entity, 'g'), char)
      })
      
      content = content.replace(/&#(\d+);/g, (match, dec) => {
        return String.fromCharCode(parseInt(dec, 10))
      })
      content = content.replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
        return String.fromCharCode(parseInt(hex, 16))
      })
      
      content = content
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n')
        .trim()
      
      detail.content = content
    }

    const attachmentMatch = html.match(/<a\s+href='([^']*)'[^>]*data-enlace='true'[^>]*>.*?<\/a>/)
    if (attachmentMatch) {
      detail.attachmentUrl = attachmentMatch[1]
      detail.attachmentName = 'Descargar el archivo adjunto'
    }

    return NextResponse.json({ data: detail })
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
