# IREAL — Flujo 0 · Landing & Autenticación (Detallado)

> Alcance: **Landing (tapa del cuaderno)** y **Autenticación** (tabs Login/Registro dentro de la app + página de **Login independiente sin verificación**). Mantiene coherencia con la **Guía de Estilo UX/UI v1** (crema `#FDF6EB`, divisores `#E5E5E5`, Playfair/Inter, iconos Lucide, acento granate suavizado `#8A0F1C`, tarjetas translúcidas y animación “página del cuaderno”).

---

## 1) Propósito y objetivos UX

- Dar **bienvenida** con una tapa de cuaderno sobria y mágica.
- Permitir **entrar** con el menor esfuerzo posible: login/registro o **demo**.
- Establecer el **lenguaje visual** (papel, cuero, chispas ✨, transición de página) que heredan los demás flujos.

**Métricas clave**
- Tasa de click en **Entrar como demo** ≥ **35%** de primeras visitas.
- Tasa de conversión **Landing → Auth** ≥ **60%**.
- LCP (Landing) < **2.5 s** en 3G rápido.

---

## 2) Alcance del Flujo 0

- **Landing** (tapa del cuaderno): logo repujado, claim y CTAs *Iniciar sesión* / *Registrarse*.
- **Auth in‑app** (pestañas Login/Registro) con **Entrar como demo**.
- **Login independiente** (standalone) **sin verificación de correo** (form simple, submit a backend futuro).

> **Nota de consistencia cromática:** Los snippets provistos usan `#960018` para CTAs. En la guía v1 el acento base es `#8A0F1C` (*accent‑600*). Para mantener la consistencia, en implementación final sustituir `#960018` por `var(--accent-600)` (`#8A0F1C`) en clases `hover:bg`, `hover:ring` y `shadow`.

---

## 3) Rutas y navegación

- `/` → **Landing**.
- `/auth` → **Auth in‑app** (tabs Login/Registro).
- `/login` → **Login independiente**.

**Transición de páginas**: preset “cuaderno” (`rotateY(±6deg) + translateX(±24px) + opacity 700ms`).

---

## 4) Landing — Especificación visual y de interacción

**Hero** centrado, logo repujado (Playfair), claim “El workspace mágico…”, CTAs gemelos (*Iniciar sesión* / *Registrarse*) y micro‑sparkle decorativo. Fondo cuero `#0E0E0E` con grano sutil y bordeado fino `ring-white/5`.

**Acciones**
- Click en **Iniciar sesión** → `openNotebook('login')` → navega a `/auth` con tab Login activa.
- Click en **Registrarse** → `openNotebook('register')` → `/auth` con tab Registro activa.

**Accesibilidad**
- Títulos con Playfair, contraste verificado; botones con foco visible (`ring` + sombra suave), iconos decorativos `aria-hidden="true"`.

### 4.1 Código de referencia — Landing + Shell de Navegación (provisto, sin cambios)

