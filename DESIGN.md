# CourseMate Design System (DESIGN.md)
*Semantic Design System for ISBAT University Campus Companion*
*Synthesized using Google Stitch Design Principles & Taste Engine*

---

## 1. Atmosphere & Design Philosophy

CourseMate is designed as an **elite, high-trust campus companion** that feels like an iOS native, tactile instrument rather than a standard web portal. It bridges legacy university ERP systems with a modern, fluid consumer-grade mobile experience.

- **Visual Archetype**: *Obsidian Glass & Precision Utility*
- **Density**: 6.5 / 10 (*Balanced Informational Density* — dense enough to see a full day's timetable at a glance, with sufficient breathing room for touch ergonomics).
- **Variance**: 6.0 / 10 (*Refined Asymmetry* — staggered schedule timelines, accent badge offsets, tactile bottom navigation).
- **Motion**: 7.0 / 10 (*Spring Physics & Spatial Transitions* — smooth drawer transitions, pill tab switches, countdown pulses).
- **Trust Tier**: *Bank-Grade Security Aesthetic* — cryptographic shield badges, hardware keystore indicators, clear data provenance.

---

## 2. Color Calibration & Semantic Tokens

### Core Rules
- **No Neon Purple/Blue AI Gradients**: Banned.
- **Off-Black Base**: Pure `#000000` is banned. Backgrounds use tailored slate-tinted obsidian.
- **Singular Vibrant Accent**: High-agency Emerald Cyan (`#00D285` / `#05B374`) communicating active clearance and university vitality, grounded by deep midnight surfaces.

### Dark Mode (Primary Default)
| Token Name | Hex Code | Functional Role |
| :--- | :--- | :--- |
| `--bg-base` | `#0B0F14` | Primary viewport backdrop (Deep Obsidian) |
| `--bg-surface` | `#131922` | Card, container, and sheet background |
| `--bg-surface-elevated` | `#1A2330` | Modals, active pills, highlighted rows |
| `--bg-glass` | `rgba(19, 25, 34, 0.78)` | Backdrop-filtered sheets and floating tab bars |
| `--border-subtle` | `rgba(255, 255, 255, 0.08)` | Standard card and divider borders |
| `--border-strong` | `rgba(255, 255, 255, 0.16)` | Focused inputs, active borders, structural lines |
| `--accent-primary` | `#00D285` | Clearance state, active tabs, primary CTAs |
| `--accent-primary-hover`| `#00B572` | Hover & pressed states |
| `--accent-glow` | `rgba(0, 210, 133, 0.15)` | Subtle badge ambient glow |
| `--accent-secondary` | `#0EA5E9` | Timetable slots, schedule markers, exams |
| `--accent-warning` | `#F59E0B` | Inactive semester notice, deadlines, dues |
| `--accent-danger` | `#EF4444` | Urgent attendance tips, outstanding fees |
| `--text-primary` | `#F8FAFC` | Headings, primary labels, values |
| `--text-secondary` | `#94A3B8` | Subtitles, timestamps, metadata |
| `--text-muted` | `#64748B` | Helper captions, disabled states |

### Light Mode
| Token Name | Hex Code | Functional Role |
| :--- | :--- | :--- |
| `--bg-base` | `#F8FAFC` | Alabaster slate background |
| `--bg-surface` | `#FFFFFF` | Pure white cards |
| `--bg-surface-elevated` | `#F1F5F9` | Elevated panels & pills |
| `--bg-glass` | `rgba(255, 255, 255, 0.85)` | Frosted glass floating elements |
| `--border-subtle` | `rgba(0, 0, 0, 0.07)` | Dividers and borders |
| `--border-strong` | `rgba(0, 0, 0, 0.14)` | Card outlines |
| `--accent-primary` | `#059669` | High-contrast emerald for light mode |
| `--accent-glow` | `rgba(5, 150, 105, 0.12)` | Subtle highlight ring |
| `--text-primary` | `#0F172A` | Sharp charcoal black |
| `--text-secondary` | `#475569` | Secondary text |
| `--text-muted` | `#94A3B8` | Captions |

---

## 3. Typographic Architecture

Typography is loaded from Google Fonts:
1. **Display & Headings**: `Outfit` (Geometric, contemporary, approachable yet crisp).
2. **Body & Controls**: `Plus Jakarta Sans` (High legibility, humanist clarity, clean rendering on mobile viewports).
3. **Data & Codes**: `JetBrains Mono` (Strictly used for Course Codes `HEC1207`, Timetable Hours `2:30PM - 5:30PM`, Financial Figures `UGX 4,200,000`, and Exam Countdown Clocks).

---

## 4. Elevation, Glassmorphism & Surface Tokens

- **Blur**: `backdrop-filter: blur(16px) saturate(180%)`
- **Card Radius**: `18px` for primary cards, `12px` for badges and inner modules, `28px` for pill tabs.
- **Shadows**:
  - `--shadow-card`: `0 8px 24px -4px rgba(0, 0, 0, 0.25)`
  - `--shadow-modal`: `0 24px 60px -8px rgba(0, 0, 0, 0.65)`
  - `--shadow-glow`: `0 0 20px rgba(0, 210, 133, 0.2)`

---

## 5. Motion & Interaction Standards

- **Easing Curve**: Spring cubic-bezier `cubic-bezier(0.16, 1, 0.3, 1)`
- **Duration**: Fast micro-animations `180ms - 280ms`
- **Active States**: Tactile push `transform: scale(0.97)` on tap.
- **Stagger Delays**: Cascade list animations with `50ms` stagger per card.

---

## 6. Anti-Patterns Banned
- ❌ No generic "AI Purple" glow or neon gradients.
- ❌ No default browser scrollbars.
- ❌ No generic bootstrap buttons or bland tables.
- ❌ No full-page blocking authentication gate upfront (Progressive Onboarding is mandatory).
- ❌ No unformatted currency or raw database timestamps.
