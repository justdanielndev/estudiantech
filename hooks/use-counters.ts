import { useEffect, useState } from 'react'

export interface Counter {
  TipoElementoResumen: number
  ContadorElementos: number
  Fallo: boolean
  DescripcionFallo: string
  MostrarContador: boolean
  name?: string
}

export function useCounters() {
  const [counters, setCounters] = useState<Counter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cacheKey = 'counters-cache-v1';
    const cached = typeof window !== 'undefined' ? sessionStorage.getItem(cacheKey) : null;
    if (cached) {
      setCounters(JSON.parse(cached));
      setLoading(false);
      return;
    }
    const fetchCounters = async () => {
      try {
        const { authFetch } = await import('@/lib/api')
        const response = await authFetch('/api/counters')
        if (!response.ok) {
          throw new Error('Failed to fetch counters')
        }
        const data = await response.json()
        setCounters(data.data || [])
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify(data.data || []));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading counters')
      } finally {
        setLoading(false)
      }
    }
    fetchCounters()
  }, [])

  return { counters, loading, error }
}
