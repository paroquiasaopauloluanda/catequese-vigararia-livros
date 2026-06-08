import React, { useEffect } from 'react';
import { c, r, shadow } from '../styles/theme';
import { IconX } from './Icons';

interface Props {
  open:     boolean;
  onClose:  () => void;
  title:    string;
  children: React.ReactNode;
  size?:    'sm' | 'md' | 'lg';
  footer?:  React.ReactNode;
}

const SIZE = { sm: '380px', md: '520px', lg: '720px' };

export function Modal({ open, onClose, title, children, size = 'md', footer }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position:        'fixed',
        inset:           0,
        zIndex:          50,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        padding:         '16px',
        background:      'rgba(15,23,42,0.5)',
        backdropFilter:  'blur(2px)',
        animation:       'fadeIn 150ms ease',
      }}
    >
      <style>{`@keyframes fadeIn { from { opacity:0; } to { opacity:1; } } @keyframes scaleIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }`}</style>
      <div style={{
        background:   c.surface,
        borderRadius: r.xl,
        boxShadow:    shadow.xl,
        width:        '100%',
        maxWidth:     SIZE[size],
        maxHeight:    'calc(100vh - 32px)',
        display:      'flex',
        flexDirection:'column',
        animation:    'scaleIn 150ms ease',
      }}>
        {/* Header */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '18px 20px',
          borderBottom:   `1px solid ${c.border}`,
          flexShrink:     0,
        }}>
          <h2 id="modal-title" style={{ fontSize:'16px', fontWeight:'600', color:c.text, margin:0 }}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background:   'none',
              border:       'none',
              cursor:       'pointer',
              color:        c.textMuted,
              padding:      '4px',
              borderRadius: r.sm,
              display:      'flex',
              lineHeight:   0,
              transition:   'color 150ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = c.text)}
            onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding:'20px', overflowY:'auto', flex:1 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding:      '14px 20px',
            borderTop:    `1px solid ${c.border}`,
            display:      'flex',
            gap:          '8px',
            justifyContent:'flex-end',
            flexShrink:   0,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}