import React from 'react';
import { c } from '../styles/theme';
import { IconLoader } from './Icons';

export function LoadingState({ message = 'A carregar...' }: { message?: string }) {
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '60px 20px',
      gap:            '12px',
      color:          c.textMuted,
    }}>
      <IconLoader size={28} />
      <span style={{ fontSize:'14px' }}>{message}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '60px 20px',
      gap:            '12px',
      color:          c.errorText,
      textAlign:      'center',
    }}>
      <span style={{ fontSize:'32px' }}>⚠</span>
      <p style={{ fontSize:'14px', color:c.textSecondary, maxWidth:'320px', lineHeight:'1.6' }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{ fontSize:'13px', color:c.primary, background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '60px 20px',
      gap:            '8px',
      textAlign:      'center',
    }}>
      <div style={{ fontSize:'40px', marginBottom:'4px' }}>📋</div>
      <p style={{ fontSize:'15px', fontWeight:'600', color:c.text }}>{title}</p>
      {description && <p style={{ fontSize:'13px', color:c.textMuted, maxWidth:'280px', lineHeight:'1.5' }}>{description}</p>}
      {action && <div style={{ marginTop:'12px' }}>{action}</div>}
    </div>
  );
}

export function KpiCard({ label, value, sub, color = '#7C3AED' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{
      background:   '#fff',
      borderRadius: '12px',
      border:       '1px solid #E2E8F0',
      padding:      '20px',
      boxShadow:    '0 1px 2px rgba(0,0,0,0.05)',
    }}>
      <p style={{ fontSize:'12px', fontWeight:'600', color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.05em', margin:0 }}>{label}</p>
      <p style={{ fontSize:'28px', fontWeight:'700', color, margin:'4px 0 0', lineHeight:1 }}>{value}</p>
      {sub && <p style={{ fontSize:'12px', color:'#64748B', margin:'4px 0 0' }}>{sub}</p>}
    </div>
  );
}