import { NextRequest } from 'next/server'

export function getAuthCookie(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  const tokenHeader = request.headers.get('X-Auth-Token')
  if (tokenHeader) {
    return tokenHeader
  }

  return null
}
