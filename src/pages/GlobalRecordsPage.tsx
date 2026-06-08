import React, { useState, useMemo } from 'react';
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
import { IconEdit, IconTrash, IconCheck, IconDownload, IconFilter, IconPrint } from '../components/Icons';

export function GlobalRecordsPage() {
  const qc    = useQueryClient();
  const { toast } = useToast();

  const [filters, setFilters] = useState({ parish:'', stage:'', age:'', status:'', search:'' });
  const [confirmId,  setConfirmId]  = useState<string|null>(null);
  const [confirmMsg, setConfirmMsg] = useState<{ title:string; message:string; action:()=>Promise<void> }>({ title:'', message:'', action: async ()=>{} });
  const [delLoading, setDelLoading] = useState(false);
  const [editRec,    setEditRec]    = useState<CatechesisRecord|null>(null);
  const [saving,     setSaving]     = useState(false);

  const { data: rec,     isLoading, isError, error, refetch } = useQuery({ queryKey:['records'],    queryFn: () => callApi('getRecords')    as Promise<{data:CatechesisRecord[]}> });
  const { data: stagesD} = useQuery({ queryKey:['stages'],     queryFn: () => callApi('getStages')    as Promise<{data:Stage[]}> });
  const { data: agesD  } = useQuery({ queryKey:['ageGroups'],  queryFn: () => callApi('getAgeGroups') as Promise<{data:AgeGroup[]}> });
  const { data: parD   } = useQuery({ queryKey:['parishes'],   queryFn: () => callApi('getParishes')  as Promise<{data:Parish[]}> });

  const records  = rec?.data      ?? [];
  const stageMap = Object.fromEntries((stagesD?.data ?? []).map(s => [s.id, s.stage_name]));
  const ageMap   = Object.fromEntries((agesD?.data   ?? []).map(a => [a.id, a.age_group]));
  const parMap   = Object.fromEntries((parD?.data    ?? []).map(p => [p.id, p.parish_name]));

  const filtered = useMemo(() => records.filter(r =>
    (!filters.parish || r.parish_id === filters.parish) &&
    (!filters.stage  || r.stage_id  === filters.stage) &&
    (!filters.age    || r.age_id    === filters.age) &&
    (!filters.status || r.status    === filters.status) &&
    (!filters.search || r.book_name.toLowerCase().includes(filters.search.toLowerCase()))
  ), [records, filters]);

  const confirm = (title: string, message: string, action: ()=>Promise<void>) => {
    setConfirmMsg({ title, message, action });
    setConfirmId('__pending__');
  };

  const handleConfirm = async () => {
    setDelLoading(true);
    try {
      await confirmMsg.action();
    } finally {
      setDelLoading(false);
      setConfirmId(null);
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
      toast(e instanceof Error ? e.message : 'Erro.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmRecord = (id: string) => {
    // Optimistic confirm — update status in cache immediately
    const prev = qc.getQueryData<{ data: CatechesisRecord[] }>(['records']);
    qc.setQueryData(['records'], (old: { data: CatechesisRecord[] } | undefined) => ({
      data: (old?.data ?? []).map(r => r.id === id ? { ...r, status: 'confirmed' as const } : r),
    }));
    toast('Registo confirmado.');
    callApi('confirmRecord', { id }).catch(() => {
      qc.setQueryData(['records'], prev);
      toast('Erro ao confirmar registo.', 'error');
    });
  };

  const handleDelete = (id: string) => {
    confirm('Eliminar Registo', 'Esta acção é irreversível.', async () => {
      const prev = qc.getQueryData<{ data: CatechesisRecord[] }>(['records']);
      qc.setQueryData(['records'], (old: { data: CatechesisRecord[] } | undefined) => ({
        data: (old?.data ?? []).filter(r => r.id !== id),
      }));
      toast('Registo eliminado.');
      try {
        await callApi('deleteRecord', { id });
      } catch (e: unknown) {
        qc.setQueryData(['records'], prev);
        toast(e instanceof Error ? e.message : 'Erro ao eliminar.', 'error');
      }
    });
  };

  const exportData = () => filtered.map(r => ({
    'Paróquia':     parMap[r.parish_id]              ?? r.parish_id,
    'Etapa':        stageMap[r.stage_id ?? '']        ?? r.stage_id,
    'Faixa Etária': ageMap[r.age_id   ?? '']          ?? r.age_id,
    'Livro':        r.book_name,
    'Autor':        r.author      ?? '',
    'Editora':      r.publisher   ?? '',
    'Ano':          r.year        ?? '',
    'Estado':       r.status,
    'Data':         r.created_at?.slice(0,10) ?? '',
  }));

  if (isLoading) return <LoadingState />;
  if (isError)   return <ErrorState message={error instanceof Error ? error.message : 'Erro.'} onRetry={() => refetch()} />;

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', gap:'12px', flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'700', color:c.text, margin:0 }}>Todos os Registos</h1>
          <p style={{ fontSize:'14px', color:c.textSecondary, margin:'2px 0 0' }}>{filtered.length} de {records.length} registos</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <Btn variant="ghost" size="sm" icon={<IconDownload size={13}/>} onClick={() => exportToExcel(exportData(),'todos-registos')}>Excel</Btn>
          <Btn variant="ghost" size="sm" icon={<IconDownload size={13}/>} onClick={() => exportToCSV(exportData(),'todos-registos')}>CSV</Btn>
          <Btn variant="ghost" size="sm" icon={<IconPrint size={13}/>} onClick={printPage}>Imprimir</Btn>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap', background:c.surface, padding:'12px', borderRadius:r.lg, border:`1px solid ${c.border}` }}>
        <IconFilter size={14} color={c.textMuted} />
        <input placeholder="Pesquisar livro..." value={filters.search} onChange={e => setFilters(f => ({...f,search:e.target.value}))}
          style={{ padding:'6px 10px', border:`1px solid ${c.border}`, borderRadius:r.md, fontSize:'13px', flex:'1', minWidth:'160px', fontFamily:'inherit' }} />
        {[
          { key:'parish', label:'Paróquias', opts: (parD?.data ?? []).map(p => ({ value:p.id, label:p.parish_name })) },
          { key:'stage',  label:'Etapas',    opts: (stagesD?.data ?? []).map(s => ({ value:s.id, label:s.stage_name })) },
          { key:'age',    label:'Idades',    opts: (agesD?.data   ?? []).map(a => ({ value:a.id, label:a.age_group })) },
          { key:'status', label:'Estado',    opts: [{value:'submitted',label:'Submetido'},{value:'confirmed',label:'Confirmado'},{value:'draft',label:'Rascunho'}] },
        ].map(f => (
          <select key={f.key} value={(filters as Record<string,string>)[f.key]}
            onChange={e => setFilters(prev => ({...prev,[f.key]:e.target.value}))}
            style={{ padding:'6px 10px', border:`1px solid ${c.border}`, borderRadius:r.md, fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>
            <option value="">Todos {f.label}</option>
            {f.opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Sem registos" description="Nenhum registo corresponde aos filtros seleccionados." />
      ) : (
        <DataTable
          data={filtered as unknown as Record<string,unknown>[]}
          columns={[
            { key:'parish',   header:'Paróquia',   render: row => parMap[(row as unknown as CatechesisRecord).parish_id] ?? '—', hideOnMobile:false },
            { key:'stage',    header:'Etapa',      render: row => stageMap[(row as unknown as CatechesisRecord).stage_id ?? ''] ?? '—' },
            { key:'age',      header:'Faixa',      render: row => ageMap[(row as unknown as CatechesisRecord).age_id ?? ''] ?? '—', hideOnMobile:true },
            { key:'book_name',header:'Livro',      render: row => <strong style={{fontSize:'13px'}}>{(row as unknown as CatechesisRecord).book_name}</strong> },
            { key:'status',   header:'Estado',     render: row => <Badge value={(row as unknown as CatechesisRecord).status} />, width:'100px' },
            { key:'date',     header:'Data',       render: row => (row as unknown as CatechesisRecord).created_at?.slice(0,10) ?? '—', hideOnMobile:true },
          ]}
          actions={(row) => {
            const rec = row as unknown as CatechesisRecord;
            return (
              <>
                {rec.status !== 'confirmed' && (
                  <button onClick={() => handleConfirmRecord(rec.id)} aria-label="Confirmar"
                    style={{ background:'none', border:'none', cursor:'pointer', color:c.textMuted, padding:'4px', borderRadius:'4px', lineHeight:0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = c.success)}
                    onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
                  ><IconCheck size={15}/></button>
                )}
                <button onClick={() => setEditRec(rec)} aria-label="Editar"
                  style={{ background:'none', border:'none', cursor:'pointer', color:c.textMuted, padding:'4px', borderRadius:'4px', lineHeight:0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = c.primary)}
                  onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
                ><IconEdit size={15}/></button>
                <button onClick={() => handleDelete(rec.id)} aria-label="Eliminar"
                  style={{ background:'none', border:'none', cursor:'pointer', color:c.textMuted, padding:'4px', borderRadius:'4px', lineHeight:0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = c.error)}
                  onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
                ><IconTrash size={15}/></button>
              </>
            );
          }}
        />
      )}

      <Modal open={!!editRec} onClose={() => setEditRec(null)} title="Editar Registo"
        footer={<><Btn variant="ghost" onClick={() => setEditRec(null)}>Cancelar</Btn><Btn onClick={handleSave} loading={saving}>Guardar</Btn></>}>
        {editRec && (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <FormField label="Etapa">
                <Select value={editRec.stage_id ?? ''} onChange={e => setEditRec(r => r && {...r,stage_id:e.target.value})}>
                  {(stagesD?.data ?? []).map(s => <option key={s.id} value={s.id}>{s.stage_name}</option>)}
                </Select>
              </FormField>
              <FormField label="Faixa Etária">
                <Select value={editRec.age_id ?? ''} onChange={e => setEditRec(r => r && {...r,age_id:e.target.value})}>
                  {(agesD?.data ?? []).map(a => <option key={a.id} value={a.id}>{a.age_group}</option>)}
                </Select>
              </FormField>
            </div>
            <FormField label="Livro" required><Input value={editRec.book_name} onChange={e => setEditRec(r => r && {...r,book_name:e.target.value})} /></FormField>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <FormField label="Autor"><Input value={editRec.author ?? ''} onChange={e => setEditRec(r => r && {...r,author:e.target.value})} /></FormField>
              <FormField label="Editora"><Input value={editRec.publisher ?? ''} onChange={e => setEditRec(r => r && {...r,publisher:e.target.value})} /></FormField>
            </div>
            <FormField label="Estado">
              <Select value={editRec.status} onChange={e => setEditRec(r => r && {...r,status:e.target.value as CatechesisRecord['status']})}>
                <option value="draft">Rascunho</option>
                <option value="submitted">Submetido</option>
                <option value="confirmed">Confirmado</option>
              </Select>
            </FormField>
            <FormField label="Observações"><Textarea value={editRec.notes ?? ''} rows={3} onChange={e => setEditRec(r => r && {...r,notes:e.target.value})} /></FormField>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={handleConfirm}
        loading={delLoading}
        title={confirmMsg.title}
        message={confirmMsg.message}
      />
    </div>
  );
}
