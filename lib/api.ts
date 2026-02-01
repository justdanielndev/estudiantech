import { isDemoMode, getDemoResponse, DEMO_TOKEN } from './demo-mode'

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  
  if (token === DEMO_TOKEN && isDemoMode()) {
    const demoData = getDemoResponse(url)
    return new Response(JSON.stringify(demoData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  const headers = new Headers(options.headers)
  if (token) {
    headers.set('X-Auth-Token', token)
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  if (
    typeof window !== 'undefined' &&
    (response.status === 401 || response.status === 403)
  ) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    throw new Error('Authentication required or server error')
  }

  return response
}
