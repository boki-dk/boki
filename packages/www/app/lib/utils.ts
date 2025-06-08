import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const currencyFormatter = new Intl.NumberFormat('da-DK', {
  style: 'currency',
  currency: 'DKK',
})

export const shortCurrencyFormatter = new Intl.NumberFormat('da-DK', {
  notation: 'compact',
  currency: 'DKK',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
  style: 'currency',
})
