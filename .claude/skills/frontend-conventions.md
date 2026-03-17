# Donos Frontend Skill Guide

You are building the frontend for **Donos**, a transparent donation platform on XRPL with a **solarpunk aesthetic**. This guide defines the visual language, conventions, and component patterns. Follow it strictly for every frontend task.

---

## Aesthetic Direction: Solarpunk Optimism

The visual identity is **hopeful, organic, and quietly futuristic**. Think sun-drenched meadows meeting clean technology. Not cyberpunk darkness — this is the optimistic timeline.

### Mood
- A flower field on a warm afternoon
- Paper-textured warmth, not sterile white
- Growth, light, breath — not corporate dashboards
- Technology that feels like nature, not machinery

### What We Are NOT
- No dark mode (this is a daylight app)
- No neon accents or cyberpunk glow
- No sharp corporate blues or greys  
- No cold/blue glassmorphism — use warm liquid glass instead (see Component Surface Style)
- No generic SaaS dashboard energy

---

## Component Surface Style: Liquid Glass

All interactive surfaces — cards, modals, dialogs, dropdowns, nav bars — should have a **liquid glass** appearance. This is warm, translucent, and organic — not the cold blue-tinted glassmorphism of corporate UI.

### The Recipe
```css
.liquid-glass {
  background: rgba(255, 253, 248, 0.55);       /* warm white, semi-transparent */
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 1rem;
  box-shadow:
    0 4px 24px rgba(107, 91, 78, 0.06),        /* warm outer glow */
    inset 0 1px 0 rgba(255, 255, 255, 0.5);    /* top highlight edge */
}
```

### Tailwind Shorthand
Use these utility classes together for a liquid glass surface:
```
bg-white/55 backdrop-blur-lg backdrop-saturate-[1.4]
border border-white/45 rounded-2xl
shadow-[0_4px_24px_rgba(107,91,78,0.06)]
[box-shadow:inset_0_1px_0_rgba(255,255,255,0.5),0_4px_24px_rgba(107,91,78,0.06)]
```

### Rules
- **Every card, panel, and floating element** uses liquid glass. No flat opaque backgrounds on components.
- The translucency should let the page's dot-grid background subtly bleed through — this creates depth.
- On hover, increase the background opacity slightly (e.g., `rgba(255, 253, 248, 0.7)`) for a gentle "solidifying" effect.
- Keep `border-radius` at `1rem` (rounded-2xl) minimum — liquid glass doesn't have sharp corners.
- Buttons use a denser glass: `bg-white/70` for secondary, or solid `--color-leaf` for primary CTAs.
- Do NOT use colored glass tints (no blue, no purple). Keep it warm-white/cream.

---

## Page Background: Canvas with Dot Grid

