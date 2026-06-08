import React from 'react';
import { c, r, input as inputStyle, label as labelStyle } from '../styles/theme';

interface FieldProps {
  label:       string;
  required?:   boolean;
  error?:      string;
  children:    React.ReactNode;
  hint?:       string;
}

export function FormField({ label, required, error, children, hint }: FieldProps) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color:c.error, marginLeft:'2px' }}>*</span>}
      </label>
      {children}
      {hint && !error && <span style={{ fontSize:'12px', color:c.textMuted }}>{hint}</span>}
      {error && <span style={{ fontSize:'12px', color:c.error }}>{error}</span>}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ error, style, ...props }: InputProps) {
  return (
    <input
      {...props}
      style={{
        ...inputStyle,
        borderColor: error ? c.error : c.border,
        ...style,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = error ? c.error : c.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? c.errorLight : c.primaryLight}`; }}
      onBlur={e  => { e.currentTarget.style.borderColor = error ? c.error : c.border;  e.currentTarget.style.boxShadow = 'none'; }}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export function Select({ error, style, children, ...props }: SelectProps) {
  return (
    <select
      {...props}
      style={{
        ...inputStyle,
        cursor:      'pointer',
        appearance:  'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat:   'no-repeat',
        backgroundPosition: 'right 10px center',
        paddingRight:       '32px',
        borderColor: error ? c.error : c.border,
        ...style,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = error ? c.error : c.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? c.errorLight : c.primaryLight}`; }}
      onBlur={e  => { e.currentTarget.style.borderColor = error ? c.error : c.border;  e.currentTarget.style.boxShadow = 'none'; }}
    >
      {children}
    </select>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ error, style, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      style={{
        ...inputStyle,
        resize:      'vertical',
        minHeight:   '80px',
        borderColor: error ? c.error : c.border,
        ...style,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = error ? c.error : c.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? c.errorLight : c.primaryLight}`; }}
      onBlur={e  => { e.currentTarget.style.borderColor = error ? c.error : c.border;  e.currentTarget.style.boxShadow = 'none'; }}
    />
  );
}