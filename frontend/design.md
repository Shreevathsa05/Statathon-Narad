# Vercel Design System — Complete UI/UX Reference

> **Purpose:** Pixel-level design specification combining Vercel's public Geist design system, scraped marketing site, pricing page, docs, and directly-observed dashboard CSS values (post-Feb 2026 redesign). Any AI agent or developer can use this file alone to reproduce the Vercel aesthetic for any web application — SaaS, B2B, portfolio, landing page, dashboard, or docs site.
>
> **Sources:** `vercel.com` (marketing), `vercel.com/geist` (design system), `vercel.com/pricing`, `vercel.com/changelog` (Feb 2026 dashboard redesign), directly observed dashboard CSS variables.

---

## 1. Design Philosophy

### 1.1 The Core Idea

Vercel's design language is built on **aggressive reduction**. A premium UI is defined by what is *removed*, not added. Every decision passes three filters:

1. Can this element be removed without losing clarity?
2. Is this color or decoration *functional* or merely decorative?
3. Does this motion *communicate* a state change, or is it just movement?

### 1.2 Marketing Site Pillars

- **Restraint as luxury** — Fewer colors, near-zero border radius, generous whitespace. The emptiness signals confidence.
- **Typographic precision** — Negative letter-spacing at display sizes does the heavy lifting for visual impact. This is the #1 differentiator.
- **Monochromatic first** — The palette is black, white, and gray. Color appears *only* when carrying semantic meaning (error, link, active state).
- **Functional motion** — Micro-animations communicate state changes and confirm intent. Never decorative.

### 1.3 Dashboard / App Pillars

- **Quiet UI chrome** — Minimize decoration, maximize readable data structure. The interface should disappear behind the content.
- **High data density** — Compact typography, consistent row heights, tight spacing. Dashboard is built for power users who scan, not browse.
- **Single decisive CTA per panel** — One clear primary action per section. Never compete for attention.
- **Fast scanning** — Short labels, left-aligned hierarchy, consistent column widths. Every row should yield its meaning within 300ms of glancing at it.
- **Utility-first layout** — Icon + label navigation, stacked detail lists, minimal decorative cards.

### 1.4 Dual Surface System

Marketing pages default to **dark** (`#000000` background). The dashboard/app defaults to **dark** as well (`#000000` → `#0A0A0A` surface), with a light mode available. Both use the same semantic token system, just inverted.

---

## 2. Color System

### 2.1 Core Semantic Tokens

Vercel uses **semantic tokens** — colors referenced by role, not value. This enables automatic dark/light mode switching.

```css
:root {
  /* ── Page Backgrounds ── */
  --background:          #000000;   /* Root page bg (dark / marketing) */
  --surface:             #0A0A0A;   /* Card / panel surface (dark) */
  --surface-elevated:    #111111;   /* Elevated surface: dropdowns, modals (dark) */
  --background-light:    #FFFFFF;   /* Root page bg (light mode) */
  --surface-light:       #FAFAFA;   /* Card / panel surface (light) */
  --surface-light-alt:   #F7F7F7;   /* Alternate surface (light) */

  /* ── Text / Foreground ── */
  --text-primary:        #EDEDED;   /* Dashboard primary text (dark mode — NOT pure white) */
  --text-primary-light:  #000000;   /* Light mode primary text */
  --text-muted:          #A1A1A1;   /* Secondary / muted text (dark mode, observed) */
  --text-muted-light:    #737373;   /* Secondary / muted text (light mode) */
  --text-disabled:       #525252;   /* Disabled text (dark) */
  --text-disabled-light: #A3A3A3;   /* Disabled text (light) */

  /* ── Gray Scale (pure neutral — zero warm or cool undertone) ── */
  --gray-100:  #F7F7F7;
  --gray-200:  #E5E5E5;
  --gray-300:  #D4D4D4;
  --gray-400:  #A3A3A3;
  --gray-500:  #737373;
  --gray-600:  #525252;
  --gray-700:  #404040;
  --gray-800:  #262626;
  --gray-900:  #171717;
  --gray-950:  #0A0A0A;

  /* ── Borders ── */
  /* Dark mode: */
  --border:              #2E2E2E;              /* Solid border (dashboard dark, observed) */
  --border-alpha:        rgba(255,255,255,0.10); /* = #FFFFFF1A — subtle alpha border */
  --border-alpha-strong: rgba(255,255,255,0.145);/* = #FFFFFF25 — stronger alpha border */
  /* Light mode: */
  --border-light:        #E5E5E5;              /* Default light border */
  --border-light-strong: #D4D4D4;              /* Hover/strong light border */

  /* ── Accent (functional only — not decorative) ── */
  --blue:                #0070F3;   /* Primary links, CTA (marketing + light mode) */
  --blue-light:          #52A8FF;   /* Links and active states in dark dashboard */
  --blue-hover:          #0761D1;   /* Hover on --blue */
  --focus-ring:          hsla(210, 100%, 66%, 1); /* = #52A8FF — focus ring color */

  /* ── Status / Semantic Colors ── */
  --error:               #E60000;   /* Errors, destructive (observed dashboard) */
  --error-bg:            rgba(230,0,0,0.08);    /* Error surface */
  --warning:             #F5A623;   /* Warning state */
  --warning-bg:          rgba(245,166,35,0.08); /* Warning surface */
  --success-teal:        #50E3C2;   /* Deployment success / ready state */
  --info-blue:           #3291FF;   /* Info state, secondary blue family */

  /* ── Geist 10-Step Component Scale (dark mode) ── */
  --color-1:  rgba(255,255,255,0.04);  /* Default component background */
  --color-2:  rgba(255,255,255,0.07);  /* Hover component background */
  --color-3:  rgba(255,255,255,0.10);  /* Active component background */
  --color-4:  rgba(255,255,255,0.12);  /* Default border */
  --color-5:  rgba(255,255,255,0.20);  /* Hover border */
  --color-6:  rgba(255,255,255,0.30);  /* Active border */
  --color-7:  rgba(255,255,255,0.70);  /* High-contrast background */
  --color-8:  rgba(255,255,255,0.85);  /* High-contrast hover background */
  --color-9:  rgba(255,255,255,0.50);  /* Secondary text */
  --color-10: rgba(255,255,255,1.00);  /* Primary text (max contrast) */
}
```

### 2.2 Surface Elevation (Dark Mode — 3 Levels)

Depth in dark mode is created through **surface layering**, never shadows:

```
Level 0: #000000       — Page background
Level 1: #0A0A0A       — Cards, panels, sidebar
Level 2: #111111       — Dropdowns, tooltips, modals, popovers (elevated)
Level 3: #1F1F1F       — Active nav item, selected row highlight
```

Borders delineate levels, not shadows. A surface at level 1 gets `border: 1px solid #2E2E2E`.

### 2.3 Color Usage Table

| Element | Dark Mode | Light Mode |
|---|---|---|
| Page background | `#000000` | `#FFFFFF` |
| Card / panel | `#0A0A0A` | `#FAFAFA` |
| Elevated (modal, dropdown) | `#111111` | `#FFFFFF` |
| Active nav item bg | `#1F1F1F` | `#F0F0F0` |
| Primary text | `#EDEDED` | `#000000` |
| Secondary text | `#A1A1A1` | `#737373` |
| Disabled text | `#525252` | `#A3A3A3` |
| Border (default) | `#2E2E2E` | `#E5E5E5` |
| Border (alpha, subtle) | `rgba(255,255,255,0.10)` | — |
| Border (hover) | `rgba(255,255,255,0.145)` | `#D4D4D4` |
| Primary button bg | `#EDEDED` | `#000000` |
| Primary button text | `#0A0A0A` | `#FFFFFF` |
| Link color | `#52A8FF` | `#0070F3` |
| Error | `#E60000` | `#E60000` |
| Success | `#50E3C2` | `#0070F3` |
| Focus ring | `#52A8FF` | `#0070F3` |
| Code block bg | `#0A0A0A` | `#F7F7F7` |

### 2.4 What Vercel Never Does With Color

