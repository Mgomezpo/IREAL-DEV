import { type NextRequest, NextResponse } from "next/server"

// Gemini AI integration
const GEMINI_API_KEY = "AIzaSyA5fPBq57kg8Ts2mPMiDuHbtd6qZ6BcCfs"
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

export async function POST(request: NextRequest) {
  try {
    const { prompt, type = "general" } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    let systemPrompt = ""

    switch (type) {
      case "calendar":
        systemPrompt =
          "Eres un asistente especializado en planificación de contenido. Genera un calendario de publicaciones creativo y estratégico para creadores de contenido. Responde en español."
        break
      case "idea":
        systemPrompt =
          "Eres un generador de ideas creativas para contenido digital. Ayuda a crear conceptos únicos y atractivos. Responde en español."
        break
      case "plan":
        systemPrompt =
          "Eres un estratega de contenido que ayuda a estructurar planes detallados de publicación. Responde en español."
        break
      default:
        systemPrompt =
          "Eres un asistente creativo para creadores de contenido. Responde en español de manera útil y creativa."
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\nUsuario: ${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!response.ok) {
      console.error("[v0] Gemini API error:", response.status, response.statusText)
      return NextResponse.json({ error: "Error generating content" }, { status: response.status })
    }

    const data = await response.json()

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error("[v0] Invalid Gemini response structure:", data)
      return NextResponse.json({ error: "Invalid response from AI service" }, { status: 500 })
    }

    const generatedText = data.candidates[0].content.parts[0].text

    return NextResponse.json({
      content: generatedText,
      type,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] AI generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
