---
name: Clinical Clarity & Modern Pulse
project: HealthSense (Mobile)
projectId: 'projects/17860711836284662528'
deviceType: MOBILE
colorMode: LIGHT
font: PLUS_JAKARTA_SANS
roundness: ROUND_EIGHT
colors:
  # Base & Surfaces
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  surface-variant: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#424655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#727787'
  outline-variant: '#c2c6d8'
  surface-tint: '#0057ce'

  # Primary (Medical Trust Blue)
  primary: '#0057cd'
  on-primary: '#ffffff'
  primary-container: '#0d6efd'
  on-primary-container: '#ffffff'
  inverse-primary: '#b1c5ff'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b1c5ff'
  on-primary-fixed: '#001946'
  on-primary-fixed-variant: '#00419e'

  # Secondary (Cyan / Clinical Teal - SpO2 & Telemetry)
  secondary: '#00687a'
  on-secondary: '#ffffff'
  secondary-container: '#57dffe'
  on-secondary-container: '#006172'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'

  # Tertiary (Emerald / Normal Flora - Sinus Rhythm & Goals)
  tertiary: '#006c49'
  on-tertiary: '#ffffff'
  tertiary-container: '#00885d'
  on-tertiary-container: '#000703'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'

  # Error & Critical (Coral Alert / AFib)
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'

  # Background & Canvas
  background: '#f8f9ff'
  on-background: '#0b1c30'

  # Semantic Hardware & Telemetry Overrides
  brand-blue: '#0d6efd'
  clinical-cyan: '#06b6d4'
  status-normal: '#10b981'
  status-warning: '#f59e0b'
  status-critical: '#ef4444'
  text-primary: '#0f172a'
  text-muted: '#64748b'

typography:
  display-metric:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-metric-unit:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 16px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px

rounded:
  sm: 0.25rem       # 4px
  DEFAULT: 0.5rem   # 8px
  md: 0.75rem       # 12px
  lg: 1rem          # 16px
  xl: 1.5rem        # 24px
  full: 9999px      # Pill / Circular

spacing:
  space-xxs: 0.25rem        # 4px
  space-xs: 0.5rem          # 8px
  space-sm: 0.75rem         # 12px
  space-md: 1rem            # 16px
  space-lg: 1.25rem         # 20px
  space-xl: 1.5rem          # 24px
  space-2xl: 2rem           # 32px
  space-3xl: 2.5rem         # 40px
  margin-screen: 1.25rem    # 20px
  gutter-grid: 1rem         # 16px
  dock-bottom-height: 4.5rem # 72px
---

# HealthSense Design System: Clinical Clarity & Modern Pulse

> Extracted from Stitch Project `HealthSense` (`projects/17860711836284662528`).

## 1. Brand & Aesthetic Direction

This design system establishes a high-trust, medical-grade digital atmosphere combined with the fluidity, approachability, and polish of a premier consumer wellness mobile application. Specially tailored for vital sign monitoring, ECG/PPG rhythm telemetry, and Atrial Fibrillation (AFib) early detection, the UI balances critical clinical reliability with calm, reassuring visuals.

The design movement combines **Modern Corporate Precision** with **Soft Glass & Tactile Elevation**:
- **Clarity over Chaos**: Strips away high-saturation gradients in favor of clean icy-blue backgrounds, balanced tonal surface elevations, and generous border-radii.
- **Strict Clinical Hierarchy**: Critical biometric warnings demand sharp, unmistakable focus without inducing panic, while standard physiological metrics offer clear, peaceful reassurance.

---

## 2. Bảng Màu (Color Palette)

The palette is engineered to satisfy medical data visualization standards (contrast ratios > 4.5:1 for body and data readouts, > 3:1 for graphical anchors) while creating a restorative, clean atmosphere.

### 2.1 Functional Brand & Semantic Tiers

