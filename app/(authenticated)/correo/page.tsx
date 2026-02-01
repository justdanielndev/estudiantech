import {
  Inbox,
  Send,
  FileText,
  Trash2,
  Star,
  Search,
  Paperclip,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const mailFolders = [
  { icon: Inbox, label: 'Bandeja de entrada', count: 12, active: true },
  { icon: Send, label: 'Enviados', count: 0 },
  { icon: FileText, label: 'Borradores', count: 2 },
  { icon: Star, label: 'Destacados', count: 5 },
  { icon: Trash2, label: 'Papelera', count: 0 },
]

const messages = [
  {
    id: '1',
    from: 'Prof. García',
    subject: 'Recordatorio: Entrega ejercicios derivadas',
    preview:
      'Buenos días, os recuerdo que la fecha límite para entregar los ejercicios del capítulo 5 es...',
    date: 'Hoy',
    isRead: false,
    isStarred: true,
    hasAttachment: true,
  },
  {
    id: '2',
    from: 'Secretaría',
    subject: 'Información viaje de estudios',
    preview:
      'Estimadas familias, les adjuntamos la información completa sobre el viaje de estudios...',
    date: 'Ayer',
    isRead: false,
    isStarred: false,
    hasAttachment: true,
  },
  {
    id: '3',
    from: 'Prof. Martínez',
    subject: 'Notas práctica laboratorio',
    preview:
      'Hola a todos, ya están disponibles las notas de la práctica de laboratorio...',
    date: '23 ene',
    isRead: true,
    isStarred: false,
    hasAttachment: false,
  },
  {
    id: '4',
    from: 'Coordinación',
    subject: 'Horario exámenes febrero',
    preview:
      'Se ha publicado el calendario de exámenes para el mes de febrero. Por favor...',
    date: '20 ene',
    isRead: true,
    isStarred: true,
    hasAttachment: true,
  },
]

export default function MailPage() {
  return (
    <main className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r border-border p-4 hidden md:block">
            <Button className="w-full mb-4">Nuevo mensaje</Button>
            <nav className="space-y-1">
              {mailFolders.map((folder) => (
                <button
                  key={folder.label}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                    folder.active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-secondary'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <folder.icon className="h-4 w-4" />
                    <span>{folder.label}</span>
                  </div>
                  {folder.count > 0 && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs',
                        folder.active && 'bg-primary text-primary-foreground'
                      )}
                    >
                      {folder.count}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar mensajes..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex items-start gap-4 p-4 border-b border-border cursor-pointer hover:bg-secondary/50 transition-colors',
                    !message.isRead && 'bg-primary/5'
                  )}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {message.from
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={cn(
                          'text-sm truncate',
                          !message.isRead
                            ? 'font-semibold text-foreground'
                            : 'text-foreground'
                        )}
                      >
                        {message.from}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {message.date}
                      </span>
                    </div>
                    <p
                      className={cn(
                        'text-sm truncate mb-1',
                        !message.isRead
                          ? 'font-medium text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {message.subject}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {message.preview}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    {message.isStarred && (
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    )}
                    {message.hasAttachment && (
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          </main>
          )
          }
