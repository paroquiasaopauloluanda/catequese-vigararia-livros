import React from 'react';
import { useToast } from '../context/ToastContext';
import { c, r, shadow } from '../styles/theme';
import { IconCheck, IconX, IconInfo, IconAlert } from './Icons';

const CONFIG = {
  success: { bg: c.successLight, text: c.successText, border: c.success, Icon: IconCheck },
  error:   { bg: c.errorLight,   text: c.errorText,   border: c.error,   Icon: IconX    },
  info:    { bg: c.infoLight,    text: c.infoText,     border: c.info,    Icon: IconInfo },
  warning: { bg: c.warningLight, text: c.warningText,  border: c.warning, Icon: IconAlert},
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div style={{
      position:    'fixed',
      bottom:      '24px',
      right:       '24px',
      zIndex:      1000,
      display:     'flex',
      flexDirection:'column',
      gap:         '8px',
      maxWidth:    '360px',
      width:       'calc(100vw - 48px)',
    }}>
      {toasts.map(t => {
        const cfg = CONFIG[t.type];
        return (
          <div key={t.id} role="alert" style={{
            display:      'flex',
            alignItems:   'flex-start',
            gap:          '10px',
            padding:      '12px 14px',
            borderRadius: r.lg,
            background:   cfg.bg,
            color:        cfg.text,
            border:       `1px solid ${cfg.border}`,
            boxShadow:    shadow.lg,
            animation:    'slideIn 200ms ease',
          }}>
            <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
            <cfg.Icon size={16} />
            <span style={{ flex:1, fontSize:'14px', fontWeight:'500', lineHeight:'1.4' }}>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Fechar notificação"
              style={{ background:'none', border:'none', cursor:'pointer', color:cfg.text, padding:'0', lineHeight:0 }}
            >
              <IconX size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}