import { NextRequest, NextResponse } from 'next/server'
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

export async function POST(request: NextRequest) {
  try {
    const { endpoint } = await request.json()

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 })
    }

    const databases = getAppwriteAdmin()
    if (!databases) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 500 })
    }

    const existing = await databases.listDocuments(DB_ID, COLLECTION_ID, [
      Query.equal('endpoint', endpoint)
    ])

    if (existing.total > 0) {
      await databases.deleteDocument(DB_ID, COLLECTION_ID, existing.documents[0].$id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[push] Unsubscribe error:', error)
    return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 })
  }
}
