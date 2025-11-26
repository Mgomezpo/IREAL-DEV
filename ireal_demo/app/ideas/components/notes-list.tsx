"use client"

import { format, isToday, isYesterday } from "date-fns"
import { ArrowRight, Trash2, Wand2 } from "lucide-react"
import type { GroupedNotes, Note } from "@/lib/notes"
import { toZonedDate } from "@/lib/time"

interface NotesListProps {
  groups: GroupedNotes
  onSelect: (note: Note) => void
  timeZone?: string
  onDelete?: (note: Note) => void
  onConvert?: (note: Note) => void
}

const getPrimaryTimestamp = (note: Note, timeZone: string) => {
  const raw = note.updated_at || note.updatedAt || note.created_at || note.createdAt
  if (!raw) return ""
  const date = toZonedDate(new Date(raw), timeZone)
  if (isToday(date)) return format(date, "HH:mm")
  if (isYesterday(date)) return "Ayer"
  return format(date, "LLL d")
}

const getPreview = (note: Note) => {
  const text = (note.content || note.title || "").trim()
  if (!text) return "Sin contenido"
  return text.length > 140 ? `${text.slice(0, 137)}…` : text
}

/**
 * NotesList
 *
 * Renders grouped notes in an iOS-like list. To add/change sections, adjust the labels
 * and ordering in `groupNotesByDate`. This component simply renders whatever groups it receives.
 */
export function NotesList({ groups, onSelect, onDelete, onConvert, timeZone }: NotesListProps) {
  const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.label} className="space-y-3">
          <header className="px-2 text-xs font-semibold uppercase tracking-wide text-black/50">
            {group.label}
          </header>
          <div className="overflow-hidden rounded-2xl border border-black/5 bg-white/70 shadow-sm">
            {group.notes.map((note, idx) => {
              const isLast = idx === group.notes.length - 1
              return (
                <button
                  key={note.id}
                  onClick={() => onSelect(note)}
                  className={`group flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white ${
                    !isLast ? "border-b border-black/5" : ""
                  }`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="flex-1 text-base font-semibold text-black">{note.title || "Nota sin título"}</p>
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 text-xs text-black/50">{getPrimaryTimestamp(note, tz)}</span>
                        {(onDelete || onConvert) && (
                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            {onConvert && (
                              <span
                                role="button"
                                tabIndex={-1}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onConvert(note)
                                }}
                                className="rounded-md p-1 text-black/60 hover:bg-black/10"
                                title="Vincular plan"
                              >
                                <Wand2 className="h-3.5 w-3.5" />
                              </span>
                            )}
                            {onDelete && (
                              <span
                                role="button"
                                tabIndex={-1}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDelete(note)
                                }}
                                className="rounded-md p-1 text-[var(--accent-600)] hover:bg-[var(--accent-600)]/10"
                                title="Eliminar"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-black/60 line-clamp-2">{getPreview(note)}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-black/30" aria-hidden />
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
