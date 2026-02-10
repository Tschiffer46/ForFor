import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return `${amount} kr`
}

export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('sv-SE')
}
