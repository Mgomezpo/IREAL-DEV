"use client"

import { startOfDay, subDays } from "date-fns"
import { toZonedDate } from "./time"

export type Note = {
  id: string
  title?: string
  content?: string
  created_at?: string
  updated_at?: string
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export type GroupedNotes = {
  label: string
  notes: Note[]
}[]

const BUCKET_ORDER = ["Today", "Yesterday", "Last 7 days", "Last 30 days", "Older"] as const

/**
 * groupNotesByDate
 *
 * Groups notes into date buckets similar to iOS Notes.
 * - Uses the local timezone (or provided one) to avoid UTC/local drift.
 * - Drops empty buckets.
 * - Sorts notes inside each bucket by most recently updated/created.
 *
 * This helper can be reused across list UIs; just pass notes from any source.
 */
export function groupNotesByDate(notes: Note[], opts?: { timeZone?: string }): GroupedNotes {
  const timeZone = opts?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  const now = toZonedDate(new Date(), timeZone)
  const startToday = startOfDay(now)
  const startYesterday = subDays(startToday, 1)
  const startLast7 = subDays(startToday, 7)
  const startLast30 = subDays(startToday, 30)

  const buckets: Record<(typeof BUCKET_ORDER)[number], Note[]> = {
    Today: [],
    Yesterday: [],
    "Last 7 days": [],
    "Last 30 days": [],
    Older: [],
  }

  const dateCache = new WeakMap<Note, number>()

  const getZonedTime = (note: Note): number | null => {
    const raw =
      note.updated_at ||
      note.updatedAt ||
      note.created_at ||
      note.createdAt

    if (!raw) return null
    const parsed = new Date(raw)
    if (Number.isNaN(parsed.getTime())) return null
    const zoned = toZonedDate(parsed, timeZone)
    return zoned.getTime()
  }

  for (const note of notes) {
    const time = getZonedTime(note)
    if (time === null) continue
    dateCache.set(note, time)

    if (time >= startToday.getTime()) {
      buckets.Today.push(note)
    } else if (time >= startYesterday.getTime()) {
      buckets.Yesterday.push(note)
    } else if (time >= startLast7.getTime()) {
      buckets["Last 7 days"].push(note)
    } else if (time >= startLast30.getTime()) {
      buckets["Last 30 days"].push(note)
    } else {
      buckets.Older.push(note)
    }
  }

  return BUCKET_ORDER.reduce<GroupedNotes>((acc, label) => {
    const group = buckets[label]
    if (!group.length) return acc
    group.sort((a, b) => (dateCache.get(b) ?? 0) - (dateCache.get(a) ?? 0))
    acc.push({ label, notes: group })
    return acc
  }, [])
}
