import { type NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = "AIzaSyA5fPBq57kg8Ts2mPMiDuHbtd6qZ6BcCfs"

export async function POST(request: NextRequest) {
  try {
    const { messages, context, command } = await request.json()

    // Build the prompt based on context and command
    let systemPrompt = `Eres un asistente especializado en planificación de contenido para IREAL. 
    
Contexto del plan: ${context}

Tu rol es ayudar a crear y refinar planes de contenido estratégicos. Puedes:
- Generar contenido para secciones específicas del plan
- Sugerir objetivos SMART
- Definir audiencias e ICPs
- Crear pilares de contenido
- Proponer calendarios de publicación
- Sugerir KPIs relevantes

Responde de manera concisa y práctica, enfocándote en acciones específicas.`

    if (command) {
      systemPrompt += `\n\nComando específico: ${command}`
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: systemPrompt }, { text: messages[messages.length - 1]?.content || "" }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no pude generar una respuesta."

    return NextResponse.json({ content })
  } catch (error) {
    console.error("[v0] Plans AI API error:", error)
    return NextResponse.json({ error: "Error al generar respuesta" }, { status: 500 })
  }
}
