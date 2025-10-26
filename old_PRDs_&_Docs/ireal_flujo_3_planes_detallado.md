# IREAL — Flujo 3 · Planes (Detallado)

> Documento exhaustivo del módulo **Planes**: listado, **workspace** (Chat ↔ Documento) y **Hoja de Cuadros**. Todo consistente con la **Guía de Estilo UX/UI v1** (fondo `#FDF6EB`, divisores `#E5E5E5`, tipografías *Playfair/Inter*, íconos Lucide, acento granate `#8A0F1C`, tarjetas translúcidas y animación “página de cuaderno”).

---

## 1) Propósito y objetivos UX

- Convertir ideas en **campañas accionables** con ayuda de IA.
- Mantener un **espacio de trabajo híbrido**: conversación (izquierda) y documento estructurado (derecha).
- **Planificar → generar calendario** en 1 flujo.

**Métricas**

- Creación de plan en < **30 s** (Quick Create).
- ≥ **60%** de planes con “Hoja de Cuadros” completa al 70%+ en 72 h.
- ≥ **50%** usan “Generar calendario” al menos 1 vez/plan.

---

## 2) Rutas y navegación

- **Listado**: `/planes`
- **Detalle (workspace)**: `/planes/:id`
- **Hoja de Cuadros**: `/planes/:id/boards` (mismo detalle con página “trasera”).

**Entradas**: desde Dashboard (card Planes), Ideas → “Convertir a plan”, o enlaces directos.

---

## 3) Listado de Planes

### 3.1 Layout & redlines

- Contenedor: `max-w-7xl mx-auto px-6 py-10`.
- Header Playfair: “Planes de contenido” + CTA **+ Crear nuevo plan**.
- **Grid**: `grid gap-6 md:grid-cols-2 lg:grid-cols-3`.

### 3.2 Tarjeta de plan

- **Card**: `rounded-xl border border-[#E5E5E5] bg-white/60 p-5 hover:shadow-sm`.
- **Contenido**:
  - Título (Playfair) + descripción (`text-sm text-black/70`).
  - **Progreso**: barra `h-2 rounded-full bg-black/10` con relleno `bg-[#D66770]` (accent-300) + %.
  - Badges: **Estado** (Borrador/Activo), **Fechas** (inicio–fin), **Canales** (chips IG/YT/…).
- **Acciones**: Abrir (click en tarjeta), **Duplicar**, **Archivar** (kebab). `aria-label` en icon buttons.

### 3.3 Filtros/orden

- Buscar por nombre, filtrar por **Estado**, **Canales**, **Rango** y **Tags**. Orden: Recientes/Alfabético/Progreso.

### 3.4 Empty/Loading/Error

- **Empty**: ilustración + “Crea tu primer plan ✨”.
- **Loading**: 6 tarjetas esqueleto.
- **Error**: banner suave `border-[#8A0F1C]/70 text-[#8A0F1C] bg-[#8A0F1C]/8` + Reintentar.

### 3.5 Quick Create (modal)

- Campos: **Nombre**\*, **Objetivo** (1 línea), **Inicio/Fin**, **Canales** (chips), **Plantilla** (General, TikTok, Newsletter, YouTube, Personalizada).
- Crear → abre **Workspace** del plan.

---

## 4) Workspace del Plan (split‑view)

### 4.1 Layout general

- **Izquierda**: **Chat del Plan** (38–42%). **Derecha**: **Documento del Plan** (58–62%). Separador arrastrable.
- **Top bar** sticky con: nombre del plan, **Estado**, **Compartir**, **Exportar** (PDF/MD), **Más**.
- Botón **Expandir documento** (doble flecha) → fullscreen.

### 4.2 Chat del Plan (izquierda)

- **Header**: mini título + badge Estado; chips de **Ideas**/**Tablas** vinculadas; botón **Adjuntar**.
- **Mensajes**: estilo Chat minimal, fondo crema; bloques del asistente pueden traer **acciones**: *Insertar en → [Sección]*, *Refinar*, *Citar fuentes*.
- **Composer**: multilínea; botones **Adjuntar** (ideas/tablas), **/comandos**, **Insertar en** (dropdown de secciones). Enter envía; Shift+Enter salto.
- **Slash commands** (sugeridos):
  - `/brief`, `/objetivos`, `/audiencia`, `/mensajes`, `/pilares`, `/calendario`, `/backlog`, `/kpis`, `/budget`, `/copy [formato]`, `/tone [estilo]`.
