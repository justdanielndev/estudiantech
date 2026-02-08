
"use client"

import { useState, useEffect } from "react"
import { Calendar, FileText, CheckCircle2, X } from "lucide-react"
import { Modal } from "@/components/ui-kit/Modal"
import { Button } from "@/components/ui/button"
import type { Task } from "@/lib/types"
import { useAppContextState } from "@/hooks/useAppContext"
import { authFetch } from "@/lib/api"
import { useI18n } from "@/hooks/useI18n"

interface TaskDetail {
  description: string
  professor?: string
}

interface TaskModalProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange?: (taskId: string, newStatus: 'pending' | 'submitted' | 'graded' | 'overdue') => void
}

export function TaskModal({ task, open, onOpenChange, onStatusChange }: TaskModalProps) {
  const { t } = useI18n()
  const { context, isReady } = useAppContextState()
  const [isLoading, setIsLoading] = useState(false)
  const [taskStatus, setTaskStatus] = useState<'pending' | 'submitted' | 'graded' | 'overdue'>(task?.status || 'pending')
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  useEffect(() => {
    if (task && open && isReady && context?.personaId) {
      setTaskStatus(task.status)
      fetchTaskDetail()
    }
  }, [task, open, isReady, context?.personaId])

  const fetchTaskDetail = async () => {
    if (!task || !context?.personaId) return
    
    setIsLoadingDetail(true)
    try {

      const response = await authFetch('/api/task-detail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idSeleccion: task.id,
          alumnoPersonaId: context.personaId,
          leida: 'True'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setTaskDetail(data.data)
      }
    } catch (err) {
      console.error('Error fetching task detail:', err)
    } finally {
      setIsLoadingDetail(false)
    }
  }

  if (!task) return null

  const isCompleted = taskStatus === 'submitted'

  const handleToggleStatus = async () => {
    setIsLoading(true)
    try {
      const response = await authFetch('/api/change-task-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tareaId: task.id,
          visto: (!isCompleted).toString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update task status')
      }

      const newStatus = isCompleted ? 'pending' : 'submitted'
      setTaskStatus(newStatus)
      
      if (onStatusChange) {
        onStatusChange(task.id, newStatus)
      }
    } catch (err) {
      console.error('Error updating task status:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={task.title} size="md">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{t('modal.dueDate')}</span>
              </div>
              <span className="font-medium text-foreground">{task.dueDate}</span>
            </div>
            
            {taskDetail?.professor && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span>{t('modal.professor')}</span>
                </div>
                <span className="font-medium text-foreground">{taskDetail.professor}</span>
              </div>
            )}
            
            {isLoadingDetail ? (
              <div className="border rounded-lg p-4 bg-muted/30">
                <p className="text-sm text-muted-foreground">{t('modal.loadingDescription')}</p>
              </div>
            ) : taskDetail?.description ? (
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t('modal.description')}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {taskDetail.description}
                </p>
              </div>
            ) : null}
            
            <div className="flex pt-2">
              <Button 
                onClick={handleToggleStatus}
                disabled={isLoading}
                className="flex-1"
              >
                {isCompleted ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    {t('modal.markIncomplete')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {t('modal.markComplete')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
