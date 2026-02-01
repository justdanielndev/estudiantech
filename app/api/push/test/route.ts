import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { Client, Databases, Query } from 'node-appwrite'

const getAppwriteAdmin = () => {
  if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
    return null
  }
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)
  return new Databases(client)
}

const DB_ID = process.env.APPWRITE_DB_ID || 'app'
const COLLECTION_ID = process.env.APPWRITE_PUSH_COLLECTION_ID || 'push_subscriptions'

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@slackers.tech',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 })
    }

    const databases = getAppwriteAdmin()
    if (!databases) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 500 })
    }

    const subscriptionsResult = await databases.listDocuments(DB_ID, COLLECTION_ID, [
      Query.limit(100)
    ])

    if (subscriptionsResult.total === 0) {
      return NextResponse.json({ error: 'No subscriptions found' }, { status: 404 })
    }

    const payload = JSON.stringify({
      title: '¡Notificación de prueba!',
      body: 'Las notificaciones push están funcionando correctamente 🎉',
      url: '/configuracion'
    })

    const results = await Promise.allSettled(
      subscriptionsResult.documents.map((doc) => {
        const subscription = {
          endpoint: doc.endpoint,
          keys: {
            p256dh: doc.keys_p256dh,
            auth: doc.keys_auth
          }
        }
        return webpush.sendNotification(subscription, payload)
      })
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    const failedIndices = results
      .map((r, i) => r.status === 'rejected' ? i : -1)
      .filter(i => i !== -1)

    for (const idx of failedIndices) {
      try {
        await databases.deleteDocument(DB_ID, COLLECTION_ID, subscriptionsResult.documents[idx].$id)
      } catch (e) {
      }
    }

    return NextResponse.json({ success: true, sent: successful, failed })
  } catch (error) {
    console.error('[push] Test error:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