- **Reglas IA**: contexto = metadatos + secciones + **ideas** y **tablas** vinculadas. Opción *Citar fuentes* agrega referencias al final del bloque.

### 4.3 Documento del Plan (derecha)

- **Estructura base (plantilla General)**:
  1. **Resumen ejecutivo** (1–2 párrafos).
  2. **Objetivos (SMART)**.
  3. **Audiencia & ICP**.
  4. **Propuesta de valor & Mensajes**.
  5. **Pilares de contenido** (bullets; CTA “Generar ejemplos”).
  6. **Calendario** (mini semana incrustada + contador/día).
  7. **Backlog de piezas** (tabla editable → “Programar en calendario”).
  8. **KPIs & Métricas**.
  9. **Recursos & Presupuesto**.
  10. **Aprobaciones & Notas**.
- **Bloques/secciones**: `rounded-xl border border-[#E5E5E5] bg-white/60 p-5` con toolbar local (**Generar con IA**, **Refinar**, **Insertar desde chat**, **Sincronizar ideas**, **Mover**/drag handle).
- **Inserción desde chat**: cada mensaje del asistente tiene **Insertar en → [Sección]**; al insertar, aparece chip **“Generado con IA”** y se guarda referencia al mensaje.
- **Backlog & Calendario**:
  - Backlog: columnas *Título*, *Formato*, *Canal*, *Estado* (Idea/Borrador/Programado/Publicado), *Fecha objetivo*; seleccionar filas → **Programar** (abre calendario).
  - Calendario mini: arrastrar piezas; botón **Ver calendario completo**.

### 4.4 Progreso del plan

- **Fórmula global**: `overall = 0.4*doc + 0.4*schedule + 0.2*approvals`.
- `doc` se alimenta de la **Hoja de Cuadros** (ver §5.5). Barra en top bar (accent-300) + tooltip con desglose.

### 4.5 Accesibilidad & atajos

- Chat `role="complementary"`, Documento `role="main"`.
- Atajos: `Cmd/Ctrl+K` Insertar selección del chat; `Cmd/Ctrl+J` Expandir documento; `/` abre comandos.

---

## 5) Hoja de Cuadros (vista formulario)

> Página complementaria con **bloques**: Objetivos, Calendario, Ideas vinculadas, Cuentas/Redes y KPIs. **Navegación tipo “pasar página”** con la animación del cuaderno.

### 5.1 Navegación

- En **Workspace** (documento), esquina **superior derecha**: flecha para **Pasar a hoja de cuadros**.
- En **Hoja de Cuadros**, esquina **superior izquierda**: flecha **Volver al chat/documento**.
- Animación: `rotateY(±6deg) + translateX(±24px) + opacity 700ms`.

### 5.2 Layout de grid

- Contenedor: `max-w-7xl mx-auto px-6 py-8`.
- Grid `lg:grid-cols-12 gap-6` con tarjetas `rounded-xl border border-[#E5E5E5] bg-white/60 p-5`.
- Distribución:
  - **(A) Objetivos** — **col-span-7**
  - **(B) Calendario** — **col-span-5**
  - **(C) Ideas vinculadas** — **col-span-4**
  - **(D) Cuentas y Redes** — **col-span-4**
  - **(E) KPIs** — **col-span-4**

### 5.3 Contenido de cada bloque

- **A) Objetivos**: *Meta principal* (textarea 3–4 líneas) + *Mensajes clave* (3 bullets). Acciones: **Generar con IA**, **Refinar**.
- **B) Calendario**: *Inicio*, *Fin*, *Frecuencia* (texto libre, ej. “3 posts/semana”). CTA **Generar calendario** (crea esqueleto en Documento + Backlog).
- **C) Ideas vinculadas**: lista de chips/filas con título + fecha; botón **+ Vincular ideas** → popup (selector multi) reutilizando el modal de Ideas; acciones por ítem: Abrir, Insertar en Backlog, Desvincular.
- **D) Cuentas y Redes**:
  1. **Cuentas destino** (desde Integraciones): logo, handle, toggle *Incluir en plan*, acción **Conectar** si vacío.
  2. **Redes sociales** (chips: IG, YT, LI, X, TikTok…).
