'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { ScheduleSidebar } from '@/components/dashboard/schedule-sidebar'
import { AppContextProvider } from '@/hooks/useAppContext'
import { WeekTimetableProvider } from '@/hooks/useWeekTimetable'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <AppContextProvider>
      <WeekTimetableProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <div className="flex flex-1 min-h-0 overflow-hidden max-h-[calc(100vh-45px)]">
            <main className="flex-1 px-6 py-4 overflow-auto">
              {children}
            </main>
            <aside className="hidden xl:flex flex-col w-[280px] border-l border-border px-4 py-4 flex-shrink-0 overflow-hidden max-h-[calc(100vh-45px)]">
              <ScheduleSidebar />
            </aside>
          </div>
        </SidebarInset>
      </SidebarProvider>
      </WeekTimetableProvider>
    </AppContextProvider>
  )
}
