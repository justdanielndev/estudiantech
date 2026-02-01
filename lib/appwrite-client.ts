import { Client, Account, Storage, Databases } from 'appwrite'

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID

const client = new Client()

if (endpoint && projectId) {
  client.setEndpoint(endpoint).setProject(projectId)
} else {
  console.warn('[appwrite] Client not configured bc missing env vars')
}

export const account = new Account(client)
export const storage = new Storage(client)
export const databases = new Databases(client)
export const isAppwriteConfigured = !!(endpoint && projectId)
export { client }