- ❌ No gradients on buttons, cards, or nav links
- ❌ No colorful section backgrounds (no teal blocks, no purple headers)
- ❌ No decorative shadows on dark surfaces
- ❌ Blue only for links, primary CTA, and active state — never decorative
- ❌ No warm or cool gray undertones — pure neutral
- ❌ No illustrations or stock photos — screenshots, code, geometric shapes only
- ❌ No bright success green — Vercel uses teal (`#50E3C2`) or blue (`#0070F3`) for success

---

## 3. Typography

### 3.1 Font Families

Vercel built its own typeface: **Geist** (2023). It replaced Inter and locked in the brand identity.

```css
:root {
  --font-sans: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'Geist Mono', 'SFMono-Regular', 'Roboto Mono', 'Courier New', monospace;
}
```

**Geist Sans** — Geometric, slightly warm at body sizes. Used for all headings, body copy, labels, nav, buttons. Designed for readability from 10px to 96px.

**Geist Mono** — Used for code, terminal output, API keys, deployment slugs, commit hashes, version numbers, and any technical identifier.

**Installation:**
```html
<!-- CDN (Google Fonts) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap" rel="stylesheet">
```
```js
// Next.js (npm: geist)
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
```

### 3.2 Type Scale

```css
:root {
  /* Dashboard / UI sizes */
  --text-xs:       12px;   /* Timestamps, captions, badges */
  --text-sm-ui:    13.33px;/* Compact controls (browser default for small) */
  --text-sm:       14px;   /* Primary UI text: nav, buttons, table rows */
  --text-base:     16px;   /* Body text (default), paragraph, inputs */
  --text-lg:       18px;   /* Card headings (small), lead copy */

  /* Marketing / display sizes */
  --text-xl:       24px;   /* Section subheadings */
  --text-2xl:      32px;   /* Page section headings */
  --text-3xl:      48px;   /* Hero sub-headings, feature headings */
  --text-display:  64px;   /* Hero primary headline */
  --text-massive:  80px;   /* Oversized hero (rare) */
}
```

### 3.3 Font Weights

```css
:root {
  --weight-normal:   400;  /* Body text, table cells, metadata */
  --weight-medium:   500;  /* UI labels, nav items, button text, emphasis */
  --weight-semibold: 600;  /* Card headings, section headings */
  --weight-bold:     700;  /* Hero headings, pricing numbers */
  --weight-extrabold:800;  /* Display headings */
}
```

### 3.4 Line Heights

```css
:root {
  --leading-tight:   1.15;   /* Headlines 48px+ */
  --leading-snug:    1.35;   /* Section headings 24–32px */
  --leading-ui:      1.43;   /* UI rows (20–24px for 14px text) */
  --leading-base:    1.5;    /* Body text */
  --leading-relaxed: 1.625;  /* Prose, docs */
}
```

### 3.5 Letter Spacing — The Most Critical Vercel Rule

```css
:root {
  --tracking-tightest: -0.05em;  /* 80px+ display */
  --tracking-tight:    -0.04em;  /* 48–64px headlines — ALWAYS apply */
  --tracking-snug:     -0.02em;  /* 24–32px section headings */
  --tracking-normal:   -0.01em;  /* Body text, UI labels */
  --tracking-wide:      0.02em;  /* Uppercase labels */
  --tracking-widest:    0.05em;  /* ALL-CAPS badges */
}
```

> **Rule:** Apply `letter-spacing: -0.04em` to every headline 48px and above, always. Without it, the same type looks 30% less intentional. This single rule is the #1 thing people miss when imitating the Vercel look.

### 3.6 Dashboard Typography Specifics

The dashboard prioritizes **density over drama**. Headings are h4-like in size — minimal size jumps between levels, relying on weight and spacing for hierarchy rather than dramatic size changes.

```css
/* Dashboard page title */
.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #EDEDED;
  letter-spacing: -0.01em;
}

/* Dashboard section heading (h4-like) */
.section-heading {
  font-size: 14px;
  font-weight: 500;
  color: #EDEDED;
  letter-spacing: 0;
}

/* Primary UI row text */
.row-text {
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: #EDEDED;
}

/* Secondary / muted metadata */
.meta-text {
  font-size: 12px;
  font-weight: 400;
  color: #A1A1A1;
  font-family: var(--font-mono); /* For hashes, IDs, times */
}
```

### 3.7 Marketing Typography

```css
/* Hero headline */
.hero-headline {
  font-size: clamp(40px, 6vw, 64px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.04em;
  color: #FFFFFF;
}

/* Section heading */
.section-heading-marketing {
  font-size: 32px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.03em;
  color: #FFFFFF;
}

/* Body copy (marketing) */
.body-marketing {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
  letter-spacing: -0.01em;
  color: rgba(255,255,255,0.7);
}

/* Uppercase section label */
.eyebrow {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #A1A1A1;
}

/* Monospace for technical content */
.code-inline {
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.7;
  letter-spacing: 0;
}
```

---

## 4. Spacing System

### 4.1 Base Grid — 4px Unit

All spacing uses a **4px base**. The practical rhythm is 4, 8, 12, 16, 24, 32. Think of 4px as the atomic unit and build up.

```css
:root {
  --space-0:    0px;
  --space-px:   1px;
  --space-1:    4px;    /* Icon gap, micro padding */
  --space-2:    8px;    /* Tight: icon-to-label, compact rows */
  --space-3:    12px;   /* Dense data: row padding, small gaps */
  --space-4:    16px;   /* Standard: card padding, section gaps */
  --space-5:    20px;
  --space-6:    24px;   /* Medium: panel padding */
  --space-8:    32px;   /* Comfortable: section separators */
  --space-10:   40px;   /* Input height, large gaps */
  --space-12:   48px;   /* Section breaks (dashboard) */
  --space-16:   64px;   /* Header height, large section breaks */
  --space-24:   96px;   /* Section vertical padding (marketing) */
  --space-32:   128px;  /* Hero padding */
  --space-48:   192px;
  --space-64:   256px;  /* Sidebar width reference */
}
```

### 4.2 Spacing Context Guide

| Context | Value | Usage |
|---|---|---|
| Icon-to-label gap | 8px | Nav items, buttons |
| Dense data rows | 8–12px padding | Table cells, list items |
| Card padding (compact) | 16px | Dashboard cards |
| Card padding (comfortable) | 24px | Feature cards |
| Section break (dashboard) | 32–48px | Between data sections |
| Section padding (marketing) | 96–128px vertical | Between full-width sections |
| Hero padding | 128px top | Landing hero section |

### 4.3 Layout Widths

```css
:root {
  --sidebar-width:      256px;   /* Dashboard sidebar (observed CSS variable) */
  --header-height:       64px;   /* Top app header */
  --navbar-height:       56px;   /* Inner nav bar / tab bar */
  --input-height-sm:     32px;   /* Small input/button */
  --input-height-md:     36px;   /* Medium input/button */
  --input-height-lg:     40px;   /* Standard input height */

  --max-w-content:     1400px;   /* Dashboard content max-width (observed) */
  --max-w-marketing:   1200px;   /* Marketing section max-width */
  --max-w-marketing-wide: 1400px;/* Wide marketing sections */
  --max-w-prose:        680px;   /* Docs / prose max-width */

  --page-padding-x: clamp(16px, 5vw, 80px); /* Horizontal page gutter */
}
```

### 4.4 Whitespace Philosophy

- **Marketing:** Aggressive 96–128px vertical padding between sections. Never reduce. The empty space is the luxury signal.
- **Dashboard:** Compact but not cramped. 8–12px for data rows, 16–24px for card padding, 32px between sections. Aim for maximum information density without sacrificing scan speed.

---

## 5. Border Radius

```css
:root {
  --radius-none:  0px;     /* Marketing panels, hero cards */
  --radius-sm:    4px;     /* Badges, code snippets, small tags */
  --radius-md:    6px;     /* Dashboard: inputs, buttons, cards, dropdowns — DEFAULT */
  --radius-lg:    8px;     /* Larger panels, toasts, modals */
  --radius-xl:    12px;    /* Feature-showcase cards (marketing, rare) */
  --radius-full:  9999px;  /* Pills, filter chips, status dots, avatars */
}
```

**Rules:**
- Marketing site: `0px` or `4px` almost exclusively
- Dashboard/app: `6px` is the universal default for all interactive elements
- Tags, filters, chips: `9999px` pill shape
- Never use `12px+` on dashboard interactive elements

---

## 6. Shadows & Depth

