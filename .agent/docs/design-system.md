# CSS Design System
Last updated: 2026-05-09

## Overview
Vanilla CSS only (no Tailwind). Three CSS files: `app.css` (app shell tokens + utilities), `marketing.css` (public pages), `animations.css` (keyframes). Imported by `globals.css`. Supports 3 themes via `data-theme` on `<html>`.

## Key files
- `src/styles/app.css` — all app shell CSS custom properties and utility classes
- `src/styles/marketing.css` — landing, pricing, about page styles
- `src/styles/animations.css` — keyframes (fadeIn, slideUp, tf-shimmer, tf-pulse, card-appear)
- `src/app/globals.css` — root import file + body defaults
- `src/components/ui/TweaksPanel.tsx` — theme switcher (writes data-theme + localStorage)

## Patterns
Class naming convention: `.tf-*` prefix for all app utility classes
- Cards: `.tf-card`, `.tf-card-head`, `.tf-card-title`
- Nav: `.tf-nav`, `.tf-nav-item`, `.tf-nav-badge`, `.tf-nav-section`
- Badges: `.tf-badge`, `.tf-badge-success`, `.tf-badge-critical`, `.tf-badge-high`, `.tf-badge-medium`, `.tf-badge-violet`
- Chips: `.tf-chip`, `.tf-chip.active`
- Skeleton: `.tf-skeleton` + `@keyframes tf-shimmer`
- Dirty pulse: `.tf-dirty` + `@keyframes tf-pulse`

## Key token values (EXACT — do not change)
- `--bg-0: #07070A` (root bg)
- `--accent: #8B5CF6` (primary violet — NOT #7C3AED)
- `--accent-2: #A78BFA`, `--accent-3: #6366F1`
- `--glass-blur: 18px`
- `--success: #34D399`, `--warning: #FBBF24`, `--error: #F87171`

## Gotchas
- Accent is #8B5CF6 — the old plan said #7C3AED. Use #8B5CF6 everywhere.
- TweaksPanel writes `data-theme` to `document.documentElement` — add inline script to root layout to avoid flash on refresh
- marketing.css should NOT be imported in app shell pages — only in (marketing) route group

## Do not
- Use Tailwind classes
- Hardcode color hex values in component files — always use CSS custom properties
- Create new CSS files outside the 3 designated files
