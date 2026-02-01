import { NextResponse, NextRequest } from 'next/server'
import puppeteer, { Browser, Page } from 'puppeteer'
import { Client, Users, ID } from 'node-appwrite'

const EDUCAMOS_URL = `${process.env.EDUCAMOS_BASE_URL!}/`
const SSO_DOMAIN = 'sso2.educamos.com'

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

export async function POST(request: NextRequest) {
  let browser: Browser | null = null;
  let page: Page | null = null;
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

const executablePath = process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : '/usr/bin/google-chrome'

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    let capturedCookie: string | null = null;

    page.on('request', (req) => {
      if (capturedCookie) return;
      const headers = req.headers();
      if (headers.cookie && headers.cookie.includes('didomi_token')) {
        capturedCookie = headers.cookie;
      }
    });

    page.on('response', async (response) => {
      const headers = response.headers()
      const setCookie = headers['set-cookie']
      if (setCookie && !capturedCookie) {
      }
    })

    try {
      await page.goto(EDUCAMOS_URL, { waitUntil: 'networkidle0', timeout: 30000 })

      await page.waitForFunction(
        (domain) => window.location.hostname.includes(domain),
        { timeout: 15000 },
        SSO_DOMAIN
      )

      await page.waitForSelector('#NombreUsuario', { timeout: 10000 })
      await page.waitForSelector('#Clave', { timeout: 10000 })

      await page.type('#NombreUsuario', username, { delay: 50 })
      await page.type('#Clave', password, { delay: 50 })

      await page.click('#btnAcceder')

      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 })

      const currentUrl = page.url()

      if (currentUrl.includes(SSO_DOMAIN)) {
        const errorElement = await page.$('.validation-summary-errors, .field-validation-error')
        const errorText = errorElement ? await errorElement.evaluate(el => el.textContent) : 'Invalid credentials'
        await browser.close()
        return NextResponse.json({ error: errorText?.trim() || 'Login failed' }, { status: 401 })
      }

      const cookies = await page.cookies()
      console.log('[auth] Someone has authed.')

      const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ')

      const email = `${username.toLowerCase()}@slackers.tech`
      const userId = `edu_${username.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
      let appwriteUserId = userId

      const adminUsers = getAppwriteAdmin()
      if (adminUsers) {
        try {
          await adminUsers.get(userId)
          await adminUsers.updatePassword(userId, password)
        } catch (e: any) {
          if (e.code === 404) {
            try {
              await adminUsers.create(userId, email, undefined, password, username)
            } catch (createError) {
              console.error('[auth] Failed to create Appwrite user:', createError)
            }
          }
        }
      }

      await browser.close()

      if (!cookieString) {
        return NextResponse.json({ error: 'Failed to obtain session cookie' }, { status: 500 })
      }

      return NextResponse.json({ token: cookieString, email, userId: appwriteUserId })

    } catch (error) {
      await browser.close()
      throw error
    }

  } catch (error) {
    console.error('[auth] Login error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed' },
      { status: 500 }
    )
  }
}
