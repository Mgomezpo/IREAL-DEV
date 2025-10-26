# IREAL — Flujo 4 · Calendario (Detallado)

> Módulo de **Calendario** con generación asistida por **IA** (mandar plan → calendario) y **popup de pieza**. Consistente con la **Guía de Estilo UX/UI v1**: fondo `#FDF6EB`, divisores `#E5E5E5`, Playfair/Inter, iconos Lucide, acento granate suavizado `#8A0F1C`, tarjetas translúcidas, animación “página de cuaderno”.

---

## 1) Propósito y objetivos UX

- Convertir un **plan** en un **cronograma** ejecutable con el menor esfuerzo posible.
- Dar **visibilidad** del mes/semana y permitir **edición rápida** por pieza.
- Mantener el **tono editorial** de IREAL: simple, cálido, “cuaderno”.

**Métricas clave**

- Tiempo desde “Mandar a calendario” hasta **Confirmar** < **40 s** (mediana).
- ≥ **80%** de piezas generadas con título+copy+guion.
- ≥ **50%** de piezas con **asset** subido antes de la fecha objetivo.

---

## 2) Rutas y entradas

- **Desde Plan**: botón **Mandar a calendario / Generar calendario**.
- **Directo**: `/calendario?view=month|week|agenda&planId=…`.
- **Desde Dashboard**: card Publicaciones → Calendario (semana actual).

---

## 3) Vistas & navegación

- **Header**: mes/año, flechas ◀ ▶, botón **Hoy**, selector **Mes / Semana / Agenda**, filtros (Plan, Canal, Cuenta, Estado).
- **Mes** (grid 7×5/6): celdas con número arriba‑izquierda; **Hoy** con contorno `accent-600`. Muestra hasta **3 piezas** como rectangulitos; si hay más, **+N**.
- **Semana**: 7 columnas; filas por **hora** (15/30 min). Útil para reels/lives.
- **Agenda (mobile)**: lista por día; chips de pieza.
- **Crear rápido**: doble click en celda/slot → modal **Nueva pieza** (título, canal, formato, plan, día/hora).

**Accesibilidad**

- Grid con `role="grid"`, celdas `role="gridcell"`; navegación por flechas; `Enter` abre pieza; tecla **H** salta a **Hoy**.

---

## 4) IA programadora — “Mandar a calendario”

**Dónde**: en el **Workspace del Plan** (Documento y Hoja de Cuadros).

**Entrada** (contexto):

- Rango **Inicio/Fin** y **Frecuencia** del plan.
- **Canales** (IG/YT/LI/X/TT/FB) y **Cuentas** elegidas.
- **Pilares / Mensajes / Objetivos**.
- **Ideas vinculadas** y **Backlog** existente.

**Algoritmo (resumen)**

1. Calcular **slots** por canal (heurística: evitar fines de semana según preferencia; distribución homogénea).
2. Generar **N piezas** = semanas×frecuencia (mezclar formatos por canal cuando aplique).
3. Para cada pieza crear: **Título** (≤70c), **Guion** (3–7 bullets), **Copy** (caption + 3 hashtags), **Público objetivo** (1–2 líneas), **Metadatos** (canal, cuenta, formato, duración, CTA).
4. Asignar **fecha & hora** evitando choques por cuenta; marcar como ``.

**Revisión & Confirmación**

- Modal **“Revisar calendario generado”** (vista semanal editable).
- Acciones por pieza: **Editar** (abre popup), **Cambiar día/hora** (drag), **Eliminar**.
- **Confirmar** → crea eventos reales (status `scheduled` o `draft`).
- **Re‑generar**: por semana o **Añadir +N** piezas a huecos.

**API**