```css
:root {
  /* Dark mode: NO shadows — all depth via borders and surface colors */
  --shadow-none: none;

  /* Subtle border-based depth (dark mode) */
  --shadow-border: 0 0 0 1px rgba(255,255,255,0.145);  /* = #FFFFFF25 */

  /* Light mode dashboard */
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06);

  /* Dropdown / popover (dark mode — light border + slight depth) */
  --shadow-popup: 0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.10);

  /* Marketing hero glow (dark, used sparingly on background) */
  --glow-blue:  0 0 80px rgba(0,112,243,0.15);
  --glow-white: 0 0 60px rgba(255,255,255,0.06);
}
```

**Rules:**
- Dark surfaces: zero `box-shadow`. Use `border` + surface color layering.
- Dropdowns/menus (dark): `var(--shadow-popup)` — light border + deep background shadow.
- Light dashboard: `shadow-xs` or `shadow-sm` on cards only.
- Never decorative shadows.

---

## 7. Navigation — Marketing Site Navbar

### 7.1 Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [▲ Logo]   Products ▾   Resources ▾   Solutions ▾   Enterprise  Pricing │  [Log In]  [Sign Up →]  │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Position:** `position: fixed; top: 0; width: 100%; z-index: 50`
- **Height:** 64px
- **Background:** `rgba(0,0,0,0.8)` + `backdrop-filter: blur(12px) saturate(150%)`
- **Border-bottom:** `1px solid rgba(255,255,255,0.08)` — nearly invisible
- **Logo:** Vercel triangle (SVG), white, 20px tall
- **Nav links:** `font-size: 14px`, `font-weight: 500`, `color: rgba(255,255,255,0.7)` — not full white
- **Nav link hover:** `color: #FFFFFF` in `150ms ease`
- **Hover indicator:** Translucent `rgba(255,255,255,0.06)` pill animates behind hovered item via Framer Motion `layoutId` (shared-element transition)

### 7.2 Navbar CTAs

```
[Log In]    → text/ghost, color: rgba(255,255,255,0.7)
[Sign Up →] → solid white: background #FFFFFF, color #000000, border-radius 6px
```

- `padding: 6px 14px`, `font-size: 14px`, `font-weight: 500`
- Arrow icon (`→`) appended to Sign Up, 14px

### 7.3 Mega Menu Dropdowns

- Trigger: hover with `200ms` intent delay
- Container: `background: #111111`, `border: 1px solid rgba(255,255,255,0.10)`, `border-radius: 8px`
- Animation: `opacity 0→1` + `translateY(-8px→0)` in `150ms ease-out`
- Layout: 2–3 column grid
- Each item: 16px icon + bold label (14px, weight 500) + muted subtitle (12px, `#A1A1A1`)
- Item hover: `background: rgba(255,255,255,0.05)`, `border-radius: 6px`
- Group headers: `font-size: 11px`, `letter-spacing: 0.06em`, `text-transform: uppercase`, `color: rgba(255,255,255,0.35)` — nearly invisible, structural only

### 7.4 Mobile Navigation

- Hamburger icon replaces links at `< 768px`
- Slide-down full-screen overlay: `background: #000000`
- Dashboard mobile: floating bottom bar optimized for one-handed use (post-Feb 2026)

---

## 8. Navigation — Dashboard Sidebar

Post-February 26, 2026 redesign — default for all users.

### 8.1 Full Layout Diagram

```
┌────────────────────┬──────────────────────────────────────────────┐
│  Sidebar (256px)   │  Header bar (56px)                           │
│                    │  [▼ Team: Acme Co.]  [⌘K Search]  [● Avatar]│
│  ▲  Vercel Logo    ├──────────────────────────────────────────────┤
│                    │  [All Projects ▾]    [Filters]  [+ New]      │
│  ○  Overview       ├──────────────────────────────────────────────┤
│  □  Projects       │                                              │
│  ⬡  Storage        │   Content Area (fills viewport)             │
│  ◈  Observability  │   max-width: 1400px, gentle side gutters    │
│  ⛨  Firewall       │                                              │
│  ─────────────     │                                              │
│  ⚙  Settings       │                                              │
│                    │                                              │
└────────────────────┴──────────────────────────────────────────────┘
```

### 8.2 Sidebar Specs

```css
.sidebar {
  width: 256px;            /* Observed CSS variable */
  height: 100vh;
  position: fixed;
  left: 0; top: 0;
  background: #0A0A0A;     /* Surface level 1 */
  border-right: 1px solid #2E2E2E;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  /* Resizable: can be hidden via user preference */
}
```

### 8.3 Sidebar Nav Items

```css
.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
  color: #A1A1A1;           /* Inactive: observed muted color */
  border-radius: 6px;
  text-decoration: none;
  transition: color 150ms ease, background 150ms ease;
  cursor: pointer;
}
.nav-item:hover {
  color: #EDEDED;
  background: rgba(255,255,255,0.05);
}
.nav-item--active {
  color: #EDEDED;
  background: #1F1F1F;      /* Observed active fill — NOT just underline */
}
.nav-item .icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: currentColor;      /* Inherits from parent text color */
}

/* Section divider */
.nav-divider {
  height: 1px;
  background: #2E2E2E;
  margin: 8px 12px;
}
```

### 8.4 Header Bar

```css
.header-bar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #2E2E2E;
  background: #000000;
  position: sticky;
  top: 0;
  z-index: 10;
}
```

**Header content (left to right):**

```
[▼ Team avatar + "Acme Co." + plan badge]     [⌘K Search]     [Notification bell]  [User avatar ●]
```

- **Team identity block:** `border: 1px solid #2E2E2E`, `border-radius: 6px`, `padding: 4px 8px`
- Team name: `font-size: 14px`, `font-weight: 500`, `color: #EDEDED`
- Plan badge: small pill, `font-size: 11px`, e.g. "Pro" or "Hobby"
- **Global search:** `⌘K` keyboard shortcut indicator, `border: 1px solid #2E2E2E`, `border-radius: 6px`, `background: #0A0A0A`, `width: 200px`
- **User avatar:** 28px circle, `border-radius: 9999px`

### 8.5 Project-Level Tab Bar

Below header when inside a project:

```
Deployments | Functions | Analytics | Logs | Storage | Settings
```

```css
.project-tabs {
  display: flex;
  border-bottom: 1px solid #2E2E2E;
  padding: 0 16px;
  height: 40px;
  align-items: flex-end;
}
.project-tab {
  padding: 0 12px 10px;
  font-size: 14px;
  font-weight: 500;
  color: #A1A1A1;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 150ms ease, border-color 150ms ease;
}
.project-tab:hover { color: #EDEDED; }
.project-tab--active {
  color: #EDEDED;
  border-bottom-color: #EDEDED;
}
```

### 8.6 Page Header + Scope Selector

Each dashboard page has a structured header row:

```
┌─────────────────────────────────────────────────────────────┐
│  [▼ All Projects]    Deployments        [Filter ▾]  [⋮]    │
└─────────────────────────────────────────────────────────────┘
```

```css
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #2E2E2E;
}
.scope-selector {
  /* "All projects" or specific project name dropdown */
  font-size: 14px;
  font-weight: 500;
  color: #EDEDED;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.page-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
/* Kebab / 3-dot menu for page-level secondary actions */
.kebab-btn {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px;
  color: #A1A1A1;
  transition: color 150ms ease, background 150ms ease;
}
.kebab-btn:hover { color: #EDEDED; background: #1F1F1F; }
```

### 8.7 Usage Page Subnav

Some pages (e.g., Usage, Settings) include a **secondary accordion-style left subnav** in the content area with nested anchor links for deep sections:

```css
.subnav {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid #2E2E2E;
  padding: 24px 0;
}
.subnav-section-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #525252;
  padding: 0 16px 8px;
}
.subnav-link {
  display: block;
  font-size: 13px;
  color: #A1A1A1;
  padding: 6px 16px;
  transition: color 150ms ease;
}
.subnav-link:hover { color: #EDEDED; }
.subnav-link--active { color: #EDEDED; }
.subnav-link--nested { padding-left: 28px; font-size: 12px; }
```

### 8.8 Announcement Banners

