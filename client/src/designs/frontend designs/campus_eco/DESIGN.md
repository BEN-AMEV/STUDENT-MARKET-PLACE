---
name: Campus Eco
colors:
  surface: '#e7fff3'
  surface-dim: '#a8e7cd'
  surface-bright: '#e7fff3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#cbffe8'
  surface-container: '#bbfbe1'
  surface-container-high: '#b6f6db'
  surface-container-highest: '#b0f0d6'
  on-surface: '#002117'
  on-surface-variant: '#3d4a42'
  inverse-surface: '#003829'
  inverse-on-surface: '#befee3'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#416656'
  on-secondary: '#ffffff'
  secondary-container: '#c3ecd7'
  on-secondary-container: '#476c5b'
  tertiary: '#9b3e3b'
  on-tertiary: '#ffffff'
  tertiary-container: '#ba5551'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#c3ecd7'
  secondary-fixed-dim: '#a8cfbc'
  on-secondary-fixed: '#002115'
  on-secondary-fixed-variant: '#294e3f'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ae'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#7f2928'
  background: '#e7fff3'
  on-background: '#002117'
  surface-variant: '#b0f0d6'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
---

## Brand & Style

This design system is built for a sustainability-focused, community-centric platform. The brand personality is **approachable, optimistic, and grounded**. It aims to evoke a sense of environmental responsibility while maintaining the warmth of a campus community.

The visual style blends **Modern Minimalism** with **Organic Tactility**. It prioritizes clarity and whitespace to reflect a "clean" environmental impact, using subtle natural tones to avoid the sterile feel of traditional corporate software. The interface should feel like a digital extension of a physical campus garden—structured but breathing.

## Colors

The palette is derived from nature, specifically forest and meadow landscapes, to reinforce the eco-friendly narrative.

*   **Primary (Forest Green):** Used for high-emphasis actions, active states, and brand highlights. It represents growth and vitality.
*   **Secondary (Soft Sage):** Used for subtle backgrounds, tag containers, and low-priority accents. It provides a cooling contrast to the warmth of the surface.
*   **Surface (Warm White):** The foundation for all cards and page backgrounds. This off-white tone reduces eye strain and feels more organic than pure white.
*   **Neutral (Deep Evergreen):** Reserved for text and iconography to ensure high legibility and a sophisticated finish.

## Typography

The design system utilizes **Inter** exclusively to achieve a systematic, highly legible, and modern feel. The utilitarian nature of Inter is balanced by the organic color palette.

Headlines should use tighter letter spacing and heavier weights to command attention. Body text prioritizes generous line heights (1.5x) to ensure long-form content is digestible. Label styles use medium to semi-bold weights to remain distinct even at smaller sizes.

## Layout & Spacing

The design system follows a **8px spacing scale**, ensuring mathematical harmony across all components.

*   **Desktop:** 12-column fluid grid with a 1280px max-width. Use 24px gutters.
*   **Tablet:** 8-column grid with 24px margins.
*   **Mobile:** 4-column grid with 16px margins. 

Layouts should favor vertical stacks with generous white space (using `xl` and `2xl` tokens) to maintain the "breathing" quality of the brand.

## Elevation & Depth

To maintain a friendly and accessible feel, depth is communicated through **Tonal Layers** rather than heavy shadows.

*   **Level 0 (Base):** The Warm White surface.
*   **Level 1 (Cards):** Low-contrast outlines (1px solid #E5E7EB) or very soft, diffused green-tinted shadows (0 4px 12px rgba(5, 150, 105, 0.05)).
*   **Level 2 (Modals/Popovers):** Medium diffused shadows with a slight elevation to indicate interactivity and focus.

Avoid heavy black shadows. Use Soft Sage as a background layer to distinguish different sections within a page without adding physical height.

## Shapes

The design system uses a **Rounded (8px/0.5rem)** logic to reflect the friendliness of a campus environment.

*   **Standard (rounded-md):** 8px. Used for buttons, input fields, and small cards.
*   **Large (rounded-lg):** 16px. Used for main content containers and featured sections.
*   **Extra Large (rounded-xl):** 24px. Reserved for hero elements or promotional banners.

Fully pill-shaped (circular) edges are reserved for tags, chips, and notification badges to make them feel like "pebbles" or organic markers.

## Components

### Buttons
*   **Primary:** Forest Green background with Warm White text. 8px corner radius.
*   **Secondary:** Soft Sage background with Forest Green text. No border.
*   **Ghost:** Transparent background with Forest Green border and text.

### Input Fields
Inputs use the Warm White surface with a 1px border. On focus, the border thickens and changes to Forest Green with a soft 4px Soft Sage outer glow.

### Chips & Tags
Used for categories like "Recycling," "Community," or "Event." These should be pill-shaped with Soft Sage backgrounds and Forest Green text (Label-sm).

### Cards
Cards are the primary container. They use the Warm White surface, an 8px or 16px corner radius, and a thin neutral border. Card headers should use Title-md for clear hierarchy.

### Progress Indicators
Sustainability metrics (e.g., carbon saved) should use Forest Green for the "filled" portion of the bar and Soft Sage for the "unfilled" track, reinforcing the brand's primary color relationship.