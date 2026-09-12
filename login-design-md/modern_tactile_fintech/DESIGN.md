---
name: Modern Tactile Fintech
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3e4947'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6e7977'
  outline-variant: '#bdc9c6'
  surface-tint: '#006a63'
  primary: '#005c55'
  on-primary: '#ffffff'
  primary-container: '#0f766e'
  on-primary-container: '#a3faef'
  inverse-primary: '#80d5cb'
  secondary: '#4b41e1'
  on-secondary: '#ffffff'
  secondary-container: '#645efb'
  on-secondary-container: '#fffbff'
  tertiary: '#734700'
  on-tertiary: '#ffffff'
  tertiary-container: '#945d00'
  on-tertiary-container: '#ffe6cc'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9cf2e8'
  primary-fixed-dim: '#80d5cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#0f0069'
  on-secondary-fixed-variant: '#3323cc'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.005em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.05em
  metric-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.03em
  metric-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.025em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 2.5rem
  gutter-mobile: 1rem
  margin-mobile: 1rem
  gutter-tablet: 1.25rem
  margin-tablet: 2rem
  touch-target-min: 2.75rem
---

## Brand & Style

This design system delivers a calm, authoritative, and frictionless financial tracking experience. Balancing modern minimalism with subtle tactile cues, it strips away financial anxiety by prioritizing high glanceability, crisp data hierarchy, and responsive feedback.

- **Brand Personality**: Disciplined, lucid, empowering, and discreetly luxurious.
- **Aesthetic Direction**: Minimalist fintech enhanced by tactile micro-interactions. Interface surfaces lean on clean paper-like off-whites and cool zinc slates, accented by rich emerald teal and focused indigo to differentiate asset accumulation from debt reconciliation.
- **Target Audience**: Discerning, design-conscious individuals seeking effortless expense oversight, cashflow pacing, and transparent peer-to-peer balance settlement.
- **Emotional Intent**: Control, reassurance, and tactile satisfaction upon logging transactions or settling accounts.

## Colors

The palette employs balanced chroma separation: an organic emerald teal anchoring positive cashflow and primary actions, balanced against a deep indigo dedicated to split debts, receivables, and analytics.

- **Primary (`#0F766E`)**: Anchors primary buttons, positive balance gains, confirmed settlements, and key brand marks.
- **Secondary (`#4F46E5`)**: Governs peer lending states, category transfers, projected milestones, and deep analytics.
- **Tertiary (`#F59E0B`)**: Dedicated to pending statuses, warning thresholds, and upcoming payment alerts.
- **Neutral (`#0F172A`)**: Sets deep slate for high-contrast alphanumeric metrics and core readability over `#F8FAFC` base canvases and `#FFFFFF` cards.

### State & Ledger Signals
- **Positive / Inflow**: `#059669` (surface tint `#ECFDF5`).
- **Negative / Outflow**: `#E11D48` (surface tint `#FFF1F2`).
- **Lent States**:
  - *Pending*: Background `#FEF3C7`, Text `#92400E`.
  - *Partial*: Background `#EEF2FF`, Text `#4338CA`.
  - *Settled / Paid*: Background `#CCFBF1`, Text `#0F766E`.

## Typography

Typography prioritizes tabular legibility and numeric scannability:
- **Headlines & Metrics**: Set in `Plus Jakarta Sans` for geometric authority and contemporary presence. Numerical displays (`metric-xl`) use tabular lining figures (`font-variant-numeric: tabular-nums`) to align rolling financial values without layout shifts.
- **Body & Labels**: Set in `Inter` to ensure legibility across multi-tiered category metadata, timestamps, and ledger descriptions.
- **Tracking**: Tightened across display levels (`-0.02em` to `-0.03em`) to deliver a compact, premium digital appearance; wide tracking on small uppercase badges (`+0.05em`) for swift status recognition.

## Layout & Spacing

A mobile-first, strict 4px/8px incremental rhythm engineered for thumb ergonomics:

