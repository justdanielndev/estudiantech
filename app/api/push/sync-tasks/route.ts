import { NextRequest, NextResponse } from 'next/server'
import { Client, Databases, ID, Query } from 'node-appwrite'

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
const COLLECTION_ID = process.env.APPWRITE_SCHEDULED_NOTIFICATIONS_COLLECTION_ID || 'scheduled_notifications'

interface Task {
  id: string
  title: string
  date: string
  type?: string
}

export async function POST(request: NextRequest) {
  try {
    const { userId, tasks } = await request.json() as { userId: string; tasks: Task[] }

    if (!userId || !Array.isArray(tasks)) {
      return NextResponse.json({ error: 'userId and tasks array required' }, { status: 400 })
    }

    const databases = getAppwriteAdmin()
    if (!databases) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 500 })
    }

    const existing = await databases.listDocuments(DB_ID, COLLECTION_ID, [
      Query.equal('userId', userId),
      Query.limit(500)
    ])

    const existingTaskIds = new Set(existing.documents.map(doc => doc.taskId))
    const incomingTaskIds = new Set(tasks.map(t => t.id))

    const toAdd = tasks.filter(t => !existingTaskIds.has(t.id))

    const toRemove = existing.documents.filter(doc => !incomingTaskIds.has(doc.taskId))

    for (const task of toAdd) {
      try {
        await databases.createDocument(DB_ID, COLLECTION_ID, ID.unique(), {
          userId,
          taskId: task.id,
          title: task.title,
          notifyDate: task.date,
          type: task.type || 'task',
          notified: false,
          createdAt: new Date().toISOString()
        })
      } catch (e) {
        console.error('[sync-tasks] Failed to add task:', task.id, e)
      }
    }

    for (const doc of toRemove) {
      try {
        await databases.deleteDocument(DB_ID, COLLECTION_ID, doc.$id)
      } catch (e) {
        console.error('[sync-tasks] Failed to remove task:', doc.taskId, e)
      }
    }

    return NextResponse.json({ 
      success: true, 
      added: toAdd.length, 
      removed: toRemove.length 
    })
  } catch (error) {
    console.error('[sync-tasks] Error:', error)
    return NextResponse.json({ error: 'Failed to sync tasks' }, { status: 500 })
  }
}
