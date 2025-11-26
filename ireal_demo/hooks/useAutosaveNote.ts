"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type AutosaveStatus = "idle" | "saving" | "saved" | "error"

interface UseAutosaveNoteParams {
  noteId: string
  initialTitle?: string
  initialContent?: string
  debounceMs?: number
  saveNote: (payload: { title: string; content: string }) => Promise<unknown>
}

interface UseAutosaveNoteResult {
  title: string
  content: string
  status: AutosaveStatus
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  setFromServer: (payload: { title?: string; content?: string }) => void
  flush: () => Promise<boolean>
}

/**
 * useAutosaveNote
 *
 * Reusable debounced autosave hook for note-like editors.
 * - Debounces saves to avoid excessive API calls.
 * - Skips saves when the current value matches the last persisted snapshot.
 * - Exposes a tiny status machine: idle → saving → saved/error.
 * - The pattern can be reused in any text area: provide a saveNote function that persists { title, content }.
 */
export function useAutosaveNote({
  noteId,
  initialTitle = "",
  initialContent = "",
  debounceMs = 1200,
  saveNote,
}: UseAutosaveNoteParams): UseAutosaveNoteResult {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [status, setStatus] = useState<AutosaveStatus>("idle")

  const timeoutRef = useRef<NodeJS.Timeout>()
  const pendingRef = useRef<{ title: string; content: string } | null>(null)
  const lastSavedRef = useRef<{ title: string; content: string }>({
    title: initialTitle,
    content: initialContent,
  })
  const mountedRef = useRef(true)

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
  }

  const runSave = useCallback(
    async (payload: { title: string; content: string }) => {
      // Avoid duplicate calls when nothing changed
      if (
        payload.title === lastSavedRef.current.title &&
        payload.content === lastSavedRef.current.content
      ) {
        pendingRef.current = null
        setStatus("saved")
        return true
      }

      setStatus("saving")
      try {
        await saveNote(payload)
        lastSavedRef.current = payload
        if (mountedRef.current) {
          setStatus("saved")
        }
        pendingRef.current = null
        return true
      } catch (err) {
        console.error("[autosave] Failed to save note", err)
        if (mountedRef.current) {
          setStatus("error")
        }
        // keep pending so a later flush can retry
        pendingRef.current = payload
        return false
      }
    },
    [saveNote],
  )

  const flush = useCallback(async () => {
    resetTimer()
    const payload = pendingRef.current
    if (!payload) return true
    return runSave(payload)
  }, [runSave])

  const schedule = useCallback(
    (next: { title: string; content: string }) => {
      pendingRef.current = next
      resetTimer()
      timeoutRef.current = setTimeout(() => {
        void runSave(next)
      }, debounceMs)
    },
    [debounceMs, runSave],
  )

  const onTitleChange = useCallback(
    (value: string) => {
      setTitle(value)
      schedule({ title: value, content })
    },
    [content, schedule],
  )

  const onContentChange = useCallback(
    (value: string) => {
      setContent(value)
      schedule({ title, content: value })
    },
    [schedule, title],
  )

  const setFromServer = useCallback((payload: { title?: string; content?: string }) => {
    const nextTitle = payload.title ?? ""
    const nextContent = payload.content ?? ""
    resetTimer()
    pendingRef.current = null
    lastSavedRef.current = { title: nextTitle, content: nextContent }
    setTitle(nextTitle)
    setContent(nextContent)
    setStatus("saved")
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      resetTimer()
      // Best-effort flush on unmount
      void flush()
    }
  }, [flush])

  useEffect(() => {
    // keep noteId change safe by resetting snapshots
    lastSavedRef.current = { title, content }
    pendingRef.current = null
    setStatus("saved")
  }, [noteId])

  return {
    title,
    content,
    status,
    onTitleChange,
    onContentChange,
    setFromServer,
    flush,
  }
}
