# IREAL — Flujo 2 · Ideas (Detallado)

> Especificación exhaustiva para el módulo **Ideas**. Mantiene coherencia con la **Guía de Estilo UX/UI v1** (off‑white `#FDF6EB`, ink `#000`, divisores `#E5E5E5`, acento granate `#8A0F1C` suavizado, Playfair/Inter, iconos Lucide, tarjetas translúcidas y animación “página del cuaderno”).

---

## 1) Propósito y objetivos UX

- **Capturar chispas** de forma ultrarrápida (1–2 toques/teclas) y mantenerlas ordenadas por **tiempo**.
- **Transformar** ideas en **planes** o **piezas/calendar** sin fricción.
- **Nutrir** la escritura con **nudges de IA** sutiles, sin distraer.

**Métricas clave**

- Crear idea con Quick Add en < **1.5 s** (p99).
- ≥ **35%** de ideas con al menos 1 vínculo (plan o pieza) en 7 días.
- Tasa de apertura del editor (detalle) ≥ **55%** desde la lista.

---

## 2) Rutas y entradas

- **Sidebar** → “Ideas”.
- **Dashboard / Card Ideas** → “Ver todo” / click ítem.
- **Deep links**: `/ideas`, `/ideas/new`, `/ideas/:id`.

---

## 3) Layout general

- **Contenedor**: `max-w-6xl md:max-w-7xl mx-auto px-6 py-10`.
- **Header** (Playfair) + **Quick Add** pegado inferior al header.
- **Listado** con **bloques sticky**: Hoy, Ayer, Semana pasada, Último mes → listas colapsables.

### 3.1 Header

- **Título**: “Ideas”.
- **Subtítulo**: “Apunta chispas. Convierte notas en planes cuando estés listo.”
- **Acciones** (derecha):
  - **+ Nueva idea** (primario).
  - **Buscar** (atajo `/`).
  - **Filtros** (tags, canal, estado) y **Ordenar** (Recientes/Antiguas/Pines arriba).
- **Estado del sistema** (opcional, meta): contador de ideas activas.

### 3.2 Quick Add (captura en 1 tecla)

- **Barra**: `sticky top-[header-bottom] z-10 bg-[#FDF6EB]/95 backdrop-blur border-b border-[#E5E5E5] py-2`.
- **Input**: una línea, placeholder **“Escribe una idea y presiona Enter…”**.
- **Enter** → `POST /ideas` con `{ title }`. Feedback: spark ✨ a la derecha.
- **Chevron** despliega **Campos avanzados**: descripción breve (140c), tags, canal (IG/YT/LI/X/GEN), prioridad.
- **After‑save**: foco permanece en el input; la nueva idea aparece en **Hoy** con animación `fade+scale`.

---

## 4) Listado y agrupación por tiempo

- **Bloques** con encabezado sticky (Playfair `text-lg`):
  - **Hoy** — “Mar 23 septiembre” + **· N notas**.
  - **Ayer** — “Lun 22 septiembre”.
  - **Semana pasada** — rango “16–22 sep”.
  - **Último mes** — apilar por semana o por mes según densidad.
- **Colapsar/expandir** por bloque (`chevron-down/up`). Estado persistido (localStorage + querystring `?g=hoy,ayer…`).

### 4.1 Fila de idea (IdeaRow)

- **Contenedor**: `rounded-md border border-[#E5E5E5] bg-white/50 px-3 py-2` (hover `bg-white/70 shadow-xs`).
- **Contenido**:
  - **Título** (una línea, truncado con `title` tooltip).
  - **Meta** debajo (opcional): chips de tags/canal.
  - **Derecha**: **hora local** (`text-black/60`) + **kebab** (`more-vertical`).
