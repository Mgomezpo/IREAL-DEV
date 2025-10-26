# IREAL — Guía de Estilo UX/UI v1

> Documento maestro de **estilos gráficos**. Define tokens, tipografías, superficies, movimiento y patrones UI para toda la app. Base 100% alineada con el código de referencia (Tailwind + Playfair/Inter + Lucide + tarjetas translúcidas + animación “página de cuaderno”).

---

## 0) Principios de diseño

- **Cuaderno mágico**: crema cálido, papel con líneas sutiles, sombras suaves, bordes redondeados.
- **Elegancia editorial**: Playfair para titulares, interlineado amplio, jerarquía clara.
- **Magia sutil**: chispas discretas ✨ en momentos clave (guardar/crear), micro‑hover, sin estridencias.
- **Accesible por defecto**: contraste ≥ 4.5:1, foco visible, navegación por teclado.
- **Consistencia**: todo componente usa los **tokens** definidos abajo.

---

## 1) Design Tokens

### 1.1 Colores

- **Base**
  - `surface` (fondo): `#FDF6EB`
  - `ink` (texto principal): `#000000`
  - `border`: `#E5E5E5`
  - `sidebar` (cuero): `#0E0E0E`
- **Acento granate (v2 suavizado)**
  - `accent-700`: `#6E0B14`
  - `accent-600`: `#8A0F1C` ← *CTA base*
  - `accent-500`: `#9F1522`
  - `accent-400`: `#B73A45`
  - `accent-300`: `#D66770` ← *barras/progreso*
- **Estados**
  - `success`: `#1B8A4B`
  - `warning`: `#B26B00`
  - `danger` (usa acento): `#8A0F1C`
  - `info`: `#0E4AA6`
- **Selección**: fondo `accent-300/10`, texto `ink`

**CSS variables sugeridas**

```css
:root{
  --surface:#FDF6EB; --ink:#000; --border:#E5E5E5; --sidebar:#0E0E0E;
  --accent-700:#6E0B14; --accent-600:#8A0F1C; --accent-500:#9F1522; --accent-400:#B73A45; --accent-300:#D66770;
}
::selection{ background: color-mix(in oklab, var(--accent-300) 12%, transparent); color: var(--ink); }
```

### 1.2 Tipografía

- **Familias**
  - Display/Headings: *Playfair Display* (500–700)
  - Cuerpo/UI: *Inter* (300–600)
- **Escala** (clases Tailwind recomendadas)
  - H1: `text-4xl md:text-5xl` · `tracking-tight` · **Playfair**
  - H2: `text-2xl md:text-3xl` · **Playfair**
  - H3: `text-lg` · **Playfair**
  - Body: `text-sm md:text-base` · **Inter** · `leading-7`
  - Overline/Meta: `text-xs` · `text-black/60`

### 1.3 Espaciado, radios y sombras

- **Espaciado**: seguir escala Tailwind (`2, 3, 4, 6, 8, 10, 12, 16…`).
- **Radios**: `rounded-md` (ítems), `rounded-xl` (cards), `rounded-2xl` (modales).
- **Sombras**:
  - `shadow-xs`: sutil en hover de cards.
  - `shadow` en modales + `backdrop-blur-sm`.

### 1.4 Movimiento (easing & tiempos)

- **Transición de página (cuaderno)**: `transform 700ms cubic-bezier(.2,.7,.1,1)`, `opacity 700ms`.
- **Hover micro**: 150–200 ms.
- **Sparkle**: 650 ms aparecer/desaparecer.
- **Respeta** `prefers-reduced-motion` (usar fades sin desplazamiento).

### 1.5 Iconografía

- **Lucide** `stroke-width: 1.5`.
- Tamaños: 16/20/24 px; color por defecto `currentColor`.
- Decorativos con `aria-hidden="true"`; botones icónicos con `aria-label`.

---

## 2) Superficies & patrones

- **Papel**: `bg-[var(--surface)]` con líneas opcionales en páginas tipo editor (`repeating-linear-gradient` cada 32px al 6% de opacidad).
- **Tarjeta**: `rounded-xl border border-[var(--border)] bg-white/40 p-5 hover:shadow-sm`.
- **Sidebar (cuero)**: `bg-[var(--sidebar)] text-white` + bordes `white/10`.
- **Divisores**: `border-[var(--border)]`.
- **Page edge**: degradado vertical sutil a la derecha: `bg-gradient-to-l from-black/5 to-transparent`.

---

## 3) Componentes base

### 3.1 Botones

- **Primario**: texto negro → *hover* texto blanco + `bg-[var(--accent-600)]` + `ring-1 ring-[var(--accent-600)]/70` + sombra `0 0 0 6px rgba(138,15,28,.10)`.
- **Secundario (ghost)**: `ring-1 ring-transparent hover:bg-[var(--accent-600)]/10`.
- **Icon‑only**: tamaño 36–40 px, `rounded-sm`, `aria-label` obligatorio.
- **Deshabilitado**: `opacity-50 cursor-not-allowed`.

