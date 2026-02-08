"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_LANGUAGE, type Language, messages } from '@/lib/i18n'
import { DEMO_TOKEN } from '@/lib/demo-mode'

const SETTINGS_KEY = 'user_settings'

type TranslationValues = Record<string, string | number>

interface I18nContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string, values?: TranslationValues) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function resolveMessage(obj: unknown, path: string): string | null {
  if (!obj || typeof obj !== 'object') return null
  const result = path.split('.').reduce<unknown>((acc, part) => {
    if (!acc || typeof acc !== 'object' || !(part in (acc as Record<string, unknown>))) {
      return null
    }
    return (acc as Record<string, unknown>)[part]
  }, obj)

  return typeof result === 'string' ? result : null
}

function interpolate(template: string, values?: TranslationValues): string {
  if (!values) return template
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, token) => {
    const value = values[token]
    return value === undefined ? '' : String(value)
  })
}

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE
  if (localStorage.getItem('token') === DEMO_TOKEN) return 'en'

  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      const settings = JSON.parse(raw) as { language?: Language }
      if (settings.language === 'es' || settings.language === 'en') {
        return settings.language
      }
    }
  } catch {
  }

  return navigator.language.toLowerCase().startsWith('en') ? 'en' : DEFAULT_LANGUAGE
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE)

  useEffect(() => {
    setLanguageState(getInitialLanguage())
  }, [])

  const setLanguage = useCallback((nextLanguage: Language) => {
    const resolvedLanguage: Language =
      typeof window !== 'undefined' && localStorage.getItem('token') === DEMO_TOKEN
        ? 'en'
        : nextLanguage
    setLanguageState(resolvedLanguage)

    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      const current = raw ? JSON.parse(raw) : {}
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, language: resolvedLanguage }))
    } catch {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ language: resolvedLanguage }))
    }
  }, [])

  const t = useCallback((key: string, values?: TranslationValues) => {
    const active = resolveMessage(messages[language], key)
    if (active) return interpolate(active, values)

    const fallback = resolveMessage(messages[DEFAULT_LANGUAGE], key)
    if (fallback) return interpolate(fallback, values)

    return key
  }, [language])

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