- **Acciones rápidas** (hover/teclado):
  - **Pin** (`pin`) — fija arriba del bloque.
  - **Convertir a plan** (`wand-2`) — abre `/planes/new` con título/descr precargados.
  - **Programar** (`calendar-plus`) — abre modal “Nueva pieza” (fecha/hora/canal).
  - **Editar** (`pencil`), **Duplicar** (`copy`), **Archivar** (`archive`), **Eliminar** (`trash`).
- **Atajos**: `Enter` abrir · `P` pin · `C` convertir · `S` programar · `Del` archivar.

### 4.2 Estados de lista

- **Loading**: 6 esqueletos por bloque (`h-4 bg-black/5 rounded animate-pulse`).
- **Empty global**: ilustración monocromática + “No tienes ideas todavía. Crea tu primera ✨” + botón **+ Nueva idea**.
- **Empty de bloque**: “Sin notas en este rango”.
- **Error**: banner `border-[#8A0F1C]/70 text-[#8A0F1C] bg-[#8A0F1C]/8` con **Reintentar**.

---

## 5) Detalle de idea — Editor minimal (tipo Notion)

> Pantalla limpia: **título grande** + **lienzo** de notas. Timestamp discreto arriba‑derecha. CTA fijo **Agregar a plan**.

### 5.1 Layout

- **Contenedor**: `max-w-4xl mx-auto px-6 py-12`.
- **Título**: Playfair `text-4xl md:text-5xl font-semibold tracking-tight` (placeholder “Escribe un título…”).
- **Timestamp**: arriba‑derecha `text-black/40` (“Última edición hace {x}”). Tooltip: “Creada el {fecha} {hora}”.
- **Lienzo**: `contenteditable` o editor light → Inter `text-base leading-7` sin bordes.
- **Autosave**: cada 2 s inactivo / blur; micro‑label “Guardado” junto al timestamp.

### 5.2 Nudge de IA (flecha 90°)

- **Disparadores**:
  1. `Enter` tras línea con `.?!` y ≥ 6 palabras.
  2. Pausa > 3 s con línea ≥ 20 caracteres.
- **UI**: tarjeta `inline-flex items-start gap-2 px-3 py-2 rounded-md border border-[#E5E5E5] bg-[#F1E7D7]` + icono `sparkles` `h-4 w-4 text-black/60` + texto `text-sm text-black/80` (≤ 120c).
- **Acciones**: **Insertar** · **Regenerar** · **Descartar** (en móvil, Insertar visible y menú para las otras).
- **Reglas**: sólo **1 nudge** a la vez; **cooldown 20 s**; no repetir la misma intención; persistir estado “descartado” por bloque.
- **Insertar** → agrega cita `>` al lienzo y coloca el cursor al final.

### 5.3 CTA fijo inferior

- **Barra sticky** con desvanecido; botón **Agregar a plan** (primario).
- **Atajo**: `Cmd/Ctrl+K`.
- **Acción** → abrir modal **Agregar a…** (ver §6).

### 5.4 Accesibilidad

- Título `role="heading" aria-level="1"`.
- Lienzo `role="textbox" aria-multiline="true" aria-label="Notas"`.
- Nudge `role="note" aria-live="polite"`.

---

## 6) Modal “Agregar a…” (selector de planes)

**Overlay**: `bg-black/30 backdrop-blur-sm`.\
**Contenedor**: `max-w-4xl rounded-2xl border-[#E5E5E5] bg-white/70 shadow-lg`.

### 6.1 Header (sticky)

- Título Playfair **“Agregar a…”**.
- **Buscar** (`/`).
- Botón **Crear nuevo plan** → **Quick Create inline** (Nombre\*, Objetivo, Inicio/Fin). Tras crear, aparece **seleccionado**.

### 6.2 Body — Grid de planes

- `md:grid-cols-3 gap-3`.
- **Tarjeta**: `rounded-xl border bg-white/60 p-4 hover:shadow-sm cursor-pointer` con **checkbox accesible** (`role="checkbox" aria-checked`).
- Muestra **nombre**, **estado**, **rango**, **chips de canal** y **contador** de piezas del plan.
- **Multi‑selección**; orden alfabético (o por reciente al buscar).

