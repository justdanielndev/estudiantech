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
const COLLECTION_ID = process.env.APPWRITE_PUSH_COLLECTION_ID || 'push_subscriptions'

export async function POST(request: NextRequest) {
  try {
    const { subscription, userId } = await request.json()

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    const databases = getAppwriteAdmin()
    if (!databases) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 500 })
    }

    const existing = await databases.listDocuments(DB_ID, COLLECTION_ID, [
      Query.equal('endpoint', subscription.endpoint)
    ])

    if (existing.total > 0) {
      await databases.updateDocument(DB_ID, COLLECTION_ID, existing.documents[0].$id, {
        keys_p256dh: subscription.keys?.p256dh || '',
        keys_auth: subscription.keys?.auth || '',
        userAgent: request.headers.get('user-agent') || '',
      })
    } else {
      await databases.createDocument(DB_ID, COLLECTION_ID, ID.unique(), {
        userId: userId || 'anonymous',
        endpoint: subscription.endpoint,
        keys_p256dh: subscription.keys?.p256dh || '',
        keys_auth: subscription.keys?.auth || '',
        userAgent: request.headers.get('user-agent') || '',
        createdAt: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[push] Subscribe error:', error)
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
  }
}
