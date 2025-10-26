export interface AIGenerationRequest {
  prompt: string
  type?: "general" | "calendar" | "idea" | "plan"
}

export interface AIGenerationResponse {
  content: string
  type: string
  timestamp: string
}

export async function generateWithAI({ prompt, type = "general" }: AIGenerationRequest): Promise<AIGenerationResponse> {
  try {
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, type }),
    })

    if (!response.ok) {
      throw new Error(`AI generation failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("[v0] AI generation error:", error)
    throw error
  }
}

// Specific AI helpers for IREAL features
export const aiHelpers = {
  generateCalendar: (preferences: string) =>
    generateWithAI({
      prompt: `Genera un calendario de contenido para las próximas 2 semanas basado en estas preferencias: ${preferences}. Incluye tipos de contenido variados, horarios óptimos y temas relevantes.`,
      type: "calendar",
    }),

  generateIdea: (topic: string) =>
    generateWithAI({
      prompt: `Genera 3 ideas creativas de contenido sobre: ${topic}. Incluye título, descripción breve y tipo de contenido recomendado.`,
      type: "idea",
    }),

  generatePlan: (idea: string) =>
    generateWithAI({
      prompt: `Crea un plan detallado de contenido basado en esta idea: ${idea}. Incluye estructura, puntos clave, call-to-action y estrategia de distribución.`,
      type: "plan",
    }),
}
