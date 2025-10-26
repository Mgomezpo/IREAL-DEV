import { type NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = "AIzaSyA5fPBq57kg8Ts2mPMiDuHbtd6qZ6BcCfs"

export async function POST(request: NextRequest) {
  try {
    const { planId, startDate, endDate, frequency, channels, accounts, pillars, objectives, ideas } =
      await request.json()

    const prompt = `
Eres un experto en marketing de contenidos. Genera un calendario de publicaciones basado en estos datos:

PLAN:
- Fecha inicio: ${startDate}
- Fecha fin: ${endDate}
- Frecuencia: ${frequency} publicaciones por semana
- Canales: ${channels.join(", ")}
- Cuentas: ${accounts.join(", ")}

CONTEXTO:
- Pilares de contenido: ${pillars}
- Objetivos: ${objectives}
- Ideas vinculadas: ${ideas}

INSTRUCCIONES:
1. Calcula el número total de publicaciones necesarias
2. Distribuye las publicaciones de manera equilibrada evitando fines de semana
3. Mezcla formatos según el canal (posts, reels, stories para IG; videos para YT, etc.)
4. Para cada publicación genera:
   - Título atractivo (máximo 70 caracteres)
   - Copy/caption completo con 3 hashtags relevantes
   - Guion estructurado en 3-7 puntos clave
   - Público objetivo específico
   - Fecha y hora sugerida

Responde en formato JSON con un array de publicaciones:
{
  "pieces": [
    {
      "title": "string",
      "channel": "IG|YT|LI|X|TT|FB",
      "format": "post|reel|story|video|etc",
      "copy": "string",
      "script": "string",
      "targetAudience": "string",
      "date": "YYYY-MM-DD",
      "time": "HH:mm",
      "hashtags": ["tag1", "tag2", "tag3"]
    }
  ]
}
`

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
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const generatedText = data.candidates[0].content.parts[0].text

    // Parse the JSON response from Gemini
    let calendarData
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        calendarData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      console.error("[v0] Error parsing Gemini response:", parseError)
      // Fallback response
      calendarData = {
        pieces: [
          {
            title: "Contenido generado por IA",
            channel: channels[0] || "IG",
            format: "post",
            copy: "Contenido creado automáticamente para tu plan de marketing 🚀 #marketing #contenido #ia",
            script: "• Introducción al tema\n• Desarrollo del concepto principal\n• Call to action final",
            targetAudience: "Emprendedores y profesionales del marketing",
            date: startDate,
            time: "09:00",
            hashtags: ["marketing", "contenido", "ia"],
          },
        ],
      }
    }

    return NextResponse.json(calendarData)
  } catch (error) {
    console.error("[v0] Calendar generation error:", error)
    return NextResponse.json({ error: "Error generating calendar" }, { status: 500 })
  }
}