> Incluye **Landing**, **Auth in‑app** y shell de navegación/animación. (Se conservan los colores tal cual se entregaron; ver Nota de consistencia para adaptar a `#8A0F1C` en implementación.)

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>IREAL – El workspace mágico para Magos del Contenido</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="antialiased selection:bg-[#960018]/10 selection:text-black bg-[#FDF6EB] text-black" style="font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'">
  <!-- App Container -->
  <div id="app" class="relative min-h-screen w-full">
    <!-- PAGE: Landing (Tapa del cuaderno) -->
    <section id="page-landing" class="page fixed inset-0 z-30 overflow-hidden bg-[#0E0E0E]">
      <!-- Subtle grain/pattern -->
      <div class="absolute inset-0 pointer-events-none" style="background: radial-gradient(1200px 600px at 20% 0%, rgba(255,255,255,0.02), rgba(255,255,255,0) 40%), radial-gradient(1000px 400px at 80% 100%, rgba(255,255,255,0.02), rgba(255,255,255,0) 40%);"></div>
      <!-- Leather edge bevel -->
      <div class="absolute inset-0 ring-1 ring-white/5"></div>

      <div class="relative flex h-full w-full items-center justify-center px-6">
        <div class="mx-auto flex max-w-3xl flex-col items-center text-center">
          <!-- Embossed logo -->
          <div class="relative mb-6">
            <div class="relative inline-block">
              <span class="block text-[56px] md:text-[92px] font-semibold tracking-tight uppercase" style="font-family: 'Playfair Display', serif;">
                <span class="absolute inset-0 translate-x-[2px] translate-y-[2px] text-white/5">ireal</span>
                <span class="absolute inset-0 -translate-x-[1px] -translate-y-[1px] text-black/40">ireal</span>
                <span class="relative text-white/15">ireal</span>
              </span>
              <!-- subtle spark -->
              <i data-lucide="sparkles" class="absolute -top-3 -right-6 h-5 w-5 text-white/30"></i>
            </div>
          </div>

          <p class="text-base md:text-lg text-white/70 mb-10">El workspace mágico para Magos del Contenido</p>

          <div class="flex items-center gap-6">
            <button onclick="openNotebook('login')" class="group relative text-base md:text-lg text-white/90 hover:text-white hover:bg-[#960018] focus:outline-none rounded-sm ring-1 ring-transparent hover:ring-[#960018]/80 hover:shadow-[0_0_0_6px_rgba(150,0,24,0.15)] px-1 py-0.5 transition">
              Iniciar sesión
              <span class="absolute -right-4 top-1/2 -translate-y-1/2 h-1 w-1 rounded-full bg-[#960018]/60 opacity-0 scale-0 transition group-hover:opacity-100 group-hover:scale-100"></span>
            </button>
            <button onclick="openNotebook('register')" class="group relative text-base md:text-lg text-white/90 hover:text-white hover:bg-[#960018] focus:outline-none rounded-sm ring-1 ring-transparent hover:ring-[#960018]/80 hover:shadow-[0_0_0_6px_rgba(150,0,24,0.15)] px-1 py-0.5 transition">
              Registrarse
              <span class="absolute -right-4 top-1/2 -translate-y-1/2 h-1 w-1 rounded-full bg-[#960018]/60 opacity-0 scale-0 transition group-hover:opacity-100 group-hover:scale-100"></span>
            </button>
          </div>

          <!-- Edge binding hint -->
          <div class="pointer-events-none mt-20 w-full h-6 bg-gradient-to-b from-white/10 to-transparent rounded-t-xl"></div>
        </div>
      </div>
    </section>

    <!-- PAGE: Auth (Login / Registro) -->
    <section id="page-auth" class="page fixed inset-0 z-20 hidden overflow-y-auto bg-[#FDF6EB]">
      <!-- Top subtle divider and magic line pattern -->
      <div class="sticky top-0 z-10 bg-[#FDF6EB]/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm border-b border-[#E5E5E5]">
        <div class="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-8 w-8 rounded-sm bg-[#0E0E0E] text-white flex items-center justify-center tracking-tight" style="font-family:'Playfair Display',serif">i</div>
            <span class="text-sm text-black/60">Abre tu cuaderno mágico</span>
          </div>
          <button onclick="navigateTo('workspace')" class="group relative text-sm text-black hover:text-white hover:bg-[#960018] focus:outline-none rounded-sm ring-1 ring-transparent hover:ring-[#960018]/80 hover:shadow-[0_0_0_6px_rgba(150,0,24,0.12)] px-1 py-0.5 transition">
            Entrar como demo
            <span class="absolute -right-3 top-1/2 -translate-y-1/2 h-1 w-1 rounded-full bg-[#960018]/60 opacity-0 scale-0 transition group-hover:opacity-100 group-hover:scale-100"></span>
          </button>
        </div>
      </div>

      <div class="mx-auto max-w-4xl px-6 pt-10 pb-16">
        <div class="mb-10">
          <h1 class="text-3xl md:text-4xl tracking-tight font-semibold text-black" style="font-family:'Playfair Display',serif">Abre tu cuaderno mágico</h1>
          <p class="text-black/70 mt-2 text-sm md:text-base">Organiza ideas, convierte chispas en estrategias, escribe tu primera página.</p>
        </div>

        <!-- Tabs Login / Registro -->
        <div class="mb-8 flex items-center gap-6">
          <button id="tab-login" onclick="setAuthTab('login')" class="group relative text-base text-black hover:text-white hover:bg-[#960018] rounded-sm ring-1 ring-transparent hover:ring-[#960018]/80 hover:shadow-[0_0_0_6px_rgba(150,0,24,0.12)] px-1 py-0.5 transition">
            Iniciar sesión
            <span class="absolute -right-3 top-1/2 -translate-y-1/2 h-1 w-1 rounded-full bg-[#960018]/60 opacity-0 scale-0 transition group-hover:opacity-100 group-hover:scale-100"></span>
          </button>
          <button id="tab-register" onclick="setAuthTab('register')" class="group relative text-base text-black/60 hover:text-white hover:bg-[#960018] rounded-sm ring-1 ring-transparent hover:ring-[#960018]/80 hover:shadow-[0_0_0_6px_rgba(150,0,24,0.12)] px-1 py-0.5 transition">
            Crear cuenta
            <span class="absolute -right-3 top-1/2 -translate-y-1/2 h-1 w-1 rounded-full bg-[#960018]/60 opacity-0 scale-0 transition group-hover:opacity-100 group-hover:scale-100"></span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <!-- Illustration / copy -->
          <div class="order-2 md:order-1">
            <div class="relative rounded-xl border border-[#E5E5E5] p-6 bg-white/40">
              <div class="mb-4 flex items-center gap-3">
                <i data-lucide="notebook-pen" class="h-5 w-5 text-black"></i>
                <p class="text-sm text-black/70">Tu cuaderno, tus reglas</p>
              </div>
              <p class="text-sm text-black/70 leading-relaxed">Diseñado para planificar, crear y publicar con precisión editorial. Cada pantalla es una página de un cuaderno que te acompaña a convertir ideas en hechizos de contenido.</p>
              <i data-lucide="sparkles" class="absolute -top-2 -right-2 h-4 w-4 text-black/40"></i>
            </div>
          </div>

          <!-- Forms -->
          <div class="order-1 md:order-2">
            <!-- Login Form -->
            <form id="form-login" class="space-y-5">
              <div>
                <label class="block text-sm text-black/70 mb-2">Email</label>
                <div class="relative">
                  <input type="email" class="w-full bg-transparent border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-md px-3 py-2 text-sm placeholder-black/40" placeholder="tu@email.com" />
                  <i data-lucide="sparkles" class="spark absolute -right-4 -top-3 h-4 w-4 text-[#960018]/80 opacity-0 scale-75 transition"></i>
                </div>
              </div>
              <div>
                <label class="block text-sm text-black/70 mb-2">Contraseña</label>
                <div class="relative">
                  <input type="password" class="w-full bg-transparent border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-md px-3 py-2 text-sm placeholder-black/40" placeholder="••••••••" />
                  <i data-lucide="sparkles" class="spark absolute -right-4 -top-3 h-4 w-4 text-[#960018]/80 opacity-0 scale-75 transition"></i>
                </div>
              </div>
              <div class="flex items-center justify-between pt-2">
                <button type="button" onclick="navigateTo('workspace')" class="group relative text-base text-black hover:text-white hover:bg-[#960018] rounded-sm ring-1 ring-transparent hover:ring-[#960018]/80 hover:shadow-[0_0_0_6px_rgba(150,0,24,0.12)] px-1 py-0.5 transition">
                  Entrar
                  <span class="absolute -right-3 top-1/2 -translate-y-1/2 h-1 w-1 rounded-full bg-[#960018]/60 opacity-0 scale-0 transition group-hover:opacity-100 group-hover:scale-100"></span>
                </button>
                <button type="button" onclick="setAuthTab('register')" class="text-sm text-black/60 hover:text-white hover:bg-[#960018] rounded-sm px-1 py-0.5 transition">Crear cuenta</button>
              </div>
            </form>

            <!-- Register Form -->
            <form id="form-register" class="hidden space-y-5">
              <div>
                <label class="block text-sm text-black/70 mb-2">Nombre</label>
                <div class="relative">
                  <input type="text" class="w-full bg-transparent border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-md px-3 py-2 text-sm placeholder-black/40" placeholder="Tu nombre" />
                  <i data-lucide="sparkles" class="spark absolute -right-4 -top-3 h-4 w-4 text-[#960018]/80 opacity-0 scale-75 transition"></i>
                </div>
              </div>
              <div>
                <label class="block text-sm text-black/70 mb-2">Email</label>
                <div class="relative">
                  <input type="email" class="w-full bg-transparent border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-md px-3 py-2 text-sm placeholder-black/40" placeholder="tu@email.com" />
                  <i data-lucide="sparkles" class="spark absolute -right-4 -top-3 h-4 w-4 text-[#960018]/80 opacity-0 scale-75 transition"></i>
                </div>
              </div>
              <div>
                <label class="block text-sm text-black/70 mb-2">Contraseña</label>
                <div class="relative">
                  <input type="password" class="w-full bg-transparent border border-[#E5E5E5] focus:border-black focus:ring-0 rounded-md px-3 py-2 text-sm placeholder-black/40" placeholder="••••••••" />
                  <i data-lucide="sparkles" class="spark absolute -right-4 -top-3 h-4 w-4 text-[#960018]/80 opacity-0 scale-75 transition"></i>
                </div>
              </div>
              <div class="flex items-center justify-between pt-2">
                <button type="button" onclick="navigateTo('workspace')" class="group relative text-base text-black hover:text-white hover:bg-[#960018] rounded-sm ring-1 ring-transparent hover:ring-[#960018]/80 hover:shadow-[0_0_0_6px_rgba(150,0,24,0.12)] px-1 py-0.5 transition">
                  Crear cuenta
                  <span class="absolute -right-3 top-1/2 -translate-y-1/2 h-1 w-1 rounded-full bg-[#960018]/60 opacity-0 scale-0 transition group-hover:opacity-100 group-hover:scale-100"></span>
                </button>
                <button type="button" onclick="setAuthTab('login')" class="text-sm text-black/60 hover:text-white hover:bg-[#960018] rounded-sm px-1 py-0.5 transition">Ya tengo cuenta</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>

    <!-- PAGE: Workspace (Dashboard) -->
    <section id="page-workspace" class="page fixed inset-0 z-10 hidden overflow-hidden">
      <!-- … (contenido de workspace del snippet original) … -->
    </section>

    <!-- PAGE: Editor de Contenidos -->
    <section id="page-editor" class="page fixed inset-0 z-10 hidden overflow-y-auto bg-[#FDF6EB]">
      <!-- … (contenido de editor del snippet original) … -->
    </section>

    <!-- PAGE: Configuración -->
    <section id="page-settings" class="page fixed inset-0 z-10 hidden overflow-y-auto bg-[#FDF6EB]">
      <!-- … (contenido de settings del snippet original) … -->
    </section>
  </div>

  <script>
    // Initialize lucide icons
    document.addEventListener('DOMContentLoaded', () => {
      lucide.createIcons({ attrs: { 'stroke-width': 1.5 } });
    });

    // Navigation state
    let currentPage = 'page-landing';

    function showPage(id) {
      document.querySelectorAll('.page').forEach(p => p.classList.add('pointer-events-none'));
      const next = document.getElementById(id);
      next.classList.remove('hidden');
      requestAnimationFrame(() => {
        next.style.transform = 'perspective(1200px) rotateY(6deg) translateX(24px)';
        next.style.opacity = '0';
        next.classList.remove('pointer-events-none');
        next.style.transition = 'transform 700ms cubic-bezier(.2,.7,.1,1), opacity 700ms cubic-bezier(.2,.7,.1,1)';
        requestAnimationFrame(() => {
          next.style.transform = 'perspective(1200px) rotateY(0deg) translateX(0px)';
          next.style.opacity = '1';
        });
      });
    }

    function hidePage(id) {
      const cur = document.getElementById(id);
      if (!cur || cur.classList.contains('hidden')) return;
      cur.style.transition = 'transform 700ms cubic-bezier(.2,.7,.1,1), opacity 700ms cubic-bezier(.2,.7,.1,1)';
      cur.style.transform = 'perspective(1200px) rotateY(-6deg) translateX(-24px)';
      cur.style.opacity = '0';
      setTimeout(() => {
        cur.classList.add('hidden');
        cur.removeAttribute('style');
      }, 720);
    }

    function navigateTo(view) {
      const map = {
        'landing': 'page-landing',
        'auth': 'page-auth',
        'workspace': 'page-workspace',
        'editor': 'page-editor',
        'settings': 'page-settings'
      };
      const nextId = map[view] || 'page-landing';
      const prevId = currentPage;
      if (prevId === nextId) return;
      hidePage(prevId);
      showPage(nextId);
      currentPage = nextId;
      // re-render icons if needed
      setTimeout(() => lucide.createIcons({ attrs: { 'stroke-width': 1.5 } }), 30);
    }

    function openNotebook(mode) {
      // from landing to auth with page opening flavor
      navigateTo('auth');
      setTimeout(() => setAuthTab(mode === 'register' ? 'register' : 'login'), 400);
    }

    // Auth tab toggle
    function setAuthTab(which) {
      const loginBtn = document.getElementById('tab-login');
      const regBtn = document.getElementById('tab-register');
      const loginForm = document.getElementById('form-login');
      const regForm = document.getElementById('form-register');

      if (which === 'register') {
        loginBtn.classList.add('text-black/60');
        regBtn.classList.remove('text-black/60');
        loginForm.classList.add('hidden');
        regForm.classList.remove('hidden');
      } else {
        regBtn.classList.add('text-black/60');
        loginBtn.classList.remove('text-black/60');
        regForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
      }
    }

    // Mobile menu toggle
    function toggleMobileMenu() {
      const m = document.getElementById('mobileMenu');
      if (m) m.classList.toggle('hidden');
    }

    // Magic spark on input completion
    function attachSparkListeners() {
      const fields = document.querySelectorAll('input, textarea');
      fields.forEach(f => {
        f.addEventListener('blur', (e) => {
          const value = (e.target.value || '').toString().trim();
          const wrap = e.target.parentElement;
          if (!wrap) return;
          const spark = wrap.querySelector('.spark');
          if (spark && value.length > 0) {
            spark.style.opacity = '1';
            spark.style.transform = 'scale(1)';
            setTimeout(() => {
              spark.style.opacity = '0';
              spark.style.transform = 'scale(0.75)';
            }, 650);
          }
        });
      });
    }

    // Initial setup
    window.addEventListener('load', () => {
      attachSparkListeners();
      // Start at landing
      showPage('page-landing');
    });
  </script>
