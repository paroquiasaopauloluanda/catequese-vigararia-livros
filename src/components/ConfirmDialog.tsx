import React from 'react';
import { Modal } from './Modal';
import { Btn } from './Btn';
import { c } from '../styles/theme';
import { IconAlert } from './Icons';

interface Props {
  open:     boolean;
  onClose:  () => void;
  onConfirm:() => void;
  title:    string;
  message:  string;
  loading?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose} disabled={loading}>Cancelar</Btn>
          <Btn variant="danger" onClick={onConfirm} loading={loading}>Confirmar</Btn>
        </>
      }
    >
      <div style={{ display:'flex', gap:'12px', alignItems:'flex-start' }}>
        <div style={{ color: c.warning, flexShrink:0, marginTop:'2px' }}>
          <IconAlert size={20} />
        </div>
        <p style={{ fontSize:'14px', color:c.textSecondary, lineHeight:'1.6', margin:0 }}>{message}</p>
      </div>
    </Modal>
  );
}