### 6.3 Footer (sticky)

- Izquierda: “Seleccionados: {N}”.
- Derecha: **Cancelar** (ghost) y **Agregar a {N} plan(es)** (primario).
- **Enter** confirma; **Esc** cierra.

### 6.4 Comportamiento

- `POST /ideas/:id/attach-plans { planIds }` → idempotente.
- **Toast**: “Agregada a {N} plan(es) ✨”.
- Chips **“Vinculada a: {PlanA, PlanB}”** debajo del título en el editor.

---

## 7) Búsqueda, filtros y orden

- **Búsqueda** debounce 250 ms por título/descripción/tags (atajo `/`).
- **Filtros**: tags (multi), canal (multi), estado (Activo/Archivado), rango de fechas.
- **Orden**: Recientes (default), Antiguas, Pines arriba.
- **Persistencia** en querystring (e.g., `/ideas?tags=IG,Reels&sort=recent`).

**Vistas guardadas (opcional)**

- Guardar combinación de filtros como vista (chip en header).
- `POST /ideas/views` (local para MVP: localStorage).

---

## 8) Datos, modelo y estados

### 8.1 Modelo `Idea`

```ts
Idea {
  id: string;
  title: string;
  description?: string;   // markdown simple
  tags: string[];         // ['IG','Reels','Idea','Copy']
  channel?: 'IG'|'YT'|'X'|'LI'|'GEN';
  priority?: 'low'|'medium'|'high';
  status: 'active'|'archived';
  pinned: boolean;
  linkedPlanIds?: string[]; // virtual
  createdAt: ISODate;
  updatedAt: ISODate;
}
```

### 8.2 API

- **Listar**: `GET /ideas?limit=50&cursor=…&filters…` (cursor para scroll infinito).
- **Crear**: `POST /ideas` `{ title, description?, tags?, channel?, priority? }`.
- **Actualizar**: `PATCH /ideas/:id`.
- **Adjuntar planes**: `POST /ideas/:id/attach-plans` `{ planIds: string[] }`.
- **Convertir a plan**: `POST /planes` `{ sourceIdeaId }` → redirige a `/planes/:id`.
- **Programar**: `POST /calendario/events` `{ sourceIdeaId, date, channel }`.
- **Archivar**: `POST /ideas/:id/archive`.
- **Eliminar**: `DELETE /ideas/:id` (si no está vinculada; si está, requiere confirmación adicional).

**Convenciones**: Mutaciones retornan el recurso actualizado; todas idempotentes cuando aplica.

---

## 9) Componentes (Stitch) & Props

- `IdeasHeader({ onCreate, onSearch, onFilter, onSort, count })`
- `QuickAdd({ onSubmit, onExpand, defaultChannel })`
- `IdeasGroup({ title, count, collapsible, defaultOpen })`
- `IdeaRow({ data, onPin, onConvert, onSchedule, onEdit, onArchive, onDelete })`
- `IdeaEditorLite({ data, onChange, onSave, onAttachPlans, onSchedule, onAIHint })`
- `AttachToPlansModal({ ideaId, selectedIds, onConfirm, onCreatePlan })`
- `IdeasSkeleton()`, `IdeasEmpty()`, `IdeasError({ onRetry })`

**Estados/Props clave**

- `IdeaRow.data = { id, title, tags[], channel, pinned, updatedAt }`.
- `IdeaEditorLite.onAIHint(payload)` → muestra nudge siguiendo §5.2.

---

## 10) Interacciones & accesibilidad

- **Teclado**: `Enter` abrir · `/` buscar · `P` pin · `C` plan · `S` calendar · `Del` archivar · `Cmd/Ctrl+K` abrir modal “Agregar a…”.
- **Focus visible**: `ring-1` + sombra `0 0 0 6px rgba(138,15,28,.10)` en botones primarios.
- **Reader**: bloques con `role="region" aria-labelledby`; listas con `role="list"`/`role="listitem"`.
- **Live regions** para toasts y creación rápida.

