import React from 'react';
import { c, r } from '../styles/theme';

type Variant = 'success' | 'warning' | 'error' | 'info' | 'default';

const MAP: Record<Variant, { bg: string; text: string }> = {
  success: { bg: c.successLight, text: c.successText },
  warning: { bg: c.warningLight, text: c.warningText },
  error:   { bg: c.errorLight,   text: c.errorText   },
  info:    { bg: c.infoLight,    text: c.infoText     },
  default: { bg: '#F1F5F9',      text: c.textSecondary},
};

const STATUS_MAP: Record<string, Variant> = {
  confirmed: 'success',
  submitted: 'info',
  draft:     'default',
  active:    'success',
  inactive:  'error',
  admin:     'warning',
  parish:    'default',
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmado',
  submitted: 'Submetido',
  draft:     'Rascunho',
  active:    'Activo',
  inactive:  'Inactivo',
  admin:     'Admin',
  parish:    'Paróquia',
};

interface Props {
  value: string;
  label?: string;
}

export function Badge({ value, label }: Props) {
  const variant = STATUS_MAP[value] ?? 'default';
  const { bg, text } = MAP[variant];
  const display = label ?? STATUS_LABEL[value] ?? value;

  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      padding:      '2px 8px',
      borderRadius: r.full,
      fontSize:     '12px',
      fontWeight:   '500',
      background:   bg,
      color:        text,
      whiteSpace:   'nowrap',
    }}>
      {display}
    </span>
  );
}