| Role | Color Name | Hex Code | Purpose & Usage |
| :--- | :--- | :--- | :--- |
| **Primary Brand** | Medical Trust Blue | `#0D6EFD` / `#0057CD` | Main actions (CTA), active navigation tab, verified BLE pairing, primary telemetry highlights. |
| **Secondary Brand** | Cyan / Clinical Teal | `#06B6D4` / `#00687A` | Oxygen saturation (SpO2), PPG signal stability, device handshake indicators. |
| **Tertiary / Success** | Emerald / Normal Flora | `#10B981` / `#006C49` | Normal sinus rhythm, target physical activity completion, safe physiological ranges. |
| **Warning** | Amber Warning | `#F59E0B` | Elevated heart rate, moderate arrhythmia warnings, low battery / weak BLE signal. |
| **Critical / Danger** | Coral AFib Alert | `#EF4444` / `#BA1A1A` | High-urgency cardiac alerts, AFib rhythm detection, emergency call trigger. |
| **Text Primary** | Deep Slate | `#0B1C30` / `#0F172A` | Primary headlines, metric values, high-contrast readable text. |
| **Text Muted** | Slate Gray | `#424655` / `#64748B` | Subheaders, metric units, descriptive body labels, timestamps. |
| **Canvas Background** | Arctic Ice Canvas | `#F8F9FF` | Soft cool background reducing eye strain during long telemetry sessions. |
| **Surface Card** | Pure White | `#FFFFFF` | Elevated metric cards, dialog surfaces, input backgrounds. |

### 2.2 Material Design 3 Named Color Tokens

#### Surface & Container Tokens
| Token Name | Hex Code | Description |
| :--- | :--- | :--- |
| `surface` | `#f8f9ff` | Base screen surface background |
| `surface_bright` | `#f8f9ff` | Bright ambient surface |
| `surface_dim` | `#cbdbf5` | Slightly dimmed surface tone |
| `surface_container_lowest` | `#ffffff` | Elevated clinical cards & group containers |
| `surface_container_low` | `#eff4ff` | Subtle grouping backdrops |
| `surface_container` | `#e5eeff` | Section backgrounds & input containers |
| `surface_container_high` | `#dce9ff` | Secondary chips and active elements |
| `surface_container_highest`| `#d3e4fe` | Prominent separators and subtle borders |
| `surface_variant` | `#d3e4fe` | Muted decorative surfaces |
| `on_surface` | `#0b1c30` | Main text on surface |
| `on_surface_variant` | `#424655` | Secondary text on surface |
| `inverse_surface` | `#213145` | Inverted surface (dark banners, tooltips) |
| `inverse_on_surface` | `#eaf1ff` | High-contrast text on inverted surface |
| `outline` | `#727787` | Strong border outlines |
| `outline_variant` | `#c2c6d8` | Subtle card borders and dividers |
| `surface_tint` | `#0057ce` | Surface tint accent |

#### Primary Tokens
| Token Name | Hex Code | Description |
| :--- | :--- | :--- |
| `primary` | `#0057cd` | Primary action color |
| `on_primary` | `#ffffff` | Text / icons on primary |
| `primary_container` | `#0d6efd` | Primary button fill & highlighted states |
| `on_primary_container` | `#ffffff` | Text on primary container |
| `primary_fixed` | `#dae2ff` | Fixed light primary container |
| `primary_fixed_dim` | `#b1c5ff` | Dimmed primary fixed container |
| `on_primary_fixed` | `#001946` | High-contrast text on primary fixed |
| `on_primary_fixed_variant` | `#00419e` | Variant text on primary fixed |
| `inverse_primary` | `#b1c5ff` | Inverted primary |

#### Secondary Tokens (SpO2 & Telemetry)
| Token Name | Hex Code | Description |
| :--- | :--- | :--- |
| `secondary` | `#00687a` | Secondary action / teal accent |
| `on_secondary` | `#ffffff` | Text on secondary |
| `secondary_container` | `#57dffe` | Oxygenation / SpO2 chip backgrounds |
| `on_secondary_container` | `#006172` | Text on secondary container |
| `secondary_fixed` | `#acedff` | Fixed light secondary container |
| `secondary_fixed_dim` | `#4cd7f6` | Dimmed secondary fixed |
| `on_secondary_fixed` | `#001f26` | Text on fixed secondary |
| `on_secondary_fixed_variant` | `#004e5c` | Variant text on fixed secondary |

#### Tertiary Tokens (Normal Flora / Sinus Rhythm)
| Token Name | Hex Code | Description |
| :--- | :--- | :--- |
| `tertiary` | `#006c49` | Healthy status accent (sinus rhythm) |
| `on_tertiary` | `#ffffff` | Text on tertiary |
| `tertiary_container` | `#00885d` | Normal rhythm banner & pill fills |
| `on_tertiary_container` | `#000703` | Text on tertiary container |
| `tertiary_fixed` | `#6ffbbe` | Fixed light green container |
| `tertiary_fixed_dim` | `#4edea3` | Dimmed green fixed container |
| `on_tertiary_fixed` | `#002113` | Text on fixed green |
| `on_tertiary_fixed_variant` | `#005236` | Variant text on fixed green |

