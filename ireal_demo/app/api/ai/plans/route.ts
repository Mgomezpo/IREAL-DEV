import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { callService } from "@/lib/service-client"
import { resolveUserIdForRateLimit } from "@/lib/request-context"

const SERVICE_PATH = "/v1/ai/generate-plan"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = await resolveUserIdForRateLimit(request)

    const buildFallbackDoc = () => {
      const nombre = body.nombre || "Creador"
      const fecha = new Date().toISOString().slice(0, 10)
      return {
        ruta_seleccionada: "EDUCACION",
        explicacion_ruta: "Ruta generada en fallback local. Se prioriza educacion en video corto.",
        metadata: { nombre, fecha },
        perfil_audiencia: {
          descripcion_general: body.audiencia || "Audiencia interesada en contenidos breves y practicos.",
          demografia: "18-45, hispano parlantes, moviles",
          psicografia: "Busca tips rapidos y accionables",
          pain_points: ["Poco tiempo", "Busca claridad", "Quiere resultados rapidos"],
          aspiraciones: ["Aprender facil", "Aplicar ya", "Mejorar cada dia"],
          lenguaje_recomendado: "Claro, directo, motivador, con CTA a video corto",
        },
        fundamentos: {
          pilares_contenido: [
            { nombre: "Inicio rapido", descripcion: "Tips accionables en 60s", proposito: "Retencion" },
            { nombre: "Errores comunes", descripcion: "Que evitar en tu tema", proposito: "Autoridad" },
            { nombre: "Mini-guias", descripcion: "Pasos cortos para lograr algo", proposito: "Valor" },
          ],
          tono_voz: "Cercano, energetico, simple",
          propuesta_valor: "Videos cortos que resuelven dudas en segundos",
        },
        ideas_contenido: Array.from({ length: 8 }).map((_, i) => ({
          numero: i + 1,
          tema: `Idea ${i + 1} para ${nombre}`,
          hook: "Sabias que...?",
          desarrollo: "Explica el tip en menos de 60s, con ejemplo simple.",
          punto_quiebre: "Muestra el antes/despues en una frase.",
          cta: "Guarda este video para aplicarlo hoy.",
          copy: "Copy breve para acompanar el reel.",
          pilar: "Inicio rapido",
        })),
        recomendaciones: {
          frecuencia_publicacion: "3-5 videos cortos por semana",
          mejores_horarios: "Entre 12pm y 8pm (movil)",
          hashtags_sugeridos: ["shorts", "tips", "aprender"],
          formatos_prioritarios: ["Reel", "TikTok", "Short"],
          metricas_clave: ["Retencion 3s", "Shares", "Saves"],
          consejos_magicos: ["CTA claro", "Hook en 1s", "Subtitulos grandes"],
        },
      }
    }

    const ensureArray = (value: unknown) => {
      if (Array.isArray(value)) return value.filter(Boolean).map(String)
      if (typeof value === "string") return value.split(",").map((v) => v.trim()).filter(Boolean)
      return []
    }

    const aiPayload = {
      nombre: body.nombre || body.name || "Creador",
      pasion: body.pasion || "",
      motivacion: body.motivacion || "",
      conexion: body.conexion || body.audiencia || "",
      vision: body.vision || "",
      tiempo: body.tiempo || "",
      temas: ensureArray(body.temas),
      contextNotes: ensureArray(body.contextNotes),
    }

    try {
      const response = await callService(SERVICE_PATH, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify(aiPayload),
      })

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "")
        console.error("[v0] Plans AI upstream error", response.status, errorBody)
        const doc = buildFallbackDoc()
        return NextResponse.json({
          data: doc,
          meta: { fallback: true, upstreamStatus: response.status, upstreamBody: errorBody },
        })
      }

      const payload = await response.json()
      return NextResponse.json(payload, { status: 200 })
    } catch (err) {
      console.error("[v0] Plans AI service unavailable", err)
      const doc = buildFallbackDoc()
      return NextResponse.json({ data: doc, meta: { fallback: true, upstreamStatus: "unreachable" } }, { status: 200 })
    }
  } catch (error) {
    console.error("[v0] Plans AI API error:", error)
    return NextResponse.json(
      {
        data: null,
        error: { code: "AI_PLAN_ERROR", message: "Error al generar respuesta" },
        meta: { requestId: randomUUID() },
      },
      { status: 500 },
    )
  }
}
