/// <reference types="vitest" />

import { describe, expect, it, beforeAll, afterAll, vi } from "vitest"
import { addDays, subDays } from "date-fns"
import { groupNotesByDate, type Note } from "./notes"

const BASE = new Date("2025-11-25T12:00:00Z") // frozen "now" for deterministic buckets

const makeNote = (id: string, daysAgo: number, updatedMinutesAgo = 0): Note => {
  const updated = subDays(BASE, daysAgo)
  updated.setUTCMinutes(updated.getUTCMinutes() - updatedMinutesAgo)
  const created = addDays(updated, -1)

  return {
    id,
    title: `Note ${id}`,
    updated_at: updated.toISOString(),
    created_at: created.toISOString(),
  }
}

describe("groupNotesByDate", () => {
  beforeAll(() => {
    process.env.TZ = "UTC"
    vi.useFakeTimers()
    vi.setSystemTime(BASE)
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it("groups notes into Today, Yesterday, Last 7 days, Last 30 days, Older with proper ordering", () => {
    const notes: Note[] = [
      makeNote("older-1", 45),
      makeNote("last30-2", 20),
      makeNote("last30-1", 10),
      makeNote("last7-1", 5),
      makeNote("yesterday-1", 1, 5),
      makeNote("today-1", 0, 1),
    ]

    const grouped = groupNotesByDate(notes, { timeZone: "UTC" })

    expect(grouped.map((g) => g.label)).toEqual([
      "Today",
      "Yesterday",
      "Last 7 days",
      "Last 30 days",
      "Older",
    ])

    // each group is sorted desc by updated_at
    expect(grouped.find((g) => g.label === "Today")?.notes.map((n) => n.id)).toEqual(["today-1"])
    expect(grouped.find((g) => g.label === "Yesterday")?.notes.map((n) => n.id)).toEqual(["yesterday-1"])
    expect(grouped.find((g) => g.label === "Last 7 days")?.notes.map((n) => n.id)).toEqual(["last7-1"])
    expect(grouped.find((g) => g.label === "Last 30 days")?.notes.map((n) => n.id)).toEqual([
      "last30-1",
      "last30-2",
    ])
    expect(grouped.find((g) => g.label === "Older")?.notes.map((n) => n.id)).toEqual(["older-1"])
  })

  it("omits empty buckets", () => {
    const notes: Note[] = [
      makeNote("today-1", 0),
      makeNote("last30-1", 15),
    ]

    const grouped = groupNotesByDate(notes, { timeZone: "UTC" })
    const labels = grouped.map((g) => g.label)

    expect(labels).toContain("Today")
    expect(labels).toContain("Last 30 days")
    expect(labels).not.toContain("Yesterday")
    expect(labels).not.toContain("Last 7 days")
    expect(labels).not.toContain("Older")
  })

  it("uses updatedAt fallback to createdAt and preserves sort order", () => {
    const withCreated: Note = {
      id: "created-only",
      title: "Created only",
      created_at: subDays(BASE, 2).toISOString(),
    }
    const withUpdated: Note = {
      id: "updated-only",
      title: "Updated only",
      updated_at: subDays(BASE, 2).toISOString(),
    }

    const grouped = groupNotesByDate([withCreated, withUpdated], { timeZone: "UTC" })
    const last7 = grouped.find((g) => g.label === "Last 7 days")
    expect(last7?.notes.map((n) => n.id)).toEqual(["updated-only", "created-only"])
  })
})
