"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { useAppContextState } from "@/hooks/useAppContext"
import { useWeekTimetable } from "@/hooks/useWeekTimetable"
import type { WeekCalendarEvent } from "@/app/api/week-calendar/route"
import { useI18n } from "@/hooks/useI18n"

const SUBJECT_COLORS = [
  'bg-[var(--tag-blue)]',
  'bg-[var(--tag-green)]',
  'bg-[var(--tag-purple)]',
  'bg-[var(--tag-yellow)]',
  'bg-[var(--tag-pink)]',
  'bg-[var(--tag-orange)]',
  'bg-[var(--tag-brown)]',
  'bg-[var(--tag-red)]',
]

function getSubjectColor(shortName: string, allSubjects: string[]): string {
  const idx = allSubjects.indexOf(shortName)
  if (idx === -1) return 'bg-[var(--tag-gray)]'
  return SUBJECT_COLORS[idx % SUBJECT_COLORS.length]
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDateRange(start: string, end: string, locale: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const startDay = startDate.getDate()
  const endDay = endDate.getDate()
  const month = startDate.toLocaleDateString(locale, { month: 'long' })
  return locale === 'en-US' ? `${startDay} - ${endDay} ${month}` : `${startDay} - ${endDay} de ${month}`
}

export default function HorarioPage() {
  const { t, language } = useI18n()
  const daysOfWeek = language === 'en'
    ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    : ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"]
  const { context, isReady } = useAppContextState()
  const { events, weekStart, weekEnd, loading, error, fetchWeek } = useWeekTimetable()
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMondayOfWeek(new Date()))

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      if (navEntries.length > 0 && navEntries[0].type === 'reload') {
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('week-calendar-')) {
            sessionStorage.removeItem(key)
          }
        })
      }
    }
  }, [])

  useEffect(() => {
    if (!isReady || !context?.personaId) return
    fetchWeek(currentWeekStart, context.personaId)
  }, [currentWeekStart, isReady, context?.personaId, fetchWeek])

  const handlePrevWeek = () => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentWeekStart(newDate)
  }

  const handleNextWeek = () => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentWeekStart(newDate)
  }

  const handleToday = () => {
    setCurrentWeekStart(getMondayOfWeek(new Date()))
  }

  const allSubjects = useMemo(() => {
    const unique = new Set<string>()
    events.forEach(e => {
      if (!e.isBreak) unique.add(e.subjectShortName || e.subjectName)
    })
    return Array.from(unique).sort()
  }, [events])

  const eventsByDay = useMemo(() => {
    const grouped: Record<number, WeekCalendarEvent[]> = {}
    for (let i = 1; i <= 5; i++) {
      grouped[i] = []
    }
    events.forEach(event => {
      if (event.dayOfWeek >= 1 && event.dayOfWeek <= 5) {
        grouped[event.dayOfWeek].push(event)
      }
    })
    return grouped
  }, [events])

  const timeSlots = useMemo(() => {
    const slots = new Set<string>()
    events.forEach(event => {
      slots.add(event.startTime)
    })
    return Array.from(slots).sort()
  }, [events])

  const isToday = (dayOfWeek: number): boolean => {
    const today = new Date()
    const dayIndex = today.getDay()
    const todayDayOfWeek = dayIndex === 0 ? 7 : dayIndex
    const todayMonday = getMondayOfWeek(today)
    return todayDayOfWeek === dayOfWeek && 
           todayMonday.getTime() === currentWeekStart.getTime()
  }

  const getDayDate = (dayOfWeek: number): string => {
    const date = new Date(currentWeekStart)
    date.setDate(date.getDate() + dayOfWeek - 1)
    return date.getDate().toString()
  }

  return (
    <div className="px-6 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{t('pages.scheduleWeekly')}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('pages.today')}
          </button>
          <div className="flex items-center">
            <button
              onClick={handlePrevWeek}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs text-muted-foreground min-w-[120px] text-center">
              {weekStart && weekEnd ? formatDateRange(weekStart, weekEnd, language === 'en' ? 'en-US' : 'es-ES') : '...'}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-md border border-border bg-card p-3 text-xs text-muted-foreground">
          {t('pages.loadingSchedule')}
        </div>
      ) : error ? (
        <div className="rounded-md border border-border bg-card p-3 text-xs text-destructive">
          {error}
        </div>
      ) : (
        <div className="rounded-md border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-[50px_repeat(5,1fr)] bg-secondary border-b border-border">
            <div className="p-2 flex items-center justify-center border-r border-border">
              <Clock className="h-3 w-3 text-muted-foreground" />
            </div>
            {[1, 2, 3, 4, 5].map(day => (
              <div
                key={day}
                className={`p-2 text-center border-r border-border last:border-r-0 ${
                  isToday(day) ? 'bg-primary/10' : ''
                }`}
              >
                <div className={`text-[10px] font-medium uppercase ${
                  isToday(day) ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {daysOfWeek[day - 1]}
                </div>
                <div className={`text-sm font-semibold ${
                  isToday(day) ? 'text-primary' : 'text-foreground'
                }`}>
                  {getDayDate(day)}
                </div>
              </div>
            ))}
          </div>

          <div className="divide-y divide-border">
            {timeSlots.map(time => {
              const eventsAtTime: (WeekCalendarEvent | null)[] = [1, 2, 3, 4, 5].map(day => {
                const dayEvents = eventsByDay[day] || []
                return dayEvents.find(e => e.startTime === time) || null
              })

              return (
                <div key={time} className="grid grid-cols-[50px_repeat(5,1fr)]">
                  <div className="p-2 border-r border-border flex items-center justify-center bg-secondary/30">
                    <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                      {time}
                    </span>
                  </div>
                  {eventsAtTime.map((event, idx) => (
                    <div
                      key={`${time}-${idx}`}
                      className={`p-1 border-r border-border last:border-r-0 min-h-[70px] ${
                        isToday(idx + 1) ? 'bg-primary/5' : ''
                      }`}
                    >
                      {event && (
                        event.isBreak ? (
                          <div className="h-full rounded-md p-2 bg-[var(--tag-gray)] flex items-center justify-center">
                            <span className="text-[10px] text-muted-foreground">{t('pages.break')}</span>
                          </div>
                        ) : (
                          <div className={`h-full rounded-md p-2 ${getSubjectColor(event.subjectShortName || event.subjectName, allSubjects)} hover:opacity-90 transition-opacity cursor-default`}>
                            <div className="text-xs font-semibold text-foreground leading-tight">
                              {event.subjectShortName || event.subjectName}
                            </div>
                            <div className="text-[10px] text-foreground/60 mt-0.5">
                              {event.startTime} - {event.endTime}
                            </div>
                            {(event.hasExam || event.hasTasks) && (
                              <div className="flex gap-1 mt-1.5 flex-wrap">
                                {event.hasExam && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-500 text-white">
                                    {t('pages.exam')}
                                  </span>
                                )}
                                {event.hasTasks && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-orange-500 text-white">
                                    {t('pages.homework')}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between px-3 py-2 bg-secondary/50 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {t('pages.classesCount', { count: events.filter(e => !e.isBreak).length })}
            </span>
            {events.filter(e => e.isBreak).length > 0 && (
              <span className="text-xs text-muted-foreground">
                {t('pages.breakRange', { start: events.filter(e => e.isBreak)[0]?.startTime ?? '', end: events.filter(e => e.isBreak)[0]?.endTime ?? '' })}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