```css
.announcement-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  background: #0A0A0A;
  border-bottom: 1px solid #2E2E2E;
  font-size: 13px;
  color: #A1A1A1;
}
.announcement-banner a { color: #52A8FF; }
.announcement-banner .banner-cta {
  font-size: 12px;
  padding: 4px 10px;
  border: 1px solid #2E2E2E;
  border-radius: 6px;
  color: #EDEDED;
  white-space: nowrap;
}
```

### 8.9 Inline Alert & Notice Rows

Used inside page content (not top-of-page banners) to surface warnings, info, or action prompts inline with data.

```css
/* Base inline notice — low-height, no bright fills, iconography-led */
.inline-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
  border: 1px solid transparent;
}
.inline-notice .notice-icon {
  width: 16px; height: 16px;
  flex-shrink: 0;
  margin-top: 1px; /* Optical alignment to first line of text */
}
.inline-notice .notice-body { flex: 1; }
.inline-notice .notice-title { font-weight: 500; display: block; margin-bottom: 2px; }
.inline-notice .notice-action {
  font-size: 13px; font-weight: 500;
  color: #52A8FF;
  text-decoration: none;
  white-space: nowrap;
}
.inline-notice .notice-action:hover { text-decoration: underline; }

/* Variants — rely on contrast + icon, never bright fills */
.inline-notice--info {
  background: rgba(82,168,255,0.06);
  border-color: rgba(82,168,255,0.15);
  color: #A1A1A1;
}
.inline-notice--info .notice-icon { color: #52A8FF; }
.inline-notice--info .notice-title { color: #EDEDED; }

.inline-notice--warning {
  background: rgba(245,166,35,0.06);
  border-color: rgba(245,166,35,0.15);
  color: #A1A1A1;
}
.inline-notice--warning .notice-icon { color: #F5A623; }
.inline-notice--warning .notice-title { color: #EDEDED; }

.inline-notice--error {
  background: rgba(230,0,0,0.06);
  border-color: rgba(230,0,0,0.15);
  color: #A1A1A1;
}
.inline-notice--error .notice-icon { color: #E60000; }
.inline-notice--error .notice-title { color: #EDEDED; }
```

**Key rule:** Notices are always **low-height** and **avoid bright/solid fills**. Contrast and iconography carry the meaning — not color blocks. This distinguishes them from marketing-style callouts.

---

## 9. Buttons

### 9.1 All Button Variants

**Primary (dark mode — dashboard and marketing):**
```css
.btn-primary {
  background: #EDEDED;      /* Off-white, not pure white */
  color: #0A0A0A;
  border: none;
  border-radius: 6px;
  padding: 0 16px;
  height: 36px;             /* Medium default */
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  display: inline-flex; align-items: center; gap: 6px;
  cursor: pointer;
  transition: background 150ms ease;
}
.btn-primary:hover { background: #D4D4D4; }
.btn-primary:active { background: #C0C0C0; transform: scale(0.98); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
```

**Primary (light mode — dashboard light theme):**
```css
.btn-primary-light {
  background: #000000;
  color: #FFFFFF;
  border-radius: 6px;
  padding: 0 16px;
  height: 36px;
  font-size: 14px; font-weight: 500;
}
.btn-primary-light:hover { background: #171717; }
```

**Secondary / Ghost:**
```css
.btn-secondary {
  background: transparent;
  color: #A1A1A1;
  border: 1px solid #2E2E2E;
  border-radius: 6px;
  padding: 0 16px;
  height: 36px;
  font-size: 14px; font-weight: 500;
  transition: border-color 150ms ease, color 150ms ease;
}
.btn-secondary:hover { border-color: rgba(255,255,255,0.30); color: #EDEDED; }
```

**Tertiary / Text Link:**
```css
.btn-text {
  background: none; border: none;
  color: #52A8FF;           /* Dark mode link blue */
  font-size: 14px; font-weight: 500;
  cursor: pointer;
}
.btn-text:hover { text-decoration: underline; }
```

**Destructive:**
```css
.btn-destructive {
  background: transparent;
  color: #E60000;
  border: 1px solid rgba(230,0,0,0.30);
  border-radius: 6px;
  padding: 0 16px; height: 36px;
  font-size: 14px; font-weight: 500;
}
.btn-destructive:hover { background: rgba(230,0,0,0.08); border-color: #E60000; }
```

**CTA with Arrow (hero / marketing):**
```css
.btn-cta {
  display: inline-flex; align-items: center; gap: 6px;
  background: #FFFFFF; color: #000000;
  border-radius: 6px; padding: 0 20px; height: 40px;
  font-size: 15px; font-weight: 500;
}
.btn-cta .arrow { transition: transform 150ms ease; }
.btn-cta:hover .arrow { transform: translateX(3px); }
```

**Filter Pill (dashboard):**
```css
.btn-pill {
  background: transparent;
  border: 1px solid #2E2E2E;
  border-radius: 9999px;
  padding: 0 12px; height: 28px;
  font-size: 13px; font-weight: 500;
  color: #A1A1A1;
  display: inline-flex; align-items: center; gap: 4px;
}
.btn-pill:hover { border-color: rgba(255,255,255,0.20); color: #EDEDED; }
.btn-pill--active { background: #1F1F1F; color: #EDEDED; border-color: rgba(255,255,255,0.20); }
```

### 9.2 Button Size Reference

| Size | Height | Padding | Font | Use Case |
|---|---|---|---|---|
| xs | 24px | `0 8px` | 12px | Inline actions, table cells |
| sm | 32px | `0 12px` | 13px | Compact UI, toolbar actions |
| md (default) | 36px | `0 16px` | 14px | Standard buttons |
| lg | 40px | `0 20px` | 15px | Input-aligned, form submit |
| xl | 44px | `0 24px` | 16px | Hero CTA |

### 9.3 Button States Summary

| State | Treatment |
|---|---|
| Default | Base styles |
| Hover | `150ms ease` bg/color shift; arrow moves `+3px` |
| Focus | `outline: 2px solid #52A8FF; outline-offset: 2px` |
| Active/Pressed | `scale(0.98)` + darker bg |
| Disabled | `opacity: 0.4; cursor: not-allowed` |
| Loading | Text → 3-dot animated Geist loader |

### 9.4 Icon Placement

- Icon **before** text: backward/contextual actions (← Back, ↑ Deploy)
- Icon **after** text: forward actions (Start Deploying →, Get Demo →)
- Icon size: 14px (sm/md), 16px (lg/xl)
- Gap: `6px`

---

## 10. Forms & Inputs

### 10.1 Text Input

```css
.input {
  width: 100%;
  height: 40px;             /* Observed dashboard height */
  padding: 0 12px;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 400;
  color: #EDEDED;
  background: #0A0A0A;      /* Dark: surface color, not pure black */
  border: 1px solid rgba(255,255,255,0.14);  /* Observed dashboard value */
  border-radius: 6px;
  outline: none;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.input::placeholder { color: #525252; }
.input:hover        { border-color: rgba(255,255,255,0.20); }
.input:focus        {
  border-color: #52A8FF;
  box-shadow: 0 0 0 3px rgba(82,168,255,0.15);
}
.input:disabled     { opacity: 0.4; cursor: not-allowed; }
```

**Search input with icon offset:**
```css
.input-search {
  padding-left: 40px;   /* Room for search icon (observed for icon-offset fields) */
  padding-right: 12px;
}
.input-search-icon {
  position: absolute;
  left: 12px; top: 50%;
  transform: translateY(-50%);
  color: #525252; width: 16px; height: 16px;
}
```

**Light mode input:**
```css
.input--light {
  background: #FFFFFF;
  color: #000000;
  border-color: #E5E5E5;
}
.input--light:hover  { border-color: #D4D4D4; }
.input--light:focus  { border-color: #0070F3; box-shadow: 0 0 0 3px rgba(0,112,243,0.12); }
```

### 10.2 Select / Dropdown Input

Same as `.input` with `padding-right: 32px` for the chevron. Chevron: `color: #525252`, 14px Geist icon.

### 10.3 Checkbox

```css
.checkbox {
  width: 16px; height: 16px;
  border: 1px solid rgba(255,255,255,0.20);
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
  appearance: none;
  transition: background 150ms ease, border-color 150ms ease;
}
.checkbox:checked {
  background: #EDEDED;
  border-color: #EDEDED;
  /* White checkmark via SVG background-image */
}
```

