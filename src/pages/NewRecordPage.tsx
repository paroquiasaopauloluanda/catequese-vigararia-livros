import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { callApi } from '../api/sheets';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Stage, AgeGroup, Book, CatechesisRecord, Parish } from '../types';
// CatechesisRecord used for cache update type
import { c, r, shadow } from '../styles/theme';
import { FormField, Input, Select, Textarea } from '../components/FormField';
import { Btn } from '../components/Btn';
import { LoadingState } from '../components/LoadingState';

const STEPS = ['Etapa & Faixa', 'Livro', 'Revisão'];

function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div style={{ display:'flex', alignItems:'center', marginBottom:'32px' }}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
            <div style={{
              width:'32px', height:'32px', borderRadius:r.full,
              background: i < current ? c.primary : i === current ? c.primary : c.border,
              color:  i <= current ? '#fff' : c.textMuted,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'13px', fontWeight:'700', transition:'all 200ms ease',
              boxShadow: i === current ? `0 0 0 4px ${c.primaryLight}` : 'none',
            }}>
              {i < current ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : i + 1}
            </div>
            <span style={{ fontSize:'11px', fontWeight:'500', color: i === current ? c.primary : c.textMuted, whiteSpace:'nowrap' }}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex:1, height:'2px', margin:'0 8px 18px',
              background: i < current ? c.primary : c.border,
              transition: 'background 200ms ease',
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

interface FormData {
  stage_id:  string;
  age_id:    string;
  book_name: string;
  author:    string;
  publisher: string;
  year:      string;
  notes:     string;
  parish_id: string;
}

