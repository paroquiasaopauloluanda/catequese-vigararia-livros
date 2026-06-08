import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { callApi } from '../api/sheets';
import type { AgeGroup } from '../types';
import { c } from '../styles/theme';
import { Btn } from '../components/Btn';
import { DataTable } from '../components/DataTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { FormField, Input } from '../components/FormField';
import { useToast } from '../context/ToastContext';
import { IconPlus, IconEdit, IconTrash } from '../components/Icons';

const EMPTY: Partial<AgeGroup> = { age_group:'', description:'' };

export function AgeGroupsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState<Partial<AgeGroup>>({...EMPTY});
  const [saving,    setSaving]    = useState(false);
  const [confirmId, setConfirmId] = useState<string|null>(null);
  const [delLoading,setDelLoading]= useState(false);

  const { data: agesD, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['ageGroups'],
    queryFn:  () => callApi('getAgeGroups') as Promise<{data:AgeGroup[]}>,
  });

  const ages = agesD?.data ?? [];

  const openCreate = () => { setEditing({...EMPTY}); setModalOpen(true); };
  const openEdit   = (a: AgeGroup) => { setEditing({...a}); setModalOpen(true); };

  const handleSave = async () => {
    if (!editing.age_group?.trim()) { toast('Nome da faixa é obrigatório.','error'); return; }
    setSaving(true);
    try {
      if (editing.id) { await callApi('updateAgeGroup', editing); toast('Faixa etária actualizada.'); }
      else            { await callApi('insertAgeGroup', editing); toast('Faixa etária criada.'); }
      await qc.invalidateQueries({ queryKey:['ageGroups'] });
      setModalOpen(false);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Erro.','error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    setDelLoading(true);
    try {
      await callApi('deleteAgeGroup', { id:confirmId });
      await qc.invalidateQueries({ queryKey:['ageGroups'] });
      toast('Faixa etária eliminada.');
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Erro.','error');
    } finally { setDelLoading(false); setConfirmId(null); }
  };

  if (isLoading) return <LoadingState />;
  if (isError)   return <ErrorState message={error instanceof Error ? error.message : 'Erro.'} onRetry={() => refetch()} />;

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', gap:'12px', flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'700', color:c.text, margin:0 }}>Faixas Etárias</h1>
          <p style={{ fontSize:'14px', color:c.textSecondary, margin:'2px 0 0' }}>{ages.length} faixas configuradas</p>
        </div>
        <Btn icon={<IconPlus size={14}/>} onClick={openCreate}>Nova Faixa</Btn>
      </div>

      <DataTable
        data={ages as unknown as Record<string,unknown>[]}
        columns={[
          { key:'age_group',   header:'Nome',      render: row => <strong style={{fontSize:'14px'}}>{(row as unknown as AgeGroup).age_group}</strong> },
          { key:'description', header:'Descrição', render: row => (row as unknown as AgeGroup).description ?? '—' },
        ]}
        emptyText="Nenhuma faixa etária configurada."
        actions={(row) => {
          const a = row as unknown as AgeGroup;
          return (
            <>
              <button onClick={() => openEdit(a)} aria-label="Editar"
                style={{ background:'none', border:'none', cursor:'pointer', color:c.textMuted, padding:'4px', lineHeight:0 }}
                onMouseEnter={e => (e.currentTarget.style.color = c.primary)}
                onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
              ><IconEdit size={15}/></button>
              <button onClick={() => setConfirmId(a.id)} aria-label="Eliminar"
                style={{ background:'none', border:'none', cursor:'pointer', color:c.textMuted, padding:'4px', lineHeight:0 }}
                onMouseEnter={e => (e.currentTarget.style.color = c.error)}
                onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
              ><IconTrash size={15}/></button>
            </>
          );
        }}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing.id ? 'Editar Faixa Etária' : 'Nova Faixa Etária'} size="sm"
        footer={<><Btn variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Btn><Btn onClick={handleSave} loading={saving}>Guardar</Btn></>}>
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <FormField label="Nome" required hint="Ex: Crianças, Adolescentes, Jovens, Adultos">
            <Input value={editing.age_group ?? ''} onChange={e => setEditing(a => ({...a,age_group:e.target.value}))} placeholder="Nome da faixa etária" autoFocus />
          </FormField>
          <FormField label="Descrição" hint="Intervalo de idades opcional">
            <Input value={editing.description ?? ''} onChange={e => setEditing(a => ({...a,description:e.target.value}))} placeholder="Ex: 7–12 anos" />
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={handleDelete} loading={delLoading}
        title="Eliminar Faixa Etária" message="Esta faixa etária será eliminada. Os registos associados não serão afectados." />
    </div>
  );
}