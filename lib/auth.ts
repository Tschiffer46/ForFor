import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
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

interface SessionData {
  userId?: string
}

const sessionOptions = {
  password: process.env.FORFOR_SESSION_SECRET || 'CHANGE-ME-SET-FORFOR_SESSION_SECRET-IN-ENV-32CHARS',
  cookieName: 'forfor-session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
}

async function getSession() {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession()

  if (!session.userId) return null

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
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
  const session = await getSession()
  session.userId = userId
  await session.save()
}

export async function clearSession() {
  const session = await getSession()
  session.destroy()
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
