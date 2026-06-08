import React from 'react';
import { btn, c } from '../styles/theme';
import { IconLoader } from './Icons';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  size?:    'sm' | 'md';
  icon?:    React.ReactNode;
}

export function Btn({ variant = 'primary', loading, size = 'md', icon, children, disabled, style, ...props }: Props) {
  const v = btn[variant];
  const isDisabled = disabled || loading;

  const sizeStyle: React.CSSProperties = size === 'sm'
    ? { padding: '6px 12px', fontSize: '13px' }
    : {};

  return (
    <button
      {...props}
      disabled={isDisabled}
      style={{
        ...btn.base,
        ...v,
        ...sizeStyle,
        opacity:  isDisabled ? 0.6 : 1,
        cursor:   isDisabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      onMouseEnter={e => {
        if (!isDisabled) {
          if (variant === 'primary')   e.currentTarget.style.background = c.primaryHover;
          if (variant === 'ghost')     e.currentTarget.style.background = '#F8FAFC';
        }
      }}
      onMouseLeave={e => {
        if (!isDisabled) {
          if (variant === 'primary')   e.currentTarget.style.background = c.primary;
          if (variant === 'ghost')     e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      {loading ? <IconLoader size={14} /> : icon}
      {children}
    </button>
  );
}