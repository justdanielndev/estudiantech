import { NextResponse, NextRequest } from 'next/server'
import { getAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const url = process.env.CHANGE_TASK_STATUS_URL
  const cookie = getAuthCookie(request)

  if (!url || !cookie) {
    return NextResponse.json(
      { error: 'Missing environment variables' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { tareaId, visto } = body

    if (!tareaId) {
      return NextResponse.json(
        { error: 'Missing tareaId' },
        { status: 400 }
      )
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json',
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
        tareaId,
        visto
      })
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to update task status' },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true })
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
