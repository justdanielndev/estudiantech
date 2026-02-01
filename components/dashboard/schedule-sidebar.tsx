"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar, Clock, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ScheduleModal } from "@/components/modals/schedule-modal"
import { TaskModal } from "@/components/modals/task-modal"
import type { ScheduleItem } from "@/lib/types"
import type { Task } from "@/lib/types"
import type { TimetableTask } from "@/app/api/timetable-tasks/route"
import { authFetch } from "@/lib/api"
import { useWeekTimetable } from "@/hooks/useWeekTimetable"
import { useAppContextState } from "@/hooks/useAppContext"

interface ScheduleItemWithSessionId extends ScheduleItem {
  sessionId: string
}

export function ScheduleSidebar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [schedule, setSchedule] = useState<ScheduleItemWithSessionId[]>([])
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [expandedTasks, setExpandedTasks] = useState<Task[]>([])
  const [expandedTasksLoading, setExpandedTasksLoading] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  
  const { context, isReady } = useAppContextState()
  const { fetchWeek, getEventsForDate, isDateInLoadedWeek, loading } = useWeekTimetable()
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  }

  useEffect(() => {
    if (!isReady || !context?.personaId) return
    
    if (!isDateInLoadedWeek(currentDate)) {
      fetchWeek(currentDate, context.personaId)
    }
  }, [currentDate, isReady, context?.personaId, fetchWeek, isDateInLoadedWeek])

  useEffect(() => {
    if (!isReady) return
    
    const dayEvents = getEventsForDate(currentDate)
    const currentTime = new Date()
    const seenIds = new Set<string>()
    
    const scheduleItems: ScheduleItemWithSessionId[] = dayEvents.map((event, index) => {
      const [startHour, startMin] = event.startTime.split(':').map(Number)
      const startDateObj = new Date(currentDate)
      startDateObj.setHours(startHour, startMin, 0)
      
      const [endHour] = event.endTime.split(':').map(Number)
      const isCurrent = 
        currentTime >= startDateObj && 
        currentTime < new Date(startDateObj.getTime() + (endHour - startHour) * 60 * 60000)
      
      let uniqueId = event.id
      if (seenIds.has(event.id)) {
        uniqueId = `${event.id}-${index}`
      }
      seenIds.add(event.id)
      
      return {
        id: uniqueId,
        subject: event.subjectName || event.subjectShortName,
        startTime: event.startTime,
        endTime: event.endTime,
        room: event.className || event.classShortName,
        isBreak: event.isBreak,
        isCurrent,
        subjectColor: event.isBreak ? undefined : '#8B5CF6',
        sessionId: event.sessionId,
      }
    })
    
    setSchedule(scheduleItems)
  }, [currentDate, getEventsForDate, isReady])

  const handlePrevDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 1)
    setCurrentDate(newDate)
  }

  const handleNextDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 1)
    setCurrentDate(newDate)
  }

  const handleItemClick = async (item: ScheduleItemWithSessionId) => {
    if (item.isBreak) return

    if (expandedItemId === item.id) {
      setExpandedItemId(null)
      setExpandedTasks([])
      return
    }

    setExpandedItemId(item.id)
    setExpandedTasksLoading(true)
    
    try {
      const dateStr = currentDate.toISOString().split('T')[0]
      
      const response = await authFetch('/api/timetable-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claseHorarioSesionId: item.sessionId,
          fecha: dateStr
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }

      const data = await response.json()
      const timetableTasks: TimetableTask[] = data.data || []

      const tasks: Task[] = timetableTasks.map((task) => ({
        id: task.id,
        subject: item.subject,
        subjectColor: item.subjectColor,
        title: task.name,
        dueDate: task.fecha.split('T')[0],
        status: task.visto ? 'submitted' : 'pending',
        type: 'homework' as const,
      }))

      setExpandedTasks(tasks)
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setExpandedTasks([])
    } finally {
      setExpandedTasksLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-calendar" />
          <h2 className="text-sm font-semibold text-foreground">Mi agenda</h2>
        </div>
        
        <div className="flex items-center justify-between py-2">
          <Button 
            onClick={handlePrevDay}
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded text-calendar hover:bg-tag-orange"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-foreground capitalize">
            {formatDate(currentDate)}
          </span>
          <Button 
            onClick={handleNextDay}
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded text-calendar hover:bg-tag-orange"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
       
      <div className="space-y-0.5 flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="text-xs text-muted-foreground py-2">Cargando...</div>
        ) : schedule.length === 0 ? (
          <div className="text-xs text-muted-foreground py-2">Sin horario</div>
        ) : (
          schedule.map((item) => (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => handleItemClick(item)}
                disabled={item.isBreak}
                className={cn(
                  "flex items-start gap-3 py-1.5 px-2 rounded transition-colors w-full text-left",
                  item.isBreak ? "cursor-not-allowed" : "cursor-pointer",
                  item.isCurrent && "bg-tag-orange",
                  !item.isCurrent && !item.isBreak && "hover:bg-accent/50",
                  expandedItemId === item.id && "bg-accent/50"
                )}
              >
                <span
                  className={cn(
                    "text-sm tabular-nums font-medium min-w-[42px]",
                    item.isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {item.startTime}
                </span>
                
                <div className="flex-1 min-w-0 flex items-start gap-2">
                  {!item.isBreak && item.subjectColor && (
                    <div
                      className="w-0.5 h-full min-h-[32px] rounded-full flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: item.subjectColor }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm truncate",
                        item.isCurrent ? "font-medium text-foreground" : "text-foreground",
                        item.isBreak && "italic text-muted-foreground"
                      )}
                    >
                      {item.subject}
                    </p>
                    {!item.isBreak && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.room || "Sin aula"}
                      </p>
                    )}
                  </div>
                </div>
                
                {!item.isBreak && (
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform mt-0.5",
                      expandedItemId === item.id && "rotate-180"
                    )}
                  />
                )}
              </button>

              {expandedItemId === item.id && (
                <div className="ml-4 mt-1 space-y-1 border-l border-border/50 pl-2">
                  {expandedTasksLoading ? (
                    <div className="text-xs text-muted-foreground py-1">Cargando...</div>
                  ) : expandedTasks.length === 0 ? (
                    <div className="text-xs text-muted-foreground py-1">Sin tareas</div>
                  ) : (
                    expandedTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="w-full text-left text-xs py-1.5 px-2 rounded hover:bg-accent/50 transition-colors"
                      >
                        <p className="text-foreground truncate font-medium">{task.title}</p>
                        <p className="text-muted-foreground text-[10px]">{task.dueDate}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
       </div>
       
       <div className="flex-shrink-0 pt-3 border-t border-border">
         <a href="/horario">
           <Button 
             variant="ghost" 
             className="w-full justify-start h-8 px-2 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
           >
             <Clock className="h-3.5 w-3.5 mr-2" />
             Horario semanal
           </Button>
         </a>
       </div>

      <ScheduleModal
        item={selectedItem}
        open={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
      />

      <TaskModal
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        onStatusChange={(taskId, newStatus) => {
          setExpandedTasks(prevTasks =>
            prevTasks.map(task =>
              task.id === taskId ? { ...task, status: newStatus } : task
            )
          )
        }}
      />
    </div>
  )
}