Every page uses a warm canvas background (`--color-canvas`: #FAF6F1) overlaid with a **subtle dot grid** pattern. This gives the app a modern, spatial feel while keeping the solarpunk warmth.

### CSS Implementation
```css
.page-bg {
  background-color: var(--color-canvas);
  background-image: radial-gradient(circle, rgba(107, 91, 78, 0.10) 1px, transparent 1px);
  background-size: 28px 28px;
}
```

### Tailwind Shorthand
Apply to every page wrapper / `<main>`:
```
bg-[var(--color-canvas)]
bg-[radial-gradient(circle,rgba(107,91,78,0.10)_1px,transparent_1px)]
[background-size:28px_28px]
```

### Rules
- The dot grid is **always present** on page backgrounds. It is the spatial foundation of the app.
- Dots are warm-tinted (`--color-bark` at 10% opacity), never black or grey.
- Grid spacing is 28px — tight enough to feel like graph paper, loose enough to breathe.
- The dot grid does NOT appear on components/cards — only on the page background behind the liquid glass surfaces.
- On the homepage hero, the dot grid may fade out or be hidden behind the flower field illustration — that's the one exception.

---

## Color Palette

Use these CSS variables globally. The palette is built around warm canvas tones with botanical accents.

```css
:root {
  /* Backgrounds */
  --color-canvas: #FAF6F1;          /* warm empty canvas — primary bg */
  --color-canvas-soft: #F5F0E8;     /* slightly deeper, for cards/sections */
  --color-canvas-warm: #EDE7DB;     /* used for hover states, borders */

  /* Botanical greens */
  --color-leaf: #4A7C59;            /* primary action color — buttons, links */
  --color-leaf-light: #6B9E7A;      /* hover states, secondary elements */
  --color-leaf-dark: #2F5738;       /* emphasis text on light backgrounds */
  --color-moss: #8BA888;            /* muted green for subtle accents */

  /* Earth tones */
  --color-bark: #6B5B4E;            /* secondary text, borders */
  --color-soil: #8B7355;            /* tertiary accents */
  --color-clay: #C4A882;            /* warm highlights, badges */

  /* Sun tones (use sparingly — for highlights and celebrations) */
  --color-sun: #E8B931;             /* achievement highlights, progress */
  --color-sun-soft: #F2D978;        /* gentle glow accents */
  --color-bloom: #D4845A;           /* warm call-to-action alternative */

  /* Text */
  --color-text-primary: #2C2416;    /* near-black with warmth */
  --color-text-secondary: #6B5B4E;  /* muted for descriptions */
  --color-text-tertiary: #9B8B7A;   /* hints, placeholders */

  /* Utility */
  --color-border: #E2D9CC;
  --color-border-strong: #C4B8A8;
  --color-success: #4A7C59;
  --color-warning: #D4845A;
  --color-error: #B85C4A;

  /* Shadows — warm tinted, never pure black */
  --shadow-sm: 0 1px 3px rgba(107, 91, 78, 0.08);
  --shadow-md: 0 4px 12px rgba(107, 91, 78, 0.10);
  --shadow-lg: 0 12px 32px rgba(107, 91, 78, 0.12);
}
```

---

## Typography

We use **two fonts**. One elegant serif for headings, one clean sans-serif for body. Import from Google Fonts.

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

:root {
  --font-heading: 'Playfair Display', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
}
```

### Usage Rules
- **Headings (h1-h3)**: Playfair Display. Use weight 500-600. Can use italic for elegant emphasis.
- **Body text, UI elements, buttons**: DM Sans. Use weight 400 for body, 500 for labels, 600 for buttons.
- **Never use Inter, Roboto, Arial, or system defaults.**
- **Minimum body font size**: 16px. Don't go smaller than 14px for any text.

### Scale
```
h1: 2.5rem / font-weight: 600   — page titles
h2: 1.75rem / font-weight: 500  — section titles  
h3: 1.25rem / font-weight: 500  — card titles
body: 1rem / font-weight: 400   — paragraphs
small: 0.875rem / font-weight: 400 — captions, hints
```

---

## Component Library & Icons

### shadcn/ui
Use shadcn components as the base for all UI elements. Restyle them to match our palette — override the default shadcn theme with our CSS variables.

Preferred shadcn components:
- `Button` — primary uses `--color-leaf`, secondary uses `--color-canvas-warm`
- `Card` — background `--color-canvas-soft`, border `--color-border`, warm shadow
- `Input`, `Textarea` — border `--color-border`, focus ring `--color-leaf-light`
- `Badge` — use `--color-clay` for neutral, `--color-leaf` for positive, `--color-bloom` for alerts
- `Dialog`, `Sheet` — for donation flows and confirmations
- `Progress` — for donation goals, use `--color-leaf` fill
- `Tabs` — for switching between NGO views, donor history
- `Tooltip` — for explaining blockchain concepts without cluttering UI

### Lucide Icons
Use `lucide-react` for all icons. No other icon library.

Commonly used icons for this project:
- `TreePine`, `Sprout`, `Leaf` — donation/growth metaphors
- `Heart`, `HandHeart` — donation actions
- `Eye`, `Search` — transparency/traceability
- `ArrowRight`, `ArrowUpRight` — navigation, external links
- `Shield`, `ShieldCheck` — trust/verification
- `Wallet` — balance display
- `Receipt` — transaction history
- `AlertTriangle` — NGO flags/anomalies
- `TrendingUp`, `BarChart3` — metrics/ratings
- `Sun` — solarpunk accent, celebrations

```tsx
import { TreePine, Heart, ShieldCheck } from "lucide-react";
```

---

## Layout Conventions

### Spacing
Use Tailwind's spacing scale. Prefer generous whitespace — the app should breathe.
- Page padding: `px-6 md:px-12 lg:px-24`
- Section gaps: `space-y-16` or `gap-16`
- Card padding: `p-6` minimum
- Between related elements: `space-y-3` or `gap-3`

### Page Structure
Every page follows this skeleton — note the dot-grid background and liquid glass nav:
```tsx
<main className="min-h-screen bg-[var(--color-canvas)] bg-[radial-gradient(circle,rgba(107,91,78,0.10)_1px,transparent_1px)] [background-size:28px_28px]">
  <nav className="sticky top-0 z-50 bg-white/55 backdrop-blur-lg backdrop-saturate-[1.4] border-b border-white/45">
    {/* liquid glass nav */}
  </nav>
  <section className="max-w-6xl mx-auto px-6 py-16">
    {/* page content — cards here use liquid glass surfaces */}
  </section>
  <footer>{/* minimal footer */}</footer>
</main>
```

### Responsive
- Mobile-first. All layouts must work at 375px width.
- Use Tailwind breakpoints: `sm:`, `md:`, `lg:`
- The tree visualization should be centered and scale down gracefully on mobile.

---

## Homepage: The Flower Field

The homepage is the emotional anchor. It should feel like arriving at a sunlit meadow.

### Composition
1. **Hero section**: large heading in Playfair Display, a one-liner describing Donos, a soft illustration or CSS-generated flower field in the background. CTA button "Start Growing" in `--color-leaf`.
2. **How it Works**: 3 steps with icons (Wallet → Heart → TreePine). Keep it dead simple. No blockchain jargon.
3. **Live Impact**: show aggregate stats (total donated, trees growing, NGOs supported). Animated counters on scroll.
4. **Featured NGOs**: card grid showing rated NGOs with their trust scores.

### The Flower Field Background
Use a CSS/SVG approach — scattered soft-colored circles or simple petal shapes on the canvas background. Subtle parallax or gentle sway animation. Do NOT use stock photos. This should feel illustrated and handcrafted.

---

## The Donor Tree (Core Visual)

This is the signature feature. A procedurally generated tree that grows as the donor accumulates DONO tokens.

### Growth Stages
| DONO Balance | Stage         | Visual                                    |
|-------------|---------------|-------------------------------------------|
| 0           | Seed          | A small seed on soil                      |
| 1-10        | Sprout        | Small green stem with 1-2 leaves          |
| 11-50       | Sapling       | Thin trunk, several branches with leaves  |
| 51-200      | Young Tree    | Visible trunk, canopy forming             |
| 201-1000    | Full Tree     | Lush canopy, strong trunk                 |
| 1000+       | Ancient Tree  | Massive, flowers/fruits appearing         |

### Branch Logic
- Each NGO the donor has given to = a distinct branch
- When an NGO moves funds (spends the donation) = sub-branches appear
- When proof is uploaded = fruit/flowers appear on that branch
- Color-code branches subtly by NGO

### Implementation Notes
- Use SVG or Canvas for the tree rendering
- Animate growth transitions smoothly (CSS transitions or framer-motion)
- Make branches clickable — tapping a branch shows the donation trail for that NGO
- The tree should be the centerpiece of the Donor Dashboard page

---

## Key UX Principles

### 1. Zero Blockchain Jargon in the UI
The user never sees: trustline, XRP Ledger, issued currency, base reserve, IOU, token issuance.
The user sees: donation receipt, verified, transparent, your impact, proof.

### 2. Donation Flow Must Feel Like 3 Clicks
Select NGO → Enter amount → Confirm. That's it. All XRPL operations (trustline setup, stablecoin transfer, token issuance) happen silently in the backend.

### 3. Notifications Are Personal
When an NGO uses donated funds: "Maria got her operation thanks to your help!" — not "Transaction 0xAF3... confirmed on ledger."

### 4. Trust Through Transparency, Not Complexity
Show the *results* of blockchain verification (green checkmarks, verified badges, audit trails) — not the blockchain itself.

---

## File & Folder Conventions

```
frontend/src/
├── components/
│   ├── ui/              # shadcn components (Button, Card, etc.)
│   ├── tree/            # Tree visualization components
│   ├── donation/        # Donation flow components
│   ├── ngo/             # NGO profile & rating components
│   └── layout/          # Nav, Footer, PageWrapper
├── pages/
│   ├── Home.tsx
│   ├── Donate.tsx
│   ├── Dashboard.tsx    # Donor tree + history
│   └── NGOProfile.tsx
├── hooks/               # Custom React hooks (useXrpl, useDonorTree, etc.)
├── utils/               # Helpers, formatters, constants
├── assets/              # Static SVGs, images if any
├── styles/
│   └── globals.css      # CSS variables, font imports, base styles
├── App.tsx
└── main.tsx
```

### Naming
- Components: PascalCase (`DonorTree.tsx`, `NGOCard.tsx`)
- Hooks: camelCase with `use` prefix (`useDonorBalance.ts`)
- Utils: camelCase (`formatDonation.ts`)
- Pages: PascalCase (`Dashboard.tsx`)

---

## Quick Reference for Prompting Claude

When asking Claude to build a component, include this context:

> "You are building a component for Donos, a solarpunk donation platform. Follow the conventions in FRONTEND_SKILL.md: use Playfair Display for headings, DM Sans for body, warm canvas backgrounds with a subtle dot grid (var(--color-canvas) + radial-gradient dots), botanical greens (var(--color-leaf)) for actions, Lucide icons, and shadcn components. All component surfaces use liquid glass style (semi-transparent warm white, backdrop-blur, soft border). No dark mode, no blockchain jargon in the UI, generous whitespace. The aesthetic is a sun-drenched flower field — hopeful and organic."