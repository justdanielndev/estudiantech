"use client"
import { AnnouncementsSection } from "@/components/dashboard/announcements-section"
import { TasksSection } from "@/components/dashboard/tasks-section"
import { QuickAccessSection } from "@/components/dashboard/quick-access-section"
import { BirthdaysSection } from "@/components/dashboard/birthdays-section"
import { ClearSessionCacheOnLoad } from "@/components/clear-session-cache-on-load"

export default function DashboardPage() {
  return (
    <div className="px-6 py-4 space-y-6">
      <ClearSessionCacheOnLoad />
      <AnnouncementsSection />
      <TasksSection />
      <QuickAccessSection />
      <BirthdaysSection />
    </div>
  )
}
