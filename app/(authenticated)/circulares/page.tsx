'use client'

import { useEffect, useState } from "react"
import { Loader, AlertTriangle, Download } from "lucide-react"
import { useAppContextState } from "@/hooks/useAppContext"
import { authFetch } from "@/lib/api"

interface Circular {
  id: string
  circularId: string
  fecha: string
  asunto: string
  isBold: boolean
  fechaCompleta: Date
}

export default function CircularesPage() {
  const { context, isReady } = useAppContextState()
  const [circulares, setCirculares] = useState<Circular[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    if (!isReady || !context?.personaId) return

    async function fetchCirculares() {
      try {
        setLoading(true)
        const personaId = context!.personaId

        const params = new URLSearchParams({
          personaId: personaId,
        })
        
        const response = await authFetch(`/api/getcirculares?${params}`, {
          method: 'POST'
        })
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        
        const data = await response.json()
        if (data.data && data.data.length > 0) {
          setCirculares(data.data)
          setError(null)
        } else {
          setError('No se encontraron circulares')
        }
      } catch (err) {
        console.error('Error fetching circulares:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar las circulares')
      } finally {
        setLoading(false)
      }
    }

    fetchCirculares()
  }, [isReady, context?.personaId])

  const handleDownload = async (circular: Circular) => {
    try {
      setDownloading(circular.id)
      const params = new URLSearchParams({
        circularId: circular.circularId,
        asunto: circular.asunto,
      })
      
      const response = await authFetch(`/api/download-circular?${params}`)
      
      if (!response.ok) {
        throw new Error(`Download error: ${response.status}`)
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `${circular.asunto.replace(/[^a-z0-9]/gi, '_')}`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";\n]*)"?/i)
        if (match && match[1]) {
          filename = match[1]
        }
      }
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error downloading circular:', err)
      alert('Error al descargar el archivo')
    } finally {
      setDownloading(null)
    }
  }

  const formatDate = (fecha: string) => {
    const [day, month, year] = fecha.split('/')
    return `${day}/${month}/${year}`
  }

  if (loading) {
    return (
      <div className="px-6 py-4 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Cargando circulares...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-sm font-semibold text-foreground">
          Mis Circulares
        </h1>
      </div>
      
      {error && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="rounded-md border border-border bg-card">
        <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-3 py-2 bg-secondary text-xs font-medium text-muted-foreground border-b border-border">
          <span className="w-20">Fecha</span>
          <span>Asunto</span>
          <span className="w-10" />
        </div>

        <div className="divide-y divide-border">
          {circulares.length > 0 ? (
            circulares.map((circular) => (
              <div
                key={circular.id}
                className="grid grid-cols-[auto_1fr_auto] gap-4 px-3 py-3 hover:bg-accent/50 transition-colors items-center w-full text-left"
              >
                <span className="text-sm text-muted-foreground w-20">
                  {formatDate(circular.fecha)}
                </span>

                <div className="min-w-0">
                  <h4 className={`text-sm truncate ${circular.isBold ? 'font-semibold text-foreground' : 'font-normal text-foreground'}`}>
                    {circular.asunto}
                  </h4>
                </div>

                <button
                  onClick={() => handleDownload(circular)}
                  disabled={downloading === circular.id}
                  className="flex items-center justify-center w-10 h-10 rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Descargar"
                >
                  <Download className={`h-4 w-4 text-muted-foreground ${downloading === circular.id ? 'animate-pulse' : ''}`} />
                </button>
              </div>
            ))
          ) : (
            <div className="p-4 text-xs text-muted-foreground text-center">
              No hay circulares disponibles
            </div>
          )}
        </div>

        {circulares.length > 0 && (
          <div className="flex items-center px-3 py-2 bg-secondary/50 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {circulares.length} registros
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
