"use client"

import { useEffect, useState } from "react"
import { Calendar, MapPin, Download, Loader2 } from "lucide-react"
import { Modal } from "@/components/ui-kit/Modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Announcement } from "@/lib/types"
import { authFetch } from "@/lib/api"

interface AnnouncementModalProps {
  announcement: Announcement | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface AnnouncementDetail {
  id: string
  title: string
  content: string
  attachmentUrl?: string
  attachmentName?: string
}

const categoryLabels: Record<string, string> = {
  activity: "Actividad",
  info: "Informacion",
  event: "Evento",
  menu: "Menu",
  general: "General",
}

const categoryColors: Record<string, string> = {
  activity: "bg-tag-pink text-foreground",
  info: "bg-tag-blue text-foreground",
  event: "bg-tag-orange text-foreground",
  menu: "bg-tag-green text-foreground",
  general: "bg-tag-gray text-foreground",
}

export function AnnouncementModal({ announcement, open, onOpenChange }: AnnouncementModalProps) {
  const [detail, setDetail] = useState<AnnouncementDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && announcement) {
      setLoading(true)
      setError(null)
      
      const fetchDetail = async () => {
        try {
          const response = await authFetch(`/api/announcements/${announcement.id}`, {
            method: 'POST'
          })
          
          if (!response.ok) {
            throw new Error("Failed to fetch announcement details")
          }
          
          const data = await response.json()
          setDetail(data.data)
        } catch (err) {
          setError(err instanceof Error ? err.message : "Error loading announcement")
        } finally {
          setLoading(false)
        }
      }
      
      fetchDetail()
    }
  }, [open, announcement])

  if (!announcement) return null

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={announcement.title} size="md">
      <Badge className={`mb-2 ${categoryColors[announcement.category] || categoryColors.general} border-0`}>
        {categoryLabels[announcement.category] || "General"}
      </Badge>
      
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {error && (
        <div className="text-sm text-destructive py-4">
          Error: {error}
        </div>
      )}
      
      {detail && !loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{announcement.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>Colegio</span>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {detail.content}
            </p>
          </div>
          
          {detail.attachmentUrl && (
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                className="flex-1 bg-transparent"
                onClick={async () => {
                  try {
                    const res = await authFetch(`/api/announcement-download?avisoId=${detail.id}`);
                    if (!res.ok) {
                      throw new Error("Error al descargar el archivo");
                    }
                    const blob = await res.blob();
                    let filename = detail.attachmentName || "archivo.bin";
                    const cd = res.headers.get("content-disposition");
                    if (cd) {
                      const match = cd.match(/filename="?([^";]+)"?/);
                      if (match) filename = match[1];
                    }
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                  } catch (err) {
                    alert(err instanceof Error ? err.message : "Error al descargar");
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                {detail.attachmentName || "Descargar adjunto"}
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
