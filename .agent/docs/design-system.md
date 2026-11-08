# CSS Design System
Last updated: 2026-11-08

## Overview
Vanilla CSS only (no Tailwind — locked decision). Three CSS files, all imported by `src/app/globals.css`: `app.css` (tokens + app shell/utilities), `marketing.css` (public pages, `m-*` keyframes/classes), `animations.css` (`tf-*` keyframes + animation classes). Three themes via `data-theme` on `<html>`. Token reference: ARCHITECTURE.md § Visual Identity.

## Key files
- `src/styles/app.css` — `:root` tokens, theme blocks, app shell, `.tf-*` components
- `src/styles/marketing.css` — landing/pricing/about (`.hero`, `.feat-card`, `m-*`)
- `src/styles/animations.css` — `tf-fade-in`, `tf-slide-up`, `tf-scale-in`, `tf-card-appear`, `tf-shimmer`, `tf-pulse-violet`, `tf-spin`, `tf-typing` (+ `.tf-typing-dot`), `tf-slide-in-right/out-right`, `tf-modal-appear`, `tf-streaming-dot`
- `src/app/globals.css` — font import (Inter, JetBrains Mono, Instrument Serif), imports the 3 CSS files, `body` defaults
- `src/components/ui/TweaksPanel.tsx` — theme switcher
- `src/app/layout.tsx` — inline `<script>` applies the stored theme before first paint (flash prevention is implemented)

## Class naming (`.tf-*`)
- Layout: `.tf-app`, `.tf-sidebar`, `.tf-main`, `.tf-topbar`, `.tf-content`, `.tf-grid-2/3/4`, `.tf-row`, `.tf-col`
- Cards: `.tf-card`, `.tf-card-head`, `.tf-card-title`, `.tf-card-sub`
- Nav: `.tf-nav`, `.tf-nav-item`, `.tf-nav-item--disabled`, `.tf-nav-badge`, `.tf-nav-section`
- Badges: `.tf-badge` + `-success|-warning|-critical|-high|-medium|-low|-info|-violet`; `.tf-pill`, `.tf-provider-badge`
- Controls: `.tf-btn` (+ `-primary|-ghost|-danger|-sm|-lg|-icon`), `.tf-chip` (+ `.active`), `.tf-input`, `.tf-textarea`, `.tf-select`, `.tf-toggle`, `.tf-tabs`/`.tf-tab`, `.tf-dropdown`/`-item`, `.tf-modal*`
- States: `.tf-skeleton*` (shimmer), `.tf-dirty` (pulse: `tf-pulse-violet`), `.tf-fade-in`, `.tf-spin`
- Feature: `.tf-tcrow*` (test case rows), `.tf-uploader*`, `.tf-screen-thumb`, `.tf-stat`/`.tf-stat-label`

## Token values (ARCHITECTURE.md vs app.css)
Accent family matches everywhere in the default theme: `--accent: #8B5CF6` (NOT #7C3AED), `--accent-2: #A78BFA`, `--accent-3: #6366F1`, `--accent-glow rgba(139,92,246,0.18)`, `--accent-strong rgba(139,92,246,0.45)`; `--glass-bg rgba(20,20,26,0.68)`, `--glass-blur 18px`, `--border rgba(255,255,255,0.07)`, `--border-strong …0.12`; `--success #34D399`, `--warning #FBBF24`, `--error #F87171`, `--info #60A5FA`; `--radius-sm/md/lg/xl 8/12/16/24px`; `--bg-0 #07070A`.

Neutral scales differ slightly (ARCHITECTURE → current app.css):
- `--bg-1` #0F0F13 → #0E0E12; `--bg-2` #141418 → #15151B; `--bg-3` #1C1C22 → #1C1C24
- `--text-0` #F0F0F4 → #F2F2F5; `--text-1` #9494A8 → #A1A1AA; `--text-2` #5A5A70 → #65656E
Code is what renders. Human decision: update ARCHITECTURE.md to app.css or vice versa.

## Themes (`data-theme`, localStorage key `tf-theme`)
`default` (Deep Obsidian; no attribute set), `lighter-glass`, `mono-violet`. Mono Violet sets `--accent: #8B5CF6`, `--accent-2: #A78BFA`, `--accent-glow rgba(139,92,246,0.15)`, `--accent-strong rgba(139,92,246,0.40)` (verified by reading `app.css` 2026-11-08). Resolved: previously used the retired #7C3AED; fixed by human decision to match the locked accent #8B5CF6.

## Gotchas
- Use CSS custom properties, not hex, in components. **Exception:** CSS variables cannot take an alpha suffix. Color maps that append hex alpha (suffixes seen in code: `'12'|'18'|'22'|'30'|'40'|'44'`) use hex literals, e.g. severity/category/persona colors in `PersonaFrictionClient`, `TestDataClient`, `LaunchReadinessClient`, `I18nAuditClient`, `GapAnalysisClient` (also `BugReportsClient`, `UXAuditClient`). Keep those literals in one map per file and match them to token hexes (#F87171 error, #FBBF24 warning, #60A5FA info, #34D399 success). Where alpha is needed for a token color, prefer `color-mix(in srgb, var(--x) 20%, transparent)`.
- `tf-shimmer` and `tf-pulse-violet` keyframes are defined in both `app.css` and `animations.css` (duplicates; same name, last import wins); `m-float-y` is likewise defined in both `animations.css` and `marketing.css`. There is no `tf-pulse` keyframe.
- All three CSS files load globally (via globals.css), so marketing styles are present in the app shell; marketing class names are namespaced (`m-*`, hero/feat) to avoid collisions.
- `TweaksPanel` writes `data-theme` to `document.documentElement` and persists to localStorage (wrapped in try/catch).

## Do not
- Use Tailwind classes.
- Hardcode hex in component styles except the alpha-suffix map exception above.
- Create new CSS files beyond the three designated ones.
- Re-use #7C3AED as the accent.