</body>
</html>
```

---

## 5) Autenticación — Especificación

### 5.1 In‑app (tabs Login/Registro)

- **Estructura**: header con marca mini + *Entrar como demo*; título Playfair; tabs **Iniciar sesión / Crear cuenta**; formulario minimal con *spark* al completar campo.
- **Entrar como demo**: `navigateTo('workspace')` (no crea sesión real; sirve para demo/marketing).
- **Validaciones (MVP)**: email formato básico; contraseña requerida (no verificación de correo).
- **Accesibilidad**: labels visibles; focus ring; `aria-live` para mensajes de error si se añaden.

### 5.2 Login independiente (sin verificación) — Código provisto

> Página dedicada (`/login`) para integrarse con backend futuro (`POST /auth/login`).

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
  <title>IREAL - Iniciar sesión</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@500;600&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="bg-[#FDF6EB] text-black" style="font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'">
  <div class="flex items-center justify-center min-h-screen px-6">
    <div class="w-full max-w-md p-8 space-y-8 rounded-xl border border-[#E5E5E5] bg-white/40">
      <div class="text-center">
        <h1 class="text-4xl tracking-tight font-semibold" style="font-family:'Playfair Display',serif">Iniciar sesión</h1>
        <p class="mt-2 text-sm text-black/60">Bienvenido de nuevo a tu cuaderno mágico.</p>
      </div>

      <form action="#" class="mt-8 space-y-6" method="POST">
        <input name="remember" type="hidden" value="true"/>

        <div class="rounded-md -space-y-px">
          <div>
            <label class="sr-only" for="email-address">Correo electrónico</label>
            <input
              autocomplete="email"
              class="appearance-none rounded-t-md relative block w-full px-3 py-3 border border-[#E5E5E5] placeholder-black/40 text-sm bg-transparent focus:outline-none focus:border-black focus:ring-0"
              id="email-address"
              name="email"
              placeholder="Correo electrónico"
              required
              type="email"
            />
          </div>
          <div>
            <label class="sr-only" for="password">Contraseña</label>
            <input
              autocomplete="current-password"
              class="appearance-none rounded-b-md relative block w-full px-3 py-3 border border-[#E5E5E5] placeholder-black/40 text-sm bg-transparent focus:outline-none focus:border-black focus:ring-0"
              id="password"
              name="password"
              placeholder="Contraseña"
              required
              type="password"
            />
          </div>
        </div>

        <div>
          <button
            class="group relative w-full flex justify-center py-3 px-4 text-base font-medium rounded-sm text-black hover:text-white hover:bg-[#960018] ring-1 ring-transparent hover:ring-[#960018]/80 hover:shadow-[0_0_0_6px_rgba(150,0,24,0.12)] transition"
            type="submit"
          >
            Iniciar sesión
            <span class="absolute -right-3 top-1/2 -translate-y-1/2 h-1 w-1 rounded-full bg-[#960018]/60 opacity-0 scale-0 transition group-hover:opacity-100 group-hover:scale-100"></span>
          </button>
        </div>
      </form>

      <div class="text-center">
        <p class="text-sm text-black/60">
          ¿No tienes una cuenta?
          <a class="font-medium text-[#960018] hover:text-[#960018]/80" href="#">
            Crear cuenta
          </a>
        </p>
      </div>
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      lucide.createIcons({ attrs: { 'stroke-width': 1.5 } });
    });
  </script>
</body>
</html>
```

