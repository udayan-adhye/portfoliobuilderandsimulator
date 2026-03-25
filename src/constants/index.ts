// Application constants
export const DEFAULT_SCHEME_CODE = 120716;
export const DEFAULT_REBALANCING_THRESHOLD = 5;

// API Configuration
export const API_ENDPOINTS = {
  MFAPI_BASE: 'https://api.mfapi.in',
  YAHOO_FINANCE_PROXY: 'https://api.allorigins.win/get?url=',
  INDEX_DATA_BASE: 'https://raw.githubusercontent.com/asrajavel/mf-index-data/main'
} as const;

// UI Configuration — Oat-inspired muted palette
export const COLORS = [
  '#09090b', '#52525b', '#a1a1aa', '#3f3f46',
  '#71717a', '#27272a', '#d4d4d8', '#18181b'
];

// Validation
export const ALLOCATION_TOTAL = 100;
export const MIN_ALLOCATION = 0;
export const MAX_ALLOCATION = 100;

// Date calculations
export const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
export const MONTHS_PER_YEAR = 12;

// Chart Styling Configuration — Oat zinc palette
export const CHART_STYLES = {
  title: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#09090b',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  axisTitle: {
    fontSize: '0.8125rem',
    fontWeight: '500',
    color: '#71717a',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  axisLabels: {
    fontSize: '0.75rem',
    color: '#71717a',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  legend: {
    fontSize: '0.8125rem',
    fontWeight: '500',
    color: '#3f3f46'
  },
  tooltip: {
    fontSize: '0.75rem',
    color: '#fafafa'
  },
  colors: {
    gridLine: '#f4f4f5',
    line: '#e4e4e7',
    tick: '#e4e4e7',
    background: '#ffffff',
    tooltipBackground: '#09090b'
  }
} as const;

// Semantic colors — Oat-aligned
export const SEMANTIC_COLORS = {
  positive: '#008032',
  positiveLight: '#f0fdf4',
  positiveBorder: '#bbf7d0',
  negative: '#d32f2f',
  negativeLight: '#fef2f2',
  warning: '#a65b00',
  warningLight: '#fffbeb',
  muted: '#71717a',
  border: '#e4e4e7',
  borderStrong: '#d4d4d8',
  surface: '#fafafa',
  surfaceCard: '#ffffff',
} as const;
