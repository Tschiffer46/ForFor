import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { UserRole } from '@prisma/client'

export interface SessionUser {
  id: string
  namn: string
  epost: string
  roll: UserRole
  foreningId: string
  lagId?: string | null
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('forfor-session')
  
  if (!sessionCookie) {
    return null
  }

  try {
    const userId = sessionCookie.value
    const user = await prisma.anvandare.findUnique({
      where: { id: userId },
      select: {
        id: true,
        namn: true,
        epost: true,
        roll: true,
        foreningId: true,
        lagId: true,
      },
    })

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
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

export async function requireAuth(requiredRole?: UserRole) {
  const user = await getCurrentUser()
  
  if (!user) {
    return null
  }

  if (requiredRole && user.roll !== requiredRole) {
    return null
  }

  return user
}

// Mock BankID authentication
export async function authenticateWithBankID() {
  // In a real app, this would integrate with BankID
  // For now, just check if a user with admin role exists
  const user = await prisma.anvandare.findFirst({
    where: {
      roll: UserRole.ADMIN,
    },
  })

  if (!user) {
    throw new Error('Ingen admin-användare hittades')
  }

  await setSession(user.id)
  return user
}

// Mock Magic Link authentication
export async function sendMagicLink(email: string) {
  // In a real app, this would send an email
  // For now, just generate a token and save it
  const user = await prisma.anvandare.findFirst({
    where: {
      epost: email,
      roll: UserRole.TEAM_MEMBER,
    },
  })

  if (!user) {
    throw new Error('Ingen användare hittades med denna e-postadress')
  }

  // Generate a secure random token
  // TODO: In production, use crypto.randomBytes() or crypto.randomUUID() for better security
  const token = Math.random().toString(36).substring(2, 15)
  const expiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  await prisma.anvandare.update({
    where: { id: user.id },
    data: {
      magicLinkToken: token,
      magicLinkExpiry: expiry,
    },
  })

  return token
}

export async function authenticateWithMagicLink(token: string) {
  const user = await prisma.anvandare.findFirst({
    where: {
      magicLinkToken: token,
      magicLinkExpiry: {
        gte: new Date(),
      },
    },
  })

  if (!user) {
    throw new Error('Ogiltig eller utgången länk')
  }

  // Clear the token
  await prisma.anvandare.update({
    where: { id: user.id },
    data: {
      magicLinkToken: null,
      magicLinkExpiry: null,
    },
  })

  await setSession(user.id)
  return user
}
