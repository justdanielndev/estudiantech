import { NextResponse, NextRequest } from 'next/server'
import { Client, Users } from 'node-appwrite'

const BASE_URL = process.env.EDUCAMOS_BASE_URL!
const SSO_BASE = 'https://sso2.educamos.com'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

const getAppwriteAdmin = () => {
  if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
    return null
  }
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)
  return new Users(client)
}

type CookieEntry = { name: string; value: string; domain: string }
type CookieJar = Map<string, CookieEntry>

function collectCookies(headers: Headers, reqUrl: string, jar: CookieJar) {
  const domain = new URL(reqUrl).hostname
  const raw: string[] = (headers as any).getSetCookie?.() ?? []
  for (const c of raw) {
    const [pair] = c.split(';')
    const eq = pair.indexOf('=')
    if (eq === -1) continue
    const name = pair.slice(0, eq).trim()
    const value = pair.slice(eq + 1).trim()
    jar.set(`${domain}::${name}`, { name, value, domain })
  }
}

function cookieHeader(reqUrl: string, jar: CookieJar): string {
  const host = new URL(reqUrl).hostname
  return [...jar.values()]
    .filter(c => host === c.domain || host.endsWith('.' + c.domain) || c.domain.endsWith('.' + host))
    .map(c => `${c.name}=${c.value}`)
    .join('; ')
}

function baseHeaders(url: string, jar: CookieJar, extra: Record<string, string> = {}) {
  return {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Cookie': cookieHeader(url, jar),
    ...extra,
  }
}

async function httpGet(url: string, jar: CookieJar, extra: Record<string, string> = {}) {
  const r = await fetch(url, { redirect: 'manual', headers: baseHeaders(url, jar, extra) })
  collectCookies(r.headers, url, jar)
  return r
}

async function httpPost(url: string, body: string, jar: CookieJar, extra: Record<string, string> = {}) {
  const r = await fetch(url, {
    method: 'POST',
    redirect: 'manual',
    headers: { ...baseHeaders(url, jar, extra), 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  collectCookies(r.headers, url, jar)
  return r
}

function loc(r: Response, base?: string): string | null {
  const l = r.headers.get('location')
  if (!l) return null
  return l.startsWith('http') ? l : new URL(l, base ?? BASE_URL).href
}

function decodeHtml(s: string) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'")
}

function extractFormField(html: string, fieldName: string): string {
  const namePos = html.indexOf(`name="${fieldName}"`)
  if (namePos === -1) return ''
  const inputStart = html.lastIndexOf('<input', namePos)
  if (inputStart === -1) return ''
  const slice = html.slice(inputStart)
  const m = slice.match(/value="([^"]*)"/) ?? slice.match(/value='([^']*)'/)
  return m ? decodeHtml(m[1]) : ''
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    const jar: CookieJar = new Map()

    let r = await httpGet(`${BASE_URL}/`, jar)
    let redirect = loc(r)
    if (!redirect) return NextResponse.json({ error: 'SSO redirect failed' }, { status: 502 })

    r = await httpGet(redirect, jar)
    redirect = loc(r, SSO_BASE)
    if (!redirect) return NextResponse.json({ error: 'SSO login redirect failed' }, { status: 502 })

    r = await httpGet(redirect, jar)
    const loginUrl = redirect

    r = await httpPost(loginUrl, new URLSearchParams({ NombreUsuario: username, Clave: password }).toString(), jar, {
      Referer: loginUrl,
      Origin: SSO_BASE,
    })

    let currentUrl = loginUrl
    for (let i = 0; i < 8; i++) {
      if (r.status !== 301 && r.status !== 302) break
      const next = loc(r, SSO_BASE)
      if (!next) break
      currentUrl = next
      r = await httpGet(next, jar, { Referer: currentUrl })
    }

    const wsfedHtml = await r.text()

    if (currentUrl.includes('sso2.educamos.com') && !wsfedHtml.includes('wresult')) {
      const errMatch = wsfedHtml.match(/class="[^"]*(?:error|validation)[^"]*"[^>]*>([\s\S]{0,200})/i)
      const errText = errMatch ? errMatch[1].replace(/<[^>]+>/g, '').trim() : 'Invalid credentials'
      return NextResponse.json({ error: errText || 'Login failed' }, { status: 401 })
    }

    if (wsfedHtml.includes('wresult')) {
      const actionMatch = wsfedHtml.match(/<form[^>]+action="([^"]+)"/)
      const postUrl = actionMatch ? decodeHtml(actionMatch[1]) : `${BASE_URL}/`

      const payload = new URLSearchParams({
        wa: extractFormField(wsfedHtml, 'wa') || 'wsignin1.0',
        wresult: extractFormField(wsfedHtml, 'wresult'),
        wctx: extractFormField(wsfedHtml, 'wctx'),
      })

      r = await httpPost(postUrl, payload.toString(), jar, {
        Referer: `${SSO_BASE}/`,
        Origin: SSO_BASE,
      })

      for (let i = 0; i < 5; i++) {
        if (r.status !== 301 && r.status !== 302) break
        const next = loc(r, BASE_URL)
        if (!next || next.includes('DefaultError')) break
        r = await httpGet(next, jar)
      }
    }

    const appCookies = [...jar.values()].filter(c =>
      c.domain.includes('educamos.com') && !c.domain.includes('sso2')
    )

    if (appCookies.length === 0) {
      return NextResponse.json({ error: 'Authentication failed — no session cookies obtained' }, { status: 401 })
    }

    const cookieString = [...jar.values()]
      .filter(c => c.domain.includes('educamos.com'))
      .map(c => `${c.name}=${c.value}`)
      .join('; ')

    const email = `${username.toLowerCase()}@slackers.tech`
    const userId = `edu_${username.toLowerCase().replace(/[^a-z0-9]/g, '_')}`

    const adminUsers = getAppwriteAdmin()
    if (adminUsers) {
      Promise.resolve().then(async () => {
        try {
          await adminUsers.get(userId)
          await adminUsers.updatePassword(userId, password)
        } catch (e: any) {
          if (e.code === 404) {
            try { await adminUsers.create(userId, email, undefined, password, username) } catch {}
          }
        }
      }).catch(() => {})
    }

    console.log(`[auth] Login OK for "${username}"`)
    return NextResponse.json({ token: cookieString, email, userId })

  } catch (error) {
    console.error('[auth] Login error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed' },
      { status: 500 }
    )
  }
}