- **E) KPIs**: *Alcance meta*, *Seguidores nuevos*, *Leads/Conversiones*. Campo sugerido: *Publicaciones/semana* (por IA a partir de la frecuencia).

### 5.4 Acciones y guardado

- Barra superior: **Guardar** (primario), **Compartir** (ghost). Autosave cada 2 s.
- Guardar recalcula **Progreso** y sincroniza con el Documento.

### 5.5 Progreso por cuadro (desglose `doc`)

- **Objetivos** (30% de `doc`): 0% vacío; 50% Meta; 100% Meta + ≥2 Mensajes.
- **Calendario (ajustes)** (15%): 0% vacío; 60% Inicio/Fin; 100% + Frecuencia.
- **Ideas vinculadas** (10%): 0% sin ideas; 50% ≥1; 100% ≥3.
- **Cuentas y Redes** (10%): 0% sin selección; 60% cuentas **o** redes; 100% ≥1 cuenta **y** ≥1 red.
- **KPIs** (25%): 0% vacío; 60% ≥2 métricas; 100% ≥3.
- **Resto Documento** (10%): promedio de secciones (audiencia, mensajes, pilares…).

---

## 6) Modelo de datos (MVP)

```ts
type SocialPlatform = 'IG'|'YT'|'LI'|'X'|'TT'|'FB'|'GEN';

Account { id: string; platform: SocialPlatform; handle: string; avatarUrl?: string; connected: boolean; }
TargetAccount { accountId: string; platform: SocialPlatform; handle: string; }

Plan {
  id: string; name: string; description?: string; status: 'draft'|'active'|'archived';
  startDate?: ISODate; endDate?: ISODate;
  channels: SocialPlatform[];            // redes objetivo
  targetAccounts: TargetAccount[];       // cuentas destino
  tags: string[]; linkedIdeaIds: string[]; linkedTableIds: string[];
  progress: { doc: number; schedule: number; approvals: number; overall: number };
  sections: PlanSection[]; createdAt: ISODate; updatedAt: ISODate;
}

PlanSection {
  id: string; type: 'summary'|'goals'|'audience'|'messages'|'pillars'|'calendar'|'backlog'|'kpis'|'resources'|'approvals'|'custom';
  title: string; content: RichText; syncRules?: { useIdeas?: boolean; ideaTags?: string[] };
  lastMessageRef?: string; updatedAt: ISODate;
}

ChatMessage { id: string; planId: string; role: 'user'|'assistant'|'system'; content: string; attachments?: Array<{type:'idea'|'table', id:string, meta?:any}>; createdAt: ISODate; }
```

---

## 7) API & Bindings

- **Listado**: `GET /planes?status!=archived&limit=24&cursor=…`.
- **Crear**: `POST /planes` (name, template?, dates?, channels?).
- **Detalle**: `GET /planes/:id` + `GET /planes/:id/sections`.
- **Actualizar**: `PATCH /planes/:id`.
- **Secciones**: `POST /planes/:id/sections`, `PATCH /planes/:id/sections/:sid`, **Reordenar** `POST /planes/:id/sections/reorder`.
- **Progreso**: `POST /planes/:id/progress/recompute`.
- **Chat IA**: `POST /planes/:id/chat` (stream) + WebSocket `/ws/planes/:id`.
- **Vincular ideas/tablas**: `POST /planes/:id/attach-ideas`, `POST /planes/:id/attach-tables`.
- **Integraciones — cuentas/redes**:\
  `GET /integrations/accounts`, `GET /integrations/networks`,\
  `GET /planes/:id/accounts`, `POST /planes/:id/attach-accounts`, `DELETE /planes/:id/attach-accounts`,\
  `PATCH /planes/:id/channels`.
- **Backlog → calendario**: `POST /calendario/events` y `POST /planes/:id/scheduler/generate` (IA) → ver Flujo 4.

**Convenciones**: mutaciones devuelven el plan actualizado, idempotentes cuando aplica; errores con `problem+json` (code/message/hint).

---

## 8) Componentes (Stitch) & Props