- **Leer**: `GET /calendario/:id`
- **Crear**: `POST /calendario` `{ ...ContentPiece }`
- **Actualizar**: `PATCH /calendario/:id` `{ title?, copy?, script?, targetAudience?, accountId?, date?, time?, status?, assets? }`
- **Subir asset**: `POST /assets` → `{ id, url, type, size }` → `PATCH /calendario/:id` con `assets[0]=id`.
- **Publicar inmediato**: `POST /calendario/:id/publish` (dispara envío inmediato con validación).
- **Autopost** (programación): `POST /calendario/:id/queue` `{ at, timezone }` *(normalmente implícito al estar **`scheduled`**)*.
- **Reintentar**: `POST /calendario/:id/retry` (si `publish.state='error'`).
- **Webhooks** proveedores: `POST /integrations/webhooks/:platform/publish-callback` (confirma éxito/permashortlink si aplica).

---

## 5) Piezas en el calendario (UI)

- **Rectangulito de pieza**: `rounded-md border border-[#E5E5E5] bg-white/70 px-2 py-1` con icono de canal, **título** truncado y **estado**.
- **Estados** (colores suaves): Idea → borde `black/15`; Borrador → relleno `black/5`; **Programado** → banda lateral `accent-400`; **Publicado** → check `accent-600` y opacidad 80%.
- **Hover/Popover**: mini detalle (plan, canal, hora, 1 línea de copy); click → abre **Popup de pieza**.
- **Drag & drop**: mover entre días/horas; **snap** a 15/30 min; validación de choques por **cuenta**.

### 5.1 Estado, iconografía y autoposting (automático)

> El **detalle de la pieza** se **monta automáticamente** desde la IA (título/copy/guion/público) al generarse. Además, el calendario **autopublica** en la red conectada a la hora programada.

**Iconografía en el calendario (3 estados clave)**

- **Próximo a montar** → icono **ruedita** `lucide:loader-2` con animación `animate-spin` (se muestra desde **T−10 min** hasta el momento de publicación y durante el envío).
- **Publicado** → **chulito** `lucide:check` (verde suave: `text-[#1B8A4B]` sobre chip neutro) + opacidad de pieza al **80%**.
- **Error** → **X** `lucide:x` (granate `text-[var(--accent-600)]`) y banner mini con hint al pasar el mouse.

**Pipeline de autopost**

1. **Pre‑flight** (al guardar/programar): validar `accountId`, `channel`, `date/time`, **asset principal** (si el formato lo requiere) y **copy**.
2. **En cola**: si `autopostEnabled=true` y `status=scheduled`, entrar en **cola** con ventana configurable (**T−10 min**).
3. **Publicación**: job `autopost-tick` toma piezas dentro de la ventana, sube el asset y publica via proveedor (IG/YT/LI/X/TT/FB) usando OAuth.
4. **Confirmación**: si éxito, guardar `permalink` y marcar `published`; si falla, registrar `error` y **reintentar** (exponencial ×3) antes de pasar a **error**.

**Transiciones de estado (resumen)**

- `draft` → `scheduled` (si tiene fecha/hora).
- `scheduled` + `autopostEnabled` → **queued** (muestra **ruedita** al entrar en ventana).
- **posting** → spinner activo.
- **success** → **check** y `status=published` (bloquea drag salvo rol editor).
- **error** → **X** con tooltip de motivo y CTA **Reintentar ahora**.

**UI en la celda**

- El **rectangulito** mantiene banda lateral por **Programado**; encima, a la derecha, el **icono** de estado (ruedita/check/X).
- Tooltip accesible: “Próximo a publicar”, “Publicado”, “Error al publicar: …”.

**Ajustes**

- Toggle por pieza: **Autopublicar a la hora programada** (default **ON**).
- Preferencia global por cuenta/red en **Configuración → Integraciones**.

**Accesibilidad**

- `aria-live="polite"` cuando cambie el icono de estado.
- Describir el icono con `aria-label` según estado.

---

## 6) Popup de pieza (detalle rápido)

> Objetivo: edición breve y fiel al contenido generado por IA. **Layout sencillo** y claro.

