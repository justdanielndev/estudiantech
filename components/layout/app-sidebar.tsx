"use client"

import { useState, useEffect } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import * as Collapsible from "@radix-ui/react-collapsible"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Mail,
  FolderOpen,
  BookOpen,
  Home,
  Settings,
  GraduationCap,
  AlertCircle,
  FileText,
  Users,
  ChevronDown,
  ExternalLink
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileMenu } from "@/components/layout/profile-menu"
import { useAppContextState } from "@/hooks/useAppContext"

const officeSubItems = [
  { title: "Inicio de Office", url: "https://sso2.educamos.com/issue/wsfed?wa=wsignin1.0&wtrealm=urn:federation:MicrosoftOnline&wctx=wa%3dwsignin1.0%26wreply%3dhttps%253a%252f%252fwww.office.com%252flaunch%252fteams%26whr%3dstomasdevillanuevavalenciao365.educamos.com", icon: ExternalLink },
  { title: "Correo", url: "https://sso2.educamos.com/issue/wsfed?wa=wsignin1.0&wtrealm=urn:federation:MicrosoftOnline&wctx=wa%3dwsignin1.0%26wreply%3dhttps%253a%252f%252foutlook.office365.com%252fowa%26whr%3dstomasdevillanuevavalenciao365.educamos.com", icon: Mail },
  { title: "Mis documentos", url: "https://sso2.educamos.com/issue/wsfed?wa=wsignin1.0&wtrealm=urn:federation:MicrosoftOnline&wctx=wa%3dwsignin1.0%26wreply%3dhttps%253a%252f%252fstomasdevillanuevavalencia-my.sharepoint.com%252f_layouts%252f15%252fMySite.aspx%253fMySiteRedirect%253dAllDocuments%26whr%3dstomasdevillanuevavalenciao365.educamos.com", icon: FolderOpen },
  { title: "Teams", url: "https://teams.microsoft.com/", icon: Users },
]

const mainNavItems = [
  { title: "Inicio", url: "/", icon: Home },
  { title: "Office 365", icon: GraduationCap, isOfficeDropdown: true },
  { title: "Asignaturas", url: "/asignaturas", icon: BookOpen },
  { title: "Incidencias", url: "/incidencias", icon: AlertCircle },
  { title: "Circulares", url: "/circulares", icon: FileText },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { userInfo, course, isReady, profileImage } = useAppContextState()
  const [userName, setUserName] = useState("Usuario")
  const [userInitials, setUserInitials] = useState("U")
  const [userClass, setUserClass] = useState("")
  const [officeOpen, setOfficeOpen] = useState(false)

  const userAvatar = profileImage || userInfo?.avatar || null

  useEffect(() => {
    if (!isReady) return

    if (userInfo?.name) {
      setUserName(userInfo.name)
      const names = userInfo.name.split(' ')
      const initials = names.map(n => n[0]).join('').substring(0, 2)
      setUserInitials(initials)
    }
    if (course?.schoolYear) {
      setUserClass(course.schoolYear)
    }
  }, [isReady, userInfo, course])

  return (
    <TooltipProvider>
      <Sidebar collapsible="icon" className="border-r border-border">
        <SidebarHeader className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Estudian.tech - Agustinos" className="h-10 rounded-lg group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:px-0">
                <Link href="/" className="group-data-[collapsible=icon]:justify-center">
                  <img src="/icon-light.svg" alt="Agustinos" className="h-6 w-6 shrink-0 dark:hidden" />
                  <img src="/icon.svg" alt="Agustinos" className="h-6 w-6 shrink-0 hidden dark:block" />
                  <div className="group-data-[collapsible=icon]:hidden flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-foreground leading-none">
                      Agustinos
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Estudian.tech
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="px-2 py-2">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {mainNavItems.map((item) => {
                  if ((item as any).isOfficeDropdown) {
                    return (
                      <Collapsible.Root key={item.title} open={officeOpen} onOpenChange={setOfficeOpen}>
                        <SidebarMenuItem>
                          <Collapsible.Trigger asChild>
                            <SidebarMenuButton
                              tooltip={item.title}
                              className="h-8 rounded-lg font-normal text-[14px] hover:bg-accent group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:px-0"
                            >
                              <item.icon className="h-4 w-4 text-muted-foreground shrink-0 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5" />
                              <span className="group-data-[collapsible=icon]:hidden flex-1">{item.title}</span>
                              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ease-in-out group-data-[collapsible=icon]:hidden ${officeOpen ? 'rotate-180' : ''}`} />
                            </SidebarMenuButton>
                          </Collapsible.Trigger>
                          <Collapsible.Content className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1 data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200">
                            <SidebarMenuSub>
                              {officeSubItems.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton asChild>
                                    <a href={subItem.url} target="_blank" rel="noopener noreferrer">
                                      <subItem.icon className="h-4 w-4" />
                                      <span>{subItem.title}</span>
                                    </a>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </Collapsible.Content>
                        </SidebarMenuItem>
                      </Collapsible.Root>
                    )
                  }
                  
                  const isActive = pathname === item.url
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className="h-8 rounded-lg font-normal text-[14px] hover:bg-accent data-[active=true]:bg-accent data-[active=true]:font-medium group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:px-0"
                      >
                        <Link href={item.url!} className="group-data-[collapsible=icon]:justify-center">
                          <item.icon className="h-4 w-4 text-muted-foreground shrink-0 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5" />
                          <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="px-2 py-2">
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Configuración" className="h-8 rounded-lg text-[14px] group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:px-0">
                <Link href="/configuracion" className="group-data-[collapsible=icon]:justify-center">
                  <Settings className="h-4 w-4 text-muted-foreground shrink-0 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">Configuración</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <ProfileMenu align="start" side="top">
                <SidebarMenuButton tooltip={userName} className="h-8 rounded-lg group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
                  <Avatar className="h-6 w-6 shrink-0">
                    {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
                    <AvatarFallback className="bg-tag-blue text-[10px] font-medium text-foreground">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="group-data-[collapsible=icon]:hidden flex flex-col min-w-0">
                    <span className="text-sm font-medium text-foreground truncate leading-none">
                      {userName}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {userClass}
                    </span>
                  </div>
                </SidebarMenuButton>
              </ProfileMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  )
}
