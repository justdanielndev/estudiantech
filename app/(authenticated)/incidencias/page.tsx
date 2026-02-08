'use client'

import { useEffect, useState } from "react"
import { Loader, CheckCircle2 } from "lucide-react"
import { useAppContextState } from "@/hooks/useAppContext"
import { authFetch } from "@/lib/api"
import { useI18n } from "@/hooks/useI18n"

interface Incidencia {
  id: string
  fecha: string
  hora: string
  materia: string
  clase: string
  tipo: string
  comentarioMateria: string
  comentarioDia: string
  justificacion: string
  fechaCompleta: Date
}

const tipoColors: Record<string, string> = {
  'Ausencia': '#ef4444',
  'Absence': '#ef4444',
  'Retraso': '#f97316',
  'Late': '#f97316',
  'Observaciones': '#eab308',
  'Observations': '#eab308',
  'C. Participa en clase con interés y respeto': '#22c55e',
  'Participates in class with interest and respect': '#22c55e',
  'Conducta': '#f59e0b',
  'Behavior': '#f59e0b',
}

const subjectColors: Record<string, string> = {
  'Matemáticas I': '#22c55e',
  'Mathematics I': '#22c55e',
  'Física y Química': '#ec4899',
  'Física y química': '#ec4899',
  'Physics and Chemistry': '#ec4899',
  'Lengua Castellana y Literatura I': '#f59e0b',
  'Spanish Language and Literature I': '#f59e0b',
  'Valenciano: Lengua y Literatura': '#0d9488',
  'Lengua Extranjera I: Inglés': '#f59e0b',
  'Foreign Language I: English': '#f59e0b',
  'Dibujo Técnico I': '#6366f1',
  'Programación, Redes y Sistemas Informáticos I': '#8b5cf6',
  'Filosofía': '#06b6d4',
  'Philosophy': '#06b6d4',
  'Educación física': '#ec4899',
  'Physical Education': '#ec4899',
  'Religión': '#94a3b8',
  'Recreo': '#64748b',
  'Break': '#64748b',
}

export default function IncidenciasPage() {
  const { t } = useI18n()
  const { context, isReady } = useAppContextState()
  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (!isReady || !context?.personaId) return

    async function fetchIncidencias() {
      try {
        setLoading(true)
        const personaId = context!.personaId

        const params = new URLSearchParams({
          personaId: personaId,
          mostrarPendientesVer: 'false',
          mostrarSoloNoJustificadas: 'false'
        })
        
        const response = await authFetch(`/api/getincidencias?${params}`, {
          method: 'POST'
        })
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        
        const data = await response.json()
        if (data.data && data.data.length > 0) {
          setIncidencias(data.data)
          setError(null)
        } else {
          
        }
      } catch (err) {
        console.error('Error fetching incidents:', err)
        setError(err instanceof Error ? err.message : t('pages.loadingIncidents'))
      } finally {
        setLoading(false)
      }
    }

    fetchIncidencias()
  }, [isReady, context?.personaId])

  const filteredIncidencias = filter === 'all' 
    ? incidencias 
    : incidencias.filter(inc => inc.tipo === filter)

  const uniqueTipos = Array.from(new Set(incidencias.map(inc => inc.tipo)))

  const isJustified = (inc: Incidencia) => !!inc.justificacion && inc.justificacion.trim() !== ''

  const formatDate = (fecha: string) => {
    const [day, month, year] = fecha.split('/')
    return `${day}/${month}/${year}`
  }

  if (loading) {
    return (
      <div className="px-6 py-4 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t('pages.loadingIncidents')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-sm font-semibold text-foreground">
          {t('pages.incidentsTitle')}
        </h1>
      </div>
      
      {error && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="rounded-md border border-border bg-card">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-3 py-2 bg-secondary text-xs font-medium text-muted-foreground border-b border-border">
          <span>{t('pages.incident')}</span>
          <span className="w-20 text-center">{t('pages.hour')}</span>
          <span className="w-20 text-center">{t('pages.incidentType')}</span>
          <span className="w-20 text-center">{t('dashboard.status')}</span>
        </div>

        <div className="divide-y divide-border">
          {filteredIncidencias.length > 0 ? (
            filteredIncidencias.map((incidencia) => {
              const isJust = isJustified(incidencia)
              const hasContent = incidencia.comentarioMateria || incidencia.comentarioDia
              return (
                <div key={incidencia.id}>
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-3 py-2.5 hover:bg-accent/50 transition-colors group items-center w-full text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-0.5 h-8 rounded-full flex-shrink-0"
                        style={{ backgroundColor: subjectColors[incidencia.materia] || '#64748b' }}
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground mb-0.5">
                          {formatDate(incidencia.fecha)}
                        </p>
                        <h4 className="text-sm text-foreground truncate">
                          {incidencia.materia}
                        </h4>
                      </div>
                    </div>

                    <span className="text-sm text-muted-foreground w-20 text-center">
                      {incidencia.hora}
                    </span>

                    <div className="w-20 flex justify-center">
                      <span 
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: tipoColors[incidencia.tipo] || '#64748b' }}
                      >
                        {incidencia.tipo === 'C. Participa en clase con interés y respeto' || incidencia.tipo === 'Participates in class with interest and respect'
                          ? t('pages.positive')
                          : incidencia.tipo.substring(0, 8)}
                      </span>
                    </div>

                    <div className="w-20 flex justify-center">
                      {isJust ? (
                        <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>

                  {hasContent && (
                    <div className="bg-secondary/30 px-3 py-3 border-t border-border/50 space-y-2">
                      {incidencia.comentarioMateria && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">{t('pages.subjectComment')}</p>
                          <p className="text-sm text-foreground">{incidencia.comentarioMateria}</p>
                        </div>
                      )}
                      {incidencia.comentarioDia && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">{t('pages.dayComment')}</p>
                          <p className="text-sm text-foreground">{incidencia.comentarioDia}</p>
                        </div>
                      )}
                      {incidencia.justificacion && (
                        <div>
                          <p className="text-xs font-medium text-green-600 mb-1">{t('pages.justification')}</p>
                          <p className="text-sm text-foreground">{incidencia.justificacion}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="p-4 text-xs text-muted-foreground text-center">
              {filter === 'all' 
                ? t('pages.noIncidents')
                : t('pages.noIncidentsOfType')}
            </div>
          )}
        </div>

        {incidencias.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 bg-secondary/50 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {t('common.recordsCount', { count: filteredIncidencias.length })} {filter !== 'all' && `(${filter})`}
            </span>
            {incidencias.length > 0 && (
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-xs bg-card border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">{t('pages.all')} ({incidencias.length})</option>
                {uniqueTipos.map(tipo => (
                  <option key={tipo} value={tipo}>
                    {tipo} ({incidencias.filter(inc => inc.tipo === tipo).length})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