export function NewRecordPage() {
  const { session, isAdmin } = useAuth();
  const { toast }  = useToast();
  const navigate   = useNavigate();
  const qc         = useQueryClient();
  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [dupWarn, setDupWarn] = useState('');
  const [form, setForm]       = useState<FormData>({
    stage_id: '', age_id: '', book_name: '', author: '',
    publisher: '', year: '', notes: '',
    parish_id: session?.parishId || '',
  });

  const { data: stagesData } = useQuery({ queryKey:['stages'],    queryFn: () => callApi('getStages')    as Promise<{ data: Stage[] }> });
  const { data: agesData }   = useQuery({ queryKey:['ageGroups'], queryFn: () => callApi('getAgeGroups') as Promise<{ data: AgeGroup[] }> });
  const { data: booksData }  = useQuery({ queryKey:['books'],     queryFn: () => callApi('getBooks')     as Promise<{ data: Book[] }> });
  const { data: parishesData }= useQuery({ queryKey:['parishes'], queryFn: () => callApi('getParishes')  as Promise<{ data: Parish[] }>, enabled: isAdmin });
  const { data: recordsData } = useQuery({ queryKey:['records'],  queryFn: () => callApi('getRecords')   as Promise<{ data: CatechesisRecord[] }> });

  const stages   = stagesData?.data ?? [];
  const ages     = agesData?.data ?? [];
  const books    = booksData?.data ?? [];
  const parishes = parishesData?.data ?? [];
  const records  = recordsData?.data ?? [];

  // Grouped stages
  const stageGroups = stages.reduce<Record<string, Stage[]>>((acc, s) => {
    const k = s.category || 'Outros';
    if (!acc[k]) acc[k] = [];
    acc[k].push(s);
    return acc;
  }, {});

  // Suggested books by stage
  const selectedStage = stages.find(s => s.id === form.stage_id);
  const suggestedBooks = books.filter(b => !form.stage_id || !b.recommended_stage || b.recommended_stage === selectedStage?.stage_name);

  // Duplicate check
  useEffect(() => {
    if (!form.stage_id || !form.age_id || !form.book_name.trim()) { setDupWarn(''); return; }
    const parishId = isAdmin ? form.parish_id : session?.parishId;
    const dup = records.find(r =>
      r.parish_id === parishId &&
      r.stage_id  === form.stage_id &&
      r.age_id    === form.age_id &&
      r.book_name.toLowerCase().trim() === form.book_name.toLowerCase().trim()
    );
    setDupWarn(dup ? 'Atenção: já existe um registo para esta combinação.' : '');
  }, [form.stage_id, form.age_id, form.book_name, form.parish_id, records, isAdmin, session]);

  const set = (k: keyof FormData, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const canStep0 = !!form.stage_id && !!form.age_id && (!isAdmin || !!form.parish_id);
  const canStep1 = !!form.book_name.trim() && !dupWarn;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await callApi('insertRecord', form) as { success: boolean; id: string };
      const sess = JSON.parse(localStorage.getItem('catequese_session') || '{}');
      const ts   = new Date().toISOString();
      // Add to cache directly — no refetch needed
      qc.setQueryData(['records'], (old: { data: CatechesisRecord[] } | undefined) => ({
        data: [...(old?.data ?? []), {
          id:         res.id,
          parish_id:  isAdmin ? form.parish_id : (sess.parishId || ''),
          stage_id:   form.stage_id,
          age_id:     form.age_id,
          book_name:  form.book_name,
          author:     form.author  || null,
          publisher:  form.publisher || null,
          year:       form.year    || null,
          notes:      form.notes   || null,
          status:     'submitted' as const,
          created_by: sess.userId || null,
          created_at: ts,
          updated_at: ts,
        }],
      }));
      toast('Registo submetido com sucesso!');
      navigate('/records');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erro ao submeter.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!stagesData || !agesData) return <LoadingState />;

  return (
    <div>
      <div style={{ marginBottom:'24px' }}>
        <h1 style={{ fontSize:'22px', fontWeight:'700', color:c.text, margin:0 }}>Novo Registo</h1>
        <p style={{ fontSize:'14px', color:c.textSecondary, margin:'2px 0 0' }}>Registe o livro utilizado na sua paróquia</p>
      </div>

      <div style={{
        background:c.surface, borderRadius:r.xl, border:`1px solid ${c.border}`,
        padding:'28px 24px', maxWidth:'640px', boxShadow:shadow.md,
      }}>
        <StepIndicator current={step} steps={STEPS} />

        {/* Step 0: Stage + Age */}
        {step === 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {isAdmin && (
              <FormField label="Paróquia" required>
                <Select value={form.parish_id} onChange={e => set('parish_id', e.target.value)}>
                  <option value="">Seleccione a paróquia</option>
                  {parishes.map(p => <option key={p.id} value={p.id}>{p.parish_name}</option>)}
                </Select>
              </FormField>
            )}

            <FormField label="Etapa da Catequese" required>
              <Select value={form.stage_id} onChange={e => set('stage_id', e.target.value)}>
                <option value="">Seleccione a etapa</option>
                {Object.entries(stageGroups).map(([cat, ss]) => (
                  <optgroup key={cat} label={cat}>
                    {ss.map(s => <option key={s.id} value={s.id}>{s.stage_name}</option>)}
                  </optgroup>
                ))}
              </Select>
            </FormField>

            <FormField label="Faixa Etária" required>
              <Select value={form.age_id} onChange={e => set('age_id', e.target.value)}>
                <option value="">Seleccione a faixa etária</option>
                {ages.map(a => <option key={a.id} value={a.id}>{a.age_group}{a.description ? ` — ${a.description}` : ''}</option>)}
              </Select>
            </FormField>
          </div>
        )}

        {/* Step 1: Book */}
        {step === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {suggestedBooks.length > 0 && (
              <div>
                <p style={{ fontSize:'13px', fontWeight:'500', color:c.textSecondary, marginBottom:'8px' }}>
                  Sugestões recomendadas
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  {suggestedBooks.slice(0,5).map(b => (
                    <button
                      key={b.id}
                      onClick={() => set('book_name', b.book_name)}
                      style={{
                        display:'flex', alignItems:'center', gap:'8px',
                        padding:'10px 12px', borderRadius:r.md, cursor:'pointer',
                        background: form.book_name === b.book_name ? c.primaryLight : '#F8FAFC',
                        border: `1px solid ${form.book_name === b.book_name ? c.primary : c.border}`,
                        textAlign:'left', transition:'all 150ms ease',
                        color: form.book_name === b.book_name ? c.primaryText : c.text,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                      </svg>
                      <div>
                        <p style={{ fontSize:'13px', fontWeight:'500', margin:0 }}>{b.book_name}</p>
                        {b.author && <p style={{ fontSize:'11px', color:c.textMuted, margin:0 }}>{b.author}</p>}
                      </div>
                    </button>
                  ))}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', margin:'12px 0' }}>
                  <div style={{ flex:1, height:'1px', background:c.border }} />
                  <span style={{ fontSize:'11px', color:c.textMuted }}>ou escreva livremente</span>
                  <div style={{ flex:1, height:'1px', background:c.border }} />
                </div>
              </div>
            )}

            <FormField label="Nome do Livro" required error={dupWarn || undefined}>
              <Input
                placeholder="Título do livro"
                value={form.book_name}
                onChange={e => set('book_name', e.target.value)}
                error={!!dupWarn}
                autoFocus
              />
            </FormField>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <FormField label="Autor">
                <Input placeholder="Nome do autor" value={form.author} onChange={e => set('author', e.target.value)} />
              </FormField>
              <FormField label="Editora">
                <Input placeholder="Nome da editora" value={form.publisher} onChange={e => set('publisher', e.target.value)} />
              </FormField>
            </div>

            <FormField label="Ano de Edição">
              <Input placeholder="Ex: 2022" type="number" min="1900" max="2099" value={form.year} onChange={e => set('year', e.target.value)} />
            </FormField>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div style={{ background:'#F8FAFC', borderRadius:r.lg, border:`1px solid ${c.border}`, padding:'16px' }}>
              <p style={{ fontSize:'13px', fontWeight:'600', color:c.textSecondary, textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 12px' }}>
                Resumo do Registo
              </p>
              {[
                { label:'Paróquia',  value: isAdmin ? (parishes.find(p => p.id === form.parish_id)?.parish_name || '—') : (session?.displayName || '—') },
                { label:'Etapa',     value: stages.find(s => s.id === form.stage_id)?.stage_name || '—' },
                { label:'Faixa Etária', value: ages.find(a => a.id === form.age_id)?.age_group || '—' },
                { label:'Livro',     value: form.book_name },
                { label:'Autor',     value: form.author || '—' },
                { label:'Editora',   value: form.publisher || '—' },
                { label:'Ano',       value: form.year || '—' },
              ].map(row => (
                <div key={row.label} style={{ display:'flex', gap:'8px', padding:'5px 0', borderBottom:`1px solid ${c.border}` }}>
                  <span style={{ fontSize:'13px', fontWeight:'500', color:c.textSecondary, minWidth:'110px', flexShrink:0 }}>{row.label}</span>
                  <span style={{ fontSize:'13px', color:c.text }}>{row.value}</span>
                </div>
              ))}
            </div>

            <FormField label="Observações" hint="Notas sobre o uso do livro (opcional)">
              <Textarea
                placeholder="Contexto de adopção, comentários..."
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                rows={3}
              />
            </FormField>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'24px', gap:'8px' }}>
          <Btn
            variant="ghost"
            onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/records')}
          >
            {step === 0 ? 'Cancelar' : 'Anterior'}
          </Btn>

          {step < 2 ? (
            <Btn
              onClick={() => setStep(s => s + 1)}
              disabled={(step === 0 && !canStep0) || (step === 1 && !canStep1)}
            >
              Próximo
            </Btn>
          ) : (
            <Btn
              onClick={handleSubmit}
              loading={loading}
            >
              Submeter Registo
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}