- `PlansHeader({ onCreate, onSearch, onFilter, onSort })`
- `PlanCard({ data, onOpen, onDuplicate, onArchive })`
- `CreatePlanModal({ onConfirm })`
- `PlanWorkspace({ plan, onShare, onExport })`
- `PlanChat({ planId, attachments, onAttach, onInsertToSection, onCommand })`
- `PlanDocument({ sections, onGenerate, onRefine, onInsertFromChat, onReorder })`
- `PlanBoards({ plan, onSave, onLinkIdeas, onAttachAccounts, onUpdateKpis })`

**Props clave**

- `PlanCard.data = { id, name, description, status, progress, startDate, endDate, channels[] }`.
- `PlanChat.attachments = { ideas: Idea[], tables: Table[] }`.
- `PlanDocument.sections = PlanSection[]`.

---

## 9) Interacciones & atajos

- `Cmd/Ctrl+K` **Insertar** desde el chat a la sección activa.
- `Cmd/Ctrl+J` **Expandir documento**.
- `/` abre **comandos** en el chat.
- `Alt+←/→` cambia **Workspace ↔ Hoja de Cuadros** (misma animación cuaderno).

---

## 10) Estados del sistema

- **Loading**: esqueletos en chat y documento; shimmer en barras de progreso.
- **Empty**: copys cálidos en documento y chat.
- **Error**: banners suaves (accent‑600/8) con reintento.

---

## 11) Accesibilidad

- Jerarquía semántica: H1 (nombre del plan), H2 (secciones), regiones `main/complementary`.
- Trampa de foco en modales; retorno del foco al disparador.
- Etiquetas `aria` en chips y toggles; contraste 4.5:1.

---

## 12) Performance

- **Prefetch** de secciones al abrir Workspace.
- **Streaming** de IA con chunks para no bloquear.
- **Memo** de componentes de sección; virtualizar Backlog si > 200 filas.

---

## 13) i18n (claves sugeridas)

```
plans.title = Planes de contenido
plans.create = Crear nuevo plan
plans.progress = Progreso
plan.workspace.chat.title = Chat del plan
plan.workspace.document.title = Documento del plan
plan.boards.title = Hoja de cuadros
plan.boards.goals = Objetivos
plan.boards.calendar = Calendario
plan.boards.ideas = Ideas vinculadas
plan.boards.accounts = Cuentas y Redes
plan.boards.kpis = KPIs
plan.generateCalendar = Generar calendario
```

---

## 14) QA (criterios de aceptación)

1. El **Listado** muestra tarjetas con progreso, fechas y canales; filtros/orden funcionan y persisten.
2. **Create Plan** abre Workspace con plantilla aplicada y top bar correcto.
3. **Split‑view** redimensionable; **Expandir documento** a fullscreen y volver sin perder contexto.
4. Desde el **Chat** puedo “Insertar en → [Sección]” y se marca “Generado con IA”.
5. **Hoja de Cuadros** sincroniza con el Documento y recalcula progreso según reglas.
6. **Vincular Ideas** abre el popup multi‑selección y refleja chips/acciones.
7. **Cuentas y Redes** persisten (endpoints de Integraciones) y afectan sugerencias del calendario.
8. **Generar calendario** crea esqueleto en Documento/Backlog y envía al módulo Calendario.
9. Accesibilidad: foco visible, roles ARIA, navegación por teclado y contraste ok.

---

## 15) Tailwind de referencia

- **Card**: `rounded-xl border border-[#E5E5E5] bg-white/60 p-5 hover:shadow-sm`.
- **Progreso**: `bg-black/10` + relleno `bg-[#D66770]`.
- **Botón primario**: `text-black hover:text-white hover:bg-[#8A0F1C] ring-1 ring-transparent hover:ring-[#8A0F1C]/70 hover:shadow-[0_0_0_6px_rgba(138,15,28,0.10)]`.
- **Bloque sección**: `rounded-xl border border-[#E5E5E5] bg-white/60 p-5`.

---

> **Listo para implementación.** El módulo Planes consolida la co‑creación con IA (chat → documento), la edición estructurada (Hoja de Cuadros) y la conexión con el Calendario, todo dentro del lenguaje visual de IREAL.

