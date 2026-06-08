import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { callApi } from '../api/sheets';
import type { Parish, CatechesisRecord, Stage, AgeGroup } from '../types';
import { c, r } from '../styles/theme';
import { Badge } from '../components/Badge';
import { Btn } from '../components/Btn';
import { DataTable } from '../components/DataTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import { LoadingState, ErrorState, KpiCard } from '../components/LoadingState';
import { FormField, Input, Select } from '../components/FormField';
import { useToast } from '../context/ToastContext';
import { exportToExcel } from '../utils/export';
import { IconPlus, IconEdit, IconTrash, IconDownload } from '../components/Icons';

const EMPTY: Partial<Parish> = { parish_name:'', city:'', coordinator_name:'', coordinator_phone:'', coordinator_email:'', status:'active' };

export function ParishesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [modalOpen,  setModalOpen]  = useState(false);
  const [editing,    setEditing]    = useState<Partial<Parish>>(EMPTY);
  const [saving,     setSaving]     = useState(false);
  const [confirmId,  setConfirmId]  = useState<string|null>(null);
  const [delLoading, setDelLoading] = useState(false);

  // Parish records modal
  const [recModal, setRecModal] = useState<{ parish: Parish } | null>(null);

  const { data: parD, isLoading, isError, error, refetch } = useQuery({ queryKey:['parishes'],  queryFn: () => callApi('getParishes') as Promise<{data:Parish[]}> });
  const { data: recD} = useQuery({ queryKey:['records'], queryFn: () => callApi('getRecords') as Promise<{data:CatechesisRecord[]}> });
  const { data: stagesD } = useQuery({ queryKey:['stages'],    queryFn: () => callApi('getStages')    as Promise<{data:Stage[]}> });
  const { data: agesD   } = useQuery({ queryKey:['ageGroups'], queryFn: () => callApi('getAgeGroups') as Promise<{data:AgeGroup[]}> });

  const parishes = parD?.data    ?? [];
  const records  = recD?.data    ?? [];
  const stages   = stagesD?.data ?? [];
  const ages     = agesD?.data   ?? [];
  const stageMap = Object.fromEntries(stages.map(s => [s.id, s.stage_name]));
  const ageMap   = Object.fromEntries(ages.map(a => [a.id, a.age_group]));
  const recCount = Object.fromEntries(parishes.map(p => [p.id, records.filter(r => r.parish_id === p.id).length]));

  const activeCount     = parishes.filter(p => p.status === 'active').length;
  const withRecords     = parishes.filter(p => recCount[p.id] > 0).length;
  const withoutRecords  = parishes.filter(p => p.status === 'active' && !recCount[p.id]).length;

  const openCreate = () => { setEditing({...EMPTY}); setModalOpen(true); };
  const openEdit   = (p: Parish) => { setEditing({...p}); setModalOpen(true); };

  const handleSave = async () => {
    if (!editing.parish_name?.trim()) { toast('Nome da paróquia é obrigatório.', 'error'); return; }
    setSaving(true);
    try {
      if (editing.id) {
        await callApi('updateParish', editing);
        toast('Paróquia actualizada.');
      } else {
        await callApi('insertParish', editing);
        toast('Paróquia criada.');
      }
      await qc.invalidateQueries({ queryKey:['parishes'] });
      setModalOpen(false);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Erro.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    const count = recCount[confirmId] ?? 0;
    if (count > 0) {
      toast(`Não é possível eliminar: esta paróquia tem ${count} registo(s) associado(s). Elimine os registos primeiro.`, 'error');
      setConfirmId(null);
      return;
    }
    setDelLoading(true);
    try {
      await callApi('deleteParish', { id:confirmId });
      await qc.invalidateQueries({ queryKey:['parishes'] });
      toast('Paróquia eliminada.');
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Erro.', 'error');
    } finally {
      setDelLoading(false);
      setConfirmId(null);
    }
  };

  if (isLoading) return <LoadingState />;
  if (isError)   return <ErrorState message={error instanceof Error ? error.message : 'Erro.'} onRetry={() => refetch()} />;

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', gap:'12px', flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'700', color:c.text, margin:0 }}>Paróquias</h1>
          <p style={{ fontSize:'14px', color:c.textSecondary, margin:'2px 0 0' }}>{parishes.length} paróquias</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <Btn variant="ghost" size="sm" icon={<IconDownload size={13}/>}
            onClick={() => exportToExcel(parishes.map(p => ({Nome:p.parish_name,Cidade:p.city,Coordenador:p.coordinator_name,Estado:p.status})),'paroquias')}>
            Excel
          </Btn>
          <Btn icon={<IconPlus size={14}/>} onClick={openCreate}>Nova Paróquia</Btn>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:'12px', marginBottom:'20px' }}>
        <KpiCard label="Total"       value={parishes.length} />
        <KpiCard label="Activas"     value={activeCount}     color={c.success} />
        <KpiCard label="Com Registos"value={withRecords}     color={c.primary} />
        <KpiCard label="Sem Registos"value={withoutRecords}  color={c.warning} />
      </div>

      <DataTable
        data={parishes as unknown as Record<string,unknown>[]}
        columns={[
          { key:'parish_name',  header:'Nome',        render: row => <strong style={{fontSize:'13px'}}>{(row as unknown as Parish).parish_name}</strong> },
          { key:'city',         header:'Cidade',      render: row => (row as unknown as Parish).city ?? '—', hideOnMobile:true },
          { key:'coordinator',  header:'Coordenador', render: row => (row as unknown as Parish).coordinator_name ?? '—', hideOnMobile:true },
          { key:'records', header:'Registos', width:'80px', render: row => {
            const p   = row as unknown as Parish;
            const cnt = recCount[p.id] ?? 0;
            return cnt > 0 ? (
              <button onClick={e => { e.stopPropagation(); setRecModal({ parish: p }); }}
                style={{ background:c.primaryLight, color:c.primaryText, border:'none', borderRadius:'12px', padding:'2px 10px', cursor:'pointer', fontWeight:'600', fontSize:'13px' }}>
                {cnt}
              </button>
            ) : (
              <span style={{ color:c.textMuted, fontSize:'13px' }}>0</span>
            );
          }},
          { key:'status',       header:'Estado',      render: row => <Badge value={(row as unknown as Parish).status} />, width:'90px' },
        ]}
        actions={(row) => {
          const p = row as unknown as Parish;
          return (
            <>
              <button onClick={() => openEdit(p)} aria-label="Editar"
                style={{ background:'none', border:'none', cursor:'pointer', color:c.textMuted, padding:'4px', lineHeight:0 }}
                onMouseEnter={e => (e.currentTarget.style.color = c.primary)}
                onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
              ><IconEdit size={15}/></button>
              <button onClick={() => setConfirmId(p.id)} aria-label="Eliminar"
                style={{ background:'none', border:'none', cursor:'pointer', color:c.textMuted, padding:'4px', lineHeight:0 }}
                onMouseEnter={e => (e.currentTarget.style.color = c.error)}
                onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
              ><IconTrash size={15}/></button>
            </>
          );
        }}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing.id ? 'Editar Paróquia' : 'Nova Paróquia'}
        footer={<><Btn variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Btn><Btn onClick={handleSave} loading={saving}>Guardar</Btn></>}
      >
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <FormField label="Nome da Paróquia" required>
            <Input value={editing.parish_name ?? ''} onChange={e => setEditing(p => ({...p,parish_name:e.target.value}))} placeholder="Nome oficial" autoFocus />
          </FormField>
          <FormField label="Cidade">
            <Input value={editing.city ?? ''} onChange={e => setEditing(p => ({...p,city:e.target.value}))} placeholder="Cidade ou localidade" />
          </FormField>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <FormField label="Nome do Coordenador">
              <Input value={editing.coordinator_name ?? ''} onChange={e => setEditing(p => ({...p,coordinator_name:e.target.value}))} />
            </FormField>
            <FormField label="Telefone">
              <Input value={editing.coordinator_phone ?? ''} onChange={e => setEditing(p => ({...p,coordinator_phone:e.target.value}))} type="tel" />
            </FormField>
          </div>
          <FormField label="Email do Coordenador">
            <Input value={editing.coordinator_email ?? ''} onChange={e => setEditing(p => ({...p,coordinator_email:e.target.value}))} type="email" />
          </FormField>
          {editing.id && (
            <FormField label="Estado">
              <Select value={editing.status ?? 'active'} onChange={e => setEditing(p => ({...p,status:e.target.value as Parish['status']}))}>
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
              </Select>
            </FormField>
          )}
        </div>
      </Modal>

      <ConfirmDialog open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={handleDelete} loading={delLoading}
        title="Eliminar Paróquia" message="Eliminar esta paróquia? Os registos associados não serão eliminados automaticamente." />

      {/* Parish records modal */}
      <Modal
        open={!!recModal}
        onClose={() => setRecModal(null)}
        title={`Registos — ${recModal?.parish.parish_name}`}
        size="lg"
      >
        {recModal && (() => {
          const parishRecs = records.filter(rec => rec.parish_id === recModal.parish.id);
          return parishRecs.length === 0 ? (
            <p style={{ color:c.textMuted, fontSize:'14px', textAlign:'center', padding:'20px' }}>Sem registos.</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
              <p style={{ fontSize:'13px', color:c.textSecondary, margin:'0 0 12px' }}>
                {parishRecs.length} registo{parishRecs.length !== 1 ? 's' : ''}
              </p>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
                  <thead>
                    <tr style={{ background:'#F8FAFC', borderBottom:`1px solid ${c.border}` }}>
                      {['Etapa','Faixa Etária','Livro','Autor','Estado','Data'].map(h => (
                        <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontWeight:'600', color:c.textMuted, fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parishRecs.map((rec, i) => (
                      <tr key={rec.id} style={{ borderBottom: i < parishRecs.length-1 ? `1px solid ${c.border}` : 'none' }}>
                        <td style={{ padding:'9px 12px', color:c.textSecondary }}>{stageMap[rec.stage_id ?? ''] ?? '—'}</td>
                        <td style={{ padding:'9px 12px', color:c.textSecondary }}>{ageMap[rec.age_id ?? ''] ?? '—'}</td>
                        <td style={{ padding:'9px 12px', fontWeight:'500', color:c.text }}>{rec.book_name}</td>
                        <td style={{ padding:'9px 12px', color:c.textSecondary }}>{rec.author ?? '—'}</td>
                        <td style={{ padding:'9px 12px' }}>
                          <span style={{
                            fontSize:'12px', padding:'2px 8px', borderRadius:r.full, fontWeight:'500',
                            background: rec.status === 'confirmed' ? c.successLight : rec.status === 'submitted' ? c.infoLight : '#F1F5F9',
                            color:      rec.status === 'confirmed' ? c.successText  : rec.status === 'submitted' ? c.infoText  : c.textSecondary,
                          }}>
                            {rec.status === 'confirmed' ? 'Confirmado' : rec.status === 'submitted' ? 'Submetido' : 'Rascunho'}
                          </span>
                        </td>
                        <td style={{ padding:'9px 12px', color:c.textMuted }}>{rec.created_at?.slice(0,10) ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}