---

## 6) Integración (MVP) & seguridad

- **Sin verificación por correo** (alcance pedido). Backend futuro:
  - `POST /auth/login { email, password }` → `200 { token }` | `401`.
  - `POST /auth/register { name, email, password }` → `201 { token }`.
- **Demo**: no toca backend; navega a `/workspace`.
- **Seguridad básica**: no loggear contraseñas; prevenir autofill malicioso; usar `type="password"` y `autocomplete` adecuado.

---

## 7) Accesibilidad

- Labels visibles o `sr-only` en inputs; `aria-invalid` si se añaden errores.
- Foco visible en CTAs (`ring` + `shadow focus`).
- Contraste ≥ 4.5:1 (texto blanco sólo sobre acento `accent-600`).

---

## 8) Analítica (eventos sugeridos)

- `landing_open` · `cta_login_click` · `cta_register_click` · `cta_demo_click`.
- `auth_tab_change { to: 'login'|'register' }`.
- `auth_login_submit` / `auth_register_submit` (éxito/error si se implementa backend).

---

## 9) QA (criterios de aceptación)

1. **Landing** carga con logo repujado, claim y dos CTAs operativos.
2. **Iniciar sesión** y **Registrarse** llevan a `/auth` con la pestaña correcta.
3. **Entrar como demo** navega a `/workspace`.
4. En **Auth**, el *sparkle* aparece al completar campos y desaparece suavemente.
5. **Login independiente** muestra el formulario minimal y activa el hover/focus en el botón.
6. Todos los controles son accesibles por teclado y tienen foco visible.

---

## 10) i18n (claves propuestas)

```
landing.title = El workspace mágico para Magos del Contenido
landing.login = Iniciar sesión
landing.register = Registrarse
auth.title = Abre tu cuaderno mágico
auth.demo = Entrar como demo
auth.login = Iniciar sesión
auth.register = Crear cuenta
login.title = Iniciar sesión
login.submit = Iniciar sesión
login.noAccount = ¿No tienes una cuenta?
login.create = Crear cuenta
```

---

> **Listo para implementación.** Este Flujo 0 define la puerta de entrada (Landing + Auth) y entrega código de referencia. Para mantener la **integridad visual**, reemplazar `#960018` por el token `accent-600 (#8A0F1C)` durante la integración.

