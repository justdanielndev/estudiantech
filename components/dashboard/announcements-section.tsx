"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Heart, Info, Calendar, Utensils, Users } from "lucide-react"
import { AnnouncementModal } from "@/components/modals/announcement-modal"
import type { Announcement } from "@/lib/types"
import { useI18n } from "@/hooks/useI18n"

const categoryIcons: Record<string, React.ElementType> = {
  activity: Heart,
  info: Info,
  event: Calendar,
  menu: Utensils,
  general: Users,
}

const categoryTags: Record<string, { bg: string; key: string }> = {
  activity: { bg: "bg-tag-pink", key: "dashboard.categories.activity" },
  info: { bg: "bg-tag-blue", key: "dashboard.categories.info" },
  event: { bg: "bg-tag-purple", key: "dashboard.categories.event" },
  menu: { bg: "bg-tag-green", key: "dashboard.categories.menu" },
  general: { bg: "bg-tag-yellow", key: "dashboard.categories.general" },
}

export function AnnouncementsSection() {
  const { t } = useI18n()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)

  useEffect(() => {
    const cacheKey = 'announcements-cache-v1';
    const cached = typeof window !== 'undefined' ? sessionStorage.getItem(cacheKey) : null;
    if (cached) {
      setAnnouncements(JSON.parse(cached));
      setLoading(false);
      return;
    }
    const fetchAnnouncements = async () => {
      try {
        const { authFetch } = await import('@/lib/api')
        const response = await authFetch("/api/announcements")
        if (!response.ok) {
          throw new Error("Failed to fetch announcements")
        }
        const data = await response.json()
        setAnnouncements(data.data || [])
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify(data.data || []));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading announcements")
      } finally {
        setLoading(false)
      }
    }
    fetchAnnouncements()
  }, [])

  if (loading) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          {t('dashboard.announcements')}
        </h2>
        <div className="rounded-md border border-border bg-card p-3 text-xs text-muted-foreground">
          {t('common.loading')}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          {t('dashboard.announcements')}
        </h2>
        <div className="rounded-md border border-border bg-card p-3 text-xs text-destructive">
          {t('common.errorPrefix')} {error}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-3">
        {t('dashboard.announcements')}
        <span className="ml-2 text-muted-foreground font-normal">
          {announcements.length}
        </span>
      </h2>

      {announcements.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {announcements.map((announcement) => {
          const Icon = categoryIcons[announcement.category] || Users
          const tag = categoryTags[announcement.category] || categoryTags.general

          return (
            <button
              type="button"
              key={announcement.id}
              onClick={() => setSelectedAnnouncement(announcement)}
              className="p-2 rounded-md border border-border bg-card cursor-pointer hover:bg-accent/50 transition-colors text-left"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${tag.bg} text-foreground`}>
                  <Icon className="h-3 w-3" />
                  {t(tag.key)}
                </span>
                {announcement.isNew && (
                  <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                )}
              </div>
              
              <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2 leading-snug">
                {announcement.title}
              </h3>
              
              <p className="text-xs text-muted-foreground">
                {announcement.date}
              </p>
            </button>
          )
        })}
        </div>
        ) : (
        <div className="rounded-md border border-border bg-card p-3 text-xs text-muted-foreground text-center">
          {t('dashboard.noAnnouncements')}
        </div>
        )}

        <AnnouncementModal
        announcement={selectedAnnouncement}
        open={!!selectedAnnouncement}
        onOpenChange={(open) => !open && setSelectedAnnouncement(null)}
        />
        </div>
        )
        }