---

## 11) Performance

- **Prefetch** de `/ideas/:id` al *hover* de fila (Desktop).
- **Virtualización** de listas (Último mes) si > 200 items.
- **Debounce** de escritura a 300 ms para autosave.

---

## 12) i18n (claves)

```
ideas.title = Ideas
ideas.subtitle = Apunta chispas. Convierte notas en planes cuando estés listo.
ideas.quickAdd.placeholder = Escribe una idea y presiona Enter…
ideas.group.today = Hoy
ideas.group.yesterday = Ayer
ideas.group.lastWeek = Semana pasada
ideas.group.lastMonth = Último mes
ideas.actions.pin = Pinear
ideas.actions.convert = Convertir a plan
ideas.actions.schedule = Programar
ideas.actions.edit = Editar
ideas.actions.duplicate = Duplicar
ideas.actions.archive = Archivar
ideas.actions.delete = Eliminar
ideas.modal.attach.title = Agregar a…
ideas.modal.attach.create = Crear nuevo plan
ideas.toast.attached = Agregada a {n} plan(es) ✨
```

---

## 13) Analítica de producto (eventos sugeridos)

- `ideas_open` (origen: sidebar/dashboard).
- `ideas_quick_add_success` `{ len, channel, withTags }`.
- `ideas_open_detail` `{ id }`.
- `ideas_ai_nudge_shown` / `ideas_ai_nudge_inserted`.
- `ideas_attach_to_plans_success` `{ count }`.
- `ideas_convert_to_plan` `{ id }`.
- `ideas_schedule_from_idea` `{ id }`.

---

## 14) QA (criterios de aceptación)

1. Quick Add crea idea en **Hoy** y mantiene foco en el input (sparkle visible).
2. Encabezados de bloques son **sticky** y colapsables; el estado persiste tras recarga.
3. La **hora** se muestra alineada a la derecha con formato local (`9:04 pm`).
4. `P` pinea y respeta orden; `C` abre creación de plan con datos; `S` abre modal de calendario.
5. En el **editor**, los **nudges** aparecen con las reglas y no se repiten hasta cooldown.
6. **Agregar a…** permite multi‑selección, Quick Create y es idempotente.
7. Búsqueda/filtros/orden se reflejan en la URL y sobreviven refresh.
8. Accesibilidad de teclado completa y foco visible en todos los controles.
9. Sin datos: empty states correctos; con error: banner suave con reintento.

---

## 15) Redlines y clases Tailwind de referencia

- **Fila Idea**: `rounded-md border border-[#E5E5E5] bg-white/50 px-3 py-2 hover:bg-white/70 hover:shadow-sm`.
- **Header**: `text-2xl md:text-3xl font-display tracking-tight`.
- **Botón primario**: `text-black hover:text-white hover:bg-[var(--ireal-accent-600)] ring-1 ring-transparent hover:ring-[var(--ireal-accent-600)]/70 hover:shadow-[0_0_0_6px_rgba(138,15,28,.10)] rounded-sm px-1 py-0.5`.
- **Nudge IA**: `px-3 py-2 rounded-md border border-[#E5E5E5] bg-[#F1E7D7]`.

---

## 16) Edge cases

- Títulos muy largos → truncar en fila, envolver en editor.
- Sin timezone → usar UTC con aviso en tooltip.
- DST (cambio de hora) → persistir `date` y `time` separados.
- Sin conexión al guardar → estado **“Guardado localmente”** y sincronizar al reconectar.

---

> **Listo para implementación.** Este flujo hereda el tema visual (granate suavizado) y patrones de accesibilidad. Integra de forma nativa el modal de **Agregar a…**, la conversión a plan y la programación en calendario, con nudges de IA que enriquecen pero no invaden la escritura.

