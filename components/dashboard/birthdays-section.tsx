"use client"

import { useEffect, useState } from "react"
import { Cake } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Birthday } from "@/lib/types"
import { authFetch } from "@/lib/api"
import { useI18n } from "@/hooks/useI18n"

export function BirthdaysSection() {
  const { t } = useI18n()
  const [birthdays, setBirthdays] = useState<Birthday[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cacheKey = 'birthdays-cache-v1';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userCacheKey = token ? `${cacheKey}-${token}` : cacheKey;
    const cached = typeof window !== 'undefined' ? localStorage.getItem(userCacheKey) : null;
    if (cached) {
      setBirthdays(JSON.parse(cached));
      setLoading(false);
      return;
    }
    const fetchBirthdays = async () => {
      try {
        const response = await authFetch("/api/birthdays");
        if (!response.ok) {
          throw new Error("Failed to fetch birthdays");
        }
        const data = await response.json();
        setBirthdays(data.data || data);
        if (typeof window !== 'undefined') {
          localStorage.setItem(userCacheKey, JSON.stringify(data.data || data));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading birthdays");
      } finally {
        setLoading(false);
      }
    };
    fetchBirthdays();
  }, [])

  if (loading) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-2">
          {t('dashboard.whoHasBirthday')}
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
        <h2 className="text-sm font-semibold text-foreground mb-2">
          {t('dashboard.whoHasBirthday')}
        </h2>
        <div className="rounded-md border border-border bg-card p-3 text-xs text-destructive">
          {t('common.errorPrefix')} {error}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-2">
        {t('dashboard.whoHasBirthday')}
      </h2>

      <div className="rounded-md border border-border bg-card divide-y divide-border">
        {birthdays.length > 0 ? (
          birthdays.map((birthday) => (
            <div
              key={birthday.id}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/50 transition-colors"
            >
              <Avatar className="h-7 w-7">
                {birthday.avatar && <AvatarImage src={birthday.avatar} alt={birthday.name} />}
                <AvatarFallback className="bg-tag-pink text-[10px] font-medium text-foreground">
                  {birthday.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {birthday.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {birthday.class}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-tag-pink text-foreground">
                <Cake className="h-3 w-3" />
                {birthday.date}
              </span>
            </div>
          ))
        ) : (
          <div className="p-3 text-xs text-muted-foreground text-center">
            {t('dashboard.noBirthdays')}
          </div>
        )}
      </div>
    </div>
  )
}
