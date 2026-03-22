import { prisma } from '@/lib/prisma'

/**
 * Generate a club-prefixed customer number like "UIF-10001".
 * Uses atomic increment on Club.nextCustomerNumber for concurrency safety.
 */
export async function generateCustomerNumber(clubId: string): Promise<string> {
  const club = await prisma.club.update({
    where: { id: clubId },
    data: { nextCustomerNumber: { increment: 1 } },
  })

  const number = club.nextCustomerNumber - 1
  const prefix = club.prefix || club.slug.toUpperCase()
  return `${prefix}-${number}`
}

/**
 * Reserve a batch of customer numbers for bulk import.
 * Returns the starting number; caller assigns startNumber, startNumber+1, etc.
 */
export async function reserveCustomerNumbers(
  clubId: string,
  count: number
): Promise<{ prefix: string; startNumber: number }> {
  const club = await prisma.club.update({
    where: { id: clubId },
    data: { nextCustomerNumber: { increment: count } },
  })

  const startNumber = club.nextCustomerNumber - count
  const prefix = club.prefix || club.slug.toUpperCase()
  return { prefix, startNumber }
}
