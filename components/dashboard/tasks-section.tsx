"use client"

import { useState, useEffect } from "react"
import { Circle, CheckCircle2, Clock, AlertCircle, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TaskModal } from "@/components/modals/task-modal"
import type { Task } from "@/lib/types"
import type { TaskItem } from "@/app/api/gettasks/route"
import { useAppContextState } from "@/hooks/useAppContext"
import { authFetch } from "@/lib/api"
import { useI18n } from "@/hooks/useI18n"

export function TasksSection() {
  const { t } = useI18n()
  const statusConfig = {
    pending: { icon: Circle, bg: "bg-tag-gray", label: t('dashboard.statuses.pending') },
    submitted: { icon: Clock, bg: "bg-tag-yellow", label: t('dashboard.statuses.submitted') },
    graded: { icon: CheckCircle2, bg: "bg-tag-green", label: t('dashboard.statuses.graded') },
    overdue: { icon: AlertCircle, bg: "bg-tag-red", label: t('dashboard.statuses.overdue') },
  }
  const today = new Date()
  const defaultStartDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`
  
  const { context, isReady } = useAppContextState()
  const [startDate, setStartDate] = useState(defaultStartDate)
  const [endDate, setEndDate] = useState("")
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showDateFilter, setShowDateFilter] = useState(false)

  const fetchTasks = async (start: string = startDate, end: string = endDate) => {
    if (!context?.personaId) {
      return
    }
    try {

      const response = await authFetch("/api/gettasks", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fechaInicio: start,
          fechaFin: end,
          alumnoId: context.personaId
        })
      })

      if (!response.ok) {
        throw new Error("Failed to fetch tasks")
      }

      const data = await response.json()
      const taskItems: TaskItem[] = data.data || []

      const transformedTasks: Task[] = taskItems.map((item) => ({
        id: item.id,
        subject: item.subject,
        subjectColor: "#8B5CF6",
        title: item.title,
        dueDate: item.dueDate,
        status: item.status,
        type: 'homework',
      }))

      setTasks(transformedTasks)

      const userId = localStorage.getItem('appwrite_user_id')
      if (userId && taskItems.length > 0) {
        const tasksToSync = taskItems.map(item => ({
          id: item.id,
          title: item.title,
          date: item.dueDate.split('/').reverse().join('-'),
          type: 'homework'
        }))
        fetch('/api/push/sync-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, tasks: tasksToSync })
        }).catch(e => console.warn('Failed to sync tasks for notifications:', e))
      }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('tasks-cache-v1', JSON.stringify(transformedTasks));
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading tasks")
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isReady) return
    
    const cacheKey = 'tasks-cache-v1';
    const cached = typeof window !== 'undefined' ? sessionStorage.getItem(cacheKey) : null;
    if (cached) {
      setTasks(JSON.parse(cached));
      setLoading(false);
      return;
    }
    setLoading(true);
    const fetchAndCache = async () => {
      await fetchTasks();
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(cacheKey, JSON.stringify(tasks));
      }
    };
    fetchAndCache();
  }, [isReady])

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground">
            {t('dashboard.tasks')}
          </h2>
        </div>
        <div className="rounded-md border border-border bg-card p-3 text-xs text-muted-foreground">
          {t('common.loading')}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground">
            {t('dashboard.tasks')}
          </h2>
        </div>
        <div className="rounded-md border border-border bg-card p-3 text-xs text-destructive">
          {t('common.errorPrefix')} {error}
        </div>
      </div>
    )
  }

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    const newStart = field === 'start' ? value : startDate
    const newEnd = field === 'end' ? value : endDate
    
    if (field === 'start') {
      setStartDate(value)
    } else {
      setEndDate(value)
    }
    
    setLoading(true)
    fetchTasks(newStart, newEnd)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">
          {t('dashboard.tasks')}
        </h2>
        <Button
          onClick={() => setShowDateFilter(!showDateFilter)}
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
        >
          {t('dashboard.filter')}
          <ChevronDown className={`h-3 w-3 transition-transform ${showDateFilter ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {showDateFilter && (
        <div className="mb-3 p-3 border border-border rounded-md bg-secondary/30 flex gap-2 items-end">
          <div className="flex-1 min-w-0">
            <label className="text-xs text-muted-foreground mb-1 block">{t('dashboard.from')}</label>
            <input
              type="date"
              value={startDate.split('/').reverse().join('-')}
              onChange={(e) => handleDateChange('start', e.target.value.split('-').reverse().join('/'))}
              className="w-full h-7 px-2 text-xs border border-border rounded bg-card text-foreground"
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-xs text-muted-foreground mb-1 block">{t('dashboard.to')}</label>
            <input
              type="date"
              value={endDate ? endDate.split('/').reverse().join('-') : ''}
              onChange={(e) => handleDateChange('end', e.target.value ? e.target.value.split('-').reverse().join('/') : '')}
              className="w-full h-7 px-2 text-xs border border-border rounded bg-card text-foreground"
            />
          </div>
        </div>
      )}

      <div className="rounded-md border border-border bg-card">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-3 py-2 bg-secondary text-xs font-medium text-muted-foreground border-b border-border">
          <span>{t('dashboard.task')}</span>
          <span className="w-24 text-center">{t('dashboard.date')}</span>
          <span className="w-24 text-center">{t('dashboard.status')}</span>
        </div>

        <div className="divide-y divide-border">
          {tasks.length > 0 ? (
            tasks.map((task) => {
              const status = statusConfig[task.status]
              const StatusIcon = status.icon

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="grid grid-cols-[1fr_auto_auto] gap-4 px-3 py-2.5 hover:bg-accent/50 transition-colors cursor-pointer group items-center w-full text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-0.5 h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: task.subjectColor }}
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground mb-0.5">
                        {task.subject}
                      </p>
                      <h4 className="text-sm text-foreground truncate">
                        {task.title}
                      </h4>
                    </div>
                  </div>
                  
                  <span className="text-sm text-muted-foreground w-24 text-center">
                    {task.dueDate}
                  </span>
                  
                  <div className="w-24 flex justify-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${status.bg} text-foreground`}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </span>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-3 text-xs text-muted-foreground text-center">
              {t('dashboard.noPendingTasks')}
            </div>
          )}
        </div>
        
        {tasks.length > 0 && (
          <div className="flex items-center px-3 py-2 bg-secondary/50 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {t('common.recordsCount', { count: tasks.length })}
            </span>
          </div>
        )}
      </div>

      <TaskModal
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        onStatusChange={(taskId, newStatus) => {
          setTasks(prevTasks =>
            prevTasks.map(task =>
              task.id === taskId ? { ...task, status: newStatus } : task
            )
          )
        }}
      />
    </div>
  )
}
