"use client"

import { useState, useEffect, useCallback } from 'react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return new Uint8Array(outputArray.buffer.slice(0));
}

export type PushPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported'

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermissionState>('prompt')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported')
      return
    }

    setPermission(Notification.permission as PushPermissionState)

    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        setRegistration(reg)
        return reg.pushManager.getSubscription()
      })
      .then((sub) => {
        setSubscription(sub)
      })
      .catch((err) => {
        console.error('Service worker registration failed:', err)
        setError('No se pudo registrar el service worker')
      })
  }, [])

  const subscribe = useCallback(async () => {
    if (!registration || !VAPID_PUBLIC_KEY) {
      setError('Notificaciones no configuradas')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await Notification.requestPermission()
      setPermission(result as PushPermissionState)

      if (result !== 'granted') {
        setError('Permiso denegado')
        return false
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })

      setSubscription(sub)

      const userId = typeof window !== 'undefined' ? localStorage.getItem('appwrite_user_id') : null

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), userId })
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription')
      }

      return true
    } catch (err) {
      console.error('Subscribe error:', err)
      setError(err instanceof Error ? err.message : 'Error al suscribirse')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [registration])

  const unsubscribe = useCallback(async () => {
    if (!subscription) return true

    setIsLoading(true)
    setError(null)

    try {
      await subscription.unsubscribe()
      setSubscription(null)

      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      })

      return true
    } catch (err) {
      console.error('Unsubscribe error:', err)
      setError(err instanceof Error ? err.message : 'Error al desuscribirse')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [subscription])

  const sendTestNotification = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/push/test', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to send test notification')
      }

      return true
    } catch (err) {
      console.error('Test notification error:', err)
      setError(err instanceof Error ? err.message : 'Error al enviar notificación')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    permission,
    subscription,
    isSubscribed: !!subscription,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification
  }
}
