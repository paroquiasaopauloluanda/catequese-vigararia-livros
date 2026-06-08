export const c = {
  // Brand
  primary:       '#7C3AED',
  primaryHover:  '#6D28D9',
  primaryLight:  '#EDE9FE',
  primaryText:   '#5B21B6',

  // Sidebar
  sidebar:       '#1E1B4B',
  sidebarHover:  '#2D2A5E',
  sidebarActive: '#7C3AED',
  sidebarText:   '#C4B5FD',
  sidebarMuted:  '#6B7280',

  // Semantic
  success:       '#059669',
  successLight:  '#D1FAE5',
  successText:   '#065F46',
  warning:       '#D97706',
  warningLight:  '#FEF3C7',
  warningText:   '#92400E',
  error:         '#DC2626',
  errorLight:    '#FEE2E2',
  errorText:     '#991B1B',
  info:          '#2563EB',
  infoLight:     '#DBEAFE',
  infoText:      '#1E40AF',

  // Neutrals
  bg:            '#F1F5F9',
  surface:       '#FFFFFF',
  surfaceHover:  '#F8FAFC',
  border:        '#E2E8F0',
  borderFocus:   '#7C3AED',

  // Text
  text:          '#0F172A',
  textSecondary: '#475569',
  textMuted:     '#94A3B8',
  textInverse:   '#FFFFFF',
} as const;

export const r = {
  sm:  '4px',
  md:  '8px',
  lg:  '12px',
  xl:  '16px',
  full:'9999px',
} as const;

export const shadow = {
  sm:  '0 1px 2px rgba(0,0,0,0.05)',
  md:  '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)',
  lg:  '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.03)',
  xl:  '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
} as const;

export const transition = 'transition: all 150ms ease;';

// Reusable style objects
export const card: React.CSSProperties = {
  background:   c.surface,
  borderRadius: r.lg,
  border:       `1px solid ${c.border}`,
  boxShadow:    shadow.sm,
  padding:      '20px',
};

export const btn = {
  base: {
    display:        'inline-flex',
    alignItems:     'center',
    gap:            '6px',
    padding:        '9px 16px',
    borderRadius:   r.md,
    fontSize:       '14px',
    fontWeight:     '500',
    cursor:         'pointer',
    border:         'none',
    transition:     'all 150ms ease',
    fontFamily:     'inherit',
    whiteSpace:     'nowrap',
  } as React.CSSProperties,
  primary: {
    background:  c.primary,
    color:       '#fff',
  } as React.CSSProperties,
  secondary: {
    background:  c.primaryLight,
    color:       c.primaryText,
  } as React.CSSProperties,
  ghost: {
    background:  'transparent',
    color:       c.textSecondary,
    border:      `1px solid ${c.border}`,
  } as React.CSSProperties,
  danger: {
    background:  c.errorLight,
    color:       c.errorText,
  } as React.CSSProperties,
  success: {
    background:  c.successLight,
    color:       c.successText,
  } as React.CSSProperties,
};

export const input: React.CSSProperties = {
  width:        '100%',
  padding:      '9px 12px',
  border:       `1px solid ${c.border}`,
  borderRadius: r.md,
  fontSize:     '14px',
  color:        c.text,
  background:   c.surface,
  outline:      'none',
  fontFamily:   'inherit',
  transition:   'border-color 150ms ease',
};

export const label: React.CSSProperties = {
  display:    'block',
  fontSize:   '13px',
  fontWeight: '500',
  color:      c.textSecondary,
  marginBottom: '4px',
};

// Import React for CSSProperties usage in non-tsx files
import type React from 'react';