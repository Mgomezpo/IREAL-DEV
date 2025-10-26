# IREAL — Flujo 1 · Dashboard (Detallado)

> Este documento define **a profundidad** el Dashboard de IREAL. Mantiene consistencia con la **Guía de Estilo UX/UI v1**: fondo `#FDF6EB`, texto negro, divisores `#E5E5E5`, acento granate `#8A0F1C`, familias *Playfair Display* (headings) e *Inter* (UI); iconos Lucide; tarjetas translúcidas; animación “página del cuaderno”.

---

## 1) Propósito del Dashboard

- **Inspirar y orientar** al creador cada vez que entra: qué ideas hay, qué planes siguen, qué tocar hoy.
- **Acciones rápidas** sin salir: crear idea/plan, ir al calendario, revisar lo de hoy.
- **Resumen operativo 24–48h**.

**KPIs UX**

- Tiempo a acción clave < **6 s** (crear idea/plan).
- Tasa de rebote a otras vistas con intención (Ideas/Planes/Calendario) > **60%**.
- Descubrimiento de “Generar calendario” > **35%** usuarios activos/semana.

---

## 2) IA & Usuarios

- **Roles:** Creador (default), Editor, Brand (mismo UI, permisos varían en publicar/editar integraciones).
- **Personalización:** saludo “Bienvenido a tu espacio mágico, {nombre}”.
- **Estados de demo:** si no hay datos, cargar *seed* (3 ideas, 1 plan, 1 publicación).

---

## 3) Arquitectura de Información

- **Sidebar** (borde del cuaderno) fijo en desktop.
- **Main** con **Header** + **Grid de tarjetas** (Ideas, Planes, Publicaciones) + **Resumen** (Ayer/Hoy/Mañana).
- **Top bar móvil** para `<lg`.

---

## 4) Layout, Redlines y Tipografía

- **Contenedor**: `max-w-7xl mx-auto px-6 py-10`.
- **Header**: margen inferior `mb-8`.
- **Grid superior**: `grid md:grid-cols-3 gap-6`.
- **Resumen**: tarjeta `mt-8` a ancho completo.
- **Headings**: Playfair `H2 text-2xl md:text-3xl tracking-tight font-semibold`.
- **Body**: Inter `text-sm md:text-base leading-7`.

---

## 5) Sidebar (desktop)

- **Ancho** `w-72`, fondo `#0E0E0E`, texto blanco.
- **Header**: logo cuadrado 36×36 (blanco), “ireal” en Playfair, subtítulo “Cuaderno de contenidos”.
- **Items** (Lucide + texto): Dashboard, Ideas, Planes, Calendario, Biblioteca, Analytics. Hover `bg-white/5`.
- **Footer**: Configuración (flecha `chevron-right`).
- **Activo**: marca lateral `bg-white/20` + texto `white`.

**Accesibilidad**: nav con `role="navigation"`, `aria-current="page"` en el activo.

---

## 6) Top bar móvil

- `sticky top-0 z-20 bg-[#FDF6EB]/95 backdrop-blur border-b border-[#E5E5E5]`.
- Acciones: **Menú**, marca mini, **Ajustes**.
- Menú móvil despliega atajos a Editor mágico y Configuración.

---

## 7) Header del Dashboard

- **Título**: “Tu página de hoy” (H1 visual H2).
- **Subtítulo**: “Convierte tu idea en un hechizo de contenido.”
- **Acciones** (derecha):
  - **Crear plan** (primario): hover `bg-[var(--accent-600)]` (granate), texto blanco.
  - **Generar calendario** (primario)

**Eventos (analytics)**

- `dashboard_open`, `cta_create_plan_click`, `cta_generate_calendar_click`.

---

## 8) Tarjeta — Ideas

- **Componente**: `CardList`
- **Header**: icono `feather`, título “Ideas”, botón **Ver todo**.
- **Items (máx 3)**:
  - Formato: `text-sm text-black/80` con título y *optional* fecha `text-black/60`.
  - Click → `/ideas/:id`.
- **Empty**: “Aún no hay ideas. Empieza una ✨” + CTA **Nueva idea**.
- **Hover**: `bg-white/60` → `bg-white/70` + `shadow-xs`.

**Eventos**: `dashboard_card_ideas_open_list`, `dashboard_card_ideas_open_item`.

---

## 9) Tarjeta — Planes

- **Header**: `file-text`, “Planes”, **Ver todo**.
- **Items (2–3)**: título + **badge de estado** (Borrador/Activo) + % **progreso** (barra fina `accent-300`).
- Click → `/planes/:id`.
- **Empty**: “Crea tu primer plan y el cuaderno cobrará vida ✨”.

**Progreso barra**

- Fondo `bg-black/10`, relleno `bg-[var(--accent-300)]` (granate claro), radio `rounded-full`, altura `h-2`.

---

## 10) Tarjeta — Publicaciones / Calendario

- **Header**: `calendar-check-2` o `send`, “Publicaciones”.
- **Contenido**: “{N} programadas para esta semana”. Línea **Hoy**: “Tienes {X} contenidos programados”.
- **CTA**: **Ver todo** → `/calendario?view=week&focus=today`.