**Ejemplo Tailwind**\
`class="group relative text-base text-black hover:text-white hover:bg-[var(--accent-600)] rounded-sm ring-1 ring-transparent hover:ring-[var(--accent-600)]/70 hover:shadow-[0_0_0_6px_rgba(138,15,28,.10)] px-1 py-0.5 transition"`

### 3.2 Inputs

- `bg-transparent border border-[var(--border)] focus:border-black focus:ring-0 rounded-md px-3 py-2 text-sm placeholder-black/40`.
- Estados: `error` → borde `accent-600/70` + ayuda `accent-600` sobre `bg-[var(--accent-600)]/8`.

### 3.3 Cards de lista/ítem

- Contenedor: ver *Tarjeta*.
- *Hover*: `bg-white/70`.
- *Selected*: `ring-1 ring-[var(--accent-400)]/30`.

### 3.4 Chips & Badges

- Chip neutro: `bg-black/5 text-black rounded-md px-2 py-0.5 text-xs`.
- Chip activo: `bg-[var(--accent-400)]/12 text-black`.
- Badge de estado (programado/publicado) con banda lateral `accent-400`/check `accent-600`.

### 3.5 Tooltips / Banners / Toasts

- Tooltip: `bg-black text-white text-xs px-2 py-1 rounded`.
- Banner info/error: borde `accent-600/70`, texto `accent-600`, fondo `accent-600/8`.
- Toast: tarjeta compacta `bg-white/80 backdrop-blur`.

### 3.6 Modales

- Overlay: `bg-black/30 backdrop-blur-sm`.
- Contenedor: `rounded-2xl border border-[var(--border)] bg-white/70 shadow-lg`.

---

## 4) Navegación & layout

- **Contenedor**: `max-w-7xl mx-auto px-6 py-10`.
- **Sidebar**: 72 px de ancho, nav vertical con íconos Lucide.
- **Top bar móvil**: sticky, `bg-surface/95` + `border-b`.
- **Grid**: uso de `md:grid-cols-3 gap-6` (dashboard), y `lg:grid-cols-12` (hojas de cuadros).

---

## 5) Patrones especiales de IREAL

### 5.1 Animación “página del cuaderno”

- **Show**: `rotateY(6deg) → 0` + `translateX(24px) → 0` + `opacity 0 → 1`.
- **Hide**: inversión de valores.

### 5.2 “Sparkle” mágico

- Icono `sparkles` aparece y se desvanece (650 ms) junto a inputs al completar.

### 5.3 Nudge de IA (flechita 90°)

- Bloque inline con flecha en L, `bg-[#F1E7D7]` (crema 10–12% más oscuro), borde `border`, texto `text-sm`.
- Acciones: **Insertar**, **Regenerar**, **Descartar**.

### 5.4 Editor rayado

- Fondo papel con reglas (`repeating-linear-gradient` cada 32px).
- Título grande Playfair, área `contenteditable` sin bordes, autosave visible.

### 5.5 Calendario

- Grid 7×5/6, “Hoy” con contorno `accent-600`.
- “Rectangulitos” de pieza: `rounded-md border bg-white/70 px-2 py-1` con icono de canal.

---

## 6) Accesibilidad

- Contraste de botones en hover ≥ 4.5:1 (texto blanco sobre `accent-600`).
- Foco visible siempre (`ring-1` + offset cuando aplique).
- Navegación por teclado en grids (calendario), listas y modales (trampa de foco).
- `aria-live="polite"` para conteos dinámicos.

---

## 7) Copy & tono

- **Cálido y editorial**: “Convierte tu idea en un hechizo de contenido.”
- Placeholders útiles (“3 bullets principales”, “dd/mm/aaaa”).
- Mensajes de sistema breves: “Guardado”, “Reprogramado para vie 10, 9:30”.

---

## 8) Tailwind config (sugerido)

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        surface: '#FDF6EB',
        border: '#E5E5E5',
        ink: '#000000',
        accent: {
          300: '#D66770', 400: '#B73A45', 500: '#9F1522', 600: '#8A0F1C', 700: '#6E0B14'
        }
      },
      fontFamily: {
        display: ['\"Playfair Display\"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        focus: '0 0 0 6px rgba(138,15,28,.10)'
      }
    }
  }
}
```

---

## 9) Do/Don’t rápido

- ✅ Usa `accent-600` sólo para acciones clave; preferir `accent-300` para barras/realces.
- ✅ Mantén bordes `#E5E5E5` y fondos translúcidos.
- ✅ Iconos monocromos; evita multicolor.
- ❌ No uses rojos saturados fuera de la escala definida.
- ❌ No abuses de sombras duras ni bordes negros.

---

## 10) Checklist de consistencia (QA visual)

1. Todas las pantallas usan fondo `#FDF6EB` y divisores `#E5E5E5`.
2. Titulares en **Playfair**; body/interacciones en **Inter**.
3. Botones primarios con hover granate suavizado + foco visible.
4. Cards translúcidas con `bg-white/40–70` y border estándar.
5. Animaciones siguen el preset “página de cuaderno”.
6. Accesibilidad y contraste OK.

---

> **Cómo usar este documento:** Antes de crear o ajustar un flujo, valida tokens, tipografías y patrones aquí. Los *docs de flujo* referencian estos estilos sin redefinirlos.