**Comportamiento**: se abre al hacer click en un rectangulito. Soporta **Nueva**, **Editar**, **Vista previa**.

### 6.1 Estructura visual (layout)

- **Overlay**: `fixed inset-0 bg-black/30 backdrop-blur-sm`.
- **Contenedor**: `max-w-3xl w-[92vw] md:w-auto mx-auto mt-16 rounded-2xl border border-[#E5E5E5] bg-white/70 shadow-lg`.
- **Header (sticky)**:
  - Izquierda: icono de canal + **Nombre de la pieza** (editable, Playfair `text-lg`).
  - Derecha: **Rectángulo de asset** (ver 6.2) — en **esquina superior derecha**.
- **Body**: grid `md:grid-cols-2 gap-4` (flexible a 1 columna en mobile).
  - **Columna izquierda**
    - **Copy** (textarea `rows=4`, Inter `text-sm`).
    - **Guion / Script** (textarea `rows=5`).
  - **Columna derecha**
    - **Público objetivo** (input/textarea corto, 1–2 líneas).
    - **Cuenta de referencia** (select con cuentas conectadas; muestra handle y red).
    - **Plan de referencia** (solo lectura, chip con nombre del plan; botón “Abrir plan”).
- **Footer (sticky)**: izquierda chips de **estado** (Idea/Borrador/Programado/Publicado). Derecha botones: **Guardar** (primario), **Programar** (abre selector de fecha/hora si falta), **Cerrar** (ghost).

### 6.2 Rectángulo de asset (superior derecha)

- **Dropzone** (120–160px de alto en desktop): `rounded-md border border-dashed border-[#E5E5E5] bg-white/50 p-3`.
- Texto: “Arrastra tu archivo o **Subir**”. Acepta **.png .jpg .mp4 .mov .pdf**.
- Al subir: vista previa (miniatura o poster de video), nombre de archivo, tamaño; acción **Reemplazar** / **Eliminar**.
- Metadato: **Vinculado a la cuenta** seleccionada (si cambia la cuenta, mantener asset pero advertir si formato no aplica al canal).

### 6.3 Accesibilidad

- `role="dialog" aria-modal="true" aria-labelledby="piece-title"`.
- Trampa de foco; `Esc` cierra; `Cmd/Ctrl+S` guarda.
- Campos con `aria-describedby` para ayudas y errores.

**Atajos**

- `Cmd/Ctrl+S` Guardar · `Enter` (sin mod) Programar si hay cambios guardados · `Esc` Cerrar.

---

## 7) Crear/editar pieza (flujo de datos)

- **Crear rápida** desde celda/slot → abre el Popup con `date/time` y `planId` pre‑rellenos.
- **Desde IA** (previsualización): al **Confirmar**, se crean y quedan en estado `scheduled` **o** `draft` según configuración.
- **Validaciones**: título no vacío; si `status=scheduled`, requiere `date/time` y `accountId`.

**API**

- **Leer**: `GET /calendario/:id`
- **Crear**: `POST /calendario` `{ ...ContentPiece }`
- **Actualizar**: `PATCH /calendario/:id` `{ title?, copy?, script?, targetAudience?, accountId?, date?, time?, status?, assets? }`
- **Subir asset**: `POST /assets` (devolver `{ id, url, type, size }`), luego `PATCH /calendario/:id` con `assets[0]=id`.
- **Publicar** (si hay integraciones): `POST /calendario/:id/publish`

---

## 8) Modelo de datos (pieza)