### 10.4 Toggle / Switch

```css
.switch-track {
  width: 40px; height: 22px;
  border-radius: 9999px;
  background: #2E2E2E;       /* Off state */
  position: relative;
  transition: background 200ms ease;
  cursor: pointer;
}
.switch-track--on { background: #EDEDED; }
.switch-thumb {
  width: 18px; height: 18px;
  border-radius: 9999px;
  background: #0A0A0A;
  position: absolute;
  top: 2px; left: 2px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.4);
  transition: transform 200ms ease;
}
.switch-track--on .switch-thumb { transform: translateX(18px); }
```

### 10.5 Form Labels & Error States

```css
.form-label {
  display: block;
  font-size: 13px; font-weight: 500;
  color: #EDEDED;
  margin-bottom: 6px;
}
.form-label--optional::after {
  content: ' (optional)'; color: #525252; font-weight: 400;
}
.form-hint { font-size: 12px; color: #A1A1A1; margin-top: 4px; }

.input--error { border-color: #E60000; }
.input--error:focus { box-shadow: 0 0 0 3px rgba(230,0,0,0.12); }
.form-error { font-size: 12px; color: #E60000; margin-top: 4px;
  display: flex; align-items: center; gap: 4px; }
```

---

## 11. Cards & Panels

### 11.1 Dashboard Data Card

```css
.dashboard-card {
  background: #0A0A0A;
  border: 1px solid #2E2E2E;
  border-radius: 6px;
  padding: 16px;
  /* No box-shadow — surface + border does the work */
}
.dashboard-card:hover {
  border-color: rgba(255,255,255,0.20);
  transition: border-color 150ms ease;
}
```

### 11.2 Feature Card (Marketing)

```css
.feature-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 32px;
}
.feature-card:hover { border-color: rgba(255,255,255,0.15); }
```

### 11.3 Project Card (Dashboard List)

```css
.project-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  background: #0A0A0A;
  border: 1px solid #2E2E2E;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 150ms ease;
}
.project-card:hover { border-color: rgba(255,255,255,0.20); }

/* Row content structure */
.project-card .row-left   { display: flex; align-items: center; gap: 12px; flex: 1; }
.project-card .row-title  { font-size: 14px; font-weight: 500; color: #EDEDED; }
.project-card .row-meta   { font-size: 12px; color: #A1A1A1; font-family: var(--font-mono); }
.project-card .row-right  { display: flex; align-items: center; gap: 8px; }
```

**Standard row content pattern:**
```
[Icon/Logo]  [Title (bold)]  [Branch/Commit (mono, muted)]  [Time (mono, muted)]  →  [Status badge]  [Action icon]
```

### 11.4 Pricing Card

```css
.pricing-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 8px; padding: 32px;
}
.pricing-card--popular {
  border-color: rgba(255,255,255,0.25);
  background: rgba(255,255,255,0.06);
}
.pricing-badge {
  padding: 2px 8px;
  background: #FFFFFF; color: #000000;
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.04em; text-transform: uppercase;
  border-radius: 9999px;
}
```

### 11.5 Marketplace / Integration Card Grid

Used for integrations, storage providers, templates — dense clickable grid:

```css
.marketplace-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.marketplace-card {
  background: #0A0A0A;
  border: 1px solid #2E2E2E;
  border-radius: 6px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition: border-color 150ms ease;
}
.marketplace-card:hover { border-color: rgba(255,255,255,0.20); }
.marketplace-card .card-icon  { width: 32px; height: 32px; }
.marketplace-card .card-title { font-size: 14px; font-weight: 500; color: #EDEDED; }
.marketplace-card .card-desc  { font-size: 12px; color: #A1A1A1; line-height: 1.4; }
.marketplace-card .card-cta   { font-size: 12px; color: #52A8FF; margin-top: auto; }
/* Disabled integration */
.marketplace-card--disabled { opacity: 0.5; cursor: default; }
.marketplace-card--disabled .card-cta { color: #525252; }
```

---

## 12. Tables & Bulk Actions

### 12.1 Dashboard Table

```css
.table { width: 100%; border-collapse: collapse; font-size: 14px; }

.table th {
  text-align: left;
  font-size: 12px; font-weight: 500;
  color: #A1A1A1;
  letter-spacing: 0.02em;
  padding: 8px 16px;
  border-bottom: 1px solid #2E2E2E;
  white-space: nowrap;
}
.table td {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.05); /* Very subtle row separators */
  color: #EDEDED;
  vertical-align: middle;
}
.table tr:hover td { background: #0A0A0A; }
.table tr:last-child td { border-bottom: none; }

/* Row groups: use spacing between group, not heavy dividers */
.table-group-spacer { height: 8px; }
```

### 12.2 Bulk Actions Pattern

Appears when one or more rows are selected:

```css
.bulk-action-bar {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 16px;
  background: #111111;
  border: 1px solid #2E2E2E;
  border-radius: 6px;
  position: sticky; bottom: 16px;
  /* Slides up from bottom when selection is made */
  animation: slide-up 200ms ease-out;
}
.bulk-count { font-size: 13px; color: #A1A1A1; }
.bulk-action-btn { /* Same as .btn-secondary but compact */ }
/* Row checkbox: shown on row hover or when any row is selected */
.row-checkbox {
  opacity: 0;
  transition: opacity 150ms ease;
}
tr:hover .row-checkbox,
.row-selected .row-checkbox { opacity: 1; }
```

---

## 13. Badges & Status Tags

```css
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px;
  font-size: 12px; font-weight: 500;
  border-radius: 9999px;
  white-space: nowrap;
  letter-spacing: 0.01em;
}

/* Dashboard status */
.badge--ready       { background: rgba(80,227,194,0.12);  color: #50E3C2; }
.badge--error       { background: rgba(230,0,0,0.12);     color: #E60000; }
.badge--building    { background: rgba(245,166,35,0.12);  color: #F5A623; }
.badge--preview     { background: rgba(255,255,255,0.08); color: #A1A1A1; }
.badge--production  { background: rgba(255,255,255,0.08); color: #EDEDED; }
.badge--new         { background: #EDEDED; color: #0A0A0A; font-size: 11px; font-weight: 700; }
.badge--default     { background: rgba(255,255,255,0.06); color: #A1A1A1; }

/* Semantic */
.badge--blue        { background: rgba(82,168,255,0.12);  color: #52A8FF; }
.badge--amber       { background: rgba(245,166,35,0.12);  color: #F5A623; }
```

**Status text labels:** "Ready", "Error", "Building", "Preview", "Production" — always concise, single word.

---

## 14. Status Dots

```css
.status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.status-dot--ready     { background: #50E3C2; }
.status-dot--error     { background: #E60000; }
.status-dot--building  { background: #F5A623; animation: pulse 1.5s ease-in-out infinite; }
.status-dot--paused    { background: #525252; }
.status-dot--active    { background: #52A8FF; }

@keyframes pulse {
  0%,100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.6; transform: scale(0.82); }
}
```

---

## 15. Icons

### 15.1 Icon System — Geist Icons

Custom icon set for developer tools. Available as React components or SVG.

- **Default size:** 16px
- **Sizes:** 14px (inline), 16px (default), 20px (medium), 24px (large)
- **Stroke width:** 1.5px — thin and precise, never chunky or filled
- **Style:** Outline/stroke, rounded line caps
- **Color:** Always `currentColor` — controlled by parent `color` property

### 15.2 Icon Usage Rules

```css
.icon-inline   { width: 14px; height: 14px; }  /* In buttons, inline text */
.icon-default  { width: 16px; height: 16px; }  /* Nav, table cells */
.icon-medium   { width: 20px; height: 20px; }  /* Section icons */
.icon-large    { width: 24px; height: 24px; }  /* Feature highlights */

/* Active / contextual colors */
.icon-muted    { color: #525252; }
.icon-secondary{ color: #A1A1A1; }
.icon-primary  { color: #EDEDED; }
.icon-blue     { color: #52A8FF; }
.icon-error    { color: #E60000; }
.icon-warning  { color: #F5A623; }
.icon-success  { color: #50E3C2; }
```

---

## 16. Tabs

