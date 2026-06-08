import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { callApi } from '../api/sheets';
import type { Book, CatechesisRecord, Stage, AgeGroup, Parish } from '../types';
import { c, r } from '../styles/theme';
import { Btn } from '../components/Btn';
import { DataTable } from '../components/DataTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { FormField, Input, Select } from '../components/FormField';
import { useToast } from '../context/ToastContext';
import { exportToExcel } from '../utils/export';
import { IconPlus, IconEdit, IconTrash, IconDownload, IconEye } from '../components/Icons';

const EMPTY: Partial<Book> = { book_name:'', author:'', publisher:'', recommended_stage:'', recommended_age:'', year:'' };

export function BooksPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tab,       setTab]       = useState<'recommended'|'inuse'>('recommended');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState<Partial<Book>>({...EMPTY});
  const [saving,    setSaving]    = useState(false);
  const [confirmId, setConfirmId] = useState<string|null>(null);
  const [delLoading,setDelLoading]= useState(false);
  const [detailBook,setDetailBook]= useState<null|{name:string;count:number;records:CatechesisRecord[];parishes:{name:string;count:number}[]}>(null);

  const { data: booksD, isLoading, isError, error, refetch } = useQuery({ queryKey:['books'],    queryFn: () => callApi('getBooks')    as Promise<{data:Book[]}> });
  const { data: recD  } = useQuery({ queryKey:['records'],  queryFn: () => callApi('getRecords') as Promise<{data:CatechesisRecord[]}> });
  const { data: stagesD}= useQuery({ queryKey:['stages'],   queryFn: () => callApi('getStages')  as Promise<{data:Stage[]}> });
  const { data: agesD  }= useQuery({ queryKey:['ageGroups'],queryFn: () => callApi('getAgeGroups')as Promise<{data:AgeGroup[]}> });
  const { data: parD   }= useQuery({ queryKey:['parishes'], queryFn: () => callApi('getParishes') as Promise<{data:Parish[]}> });

  const books    = booksD?.data  ?? [];
  const records  = recD?.data    ?? [];
  const stages   = stagesD?.data ?? [];
  const ages     = agesD?.data   ?? [];
  const parishes = parD?.data    ?? [];
  const stageMap = Object.fromEntries(stages.map(s => [s.id, s.stage_name]));
  const ageMap   = Object.fromEntries(ages.map(a => [a.id, a.age_group]));
  const parMap   = Object.fromEntries(parishes.map(p => [p.id, p.parish_name]));

  // Books in use stats
  const inUse = useMemo(() => {
    const map: Record<string, { count:number; parishIds:Set<string>; recs:CatechesisRecord[] }> = {};
    records.forEach(r => {
      const k = r.book_name.trim();
      if (!k) return;
      if (!map[k]) map[k] = { count:0, parishIds:new Set(), recs:[] };
      map[k].count++;
      map[k].parishIds.add(r.parish_id);
      map[k].recs.push(r);
    });
    return Object.entries(map).map(([name, d]) => ({
      name, count:d.count, parishes:d.parishIds.size,
      recs: d.recs,
      parishDetails: [...d.parishIds].map(pid => ({
        name:  parMap[pid] ?? 'Desconhecida',
        count: d.recs.filter(r => r.parish_id === pid).length,
      })),
    })).sort((a,b) => b.count - a.count);
  }, [records, parMap]);

  const openCreate = () => { setEditing({...EMPTY}); setModalOpen(true); };
  const openEdit   = (b: Book) => { setEditing({...b}); setModalOpen(true); };

  const handleSave = async () => {
    if (!editing.book_name?.trim()) { toast('Nome do livro é obrigatório.','error'); return; }
    setSaving(true);
    try {
      if (editing.id) { await callApi('updateBook', editing); toast('Livro actualizado.'); }
      else            { await callApi('insertBook', editing); toast('Livro criado.'); }
      await qc.invalidateQueries({ queryKey:['books'] });
      setModalOpen(false);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Erro.','error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    setDelLoading(true);
    try {
      await callApi('deleteBook', { id:confirmId });
      await qc.invalidateQueries({ queryKey:['books'] });
      toast('Livro eliminado.');
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
          <h1 style={{ fontSize:'22px', fontWeight:'700', color:c.text, margin:0 }}>Livros</h1>
          <p style={{ fontSize:'14px', color:c.textSecondary, margin:'2px 0 0' }}>Catálogo e análise de uso</p>
        </div>
        {tab === 'recommended' && (
          <div style={{ display:'flex', gap:'8px' }}>
            <Btn variant="ghost" size="sm" icon={<IconDownload size={13}/>}
              onClick={() => exportToExcel(books.map(b => ({Nome:b.book_name,Autor:b.author,Editora:b.publisher,Etapa:b.recommended_stage,Faixa:b.recommended_age})),'livros')}>
              Excel
            </Btn>
            <Btn icon={<IconPlus size={14}/>} onClick={openCreate}>Novo Livro</Btn>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:`1px solid ${c.border}`, marginBottom:'20px' }}>
        {(['recommended','inuse'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:'10px 16px', background:'none', border:'none', cursor:'pointer',
            fontSize:'14px', fontWeight:'500', transition:'all 150ms ease',
            borderBottom: tab === t ? `2px solid ${c.primary}` : '2px solid transparent',
            color: tab === t ? c.primary : c.textSecondary,
            marginBottom:'-1px',
          }}>
            {t === 'recommended' ? `Recomendados (${books.length})` : `Em Uso (${inUse.length})`}
          </button>
        ))}
      </div>

      {tab === 'recommended' && (
        <DataTable
          data={books as unknown as Record<string,unknown>[]}
          columns={[
            { key:'book_name',        header:'Título',      render: row => <strong style={{fontSize:'13px'}}>{(row as unknown as Book).book_name}</strong> },
            { key:'author',           header:'Autor',       render: row => (row as unknown as Book).author ?? '—' },
            { key:'publisher',        header:'Editora',     render: row => (row as unknown as Book).publisher ?? '—', hideOnMobile:true },
            { key:'recommended_stage',header:'Etapa Rec.',  render: row => (row as unknown as Book).recommended_stage ?? '—', hideOnMobile:true },
            { key:'recommended_age',  header:'Faixa Rec.',  render: row => (row as unknown as Book).recommended_age ?? '—', hideOnMobile:true },
          ]}
          actions={(row) => {
            const b = row as unknown as Book;
            return (
              <>
                <button onClick={() => openEdit(b)} aria-label="Editar"
                  style={{ background:'none', border:'none', cursor:'pointer', color:c.textMuted, padding:'4px', lineHeight:0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = c.primary)}
                  onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
                ><IconEdit size={15}/></button>
                <button onClick={() => setConfirmId(b.id)} aria-label="Eliminar"
                  style={{ background:'none', border:'none', cursor:'pointer', color:c.textMuted, padding:'4px', lineHeight:0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = c.error)}
                  onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
                ><IconTrash size={15}/></button>
              </>
            );
          }}
        />
      )}

      {tab === 'inuse' && (
        <DataTable
          data={inUse as unknown as Record<string,unknown>[]}
          keyField="name"
          columns={[
            { key:'name',     header:'Livro',    render: row => <strong style={{fontSize:'13px'}}>{(row as {name:string}).name}</strong> },
            { key:'count',    header:'Registos', render: row => (
              <button onClick={() => {
                const b = inUse.find(x => x.name === (row as {name:string}).name);
                if (b) setDetailBook({ name:b.name, count:b.count, records:b.recs, parishes:b.parishDetails });
              }} style={{ background:c.primaryLight, color:c.primaryText, border:'none', borderRadius:'12px', padding:'2px 10px', cursor:'pointer', fontWeight:'600', fontSize:'13px' }}>
                {(row as {count:number}).count}
              </button>
            ), width:'80px' },
            { key:'parishes', header:'Paróquias', render: row => (
              <button onClick={() => {
                const b = inUse.find(x => x.name === (row as {name:string}).name);
                if (b) setDetailBook({ name:b.name, count:b.count, records:b.recs, parishes:b.parishDetails });
              }} style={{ background:c.successLight, color:c.successText, border:'none', borderRadius:'12px', padding:'2px 10px', cursor:'pointer', fontWeight:'600', fontSize:'13px' }}>
                {(row as {parishes:number}).parishes}
              </button>
            ), width:'90px' },
          ]}
          actions={(row) => (
            <button onClick={() => {
              const b = inUse.find(x => x.name === (row as {name:string}).name);
              if (b) setDetailBook({ name:b.name, count:b.count, records:b.recs, parishes:b.parishDetails });
            }} aria-label="Ver detalhes"
              style={{ background:'none', border:'none', cursor:'pointer', color:c.textMuted, padding:'4px', lineHeight:0 }}
              onMouseEnter={e => (e.currentTarget.style.color = c.primary)}
              onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
            ><IconEye size={15}/></button>
          )}
        />
      )}

      {/* Book Form Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing.id ? 'Editar Livro' : 'Novo Livro'}
        footer={<><Btn variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Btn><Btn onClick={handleSave} loading={saving}>Guardar</Btn></>}>
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <FormField label="Título" required><Input value={editing.book_name ?? ''} onChange={e => setEditing(b => ({...b,book_name:e.target.value}))} autoFocus /></FormField>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <FormField label="Autor"><Input value={editing.author ?? ''} onChange={e => setEditing(b => ({...b,author:e.target.value}))} /></FormField>
            <FormField label="Editora"><Input value={editing.publisher ?? ''} onChange={e => setEditing(b => ({...b,publisher:e.target.value}))} /></FormField>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <FormField label="Etapa Recomendada">
              <Select value={editing.recommended_stage ?? ''} onChange={e => setEditing(b => ({...b,recommended_stage:e.target.value}))}>
                <option value="">Nenhuma</option>
                {stages.map(s => <option key={s.id} value={s.stage_name}>{s.stage_name}</option>)}
              </Select>
            </FormField>
            <FormField label="Faixa Recomendada">
              <Select value={editing.recommended_age ?? ''} onChange={e => setEditing(b => ({...b,recommended_age:e.target.value}))}>
                <option value="">Nenhuma</option>
                {ages.map(a => <option key={a.id} value={a.age_group}>{a.age_group}</option>)}
              </Select>
            </FormField>
          </div>
          <FormField label="Ano de Edição"><Input type="number" value={editing.year ?? ''} onChange={e => setEditing(b => ({...b,year:e.target.value}))} /></FormField>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detailBook} onClose={() => setDetailBook(null)} title={`Uso: ${detailBook?.name}`} size="lg">
        {detailBook && (
          <div>
            <p style={{ fontSize:'13px', color:c.textSecondary, marginBottom:'14px' }}>
              {detailBook.count} registo{detailBook.count !== 1 ? 's' : ''} · {detailBook.parishes.length} paróquia{detailBook.parishes.length !== 1 ? 's' : ''}
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'8px', marginBottom:'20px' }}>
              {detailBook.parishes.map((p, i) => (
                <div key={i} style={{ padding:'10px 12px', borderRadius:r.lg, background:'#F8FAFC', border:`1px solid ${c.border}` }}>
                  <p style={{ fontSize:'13px', fontWeight:'600', color:c.text, margin:0 }}>{p.name}</p>
                  <p style={{ fontSize:'12px', color:c.textMuted, margin:'2px 0 0' }}>{p.count} registo{p.count !== 1?'s':''}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize:'12px', fontWeight:'600', color:c.textSecondary, textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 10px' }}>
              Detalhe por Registo
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:'6px', maxHeight:'300px', overflowY:'auto' }}>
              {detailBook.records.map((rec, i) => (
                <div key={i} style={{ padding:'10px 12px', borderRadius:r.md, background:'#F8FAFC', border:`1px solid ${c.border}`, fontSize:'13px' }}>
                  <strong>{parMap[rec.parish_id] ?? 'Desconhecida'}</strong> · {stageMap[rec.stage_id ?? ''] ?? '—'} · {ageMap[rec.age_id ?? ''] ?? '—'}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={handleDelete} loading={delLoading}
        title="Eliminar Livro" message="Eliminar este livro do catálogo de recomendados?" />
    </div>
  );
}