````ts
ContentPiece {
  id: string;
  planId: string;                // referencia al plan
  title: string;                  // nombre de la pieza (IA editable)
  channel: 'IG'|'YT'|'LI'|'X'|'TT'|'FB';
  accountId?: string;             // cuenta destino
  format?: 'reel'|'short'|'post'|'carrusel'|'story'|'live'|'blog'|'newsletter'|'otro';
  status: 'idea'|'draft'|'scheduled'|'published';
  date: ISODate;                  // día
  time?: string;                  // HH:mm
  durationMin?: number;
  concept?: string;               // opcional (resumen)
  script?: string;                // guion (multilínea)
  copy?: string;                  // caption/texto
  targetAudience?: string;        // público objetivo (1–2 líneas)
  hashtags?: string[];
  assets?: Array<{ id:string, type:'image'|'video'|'doc'|'link', url:string, note?:string }>; // primer asset = principal
  aiSuggested?: boolean;          // true si viene del generador
  autopostEnabled?: boolean;      // ON/OFF por pieza
  publish?: {                     // estado de autopublicación
    state: 'idle'|'queued'|'posting'|'success'|'error';
    attempts: number;
    lastError?: string;
    externalId?: string;          // id en la red
    permalink?: string;           // URL pública
    lastRunAt?: ISODate;
  };
  createdAt: ISODate; updatedAt: ISODate;
}
```ts
ContentPiece {
  id: string;
  planId: string;                // referencia al plan
  title: string;                  // nombre de la pieza (IA editable)
  channel: 'IG'|'YT'|'LI'|'X'|'TT'|'FB';
  accountId?: string;             // cuenta destino
  format?: 'reel'|'short'|'post'|'carrusel'|'story'|'live'|'blog'|'newsletter'|'otro';
  status: 'idea'|'draft'|'scheduled'|'published';
  date: ISODate;                  // día
  time?: string;                  // HH:mm
  durationMin?: number;
  concept?: string;               // opcional (resumen)
  script?: string;                // guion (multilínea)
  copy?: string;                  // caption/texto
  targetAudience?: string;        // público objetivo (1–2 líneas)
  hashtags?: string[];
  assets?: Array<{ id:string, type:'image'|'video'|'doc'|'link', url:string, note?:string }>; // primer asset = principal
  aiSuggested?: boolean;          // true si viene del generador
  createdAt: ISODate; updatedAt: ISODate;
}
````

---

## 9) Filtros & capas

- **Plan(es)**: multi‑select con contador; opción **Solo este plan**.
- **Canales** y **Cuentas**: chips con iconos.
- **Estado**: idea/borrador/programado/publicado.
- **Densidad**: compacto (2 por día) o completo (scroll en celda).

---

## 10) Componentes (Stitch) & Props

- `CalendarHeader({ month, onPrev, onNext, onToday, view, onChangeView, filters })`
- `CalendarMonthGrid({ days, pieces, onCreateQuick, onOpenPiece, onDragPiece })`
- `CalendarWeekGrid({ hours, pieces, onCreateQuick, onOpenPiece, onDragPiece })`
- `PieceChip({ data, onClick, onDragStart })`
- `PieceModal({ data, onChange, onUploadAsset, onSave, onSchedule, onClose })`
- `GenerateFromPlanModal({ preview, onEditPiece, onConfirm, onRegenerate })`

`` mínimo:

```ts
{
  id, planId, title, channel, accountId, status,
  copy, script, targetAudience,
  date, time, assets: [{id,url,type}],
}
```

---

## 11) Interacciones y accesibilidad

- **Drag & drop** con límites por cuenta; teclado: mover pieza seleccionada con `Alt+↑/↓/←/→` (semana).
- **Iconos de estado**: ruedita (**queued/posting**), check (**success/published**), X (**error**). Cambios anuncian toast y `aria-live`.
- **Focus visible** en chips y celdas; `aria-live="polite"` en toasts (“Reprogramado para vie 10, 9:30”).
- **Reader**: botón **Hoy** anuncia semana visible.

---

## 12) Performance

- **Windowing** de piezas en Mes si > 200 en vista.
- **Memo** de `PieceChip` por `id`.
- **Prefetch** de `PieceModal` al *hover* de chip/pieza.

---

## 13) i18n (claves)

```
calendar.title = Calendario
calendar.today = Hoy
calendar.month = Mes
calendar.week = Semana
calendar.agenda = Agenda
calendar.generateFromPlan = Mandar a calendario
piece.modal.title = Nombre de la pieza
piece.modal.copy = Copy
piece.modal.script = Guion
piece.modal.audience = Público objetivo
piece.modal.account = Cuenta de referencia
piece.modal.plan = Plan de referencia
piece.modal.asset = Archivo de la pieza
piece.modal.save = Guardar
piece.modal.schedule = Programar
piece.modal.close = Cerrar
status.nextUp = Próximo a publicar
status.published = Publicado
status.error = Error al publicar
autopost.enabled = Autopublicar a la hora programada
autopost.retryNow = Reintentar ahora
```

calendar.title = Calendario calendar.today = Hoy calendar.month = Mes calendar.week = Semana calendar.agenda = Agenda calendar.generateFromPlan = Mandar a calendario piece.modal.title = Nombre de la pieza piece.modal.copy = Copy piece.modal.script = Guion piece.modal.audience = Público objetivo piece.modal.account = Cuenta de referencia piece.modal.plan = Plan de referencia piece.modal.asset = Archivo de la pieza piece.modal.save = Guardar piece.modal.schedule = Programar piece.modal.close = Cerrar

```

