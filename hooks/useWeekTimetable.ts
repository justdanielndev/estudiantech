'use client'

import { createContext, useContext, useState, useCallback, ReactNode, createElement } from 'react'
import { authFetch } from '@/lib/api'
import type { WeekCalendarEvent, WeekCalendarResponse } from '@/app/api/week-calendar/route'

interface WeekTimetableState {
  events: WeekCalendarEvent[]
  weekStart: string
  weekEnd: string
  loading: boolean
  error: string | null
  currentMondayKey: string | null
}

interface WeekTimetableContextValue extends WeekTimetableState {
  fetchWeek: (mondayDate: Date, personaId: string) => Promise<void>
  getEventsForDate: (date: Date) => WeekCalendarEvent[]
  isDateInLoadedWeek: (date: Date) => boolean
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getDayOfWeekFromDate(date: Date): number {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

const WeekTimetableContext = createContext<WeekTimetableContextValue | null>(null)

export function WeekTimetableProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WeekTimetableState>({
    events: [],
    weekStart: '',
    weekEnd: '',
    loading: false,
    error: null,
    currentMondayKey: null,
  })

  const fetchWeek = useCallback(async (mondayDate: Date, personaId: string) => {
    const mondayKey = formatDateKey(getMondayOfWeek(mondayDate))
    
    if (state.currentMondayKey === mondayKey && state.events.length > 0) {
      return
    }

    const cacheKey = `week-calendar-${mondayKey}`
    const cached = typeof window !== 'undefined' ? sessionStorage.getItem(cacheKey) : null
    
    if (cached) {
      const data: WeekCalendarResponse = JSON.parse(cached)
      setState({
        events: data.events,
        weekStart: data.weekStart,
        weekEnd: data.weekEnd,
        loading: false,
        error: null,
        currentMondayKey: mondayKey,
      })
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await authFetch('/api/week-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaId,
          fechaHoy: mondayKey,
          diaSemanaInicio: 1,
          diaSemanaFin: 7
        })
      })

      if (!response.ok) throw new Error('Failed to fetch week calendar')
      
      const result = await response.json()
      const data: WeekCalendarResponse = result.data

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(cacheKey, JSON.stringify(data))
      }

      setState({
        events: data.events,
        weekStart: data.weekStart,
        weekEnd: data.weekEnd,
        loading: false,
        error: null,
        currentMondayKey: mondayKey,
      })
    } catch (err) {
      console.error('Error fetching week calendar:', err)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'No se pudo cargar el horario',
      }))
    }
  }, [state.currentMondayKey, state.events.length])

  const isDateInLoadedWeek = useCallback((date: Date): boolean => {
    if (!state.currentMondayKey) return false
    const mondayOfDate = getMondayOfWeek(date)
    return formatDateKey(mondayOfDate) === state.currentMondayKey
  }, [state.currentMondayKey])

  const getEventsForDate = useCallback((date: Date): WeekCalendarEvent[] => {
    const dayOfWeek = getDayOfWeekFromDate(date)
    return state.events.filter(e => e.dayOfWeek === dayOfWeek)
  }, [state.events])

  const value: WeekTimetableContextValue = {
    ...state,
    fetchWeek,
    getEventsForDate,
    isDateInLoadedWeek,
  }

  return createElement(WeekTimetableContext.Provider, { value }, children)
}

export function useWeekTimetable() {
  const context = useContext(WeekTimetableContext)
  if (!context) {
    throw new Error('useWeekTimetable must be used within a WeekTimetableProvider')
  }
  return context
}
