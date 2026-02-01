import { NextResponse, NextRequest } from 'next/server'
import { getAuthCookie } from '@/lib/auth'

export async function GET(request: NextRequest) {  
  const baseUrl = process.env.EDUCAMOS_BASE_URL!
  const cookie = getAuthCookie(request)

  const searchParams = request.nextUrl.searchParams
  const circularId = searchParams.get('circularId')
  const asunto = searchParams.get('asunto') || 'document'

  if (!circularId) {
    console.warn('[download-circular] Missing required param: circularId')
    return NextResponse.json(
      { error: 'Missing required param: circularId' },
      { status: 400 }
    )
  }

  try {
    const url = `${baseUrl}/Comunicacion/Circulares/DescargarAdjuntos?CircularId=${circularId}`
    
    const headers: Record<string, string> = {
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'es-ES,es;q=0.9',
      'priority': 'u=0, i',
      'referer': `${baseUrl}/Comunicacion/Circulares/MisCirculares`,
      'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
    };
    if (cookie) {
      headers['cookie'] = cookie;
    }
    const response = await fetch(url, {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      console.error('[download-circular] Educamos API error:', response.status)
      return NextResponse.json(
        { error: `Failed to download file: ${response.status}` },
        { status: response.status }
      )
    }

    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    
    let filename = `${asunto.replace(/[^a-z0-9]/gi, '_')}.pdf`
    const contentDisposition = response.headers.get('content-disposition')
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^";\n]*)"?/i)
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1]
      }
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    console.error('[download-circular] ERROR:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
