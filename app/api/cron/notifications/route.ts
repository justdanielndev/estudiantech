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
const SCHEDULED_COLLECTION = process.env.APPWRITE_SCHEDULED_NOTIFICATIONS_COLLECTION_ID || 'scheduled_notifications'
const PUSH_COLLECTION = process.env.APPWRITE_PUSH_COLLECTION_ID || 'push_subscriptions'

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@slackers.tech',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

function getTodaySpain(): string {
  const now = new Date()
  const spainTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }))
  return spainTime.toISOString().split('T')[0]
}

function isNineAMSpain(): boolean {
  const now = new Date()
  const spainTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }))
  const hour = spainTime.getHours()
  return hour === 9 || (hour === 8 && spainTime.getMinutes() >= 45)
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 })
    }

    const databases = getAppwriteAdmin()
    if (!databases) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 500 })
    }

    const today = getTodaySpain()
    
    const scheduled = await databases.listDocuments(DB_ID, SCHEDULED_COLLECTION, [
      Query.equal('notifyDate', today),
      Query.equal('notified', false),
      Query.limit(500)
    ])

    if (scheduled.total === 0) {
      return NextResponse.json({ message: 'No notifications to send', today })
    }

    const byUser = new Map<string, typeof scheduled.documents>()
    for (const doc of scheduled.documents) {
      const userId = doc.userId
      if (!byUser.has(userId)) {
        byUser.set(userId, [])
      }
      byUser.get(userId)!.push(doc)
    }

    let sentCount = 0
    let failedCount = 0

    for (const [userId, tasks] of byUser) {
      const subscriptions = await databases.listDocuments(DB_ID, PUSH_COLLECTION, [
        Query.equal('userId', userId),
        Query.limit(10)
      ])

      if (subscriptions.total === 0) continue

      const taskTitles = tasks.map(t => t.title).slice(0, 3)
      const moreCount = tasks.length > 3 ? tasks.length - 3 : 0
      
      const payload = JSON.stringify({
        title: `📅 Hoy tienes ${tasks.length} ${tasks.length === 1 ? 'tarea' : 'tareas'}`,
        body: taskTitles.join(', ') + (moreCount > 0 ? ` y ${moreCount} más` : ''),
        url: '/'
      })

      for (const sub of subscriptions.documents) {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys_p256dh,
              auth: sub.keys_auth
            }
          }, payload)
          sentCount++
        } catch (e: any) {
          failedCount++
          if (e.statusCode === 404 || e.statusCode === 410) {
            try {
              await databases.deleteDocument(DB_ID, PUSH_COLLECTION, sub.$id)
            } catch {}
          }
        }
      }

      for (const task of tasks) {
        try {
          await databases.updateDocument(DB_ID, SCHEDULED_COLLECTION, task.$id, {
            notified: true
          })
        } catch {}
      }
    }

    console.log(`[cron] Notifications sent: ${sentCount} success, ${failedCount} failed, ${scheduled.total} tasks`)

    return NextResponse.json({ 
      success: true, 
      today,
      tasksProcessed: scheduled.total,
      notificationsSent: sentCount,
      failed: failedCount
    })
  } catch (error) {
    console.error('[cron] Notification error:', error)
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 })
  }
}
