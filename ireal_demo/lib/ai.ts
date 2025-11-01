export interface AiEnvelope<T> {
  data: T | null
  error: { code: string; message: string } | null
  meta: Record<string, unknown>
}

export interface AIGenerationRequest {
  prompt: string
  type?: "general" | "calendar" | "idea" | "plan"
}

export interface AIGenerationResponse {
  content: string
  type: string
  timestamp: string
}

async function handleAiResponse<T>(response: Response): Promise<T> {
  const envelope = (await response.json()) as AiEnvelope<T>

  if (!response.ok || envelope.error) {
    throw new Error(envelope.error?.message ?? "AI request failed")
  }

  if (!envelope.data) {
    throw new Error("AI response missing data")
  }

  return envelope.data
}

export async function generateWithAI({ prompt, type = "general" }: AIGenerationRequest): Promise<AIGenerationResponse> {
  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, type }),
  })

  const data = await handleAiResponse<{
    content: string
    type: string
    timestamp: string
  }>(response)

  return {
    content: data.content,
    type: data.type,
    timestamp: data.timestamp,
  }
}

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
