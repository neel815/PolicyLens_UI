// NOTE: localStorage is used as a backup/cache only.
// Primary data source is the backend DB via /api/policies.
// This will be deprecated once full DB integration is complete.

import { SavedPolicy } from '@/types/analysis'

const STORAGE_KEY = 'policylens_analyses'

export function getSavedPolicies(): SavedPolicy[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function savePolicy(policy: SavedPolicy): void {
  if (typeof window === 'undefined') return
  try {
    const existing = getSavedPolicies()
    const updated = [policy, ...existing]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    console.error('Failed to save policy')
  }
}

export function deletePolicy(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const existing = getSavedPolicies()
    const updated = existing.filter(p => p.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    console.error('Failed to delete policy')
  }
}

export function clearAllPolicies(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
