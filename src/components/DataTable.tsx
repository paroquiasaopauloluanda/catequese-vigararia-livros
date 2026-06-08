import React from 'react';
import { c, r, shadow } from '../styles/theme';

export interface Column<T> {
  key:       string;
  header:    string;
  render?:   (row: T) => React.ReactNode;
  width?:    string;
  hideOnMobile?: boolean;
}

interface Props<T> {
  columns:  Column<T>[];
  data:     T[];
  onRowClick?: (row: T) => void;
  keyField?: string;
  emptyText?: string;
  actions?: (row: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, unknown>>({
  columns, data, onRowClick, keyField = 'id', emptyText = 'Sem registos', actions,
}: Props<T>) {
  return (
    <div style={{
      background:   c.surface,
      borderRadius: r.lg,
      border:       `1px solid ${c.border}`,
      boxShadow:    shadow.sm,
      overflowX:    'auto',
    }}>
      <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'500px' }}>
        <thead>
          <tr style={{ borderBottom:`1px solid ${c.border}` }}>
            {columns.map(col => (
              <th
                key={col.key}
                className={col.hideOnMobile ? 'hide-mobile' : ''}
                style={{
                  padding:     '11px 14px',
                  textAlign:   'left',
                  fontSize:    '12px',
                  fontWeight:  '600',
                  color:       c.textMuted,
                  textTransform:'uppercase',
                  letterSpacing:'0.05em',
                  whiteSpace:  'nowrap',
                  width:       col.width,
                  background:  '#F8FAFC',
                }}
              >
                {col.header}
              </th>
            ))}
            {actions && (
              <th style={{
                padding:'11px 14px', textAlign:'right', fontSize:'12px',
                fontWeight:'600', color:c.textMuted, textTransform:'uppercase',
                letterSpacing:'0.05em', background:'#F8FAFC', width:'120px',
              }}>
                Acções
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                style={{ padding:'40px 14px', textAlign:'center', color:c.textMuted, fontSize:'14px' }}
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={String(row[keyField] ?? idx)}
                onClick={() => onRowClick?.(row)}
                style={{
                  borderBottom: idx < data.length - 1 ? `1px solid ${c.border}` : 'none',
                  cursor:       onRowClick ? 'pointer' : 'default',
                  transition:   'background 120ms ease',
                }}
                onMouseEnter={e => { if (onRowClick || actions) (e.currentTarget as HTMLElement).style.background = '#F8FAFC'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={col.hideOnMobile ? 'hide-mobile' : ''}
                    style={{
                      padding:  '11px 14px',
                      fontSize: '14px',
                      color:    c.text,
                      verticalAlign:'middle',
                    }}
                  >
                    {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                  </td>
                ))}
                {actions && (
                  <td style={{ padding:'8px 14px', textAlign:'right' }}>
                    <div style={{ display:'flex', justifyContent:'flex-end', gap:'4px' }}>
                      {actions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <style>{`@media (max-width: 640px) { .hide-mobile { display: none !important; } }`}</style>
    </div>
  );
}