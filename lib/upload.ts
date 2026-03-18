import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function saveUploadedFile(
  file: File,
  subDir: 'products' | 'clubs'
): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Filtypen stöds inte. Använd JPG, PNG eller WebP.')
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Filen är för stor. Max 5 MB.')
  }

  const dir = path.join(UPLOAD_DIR, subDir)
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filePath = path.join(dir, filename)

  const bytes = await file.arrayBuffer()
  await writeFile(filePath, Buffer.from(bytes))

  // Return the path relative to UPLOAD_DIR for serving via API
  return `${subDir}/${filename}`
}

export function getUploadPath(relativePath: string): string {
  return path.join(UPLOAD_DIR, relativePath)
}
