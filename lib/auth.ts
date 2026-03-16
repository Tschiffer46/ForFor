import { cookies } from 'next/headers'
import { compare } from 'bcrypt'
import { prisma } from './prisma'
import { UserRole } from '@prisma/client'

export interface SessionUser {
  id: string
  name: string
  email: string | null
  username: string
  role: UserRole
  organizationId: string | null
  clubId: string | null
  teamId: string | null
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('forfor-session')

  if (!sessionCookie) return null

  try {
    const user = await prisma.user.findUnique({
      where: { id: sessionCookie.value },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        organizationId: true,
        clubId: true,
        teamId: true,
      },
    })
    return user
  } catch {
    return null
  }
}

export async function setSession(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set('forfor-session', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete('forfor-session')
}

export async function requireAuth(requiredRole?: UserRole): Promise<SessionUser | null> {
  const user = await getCurrentUser()
  if (!user) return null
  if (requiredRole && user.role !== requiredRole) return null
  return user
}

export async function requireOrgAdmin(): Promise<SessionUser | null> {
  return requireAuth(UserRole.ORG_ADMIN)
}

export async function requireClubAdmin(): Promise<SessionUser | null> {
  const user = await getCurrentUser()
  if (!user) return null
  if (user.role !== UserRole.CLUB_ADMIN && user.role !== UserRole.ORG_ADMIN) return null
  return user
}

export async function requireTeamMember(): Promise<SessionUser | null> {
  return getCurrentUser()
}

export async function authenticateWithPassword(username: string, password: string): Promise<SessionUser> {
  const user = await prisma.user.findUnique({
    where: { username },
  })

  if (!user) {
    throw new Error('Felaktigt användarnamn eller lösenord')
  }

  const valid = await compare(password, user.password)
  if (!valid) {
    throw new Error('Felaktigt användarnamn eller lösenord')
  }

  await setSession(user.id)

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    organizationId: user.organizationId,
    clubId: user.clubId,
    teamId: user.teamId,
  }
}