#### Error & Alert Tokens (Critical AFib)
| Token Name | Hex Code | Description |
| :--- | :--- | :--- |
| `error` | `#ba1a1a` | Critical heart alerts, error feedback |
| `on_error` | `#ffffff` | Text on error |
| `error_container` | `#ffdad6` | Soft alert background for AFib warnings |
| `on_error_container` | `#93000a` | Deep red text on alert container |

---

## 3. Kiểu Chữ (Typography)

The typography exclusively relies on **Plus Jakarta Sans** across all roles, selected for its contemporary geometric clarity, humanist warmth, and exceptional numeral legibility on mobile handheld displays.

### 3.1 Type Scale Specification

| Token Name | Font Size | Weight | Line Height | Letter Spacing | Intended Application |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-metric` | 36px | 800 (ExtraBold) | 44px | Normal (`tnum`) | Real-time vitals: Heart rate (BPM), SpO2 (%), Steps, AFib score |
| `display-lg` | 32px | 700 (Bold) | 40px | -0.02em | Onboarding hero titles, major welcome banners |
| `headline-lg` | 24px | 700 (Bold) | 32px | -0.015em | Screen headers, modal titles, section highlights |
| `headline-md` | 20px | 600 (SemiBold) | 28px | -0.01em | Dashboard module titles, diagnostic summary headers |
| `headline-sm` | 18px | 600 (SemiBold) | 24px | 0 | Card section titles, BLE device titles |
| `body-lg` | 16px | 400 (Regular) | 24px | 0 | Long diagnostic explanations, doctor recommendations |
| `body-md` | 14px | 400 (Regular) | 20px | 0 | General interface body copy, input text, form labels |
| `body-sm` | 12px | 400 (Regular) | 16px | +0.005em | Telemetry card titles, timestamp notes, secondary captions |
| `label-lg` | 14px | 600 (SemiBold) | 20px | 0 | Primary CTA button labels, action text |
| `label-metric-unit` | 13px | 700 (Bold) | 16px | +0.02em | Metric unit text adjacent to numbers (e.g., `BPM`, `%`, `mmHg`) |
| `label-md` | 12px | 600 (SemiBold) | 16px | +0.05em (Upper) | Category markers (e.g., `EMAIL`, `MẬT KHẨU`, `KẾT NỐI BLE`) |
| `label-sm` | 11px | 600 (SemiBold) | 14px | +0.03em | Status badge pills, tiny tags, filter chip labels |

### 3.2 Clinical Principles for Typography
- **Tabular Figures (`tnum`)**: All numeric readings (BPM, SpO2, timestamps) must enable tabular numbers to prevent jitter during live 60-second PPG/ECG telemetry streams.
- **Scanning Beacons**: Section labels use `label-md` uppercase with `0.05em` letter tracking to establish immediate scanning anchors.
- **Clinical Readability Guardrail**: Critical diagnostic and safety instructions must never fall below 14px (`body-md`) to ensure effortless readability for elderly patients.

---

## 4. Spacing & Layout Rhythm

Anchored on an 8pt base grid with a 4pt sub-grid for mobile ergonomics:

- **Horizontal Screen Margins**: `1.25rem` (20px) fixed to prevent accidental palm rejection touches on edge-to-edge screens.
- **Card Content Padding**: `1.25rem` (20px) on telemetry cards; `1rem` (16px) on compact 2-column dashboard widgets.
- **Vertical Spacing**: `1.5rem` to `2rem` between dashboard sections.
- **Dock Bottom Clearance**: Bottom padding of `5.5rem` to prevent content clipping under the elevated bottom navigation bar.

| Token | Value (rem) | Pixels |
| :--- | :--- | :--- |
| `space-xxs` | 0.25rem | 4px |
| `space-xs` | 0.5rem | 8px |
| `space-sm` | 0.75rem | 12px |
| `space-md` | 1.0rem | 16px |
| `space-lg` | 1.25rem | 20px |
| `space-xl` | 1.5rem | 24px |
| `space-2xl` | 2.0rem | 32px |
| `space-3xl` | 2.5rem | 40px |

---

## 5. Elevation, Shapes & Radii

### 5.1 Corner Radius Tokens (`roundness: 2`)
- `rounded-sm` (`0.25rem` / 4px): Micro badges, small progress indicators.
- `rounded-md` (`0.75rem` / 12px): Inner sub-elements, input container corners.
- `rounded-lg` (`1rem` / 16px): Primary buttons, metric cards, dialog boxes.
- `rounded-xl` (`1.5rem` / 24px): Large bottom sheets, welcome card grouping surfaces.
- `rounded-full` (`9999px`): Status pills (`Nhịp xoang đều`, `Rung nhĩ`), BLE tags, FAB scan button.

### 5.2 Elevation & Shadows
- **Level 0 (Base Canvas)**: `#F8FAFC`, no shadow.
- **Level 1 (Clinical Cards)**: `#FFFFFF`, border `1px solid rgba(226, 232, 240, 0.8)`, shadow `0px 4px 20px -2px rgba(15, 23, 42, 0.04), 0px 2px 6px -1px rgba(13, 110, 253, 0.03)`.
- **Level 2 (Floating Action & Nav Bar)**: `#FFFFFF` (or `rgba(255, 255, 255, 0.94)` with `backdrop-filter: blur(16px)`), shadow `0px 10px 30px -4px rgba(13, 110, 253, 0.12), 0px 4px 10px -2px rgba(15, 23, 42, 0.06)`.
- **Level 3 (Modal Alerts & Bottom Sheets)**: Shadow `0px 20px 40px -8px rgba(15, 23, 42, 0.18)`.
- **Pulse Glow (Live ECG / Central FAB)**: `0px 0px 24px 2px rgba(13, 110, 253, 0.28)`.