---

## 11) Módulo — Resumen (ancho)

- **Bloques**: **Ayer**, **Hoy**, **Mañana** (ordenados izquierda→derecha).
- **Cada bloque**: lista de títulos (máx. 5) con chip de **estado** (publicado/programado).
- **Acción**: **Ver más** si >5.

---

## 12) Estados del sistema

- **Loading**: esqueletos en cards (3 filas `h-4 bg-black/5 rounded`).
- **Empty**: copia cálida + CTA.
- **Error**: banner suave `border-[var(--accent-600)]/70 text-[var(--accent-600)] bg-[var(--accent-600)]/8` + “Reintentar”.

---

## 13) Interacciones clave

- Animación de transición **notebook** al navegar a Ideas/Planes/Calendario.
- Micro‑sparkle ✨ al crear idea/plan.
- Foco visible en todos los `:focus`.
- Teclado: `G` abre **Generar calendario**, `/` foco en **Buscar** (si presente), `Alt+1/2/3` enfoca card 1/2/3.

---

## 14) Performance

- Objetivo TTI < **2.5 s** en 3G rápido.
- Carga **perezosa** de tarjetas (IntersectionObserver) + prefetch on‑hover para enlaces.
- Cache de `ideasRecent` y `plansRecent` **60 s**.

---

## 15) Datos y Binding

- **Ideas**: `GET /ideas?limit=3&sort=recent` → `{id,title,updatedAt}`.
- **Planes**: `GET /planes?limit=3&sort=recent` → `{id,title,progress,status}`.
- **Calendario**: `GET /calendario/summary?range=this_week` → `{weekCount,todayCount}`.
- **Resumen**: `GET /calendario/summary?range=yesterday,today,tomorrow`.

**Errores**

- Si `ideas` o `planes` fallan, mostrar card con banner y botón **Reintentar** (re‑hit sólo ese endpoint).

---

## 16) Accesibilidad

- `main` con `role="main"`.
- Headings jerárquicos (H1: “Tu página de hoy”).
- Iconos decorativos `aria-hidden="true"`. Icon buttons con `aria-label`.
- `aria-live="polite"` en contadores dinámicos.
- Contraste validado (texto blanco sólo sobre `accent-600`/700).

---

## 17) Responsivo

- **Mobile (< md)**: una columna; tarjetas a ancho completo; top bar móvil visible.
- **Tablet (md)**: 2–3 columnas según ancho.
- **Desktop (≥ lg)**: 3 columnas + Resumen ancho.

---

## 18) Internacionalización (i18n)

- Claves sugeridas:

```
dashboard.title = Tu página de hoy
dashboard.subtitle = Convierte tu idea en un hechizo de contenido.
dashboard.ideas = Ideas
dashboard.plans = Planes
dashboard.posts = Publicaciones
dashboard.viewAll = Ver todo
```

---

## 19) Seguridad y privacidad

- No renderizar emails completos en cards; sólo nombre/título.
- Evitar datos sensibles en querystring; usar IDs opacos.

---

## 20) Componentes (Stitch) & Props

- `SidebarNotebook({activeRoute})`
- `TopbarMobile({onMenu,onSettings})`
- `PageHeader({title,subtitle,actions})`
- `CardList({icon,title,items,onViewAll,emptyState})`
- `SummaryStrip({yesterday,today,tomorrow,onViewMore})`
- `MagicButton({variant:'primary'|'ghost',onClick})`

**Ejemplo **``

```ts
{ id:'i1', title:'Checklist pre‑publicación', meta:'Ayer 9:40', href:'/ideas/i1' }
```

---

## 21) QA (Criterios de aceptación)

1. El grid superior muestra exactamente 3 tarjetas en `≥768px` y 1 en `<768px`.
2. Los CTAs **Crear plan** y **Generar calendario** están visibles y con hover/focus correctos.
3. `Ver todo` de cada card navega a la vista correspondiente.
4. Esqueletos visibles mientras se cargan datos; errores se muestran sólo en la card afectada.
5. Resumen lista Ayer/Hoy/Mañana acorde al API; al hacer click en un ítem abre el detalle correspondiente (calendario o publicación).
6. Reglas de accesibilidad y contraste superadas (axe-core sin issues críticas).

---

## 22) Anexos — Clases Tailwind útiles

- Card base: `rounded-xl border border-[#E5E5E5] bg-white/40 p-5 hover:shadow-sm`.
- Botón primario: `group relative text-base text-black hover:text-white hover:bg-[var(--accent-600)] rounded-sm ring-1 ring-transparent hover:ring-[var(--accent-600)]/70 hover:shadow-[0_0_0_6px_rgba(138,15,28,0.10)] px-1 py-0.5 transition`.
- Encabezado H2: `text-2xl md:text-3xl tracking-tight font-semibold font-display`.

---

> **Listo para implementación**. En el siguiente documento detallaremos **Flujo 2 — Ideas** con la misma profundidad (lista, editor minimal, nudge de IA y modal de “Agregar a…”).

