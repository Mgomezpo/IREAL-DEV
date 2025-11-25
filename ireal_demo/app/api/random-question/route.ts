import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "..", "PreguntasRick.txt")
    const raw = await fs.readFile(filePath, "utf8")
    const questions = raw
      .split(/\r?\n/)
      .map((q) => q.trim())
      .filter(Boolean)
    if (questions.length === 0) {
      return NextResponse.json({ question: "¿Qué te gustaría crear hoy?" })
    }
    const random = questions[Math.floor(Math.random() * questions.length)]
    return NextResponse.json({ question: random })
  } catch (error) {
    console.error("[random-question] Failed to load questions:", error)
    return NextResponse.json({ question: "¿Qué te gustaría crear hoy?" })
  }
}
