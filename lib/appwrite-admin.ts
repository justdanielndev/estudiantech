import { Client, Users, Databases, Storage } from 'node-appwrite'

const getAdminClient = () => {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!)
  
  return client
}

export const getAdminServices = () => {
  const client = getAdminClient()
  return {
    users: new Users(client),
    databases: new Databases(client),
    storage: new Storage(client),
    client
  }
}
