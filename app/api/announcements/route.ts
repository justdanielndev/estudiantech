import { NextResponse, NextRequest } from 'next/server'
import { getAuthCookie } from '@/lib/auth'
import type { Announcement } from '@/lib/types'

export async function GET(request: NextRequest) {
  const url = process.env.ANNOUNCEMENTS_URL
  const cookie = getAuthCookie(request)

  if (!url || !cookie) {
    return NextResponse.json(
      { error: 'Missing environment variables' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'max-age=0',
        'cookie': cookie,
        'Referer': `${process.env.EDUCAMOS_BASE_URL!}/`
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch announcements' },
        { status: response.status }
      )
    }

    const html = await response.text()
    
    const announcements: Announcement[] = []
    
    const tableRowRegex = /<tr[^>]*data-parametrosfila='(\[.*?\])'[^>]*>([\s\S]*?)<\/tr>/g
    let match

    while ((match = tableRowRegex.exec(html)) !== null) {
      try {
        const parametrosStr = match[1]
        const rowHtml = match[2]
        
        const parametros = JSON.parse(parametrosStr)
        const id = parametros.find((p: any) => p.name === 'idSeleccion')?.value || ''
        const isRead = parametros.find((p: any) => p.name === 'marcarLeido')?.value === true

        const cells = rowHtml.match(/<td[^>]*>(.*?)<\/td>/g) || []
        
        if (cells.length >= 4) {
          const titleMatch = cells[1]?.match(/<span[^>]*>(.*?)<\/span>/s)
          const title = titleMatch ? titleMatch[1].trim() : ''

          const dateMatch = cells[3]?.match(/<span[^>]*>(.*?)<\/span>/s)
          const date = dateMatch ? dateMatch[1].trim() : ''

          const hasAttachment = cells[2]?.includes('paperclip')

          const isBold = rowHtml.includes("font-weight: bold")
          const isNew = !isRead || isBold

          if (title && date) {
            announcements.push({
              id,
              title,
              date,
              category: 'general',
              isNew,
            })
          }
        }
      } catch (e) {
        console.error('Error parsing announcement row:', e)
        continue
      }
    }

    return NextResponse.json({ 
      data: announcements,
      count: announcements.length
    })
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
