import { NextResponse, NextRequest } from 'next/server'
import { getAuthCookie } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const avisoId = request.nextUrl.searchParams.get('avisoId')
  
  if (!avisoId) {
    return NextResponse.json(
      { error: 'Missing avisoId parameter' },
      { status: 400 }
    )
  }

  const url = process.env.DOWNLOAD_ANNOUNCEMENT_FILE_URL
  const cookie = getAuthCookie(request)

  if (!url || !cookie) {
    return NextResponse.json(
      { error: 'Missing environment variables' },
      { status: 500 }
    )
  }

  try {
    const downloadUrl = `${url}?avisoId=${encodeURIComponent(avisoId)}`
    
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'cookie': cookie,
        'Referer': `${process.env.EDUCAMOS_BASE_URL!}/`
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to download file' },
        { status: response.status }
      )
    }

    const buffer = await response.arrayBuffer()
    
    const contentDisposition = response.headers.get('content-disposition')
    const contentType = response.headers.get('content-type') || 'application/octet-stream'

    const downloadResponse = new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.byteLength.toString(),
      }
    })

    if (contentDisposition) {
      downloadResponse.headers.set('Content-Disposition', contentDisposition)
    }

    return downloadResponse
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