```css
.tabs {
  display: flex;
  border-bottom: 1px solid #2E2E2E;
}
.tab {
  padding: 10px 16px;
  font-size: 14px; font-weight: 500;
  color: #A1A1A1;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: color 150ms ease, border-color 150ms ease;
}
.tab:hover { color: #EDEDED; }
.tab--active { color: #EDEDED; border-bottom-color: #EDEDED; }

/* Light mode */
.tabs--light { border-bottom-color: #E5E5E5; }
.tabs--light .tab { color: #737373; }
.tabs--light .tab:hover { color: #000000; }
.tabs--light .tab--active { color: #000000; border-bottom-color: #000000; }
```

---

## 17. Dropdowns & Context Menus

```css
.dropdown {
  position: absolute; z-index: 50;
  min-width: 180px;
  background: #111111;             /* Elevated surface level */
  border: 1px solid #2E2E2E;
  border-radius: 8px;
  box-shadow: var(--shadow-popup);
  padding: 4px;
  animation: dropdown-in 120ms ease-out;
}
@keyframes dropdown-in {
  from { opacity: 0; transform: translateY(-6px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.dropdown-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px;
  font-size: 14px; color: #EDEDED;
  border-radius: 6px; cursor: pointer;
  transition: background 100ms ease;
}
.dropdown-item:hover { background: rgba(255,255,255,0.07); }
.dropdown-item--destructive { color: #E60000; }
.dropdown-item--destructive:hover { background: rgba(230,0,0,0.08); }
.dropdown-item .icon { color: #A1A1A1; }

.dropdown-separator { height: 1px; background: #2E2E2E; margin: 4px 0; }
.dropdown-label {
  padding: 6px 10px 2px;
  font-size: 11px; font-weight: 500;
  color: #525252;
  letter-spacing: 0.04em; text-transform: uppercase;
}
```

---

## 18. Modals & Dialogs

```css
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  z-index: 100;
  animation: fade-in 150ms ease;
}
.modal {
  position: fixed; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  z-index: 101;
  width: min(560px, calc(100vw - 32px));
  background: #111111;
  border: 1px solid #2E2E2E;
  border-radius: 8px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.5);
  padding: 24px;
  animation: modal-in 200ms cubic-bezier(0.34, 1.2, 0.64, 1);
}
@keyframes modal-in {
  from { opacity: 0; transform: translate(-50%, calc(-50% + 12px)); }
  to   { opacity: 1; transform: translate(-50%, -50%); }
}
.modal-title { font-size: 18px; font-weight: 600; color: #EDEDED; margin-bottom: 8px; }
.modal-desc  { font-size: 14px; color: #A1A1A1; line-height: 1.5; margin-bottom: 24px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; }
```

---

## 19. Tooltips

