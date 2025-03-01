import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function clg(...inputs: any[]) {
  if (process.env.NODE_ENV !== 'development') return;
  console.log(...inputs)
}