"use client"

import { useState, useEffect } from "react"
import { Settings } from "lucide-react"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileMenu } from "@/components/layout/profile-menu"
import { useAppContextState } from "@/hooks/useAppContext"

export function AppHeader() {
  const { context, userInfo, isReady, profileImage } = useAppContextState()
  const [userName, setUserName] = useState("U")
  const [schoolName, setSchoolName] = useState("Agustinos - Estudiantech")

  const userAvatar = profileImage || userInfo?.avatar || null

  useEffect(() => {
    if (!isReady) return

    if (userInfo?.name) {
      const names = userInfo.name.split(' ')
      const initials = names.map(n => n[0]).join('').substring(0, 2)
      setUserName(initials)
    }

    if (context?.schoolName) {
      setSchoolName(context.schoolName)
    }
  }, [isReady, userInfo, context])

  return (
    <header className="sticky top-0 z-40 flex h-11 items-center justify-between bg-background px-3">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="h-7 w-7 rounded-md" />
        <span className="text-sm text-muted-foreground hidden sm:block">
          {schoolName}
        </span>
      </div>

      <div className="flex items-center gap-0.5">

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 rounded-md text-muted-foreground hover:bg-accent relative"
          onClick={() => {
            window.location.href = '/configuracion';
          }}
        >
          <Settings className="h-4 w-4" />
          <span className="sr-only">Configuración</span>
        </Button>

        <div className="w-px h-4 bg-border mx-1.5" />

        <ProfileMenu>
          <button className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-6 w-6 cursor-pointer">
              {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
              <AvatarFallback className="bg-tag-blue text-[10px] font-medium text-foreground">
                {userName}
              </AvatarFallback>
            </Avatar>
          </button>
        </ProfileMenu>
      </div>
    </header>
  )
}
