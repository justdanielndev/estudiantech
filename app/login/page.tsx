'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { account, isAppwriteConfigured } from '@/lib/appwrite-client'
import { setDemoMode } from '@/lib/demo-mode'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (username === 'demo' && password === 'demo') {
      setDemoMode()
      window.location.href = '/'
      return
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al iniciar sesión')
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('appwrite_email', data.email)
      localStorage.setItem('appwrite_user_id', data.userId)

      if (isAppwriteConfigured) {
        try {
          await account.createEmailPasswordSession(data.email, password)
        } catch (appwriteErr) {
          console.warn('Appwrite session creation failed:', appwriteErr)
        }
      }

      router.push('/')
    } catch (err) {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <picture>
              <source srcSet="/icon.svg" media="(prefers-color-scheme: dark)" />
              <img
                src="/icon-light.svg"
                alt="Logo"
                className="h-16 w-auto drop-shadow"
                width={64}
                height={64}
                draggable="false"
              />
            </picture>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Iniciar Sesión</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Usa tus credenciales de Educamos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Usuario</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                placeholder="Tu usuario de Educamos"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                disabled={loading}
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              'Acceder'
            )}
          </Button>
        </form>

        {loading && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Esto puede tardar unos segundos...
          </p>
        )}
      </div>
    </div>
  )
}
