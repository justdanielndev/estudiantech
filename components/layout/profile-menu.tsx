"use client"

import { useState, useEffect } from "react"
import { Sparkles, LogOut, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const APP_VERSION = "Versión 2026.02.01-2"

interface UpdateItem {
  version: string
  date: string
  title: string
  items: string[]
}

interface NovedadesData {
  updates: UpdateItem[]
}

interface ProfileMenuProps {
  children: React.ReactNode
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
}

export function ProfileMenu({ children, align = "end", side = "bottom" }: ProfileMenuProps) {
  const [novedadesOpen, setNovedadesOpen] = useState(false)
  const [novedades, setNovedades] = useState<UpdateItem[]>([])
  const [loading, setLoading] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    sessionStorage.clear()
    window.location.href = '/login'
  }

  const handleNovedadesClick = async () => {
    setNovedadesOpen(true)
    setLoading(true)
    try {
      const res = await fetch('/novedades.json')
      const data: NovedadesData = await res.json()
      setNovedades(data.updates || [])
    } catch (err) {
      console.error('Error fetching novedades:', err)
      setNovedades([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent 
          align={align} 
          side={side} 
          sideOffset={8}
          className="w-44 p-1"
        >
          <div className="px-2 py-1.5">
            <span className="text-xs text-muted-foreground">{APP_VERSION}</span>
          </div>
          
          <div className="my-1 h-px bg-border" />
          
          <button
            onClick={handleNovedadesClick}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground hover:bg-accent transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Novedades</span>
          </button>
          
          <div className="my-1 h-px bg-border" />
          
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground hover:bg-accent transition-colors"
          >
            <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Cerrar sesión</span>
          </button>
        </PopoverContent>
      </Popover>

      <Dialog open={novedadesOpen} onOpenChange={setNovedadesOpen}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden" showCloseButton={false}>
          <DialogHeader className="px-4 py-3 border-b border-border bg-secondary">
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
              Novedades
            </DialogTitle>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-3 text-xs text-muted-foreground">Cargando...</div>
            ) : novedades.length === 0 ? (
              <div className="px-4 py-3 text-xs text-muted-foreground text-center">No hay novedades</div>
            ) : (
              <div className="divide-y divide-border">
                {novedades.map((update) => (
                  <div key={update.version} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-tag-purple text-foreground">
                          {update.version}
                        </span>
                        <span className="text-sm font-medium text-foreground">{update.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{update.date}</span>
                    </div>
                    <ul className="space-y-1 ml-0.5">
                      {update.items.map((item, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-muted-foreground mt-1.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="px-4 py-2 bg-secondary/50 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {novedades.length} {novedades.length === 1 ? 'actualización' : 'actualizaciones'}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