---

## 14) QA (criterios de aceptación)
1. Desde un plan con **Inicio/Fin** y **Frecuencia**, el botón **Mandar a calendario** abre previsualización con **N** piezas con **título, copy, guion y público objetivo**.
2. **Confirmar** inserta las piezas en el mes/semana correctos, cada una con estado `draft` o `scheduled`.
3. Click en una pieza abre el **Popup** con: **Nombre**, **Copy**, **Guion**, **Público objetivo**, **Cuenta referencia**, **Plan referencia** y **Rectángulo para subir asset** en la **esquina superior derecha**.
4. **Autopost**: piezas `scheduled` con `autopostEnabled` entran a **cola**; a **T−10** muestran **ruedita**; tras publicar muestran **check**; si falla, muestran **X** y permiten **Reintentar ahora**.
5. Subir un asset lo muestra como miniatura; se guarda vinculado a la **cuenta** seleccionada.
6. Drag & drop reprograma fecha/hora y respeta conflictos de **cuenta** (alerta si solapa).
7. Accesibilidad: grid por teclado, `aria-live` para cambio de estado, `Esc` cierra modales, `Cmd/Ctrl+S` guarda en el Popup.

---

## 15) Redlines & clases Tailwind de referencia
- **Chip pieza (rectangulito)**: `relative rounded-md border border-[#E5E5E5] bg-white/70 px-2 py-1 text-xs`.
- **Banda Programado**: `before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[var(--accent-400)]`.
- **Icono de estado** (esquina sup. derecha del chip): `absolute right-1 top-1 h-3.5 w-3.5 text-black/50`  
  - Próximo/En curso: `i data-lucide="loader-2" class="animate-spin"`
  - Publicado: `i data-lucide="check" class="text-[#1B8A4B]"`
  - Error: `i data-lucide="x" class="text-[var(--accent-600)]"`
- **Popup contenedor**: `rounded-2xl border border-[#E5E5E5] bg-white/70 shadow-lg`.
- **Asset dropzone**: `rounded-md border border-dashed border-[#E5E5E5] bg-white/50 p-3`.
- **Botón primario**: `text-black hover:text-white hover:bg-[var(--accent-600)] ring-1 ring-transparent hover:ring-[var(--accent-600)]/70 hover:shadow-[0_0_0_6px_rgba(138,15,28,0.10)]`.

---

> **Actualizado**: Autopost con cola y **iconografía (ruedita/check/X)**, estados accesibles y endpoints de publicación/reintentos/webhooks. Además, el detalle de la pieza se **autocompleta** desde la IA al generar.

```