```css
.tooltip {
  position: absolute; z-index: 200;
  padding: 6px 10px;
  background: #111111;
  border: 1px solid #2E2E2E;
  color: #EDEDED;
  font-size: 12px; font-weight: 500;
  border-radius: 6px;
  white-space: nowrap;
  pointer-events: none;
  animation: tooltip-in 100ms ease-out;
  box-shadow: var(--shadow-popup);
}
@keyframes tooltip-in {
  from { opacity: 0; transform: translateY(3px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**Rule:** Tooltip appears after `400ms` hover delay. Instant tooltips feel jittery.

---

## 20. Popovers

A popover is larger than a tooltip — contains structured content (title, description, actions). Triggered by click, not hover. Dismissed by clicking outside or pressing `Esc`.

```css
.popover {
  position: absolute;
  z-index: 150;
  width: 280px;
  background: #111111;
  border: 1px solid #2E2E2E;
  border-radius: 8px;
  box-shadow: var(--shadow-popup);
  padding: 16px;
  /* Enter: subtle scale-up + fade */
  animation: popover-in 150ms cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top center;
}
@keyframes popover-in {
  from { opacity: 0; transform: scale(0.96) translateY(-4px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
/* Exit (applied via JS) */
.popover--exit {
  animation: popover-out 120ms ease-in forwards;
}
@keyframes popover-out {
  to { opacity: 0; transform: scale(0.96); }
}

.popover-title {
  font-size: 13px; font-weight: 600;
  color: #EDEDED; margin-bottom: 6px;
}
.popover-desc {
  font-size: 13px; color: #A1A1A1;
  line-height: 1.5; margin-bottom: 12px;
}
.popover-actions {
  display: flex; gap: 8px; justify-content: flex-end;
}

/* Arrow pointer (optional) */
.popover-arrow {
  position: absolute;
  top: -5px; left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 8px; height: 8px;
  background: #111111;
  border-top: 1px solid #2E2E2E;
  border-left: 1px solid #2E2E2E;
}
```

**Key difference from Tooltip:** Popovers scale slightly on enter (`scale(0.96 → 1)`) whereas tooltips only translate. Popovers persist until explicitly dismissed; tooltips disappear on mouse-out.

---

## 21. Toast Notifications

```css
.toast {
  position: fixed; bottom: 24px; right: 24px; z-index: 300;
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px;
  background: #111111; color: #EDEDED;
  border: 1px solid #2E2E2E;
  border-radius: 8px; font-size: 14px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  max-width: 400px;
  animation: toast-in 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes toast-in {
  from { opacity: 0; transform: translateY(12px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.toast--success { border-left: 3px solid #50E3C2; }
.toast--error   { border-left: 3px solid #E60000; }
.toast--warning { border-left: 3px solid #F5A623; }
```

---

## 22. Empty States

### 21.1 Standard Empty State

```css
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 64px 32px; text-align: center;
}
.empty-icon  { width: 32px; height: 32px; color: #525252; margin-bottom: 16px; }
.empty-title { font-size: 14px; font-weight: 500; color: #EDEDED; margin-bottom: 8px; }
.empty-desc  { font-size: 14px; color: #A1A1A1; line-height: 1.5; margin-bottom: 20px; max-width: 320px; }
/* Primary action placed directly below description */
```

Pattern: `[Icon] → [Heading] → [One-line guidance] → [Single CTA]`

### 21.2 "Continue to Feature" Empty State

Used when a feature requires project selection first:

```css
.feature-gate {
  padding: 48px 32px;
  display: flex; flex-direction: column; gap: 16px; align-items: flex-start;
}
.feature-gate-title { font-size: 16px; font-weight: 600; color: #EDEDED; }
.feature-gate-desc  { font-size: 14px; color: #A1A1A1; }
/* Inline project search input for quick selection */
.feature-gate .project-search { width: 280px; }
```

---

## 23. Code Blocks & Snippets

```css
.code-block {
  background: #0A0A0A;
  border: 1px solid #2E2E2E;
  border-radius: 8px; padding: 20px 24px;
  overflow-x: auto; position: relative;
}
.code-block pre {
  font-family: var(--font-mono);
  font-size: 13px; line-height: 1.7;
  color: #EDEDED; margin: 0; tab-size: 2;
}
.line-number { display: inline-block; width: 24px; color: #525252; user-select: none; }

/* Syntax tokens */
.token-keyword  { color: #F5A623; }
.token-string   { color: #50E3C2; }
.token-comment  { color: #525252; }
.token-function { color: #52A8FF; }
.token-number   { color: #E60000; }

/* Copy button */
.code-copy-btn {
  position: absolute; top: 12px; right: 12px;
  padding: 4px 8px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 4px; color: #A1A1A1; font-size: 12px;
  cursor: pointer; opacity: 0; transition: opacity 150ms ease;
}
.code-block:hover .code-copy-btn { opacity: 1; }
/* After copy: text → "Copied!" for 2000ms, then revert */
```

---

## 24. Loading States

### 23.1 Loading Dots (Geist Standard)

```css
.loading-dots { display: inline-flex; gap: 4px; align-items: center; }
.loading-dot {
  width: 4px; height: 4px; border-radius: 50%;
  background: currentColor;
  animation: dot-bounce 1.2s ease-in-out infinite;
}
.loading-dot:nth-child(2) { animation-delay: 0.2s; }
.loading-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes dot-bounce {
  0%,80%,100% { transform: scale(0.6); opacity: 0.4; }
  40%          { transform: scale(1.0); opacity: 1; }
}
```

### 23.2 Spinner

```css
.spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.12);
  border-top-color: #EDEDED;
  border-radius: 50%;
  animation: spin 600ms linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
```

### 23.3 Skeleton Shimmer

```css
.skeleton {
  background: linear-gradient(90deg,
    #111111 25%, #1F1F1F 50%, #111111 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
}
@keyframes shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}
```

---

## 25. Micro-Animations & Motion

### 24.1 Core Principles

1. **Fast.** Most interactions: 100–200ms. Never over 400ms for UI feedback.
2. **Transform + opacity only.** Never animate `width`, `height`, `padding`, `margin` — too slow.
3. **Purpose-driven.** Every animation communicates a state change. If you can't articulate what it communicates, remove it.
4. **Spring for arrivals, ease-in for exits.** Entering elements feel responsive; exiting elements should disappear quickly.

### 24.2 Timing & Easing Tokens

```css
:root {
  --duration-instant: 75ms;
  --duration-fast:   150ms;   /* Hovers, toggles, border shifts */
  --duration-normal: 200ms;   /* Dropdowns, tooltips */
  --duration-slow:   300ms;   /* Modals, page content reveals */
  --duration-slower: 400ms;   /* Complex staggered reveals */

  --ease-default:  ease;
  --ease-out:      cubic-bezier(0.0, 0.0, 0.2, 1);   /* Entering elements */
  --ease-in:       cubic-bezier(0.4, 0.0, 1, 1);      /* Exiting elements */
  --ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1); /* Toasts, modals pop */
}
```

### 24.3 Specific Animation Catalog

| Element | Animation | Duration | Easing |
|---|---|---|---|
| Nav hover indicator pill | FLIP / layoutId slide | 200ms | ease |
| Button arrow icon | `translateX(+3px)` | 150ms | ease |
| Card border on hover | `border-color` shift | 200ms | ease |
| Dropdown open | `opacity 0→1` + `translateY(-6px→0)` | 120ms | ease-out |
| Modal open | `opacity 0→1` + `translateY(+12px→0)` | 200ms | spring |
| Toast appear | `opacity 0→1` + `translateY(+12px→0) + scale(0.95→1)` | 250ms | spring |
| Tab indicator | Position slide (FLIP) | 200ms | ease |
| Copy button confirm | Icon swap + text "Copied!" | instant | — |
| Skeleton shimmer | Linear scroll | 1500ms | linear, infinite |
| Status dot pulse | Scale 1→0.82→1 | 1500ms | ease-in-out, infinite |
| Accordion/collapse | Height (JS-measured, not max-height) + opacity | 250ms | ease-out |
| Deployment log lines | Staggered opacity 0→1 per line | 100ms/line | ease |
| Page transition | `opacity 0→1` + `translateY(8px→0)` | 300ms | ease-out |

### 24.4 Focus Ring (Always Visible)

```css
*:focus-visible {
  outline: 2px solid #52A8FF;  /* Observed focus color */
  outline-offset: 2px;
  border-radius: 4px;
}
```

Never suppress focus rings without a visual replacement.

---

## 26. Content Density Guidelines

The dashboard is built for **power users who scan, not browse**. Apply these rules to keep information legible at high density:

- **Minimal heading size jumps.** Dashboard page titles are `16px`, section headings `14px`. Rely on spacing and font-weight for hierarchy — not dramatic size differences.
- **Short labels.** Column headers in tables: 1–3 words max. Status text: one word ("Ready", "Error", "Building").
- **Mono for identifiers.** Commit hashes, build IDs, deployment slugs, timestamps → `Geist Mono`, `color: #A1A1A1`.
- **Right-align metadata.** Timestamps, usage numbers, status badges → right side of rows.
- **Row height: 44–48px** for comfortable dense lists. 40px for very compact tables.
- **Never center content in data rows.** Left-align everything except right-column metadata.
- **No decorative illustrations** in data sections. Icon only (16px, monochrome) when needed.
- **Avoid empty headings.** If a section has no data, show an empty state instead of an empty header + nothing.

---

## 27. Marketing Page Patterns

### 26.1 Hero Section

```
[Announcement pill — "Ship 26 → 5 cities"]
H1: Build and deploy on the AI Cloud.  (64px, -0.04em tracking)
Subtext: Vercel provides the developer tools...  (18px, 70% white)
[▲ Start Deploying]    [Get a Demo →]
[Logo] stat text   [Logo] stat text   [Logo] stat text
[Hero interactive demo / screenshot]
```

**Announcement pill:**
```css
.pill-announce {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 4px 12px 4px 4px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 9999px;
  font-size: 13px; color: rgba(255,255,255,0.7);
  margin-bottom: 24px;
}
.pill-announce .inner-tag {
  background: #FFFFFF; color: #000000;
  font-size: 11px; font-weight: 700;
  padding: 2px 7px; border-radius: 9999px;
}
```

### 26.2 Social Proof Logos

```css
.social-proof-row { display: flex; align-items: center; gap: 32px; flex-wrap: wrap; }
.social-proof-item { display: flex; align-items: center; gap: 8px; }
.customer-logo { height: 16px; opacity: 0.5; filter: brightness(0) invert(1); }
.customer-stat { font-size: 13px; color: rgba(255,255,255,0.5); }
```

### 26.3 Feature Grid (Border Grid)

```css
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1px;
  background: rgba(255,255,255,0.08); /* Gaps show as lines */
}
.feature-cell { background: #000000; padding: 40px 32px; }
```

### 26.4 Logo Marquee

```css
.marquee-wrapper {
  overflow: hidden;
  mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
}
.marquee-track {
  display: flex; gap: 48px;
  animation: marquee 30s linear infinite;
}
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
```

### 26.5 Closing CTA Section

Every marketing page ends with:
```
[Large heading]
[Primary CTA]    [Secondary ghost CTA]
```
- `padding: 128px var(--page-padding-x)`, centered
- Primary: solid white button, `→` arrow
- Secondary: ghost, "Talk to an Expert"

---

## 28. Footer

```css
.footer {
  border-top: 1px solid rgba(255,255,255,0.08);
  padding: 64px var(--page-padding-x) 40px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 40px 32px;
}
.footer-col-title {
  font-size: 12px; font-weight: 600;
  letter-spacing: 0.04em; text-transform: uppercase;
  color: rgba(255,255,255,0.35); margin-bottom: 12px;
}
.footer-link {
  display: block; font-size: 14px;
  color: rgba(255,255,255,0.55); padding: 3px 0;
  text-decoration: none; transition: color 150ms ease;
}
.footer-link:hover { color: #FFFFFF; }
.footer-bottom {
  border-top: 1px solid rgba(255,255,255,0.06);
  margin-top: 40px; padding-top: 24px;
  display: flex; justify-content: space-between; align-items: center;
  font-size: 13px; color: rgba(255,255,255,0.30);
}
```

---

## 29. Dark/Light Mode Implementation

```css
/* Dark (default) */
[data-theme="dark"], :root {
  --bg:         #000000;
  --surface:    #0A0A0A;
  --elevated:   #111111;
  --active-bg:  #1F1F1F;
  --text:       #EDEDED;
  --text-muted: #A1A1A1;
  --border:     #2E2E2E;
  --link:       #52A8FF;
  --focus:      #52A8FF;
}

/* Light */
[data-theme="light"] {
  --bg:         #FFFFFF;
  --surface:    #FAFAFA;
  --elevated:   #FFFFFF;
  --active-bg:  #F0F0F0;
  --text:       #000000;
  --text-muted: #737373;
  --border:     #E5E5E5;
  --link:       #0070F3;
  --focus:      #0070F3;
}

/* System fallback */
@media (prefers-color-scheme: light) {
  :root { /* same as [data-theme="light"] */ }
}
```

**Depth in dark mode (no shadows):**
```
#000000 page → #0A0A0A surface → #111111 elevated → #1F1F1F active/selected
```

**Depth in light mode (minimal shadows):**
```
#FFFFFF page → #FAFAFA surface → #FFFFFF elevated + shadow-xs → #F0F0F0 active
```

---

## 30. Responsive Design

### 29.1 Breakpoints

```css
/* sm  */  @media (max-width: 640px)  { }
/* md  */  @media (max-width: 768px)  { }
/* lg  */  @media (max-width: 1024px) { }
/* xl  */  @media (max-width: 1280px) { }
/* 2xl */  @media (max-width: 1536px) { }
```

### 29.2 Mobile Patterns

- Navbar collapses to hamburger at `≤ 768px`
- Hero text: `clamp(32px, 7vw, 64px)`
- Multi-column grids → single column on mobile
- Section padding → `64px` vertical on mobile
- Dashboard sidebar → collapsible / hidden; floating bottom tab bar on mobile (post-Feb 2026)
- Tables → horizontal scroll on mobile, or card-list transformation

---

## 31. Accessibility

- **Contrast:** All text meets WCAG AA (4.5:1 for normal, 3:1 for large). `#EDEDED` on `#000000` = 17.5:1.
- **Focus rings:** Always `outline: 2px solid #52A8FF; outline-offset: 2px`. Never remove without replacement.
- **Semantic HTML:** `<nav>`, `<main>`, `<section>`, `<button>` (never `<div onClick>`).
- **ARIA:** Icon-only buttons → `aria-label`. Dynamic regions → `aria-live`.
- **Motion:** Respect reduced motion preference:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 32. Full CSS Custom Properties Reference

```css
:root {
  /* Fonts */
  --font-sans: 'Geist', system-ui, sans-serif;
  --font-mono: 'Geist Mono', monospace;

  /* Backgrounds / Surfaces */
  --background:       #000000;
  --surface:          #0A0A0A;
  --surface-elevated: #111111;
  --active-bg:        #1F1F1F;

  /* Text */
  --text-primary:  #EDEDED;
  --text-muted:    #A1A1A1;
  --text-disabled: #525252;

  /* Gray Scale */
  --gray-100: #F7F7F7; --gray-200: #E5E5E5; --gray-300: #D4D4D4;
  --gray-400: #A3A3A3; --gray-500: #737373; --gray-600: #525252;
  --gray-700: #404040; --gray-800: #262626; --gray-900: #171717;
  --gray-950: #0A0A0A;

  /* Borders */
  --border:       #2E2E2E;
  --border-alpha: rgba(255,255,255,0.10);
  --border-strong:rgba(255,255,255,0.145);

  /* Accent */
  --blue:        #0070F3;
  --blue-dark:   #52A8FF;
  --focus:       #52A8FF;

  /* Status */
  --error:       #E60000;
  --warning:     #F5A623;
  --success:     #50E3C2;
  --info:        #3291FF;

  /* Type Scale */
  --text-xs: 12px; --text-sm: 14px; --text-base: 16px;
  --text-lg: 18px; --text-xl: 24px; --text-2xl: 32px;
  --text-3xl: 48px; --text-display: 64px;

  /* Letter Spacing */
  --tracking-tightest: -0.05em;
  --tracking-tight:    -0.04em;
  --tracking-snug:     -0.02em;
  --tracking-normal:   -0.01em;
  --tracking-wide:      0.02em;

  /* Line Heights */
  --leading-tight: 1.15; --leading-ui: 1.43;
  --leading-base: 1.5;   --leading-relaxed: 1.625;

  /* Radius */
  --radius-none: 0px; --radius-sm: 4px; --radius-md: 6px;
  --radius-lg: 8px; --radius-xl: 12px; --radius-full: 9999px;

  /* Spacing (4px base) */
  --space-1: 4px; --space-2: 8px; --space-3: 12px;
  --space-4: 16px; --space-6: 24px; --space-8: 32px;
  --space-10: 40px; --space-12: 48px; --space-16: 64px;
  --space-24: 96px; --space-32: 128px;

  /* Layout */
  --sidebar-width:   256px;
  --header-height:    64px;
  --navbar-height:    56px;
  --input-height-sm:  32px;
  --input-height-md:  36px;
  --input-height-lg:  40px;
  --max-w-content: 1400px;
  --max-w-marketing:1200px;
  --max-w-prose:     680px;

  /* Shadows */
  --shadow-xs:     0 1px 2px rgba(0,0,0,0.05);
  --shadow-sm:     0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-popup:  0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.10);

  /* Motion */
  --duration-fast:   150ms;
  --duration-normal: 200ms;
  --duration-slow:   300ms;
  --ease-out:        cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## 33. Reusability Guide — Shell Architecture for Any App Type

The Vercel design language scales to any product. The key is keeping the **shell architecture constant** and varying only the content layer. Follow these rules regardless of the type of app:

### 33.1 Structural Shell (Always the Same)

```
sidebar (256px) + header bar (56px) + content area (flex: 1)
```

- Sidebar: icon + label rail, grouped by function, dividers between groups, Settings at bottom
- Header bar: team/scope selector (left) + search + notifications + user avatar (right)
- Content area: scrollable, max-width 1400px, gentle horizontal gutters

This shell works for: SaaS dashboard, B2B admin, portfolio CMS, developer tools, analytics platforms.

### 33.2 App Type Adaptations

| App Type | Content Area Pattern | Primary Data Unit |
|---|---|---|
| SaaS Dashboard | Stat cards row + data table | Row / list item |
| B2B Admin | Left subnav + form sections | Form fields, tables |
| Developer Tool | Code pane + log pane | Code block, terminal row |
| Portfolio CMS | Card grid + detail panel | Image/media card |
| Analytics | Chart panels + filter bar | Chart, metric tile |
| Docs Site | Prose column (680px) + TOC sidebar | Heading, paragraph |

### 33.3 Typography Scale by App Type

| Context | Heading | Body | Labels |
|---|---|---|---|
| Marketing page | 64px, -0.04em | 16px | 12px uppercase |
| SaaS dashboard | 16px h4-like | 14px | 12px |
| Docs / prose | 24px | 16px | 12px |
| Data-heavy admin | 14px section heading | 14px | 11px |

### 33.4 Color Restrain Rule

Regardless of app type: **never add brand accent colors beyond the Vercel palette**. If you need a brand identity, express it through the logo only. The UI itself stays neutral. Any deviation from the black/white/gray system with a single blue accent immediately breaks the aesthetic.

### 33.5 CTA Hierarchy (Universal)

Always one decisive primary CTA per logical panel:
- **1 primary** (solid, filled)
- **1 secondary max** (ghost/outline)
- **No tertiary** in the same visual cluster — use a text link instead

Destructive CTAs must be spatially separated from constructive CTAs (never adjacent in a button row without a clear divider or confirmation gate).

---

## 34. Anti-Patterns — What to Never Do

| ❌ Common Mistake | ✅ Correct Vercel Approach |
|---|---|
| `color: #FFFFFF` for dashboard body text | Use `#EDEDED` — off-white, not pure white |
| Border radius 12px+ on interactive elements | Max 6–8px; 0–4px on marketing |
| Default letter-spacing on 48px+ headlines | Always `-0.04em` on large text |
| Padding 24px on marketing sections | 96–128px vertical section padding |
| Semi-transparent dark borders at 15% opacity | Use solid `#2E2E2E` or alpha `rgba(255,255,255,0.10)` |
| Blue used decoratively | Blue = links and active states only |
| Gradients on buttons, cards, or nav | Flat solid backgrounds only |
| Colored section backgrounds | Black/white surfaces only |
| `box-shadow` on dark surfaces | No shadows; use `#2E2E2E` border |
| Scale cards on hover | Border-color transition only |
| Instant tooltip appearance | 400ms delay before tooltip shows |
| `max-height` for accordion animation | Animate explicit JS-measured height |
| Filled/chunky icons | 1.5px stroke outline, Geist icons |
| Stock photos, illustrations | Screenshots, code demos, geometric shapes |
| Sidebar 220px or less | 256px (observed CSS variable) |
| 8px spacing base | 4px base — values: 4, 8, 12, 16, 24, 32... |
| Green for success | Teal `#50E3C2` or blue `#0070F3` for success |
| Error as `#EE0000` | Use observed `#E60000` |
| Heavy table row separators | Use `rgba(255,255,255,0.05)` hairlines |
| Multiple primary CTAs per panel | One decisive action per section |
| Large heading hierarchy in dashboard | h4-like headings, rely on spacing + weight |

---

*Sources: `vercel.com` marketing site (scraped), `vercel.com/geist` design system, `vercel.com/pricing`, `vercel.com/changelog` (Feb 2026 dashboard redesign), observed dashboard CSS variables, and third-party design system analysis cross-referenced against public Geist documentation. Last updated: May 2026.*
