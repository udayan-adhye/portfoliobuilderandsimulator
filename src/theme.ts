import { createTheme, lightThemePrimitives } from 'baseui';

/**
 * Premium theme for Portfolio Simulator
 * Inspired by Oat (Kailash Nadh / Zerodha) design system.
 *
 * Key principles:
 * - Warm zinc grays instead of cold slates
 * - system-ui font stack (no custom font loading)
 * - Tight border-radius (0.375rem / 6px)
 * - Subtle shadows, restrained color
 * - High contrast foreground on clean backgrounds
 */

const primitives = {
  ...lightThemePrimitives,
  primaryFontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",

  // Zinc palette (from Oat)
  primary: '#09090b',       // Zinc 950
  primary50: '#fafafa',     // Zinc 50
  primary100: '#f4f4f5',    // Zinc 100
  primary200: '#e4e4e7',    // Zinc 200
  primary300: '#d4d4d8',    // Zinc 300
  primary400: '#a1a1aa',    // Zinc 400
  primary500: '#71717a',    // Zinc 500
  primary600: '#52525b',    // Zinc 600
  primary700: '#3f3f46',    // Zinc 700
};

const overrides = {
  colors: {
    // Buttons — dark, confident
    buttonPrimaryFill: '#09090b',
    buttonPrimaryHover: '#18181b',
    buttonPrimaryActive: '#27272a',
    buttonPrimaryText: '#fafafa',
    buttonSecondaryFill: '#f4f4f5',
    buttonSecondaryHover: '#e4e4e7',
    buttonSecondaryActive: '#d4d4d8',
    buttonSecondaryText: '#09090b',
    buttonTertiaryFill: 'transparent',
    buttonTertiaryHover: '#fafafa',
    buttonTertiaryActive: '#f4f4f5',
    buttonTertiaryText: '#52525b',

    // Surfaces
    backgroundPrimary: '#ffffff',
    backgroundSecondary: '#fafafa',
    backgroundTertiary: '#f4f4f5',

    // Borders
    borderOpaque: '#d4d4d8',
    borderTransparent: '#e4e4e7',

    // Content
    contentPrimary: '#09090b',
    contentSecondary: '#52525b',
    contentTertiary: '#71717a',
    contentInversePrimary: '#fafafa',

    // Inputs
    inputFill: '#fafafa',
    inputFillActive: '#ffffff',
    inputBorder: '#d4d4d8',
    inputBorderError: '#d32f2f',
    inputFillError: '#fef2f2',

    // Semantic
    positive: '#008032',
    positive50: '#f0fdf4',
    negative: '#d32f2f',
    negative50: '#fef2f2',
    warning: '#a65b00',
    warning50: '#fffbeb',

    // Menu / Nav
    menuFill: '#ffffff',
    menuFillHover: '#fafafa',
    menuFontDefault: '#09090b',
    menuFontHighlighted: '#09090b',
  },
  borders: {
    // Tight radii (Oat uses 0.375rem = 6px for medium)
    radius100: '4px',
    radius200: '6px',
    radius300: '8px',
    radius400: '12px',
    buttonBorderRadius: '6px',
    inputBorderRadius: '6px',
    surfaceBorderRadius: '8px',
  },
  typography: {
    HeadingXSmall: {
      fontFamily: primitives.primaryFontFamily,
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: '1.5',
    },
    HeadingSmall: {
      fontFamily: primitives.primaryFontFamily,
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: '1.4',
    },
    HeadingMedium: {
      fontFamily: primitives.primaryFontFamily,
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: '1.35',
    },
    LabelLarge: {
      fontFamily: primitives.primaryFontFamily,
      fontSize: '0.9375rem',
      fontWeight: 600,
      lineHeight: '1.4',
    },
    LabelMedium: {
      fontFamily: primitives.primaryFontFamily,
      fontSize: '0.8125rem',
      fontWeight: 500,
      lineHeight: '1.45',
    },
    LabelSmall: {
      fontFamily: primitives.primaryFontFamily,
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: '1.35',
    },
    ParagraphMedium: {
      fontFamily: primitives.primaryFontFamily,
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: '1.5',
    },
    ParagraphSmall: {
      fontFamily: primitives.primaryFontFamily,
      fontSize: '0.8125rem',
      fontWeight: 400,
      lineHeight: '1.5',
    },
  },
};

export const premiumTheme = createTheme(primitives, overrides);
