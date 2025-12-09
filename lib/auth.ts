import { auth, currentUser } from '@clerk/nextjs/server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase())

export async function isAdmin(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false

  const user = await currentUser()
  if (!user) return false

  const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase()
  if (!userEmail) return false

  return ADMIN_EMAILS.includes(userEmail)
}

export async function requireAdmin(): Promise<{ userId: string; email: string } | null> {
  const { userId } = await auth()
  if (!userId) return null

  const user = await currentUser()
  if (!user) return null

  const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase()
  if (!userEmail) return null

  if (!ADMIN_EMAILS.includes(userEmail)) return null

  return { userId, email: userEmail }
}
