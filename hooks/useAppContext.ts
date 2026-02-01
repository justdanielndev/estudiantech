'use client'

import { createContext, useContext, useEffect, useState, ReactNode, createElement, useCallback } from 'react'
import { account, storage, isAppwriteConfigured } from '@/lib/appwrite-client'
import { isDemoMode, demoContext, demoCourse, demoUserInfo } from '@/lib/demo-mode'

const APPWRITE_PFP_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_PFP_BUCKET_ID || 'profile-pictures'

interface ContextData {
  cdnUrl: string
  schoolName: string
  logo: string
  variant: string
  roleBase: string
  rolColegioId: string
  calendarId: string
  culture: string
  personaId: string
  personaLanguageId: string
}

interface CourseData {
  schoolPhase: string
  schoolYear: string
}

interface UserInfo {
  name: string
  avatar: string
}

interface AppContextState {
  context: ContextData | null
  course: CourseData | null
  userInfo: UserInfo | null
  profileImage: string | null
  isLoading: boolean
  isReady: boolean
  refreshProfileImage: () => Promise<void>
}

const AppContext = createContext<AppContextState>({
  context: null,
  course: null,
  userInfo: null,
  profileImage: null,
  isLoading: true,
  isReady: false,
  refreshProfileImage: async () => {},
})

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppContextState>({
    context: null,
    course: null,
    userInfo: null,
    profileImage: null,
    isLoading: true,
    isReady: false,
    refreshProfileImage: async () => {},
  })

  const fetchProfileImage = useCallback(async (): Promise<string | null> => {
    if (!isAppwriteConfigured || isDemoMode()) return null
    try {
      const user = await account.get()
      const fileId = user.prefs?.profileImageFileId
      if (fileId) {
        const url = storage.getFilePreview(APPWRITE_PFP_BUCKET_ID, fileId, 200, 200)
        return url.toString()
      }
    } catch (e) {
      console.warn('Could not fetch profile image:', e)
    }
    return null
  }, [])

  const refreshProfileImage = useCallback(async () => {
    const profileImage = await fetchProfileImage()
    setState(prev => ({ ...prev, profileImage }))
  }, [fetchProfileImage])

  useEffect(() => {
    if (isDemoMode()) {
      setState({
        context: demoContext,
        course: demoCourse,
        userInfo: demoUserInfo,
        profileImage: null,
        isLoading: false,
        isReady: true,
        refreshProfileImage,
      })
      return
    }

    const cachedContext = sessionStorage.getItem('appContext')
    const cachedCourse = sessionStorage.getItem('appCourse')
    const cachedUserInfo = sessionStorage.getItem('appUserInfo')

    if (cachedContext && cachedCourse && cachedUserInfo) {
      setState(prev => ({
        ...prev,
        context: JSON.parse(cachedContext),
        course: JSON.parse(cachedCourse),
        userInfo: JSON.parse(cachedUserInfo),
        isLoading: false,
        isReady: true,
        refreshProfileImage,
      }))
      fetchProfileImage().then(profileImage => {
        setState(prev => ({ ...prev, profileImage }))
      })
      return
    }

    const initializeAppContext = async () => {
      try {
        const { authFetch } = await import('@/lib/api')
        const contextResponse = await authFetch('/api/context')
        
        if (contextResponse.status === 401) {
          localStorage.removeItem('token')
          sessionStorage.clear()
          window.location.href = '/login'
          return
        }
        
        if (!contextResponse.ok) throw new Error('Failed to fetch context')
        const contextData = await contextResponse.json()
        const context: ContextData = contextData.data

        const courseResponse = await authFetch('/api/course')
        if (!courseResponse.ok) throw new Error('Failed to fetch course')
        const courseData = await courseResponse.json()
        const course: CourseData = courseData.data

        const userInfoResponse = await authFetch('/api/user-info')
        if (!userInfoResponse.ok) throw new Error('Failed to fetch user info')
        const userInfoData = await userInfoResponse.json()
        const userInfo: UserInfo = userInfoData.data

        sessionStorage.setItem('appContext', JSON.stringify(context))
        sessionStorage.setItem('appCourse', JSON.stringify(course))
        sessionStorage.setItem('appUserInfo', JSON.stringify(userInfo))

        const profileImage = await fetchProfileImage()

        setState({
          context,
          course,
          userInfo,
          profileImage,
          isLoading: false,
          isReady: true,
          refreshProfileImage,
        })
      } catch (err) {
        console.error('Error initializing app context:', err)
        setState(prev => ({ ...prev, isLoading: false }))
      }
    }

    initializeAppContext()
  }, [fetchProfileImage, refreshProfileImage])

  return createElement(AppContext.Provider, { value: state }, children)
}

export function useAppContextState() {
  return useContext(AppContext)
}

export function useAppContext() {
  const { context, isLoading, isReady } = useContext(AppContext)
  return { context, isLoading, isReady }
}

export function getAppContext(): ContextData | null {
  if (typeof window === 'undefined') return null
  const context = sessionStorage.getItem('appContext')
  return context ? JSON.parse(context) : null
}

export function getAppCourse(): CourseData | null {
  if (typeof window === 'undefined') return null
  const course = sessionStorage.getItem('appCourse')
  return course ? JSON.parse(course) : null
}

export function getAppUserInfo(): UserInfo | null {
  if (typeof window === 'undefined') return null
  const userInfo = sessionStorage.getItem('appUserInfo')
  return userInfo ? JSON.parse(userInfo) : null
}