- **Mobile Viewport (< 640px)**: 4-column fluid layout with `16px` (`1rem`) outer margins and gutters. Key navigation and transaction actions stay within the bottom ergonomic reach zone (44px–120px above home indicator).
- **Tablet Viewport (640px – 1024px)**: 8-column layout with `32px` margins; ledger lists and category spend breakdowns sit in dual-column format.
- **Desktop / Wide Dashboard (> 1024px)**: 12-column layout maxing out at `1120px` width, centered with ample whitespace.
- **Touch Target Integrity**: Any interactive surface (toggles, icons, chips) maintains a physical dimension or hit box of at least `44px x 44px` (`touch-target-min: 2.75rem`).

## Elevation & Depth

Visual hierarchy combines light-reactive surface elevations with subtle physical inset and stroke contours.

- **Base Canvas**: Neutral `#F8FAFC`.
- **Card Tier (Resting)**: `#FFFFFF` paired with an ultra-fine structural border: `1px solid rgba(15, 23, 42, 0.06)`. Elevated by an ambient shadow: `0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03)`.
- **Floating Action / Elevated Sheets**: Ambient shadow with subtle emerald saturation: `0 12px 28px -4px rgba(15, 118, 110, 0.18), 0 6px 10px -2px rgba(15, 23, 42, 0.04)`.
- **Tactile Insets**: Pressed or active card states transition subtly via `transform: scale(0.985)` coupled with a low-depth internal shading `inset 0 2px 4px rgba(15, 23, 42, 0.06)` for physical touch feedback.
- **Floating Bottom Bar**: Glass-sheen backing using `rgba(255, 255, 255, 0.88)` with `backdrop-filter: blur(16px)` and a subtle `1px` top rim highlight (`rgba(255, 255, 255, 0.8)`).

## Shapes

The design uses balanced, modern geometric curvatures:
- **Cards & Surfaces**: Default to `rounded-2xl` (`1rem` / `16px`) for a soft, friendly hand-feel on handheld displays.
- **Buttons & Interactive Pills**: Primary action triggers, quick-add badges, and status pills utilize full concentric pill radii (`9999px`) to invite interaction and distinct separation from cards.
- **Inputs & Category Badges**: Form containers, textfields, and metric chips maintain a cohesive `12px` (`0.75rem`) radius.

## Components

### Buttons
- **Primary**: Pill-shaped (`rounded-full`), `#0F766E` background with `#FFFFFF` text. Height is `48px`, horizontal padding is `24px`. Micro-tactile active state: `transform: scale(0.97)` and shadow reduction.
- **Secondary**: `#EEF2FF` background with `#4F46E5` text, matching dimensions.
- **Icon Action (Floating Add)**: Centered `56px x 56px` circle in `#0F766E` with subtle white highlight ring and soft elevation.

### Status Badges & Chips
- **Category Badges**: Compact pill chips (`height: 28px`, `px: 10px`) utilizing muted pastel tints with high-contrast foreground labels (e.g., Groceries: `#ECFDF5`/`#065F46`; Transport: `#EFF6FF`/`#1E40AF`).
- **Debt / Lent Indicators**:
  - *Pending*: `#FEF3C7` background, `#92400E` text, amber bullet icon (`●`).
  - *Partial*: `#EEF2FF` background, `#4338CA` text, dual split-ring icon (`◐`).
  - *Paid*: `#CCFBF1` background, `#0F766E` text, solid checkmark (`✓`).

### Transaction List Items
- **Structure**: Row height minimum of `64px`, `px: 16px`, containing a `40px` circular category glyph container, stacked title and date/counterparty, and right-aligned tabular amount with status indicator below.
- **Divider**: Subtle border bottom (`1px solid rgba(15, 23, 42, 0.04)`), inset to start at label margin.

### Input Fields & Controls
- **Text & Currency Inputs**: `48px` height, `12px` border radius, `#F1F5F9` background with no border at rest; focuses into `#FFFFFF` surface with `2px solid #0F766E` ring.
- **Checkboxes & Radios**: Custom `20px x 20px` bounds, `6px` radius for checkboxes, filled with `#0F766E` when active. Minimum touch target padded out to `44px`.

### Bottom Navigation Bar
- **Configuration**: Floating docked capsule or flush bottom anchor with `height: 64px`, `px: 24px`, background `rgba(255, 255, 255, 0.9)` with backdrop blur.
- **Items**: 4 to 5 ergonomic destinations with centered icon and active-state pill highlight (`#F0FDFA` tint with `#0F766E` icon color).