"use client"

import { Clock, MapPin, User } from "lucide-react"
import { Modal } from "@/components/ui-kit/Modal"
import { Badge } from "@/components/ui/badge"
import type { ScheduleItem } from "@/lib/types"
import { useI18n } from "@/hooks/useI18n"

interface ScheduleModalProps {
  item: ScheduleItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ScheduleModal({ item, open, onOpenChange }: ScheduleModalProps) {
  const { t } = useI18n()
  if (!item) return null

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={item.isBreak ? t('modal.break') : item.subject} size="md">
      <Badge variant={item.isBreak ? "secondary" : "default"} className="mb-2 border-0">
        {item.isBreak ? t('modal.breakBadge') : item.subject}
      </Badge>
      <div className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{item.startTime} - {item.endTime}</span>
          </div>
          {!item.isBreak && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{item.room || t('common.noClassroom')}</span>
            </div>
          )}
        </div>
        <div className="border-t pt-4">
          {item.isBreak ? (
            <p className="text-sm text-foreground leading-relaxed">
              {t('modal.breakDescription')}
            </p>
          ) : (
            <>
              <p className="text-sm text-foreground leading-relaxed">
                {t('modal.classDescription', { subject: item.subject })}
              </p>
              <p className="text-sm text-foreground leading-relaxed mt-3">
                {t('modal.classDescription2')}
              </p>
            </>
          )}
        </div>
        {!item.isBreak && (
          <div className="flex items-center gap-2 pt-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{t('modal.professor')} {item.teacher}</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
