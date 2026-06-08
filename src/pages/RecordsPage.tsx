import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { callApi } from '../api/sheets';
import type { CatechesisRecord, Stage, AgeGroup, Parish } from '../types';
import { c, r } from '../styles/theme';
import { Badge } from '../components/Badge';
import { Btn } from '../components/Btn';
import { DataTable } from '../components/DataTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import { LoadingState, ErrorState, EmptyState } from '../components/LoadingState';
import { FormField, Input, Select, Textarea } from '../components/FormField';
import { useToast } from '../context/ToastContext';
import { exportToExcel, exportToCSV, printPage } from '../utils/export';
import { IconPlus, IconEdit, IconTrash, IconDownload, IconFilter, IconPrint } from '../components/Icons';

export function RecordsPage() {
  const qc    = useQueryClient();
  const { toast } = useToast();

  const [filters, setFilters] = useState({ stage:'', age:'', status:'', search:'' });
  const [confirmId, setConfirmId] = useState<string|null>(null);
  const [editRec, setEditRec] = useState<CatechesisRecord|null>(null);
  const [saving, setSaving]   = useState(false);

  const { data: rec,    isLoading, isError, error, refetch } = useQuery({ queryKey:['records'],   queryFn: () => callApi('getRecords')   as Promise<{ data: CatechesisRecord[] }> });
  const { data: stages} = useQuery({ queryKey:['stages'],    queryFn: () => callApi('getStages')   as Promise<{ data: Stage[] }> });
  const { data: ages  } = useQuery({ queryKey:['ageGroups'], queryFn: () => callApi('getAgeGroups')as Promise<{ data: AgeGroup[] }> });
  const { data: par   } = useQuery({ queryKey:['parishes'],  queryFn: () => callApi('getParishes') as Promise<{ data: Parish[] }> });

  const records  = rec?.data     ?? [];
  const stageMap = Object.fromEntries((stages?.data ?? []).map(s => [s.id, s.stage_name]));
  const ageMap   = Object.fromEntries((ages?.data   ?? []).map(a => [a.id, a.age_group]));
  const parMap   = Object.fromEntries((par?.data    ?? []).map(p => [p.id, p.parish_name]));

  const filtered = useMemo(() => records.filter(r =>
    (!filters.stage  || r.stage_id === filters.stage) &&
    (!filters.age    || r.age_id   === filters.age) &&
    (!filters.status || r.status   === filters.status) &&
    (!filters.search || r.book_name.toLowerCase().includes(filters.search.toLowerCase()))
  ), [records, filters]);

  const handleDelete = async () => {
    if (!confirmId) return;
    const id  = confirmId;
    const prev = qc.getQueryData<{ data: CatechesisRecord[] }>(['records']);
    // Optimistic: remove instantly from UI
    qc.setQueryData(['records'], (old: { data: CatechesisRecord[] } | undefined) => ({
      data: (old?.data ?? []).filter(r => r.id !== id),
    }));
    setConfirmId(null);
    toast('Registo eliminado.');
    try {
      await callApi('deleteRecord', { id });
    } catch (e: unknown) {
      qc.setQueryData(['records'], prev); // rollback
      toast(e instanceof Error ? e.message : 'Erro ao eliminar.', 'error');
    }
  };

  const handleSave = async () => {
    if (!editRec) return;
    setSaving(true);
    try {
      await callApi('updateRecord', editRec);
      await qc.invalidateQueries({ queryKey: ['records'] });
      toast('Registo actualizado.');
      setEditRec(null);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Erro ao guardar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const exportData = () => filtered.map(r => ({
    'Etapa':        stageMap[r.stage_id ?? ''] ?? r.stage_id,
    'Faixa Etária': ageMap[r.age_id ?? ''] ?? r.age_id,
    'Livro':        r.book_name,
    'Autor':        r.author ?? '',
    'Editora':      r.publisher ?? '',
    'Ano':          r.year ?? '',
    'Estado':       r.status,
    'Data':         r.created_at?.slice(0,10) ?? '',
  }));

  if (isLoading) return <LoadingState />;
  if (isError)   return <ErrorState message={error instanceof Error ? error.message : 'Erro.'} onRetry={() => refetch()} />;

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', gap:'12px', flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'700', color:c.text, margin:0 }}>Os meus Registos</h1>
          <p style={{ fontSize:'14px', color:c.textSecondary, margin:'2px 0 0' }}>
            {filtered.length} registo{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
          <Btn variant="ghost" size="sm" icon={<IconDownload size={13}/>} onClick={() => exportToExcel(exportData(), 'registos')}>Excel</Btn>
          <Btn variant="ghost" size="sm" icon={<IconDownload size={13}/>} onClick={() => exportToCSV(exportData(), 'registos')}>CSV</Btn>
          <Btn variant="ghost" size="sm" icon={<IconPrint size={13}/>} onClick={printPage}>Imprimir</Btn>
          <Link to="/records/new" style={{ textDecoration:'none' }}>
            <Btn icon={<IconPlus size={14}/>}>Novo Registo</Btn>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display:'flex', gap:'8px', marginBottom:'16px',
        flexWrap:'wrap', background:c.surface,
        padding:'12px', borderRadius:r.lg, border:`1px solid ${c.border}`,
      }}>
        <IconFilter size={14} color={c.textMuted} />
        <input
          placeholder="Pesquisar livro..."
          value={filters.search}
          onChange={e => setFilters(f => ({...f, search:e.target.value}))}
          style={{ padding:'6px 10px', border:`1px solid ${c.border}`, borderRadius:r.md, fontSize:'13px', flex:'1', minWidth:'160px', fontFamily:'inherit' }}
        />
        <select value={filters.stage} onChange={e => setFilters(f => ({...f, stage:e.target.value}))}
          style={{ padding:'6px 10px', border:`1px solid ${c.border}`, borderRadius:r.md, fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>
          <option value="">Todas as etapas</option>
          {(stages?.data ?? []).map(s => <option key={s.id} value={s.id}>{s.stage_name}</option>)}
        </select>
        <select value={filters.age} onChange={e => setFilters(f => ({...f, age:e.target.value}))}
          style={{ padding:'6px 10px', border:`1px solid ${c.border}`, borderRadius:r.md, fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>
          <option value="">Todas as idades</option>
          {(ages?.data ?? []).map(a => <option key={a.id} value={a.id}>{a.age_group}</option>)}
        </select>
        <select value={filters.status} onChange={e => setFilters(f => ({...f, status:e.target.value}))}
          style={{ padding:'6px 10px', border:`1px solid ${c.border}`, borderRadius:r.md, fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>
          <option value="">Todos os estados</option>
          <option value="submitted">Submetido</option>
          <option value="confirmed">Confirmado</option>
          <option value="draft">Rascunho</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sem registos"
          description="Ainda não submeteu nenhum registo de livro."
          action={<Link to="/records/new"><Btn icon={<IconPlus size={14}/>}>Novo Registo</Btn></Link>}
        />
      ) : (
        <DataTable
          data={filtered as unknown as Record<string,unknown>[]}
          columns={[
            { key:'stage',    header:'Etapa',    render: (row) => stageMap[(row as unknown as CatechesisRecord).stage_id ?? ''] ?? '—' },
            { key:'age',      header:'Faixa',    render: (row) => ageMap[(row as unknown as CatechesisRecord).age_id   ?? ''] ?? '—' },
            { key:'book_name',header:'Livro',    render: (row) => <strong style={{fontSize:'13px'}}>{(row as unknown as CatechesisRecord).book_name}</strong> },
            { key:'author',   header:'Autor',    render: (row) => (row as unknown as CatechesisRecord).author ?? '—', hideOnMobile:true },
            { key:'status',   header:'Estado',   render: (row) => <Badge value={(row as unknown as CatechesisRecord).status} />, width:'100px' },
            { key:'date',     header:'Data',     render: (row) => (row as unknown as CatechesisRecord).created_at?.slice(0,10) ?? '—', hideOnMobile:true },
          ]}
          actions={(row) => {
            const r = row as unknown as CatechesisRecord;
            return (
              <>
                <button onClick={() => setEditRec(r)} aria-label="Editar"
                  style={{ background:'none', border:'none', cursor:'pointer', color:c.textMuted, padding:'4px', borderRadius:'4px', lineHeight:0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = c.primary)}
                  onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
                >
                  <IconEdit size={15} />
                </button>
                <button onClick={() => setConfirmId(r.id)} aria-label="Eliminar"
                  style={{ background:'none', border:'none', cursor:'pointer', color:c.textMuted, padding:'4px', borderRadius:'4px', lineHeight:0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = c.error)}
                  onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
                >
                  <IconTrash size={15} />
                </button>
              </>
            );
          }}
        />
      )}

      {/* Edit Modal */}
      <Modal open={!!editRec} onClose={() => setEditRec(null)} title="Editar Registo"
        footer={<>
          <Btn variant="ghost" onClick={() => setEditRec(null)}>Cancelar</Btn>
          <Btn onClick={handleSave} loading={saving}>Guardar</Btn>
        </>}
      >
        {editRec && (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <FormField label="Etapa">
              <Select value={editRec.stage_id ?? ''} onChange={e => setEditRec(r => r && {...r, stage_id:e.target.value})}>
                {(stages?.data ?? []).map(s => <option key={s.id} value={s.id}>{s.stage_name}</option>)}
              </Select>
            </FormField>
            <FormField label="Faixa Etária">
              <Select value={editRec.age_id ?? ''} onChange={e => setEditRec(r => r && {...r, age_id:e.target.value})}>
                {(ages?.data ?? []).map(a => <option key={a.id} value={a.id}>{a.age_group}</option>)}
              </Select>
            </FormField>
            <FormField label="Livro" required>
              <Input value={editRec.book_name} onChange={e => setEditRec(r => r && {...r, book_name:e.target.value})} />
            </FormField>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <FormField label="Autor"><Input value={editRec.author ?? ''} onChange={e => setEditRec(r => r && {...r, author:e.target.value})} /></FormField>
              <FormField label="Editora"><Input value={editRec.publisher ?? ''} onChange={e => setEditRec(r => r && {...r, publisher:e.target.value})} /></FormField>
            </div>
            <FormField label="Observações"><Textarea value={editRec.notes ?? ''} rows={3} onChange={e => setEditRec(r => r && {...r, notes:e.target.value})} /></FormField>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDelete}
        title="Eliminar Registo"
        message="Esta acção é irreversível. O registo será eliminado permanentemente."
      />
    </div>
  );
}