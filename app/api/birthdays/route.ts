import { NextResponse, NextRequest } from 'next/server'
import { getAuthCookie } from '@/lib/auth'
import type { Birthday } from '@/lib/types'
import { authFetch } from '@/lib/api'

interface RawBirthday {
  nombre: string
  nombreCompleto: string
  urlFoto?: string
  alumnoClasesNombres?: string[]
  nombreApellido: string
  tipoDeUsuario: string
}

export async function GET(request: NextRequest) {
  const url = process.env.BIRTHDAYS_URL
  const cookie = getAuthCookie(request)

  if (!url || !cookie) {
    return NextResponse.json(
      { error: 'Missing environment variables' },
      { status: 500 }
    )
  }

  try {
    const response = await authFetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/javascript, */*; q=0.01',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json; charset=utf-8',
        'priority': 'u=1, i',
        'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-requested-with': 'XMLHttpRequest',
        'cookie': cookie,
        'Referer': `${process.env.EDUCAMOS_BASE_URL!}/`
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch birthdays' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    const birthdays: Birthday[] = []
    
    if (data.personaCumpleannosHoy) {
      birthdays.push(...data.personaCumpleannosHoy.map((person: RawBirthday, idx: number) => ({
        id: `hoy-${idx}`,
        name: person.nombreApellido,
        date: 'Hoy',
        avatar: person.urlFoto || undefined,
        class: person.alumnoClasesNombres?.[0] || undefined
      })))
    }
    
    if (data.personaCumpleannosMannana) {
      birthdays.push(...data.personaCumpleannosMannana.map((person: RawBirthday, idx: number) => ({
        id: `mannana-${idx}`,
        name: person.nombreApellido,
        date: 'Mañana',
        avatar: person.urlFoto || undefined,
        class: person.alumnoClasesNombres?.[0] || undefined
      })))
    }
    
    if (data.personaCumpleannosProximamente) {
      birthdays.push(...data.personaCumpleannosProximamente.map((person: RawBirthday, idx: number) => ({
        id: `proximo-${idx}`,
        name: person.nombreApellido,
        date: 'Próximamente',
        avatar: person.urlFoto || undefined,
        class: person.alumnoClasesNombres?.[0] || undefined
      })))
    }
    
    return NextResponse.json({ data: birthdays })
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