---

## 6. Key Mobile Components & Screen Inventory

### 6.1 Component Specifications
- **Primary CTA Button**: Height 56px (`h-14`), background `#0D6EFD`, label `label-lg` white, border-radius 16px.
- **Soft Secondary Button**: Background `#EFF6FF`, border `1px solid rgba(13, 110, 253, 0.2)`, text `#0D6EFD`.
- **Biometric Metric Card**: White surface, 36x36px circular icon container with 12% opacity semantic tint, `display-metric` numeral with `label-metric-unit`, caption `body-sm`.
- **Screening & AFib Banner**: Heart rhythm spline visualization with status pill (`Nhịp xoang đều` in `#10B981` / `Rung nhĩ (AFib)` in `#EF4444`).
- **Input Fields**: Height 52px, background `#F8FAFC`, border `1.5px solid #E2E8F0`, rounded 14px. Focus state: background `#FFFFFF`, border `#0D6EFD`, ring `0 0 0 3px rgba(13, 110, 253, 0.12)`.
- **Bottom Navigation Dock**: Translucent curved bar (`rgba(255, 255, 255, 0.95)`, `backdrop-blur-md`) with 4 navigation icons and a center circular `56x56px` vital scan FAB.

### 6.2 Screen Inventory (from Stitch MCP)
1. **Màn hình chính HealthSense - Dashboard Chỉ số sức khoẻ** (`0d2a6231b14a463fb79df6be72c57ca5`)
2. **Đo Rung nhĩ AFib 60s - HealthSense** (`9690924af5544142822f9a5f6763ec01`)
3. **Lịch sử đo - HealthSense** (`1ee19872cf534bfd902e7478ee24d866`)
4. **Chi tiết phân tích nhịp tim - HealthSense** (`dabad47c8cd946a482fe38abde6bdaab`)
5. **Chi tiết theo ngày - HealthSense** (`77501893c57642918c687ca4a686651e`)
6. **Cài đặt kết nối thiết bị BLE - HealthSense** (`2b6a67992462424f96be2be216d430d3`)
7. **Thiết bị đeo - Quét kết nối BLE** (`47b96f06288147408ccbbde8f92fbb40`)
8. **Đăng nhập & Xác thực HealthSense** (`0f8d55a931c244b49d356ff7f17771a5` / `d2dc87189a2b4ea58b7ab43bcc99ce25`)
9. **Trang Chào mừng & Khám phá HealthSense** (`eca875826cff445eb7aa885af364cd64`)
