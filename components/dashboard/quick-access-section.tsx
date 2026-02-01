"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
  Trophy,
  FileText,
  MessageSquare,
  AlertTriangle,
  Users,
  ClipboardList,
  ChevronRight,
  AlertCircle,
} from "lucide-react"
import type { Counter } from "@/app/api/counters/route"
import type { QuickAccessItem } from "@/lib/types"

const quickAccessItems: QuickAccessItem[] = [
  { id: '1', label: 'Calificaciones', icon: 'trophy', href: '/asignaturas', description: 'No hay calificaciones pendientes' },
  { id: '2', label: 'Circulares', icon: 'file-text', href: '/circulares', description: 'Circulares' },
  { id: '3', label: 'Incidencias', icon: 'alert-triangle', href: '/incidencias', description: 'Sin incidencias' },
  { id: '4', label: 'Entrevistas', icon: 'message-square', href: '/', description: 'Solicitar entrevista' },
  { id: '5', label: 'Reuniones', icon: 'users', href: '/', description: 'Próximas reuniones' },
  { id: '6', label: 'Encuestas', icon: 'clipboard-list', href: '/', description: 'Encuestas disponibles' },
]

import { useAppContextState } from "@/hooks/useAppContext"
import { authFetch } from "@/lib/api"

interface UnreadMark {
  id: string
  fecha: string
  texto: string
  url: string | null
  activo: boolean
  destacado: boolean
}

const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy,
  "file-text": FileText,
  "message-square": MessageSquare,
  "alert-triangle": AlertTriangle,
  users: Users,
  "clipboard-list": ClipboardList,
}

const iconColors: Record<string, string> = {
  trophy: "bg-tag-yellow",
  "file-text": "bg-tag-blue",
  "message-square": "bg-tag-purple",
  "alert-triangle": "bg-tag-red",
  users: "bg-tag-green",
  "clipboard-list": "bg-tag-orange",
}

const COUNTER_TYPE_MAP: Record<number, string> = {
  32: '1',    // calificaciones
  1: '2',     // circulares
  2: '3',     // entrevistas
  64: '4',    // incidencias
  4: '5',     // reuniones
  1024: '6',  // encuestas
}

export function QuickAccessSection() {
  const { context, isReady } = useAppContextState()
  const [counters, setCounters] = useState<Counter[]>([])
  const [itemsWithCounters, setItemsWithCounters] = useState(quickAccessItems)
  const [unreadMarks, setUnreadMarks] = useState<UnreadMark[]>([])

  useEffect(() => {
    if (!isReady || !context?.personaId) return

    const countersCacheKey = 'counters-cache-v1';
    const countersCached = typeof window !== 'undefined' ? sessionStorage.getItem(countersCacheKey) : null;
    if (countersCached) {
      setCounters(JSON.parse(countersCached));
      const countersList = JSON.parse(countersCached);
      const updated = quickAccessItems.map((item) => {
        const counter = countersList.find((c: Counter) => {
          const mappedId = COUNTER_TYPE_MAP[c.TipoElementoResumen]
          return mappedId === item.id
        })
        if (counter && counter.ContadorElementos > 0) {
          return { ...item, badge: counter.ContadorElementos }
        }
        return { ...item, badge: undefined }
      })
      setItemsWithCounters(updated)
    } else {
      const fetchCounters = async () => {
        try {
          const response = await authFetch(`/api/counters?personaId=${context.personaId}`)
          if (!response.ok) throw new Error('Failed to fetch counters')
          const data = await response.json()
          const countersList = data.data || []
          setCounters(countersList)
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(countersCacheKey, JSON.stringify(countersList));
          }
          const updated = quickAccessItems.map((item) => {
            const counter = countersList.find((c: Counter) => {
              const mappedId = COUNTER_TYPE_MAP[c.TipoElementoResumen]
              return mappedId === item.id
            })
            if (counter && counter.ContadorElementos > 0) {
              return { ...item, badge: counter.ContadorElementos }
            }
            return { ...item, badge: undefined }
          })
          setItemsWithCounters(updated)
        } catch (err) {
          console.error('Error fetching counters:', err)
        }
      }
      fetchCounters();
    }

    const marksCacheKey = 'unread-marks-cache-v1';
    const marksCached = typeof window !== 'undefined' ? sessionStorage.getItem(marksCacheKey) : null;
    if (marksCached) {
      setUnreadMarks(JSON.parse(marksCached));
    } else {
      const fetchUnreadMarks = async () => {
        try {
          const response = await authFetch(`/api/unread-marks?PersonaId=${context.personaId}`)
          if (!response.ok) throw new Error('Failed to fetch unread marks')
          const data = await response.json()
          setUnreadMarks(data.data || [])
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(marksCacheKey, JSON.stringify(data.data || []));
          }
        } catch (err) {
          console.error('Error fetching unread marks:', err)
        }
      }
      fetchUnreadMarks();
    }
  }, [isReady, context?.personaId])

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-2">
        Mi espacio
      </h2>

      <div className="rounded-md border border-border bg-card">
        <div className="border-b border-border">
          {unreadMarks.length > 0 ? (
            <div>
              <div className="flex items-center gap-3 px-3 py-2.5 bg-tag-yellow/50 border-b border-border">
                <Trophy className="h-4 w-4 text-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  Calificaciones recientes
                </span>
              </div>
              <div className="divide-y divide-border">
                {unreadMarks.map((mark) => (
                  <div
                    key={mark.id}
                    className="flex items-start gap-3 px-3 py-2.5 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {mark.texto}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(mark.fecha).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-3 py-2.5 bg-tag-yellow/50">
              <Trophy className="h-4 w-4 text-foreground" />
              <span className="text-sm text-foreground">
                No hay calificaciones pendientes de revisar
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-border">
          {itemsWithCounters.map((item) => {
            const Icon = iconMap[item.icon] || FileText
            const colorClass = iconColors[item.icon] || "bg-tag-gray"

            return (
              <Link 
                key={item.id} 
                href={item.href}
                className="flex flex-col items-center gap-2 py-4 px-3 hover:bg-accent/50 transition-colors"
              >
                <div className="relative">
                  <div className={`w-10 h-10 rounded-md ${colorClass} flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-semibold bg-primary text-primary-foreground rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium text-foreground text-center">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
