export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
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
