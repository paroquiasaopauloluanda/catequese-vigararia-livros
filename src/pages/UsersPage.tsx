import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { callApi } from '../api/sheets';
import type { UserProfile, Parish, CatechesisRecord } from '../types';
import { c } from '../styles/theme';
import { Badge } from '../components/Badge';
import { Btn } from '../components/Btn';
import { DataTable } from '../components/DataTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import { LoadingState, ErrorState } from '../components/LoadingState';
import { FormField, Input, Select } from '../components/FormField';
import { useToast } from '../context/ToastContext';
import { IconPlus, IconEdit, IconTrash } from '../components/Icons';

interface NewUser { username:string; display_name:string; password:string; role:'admin'|'parish'; parish_id:string; }
const EMPTY_NEW: NewUser = { username:'', display_name:'', password:'', role:'parish', parish_id:'' };

export function UsersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [newUser,    setNewUser]    = useState<NewUser>({...EMPTY_NEW});
  const [creating,   setCreating]   = useState(false);

  const [editUser,  setEditUser]  = useState<Partial<UserProfile>|null>(null);
  const [saving,    setSaving]    = useState(false);

  const [confirmId,  setConfirmId]  = useState<string|null>(null);
  const [delLoading, setDelLoading] = useState(false);

  const { data: usersD, isLoading, isError, error, refetch } = useQuery({ queryKey:['users'],    queryFn: () => callApi('getUsers')    as Promise<{data:UserProfile[]}> });
  const { data: parD  } = useQuery({ queryKey:['parishes'], queryFn: () => callApi('getParishes') as Promise<{data:Parish[]}> });
  const { data: recD  } = useQuery({ queryKey:['records'],  queryFn: () => callApi('getRecords')  as Promise<{data:CatechesisRecord[]}> });

  const users    = usersD?.data ?? [];
  const parishes = parD?.data   ?? [];
  const records  = recD?.data   ?? [];
  const parMap   = Object.fromEntries(parishes.map(p => [p.id, p.parish_name]));

  // Count records created by each user
  const recByUser = Object.fromEntries(users.map(u => [u.id, records.filter(r => r.created_by === u.id).length]));

  const handleCreate = async () => {
    if (!newUser.username.trim()) { toast('Username é obrigatório.','error'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(newUser.username)) { toast('Username: apenas letras, números e _.','error'); return; }
    if (newUser.password.length < 6) { toast('Senha deve ter pelo menos 6 caracteres.','error'); return; }
    if (newUser.role === 'parish' && !newUser.parish_id) { toast('Seleccione a paróquia.','error'); return; }
    setCreating(true);
    try {
      await callApi('insertUser', newUser);
      await qc.invalidateQueries({ queryKey:['users'] });
      toast('Utilizador criado.');
      setCreateOpen(false);
      setNewUser({...EMPTY_NEW});
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Erro.','error');
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await callApi('updateUser', editUser);
      await qc.invalidateQueries({ queryKey:['users'] });
      toast('Utilizador actualizado.');
      setEditUser(null);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Erro.','error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    const recCount = recByUser[confirmId] ?? 0;
    if (recCount > 0) {
      toast(`Não é possível eliminar: utilizador tem ${recCount} registo(s) associado(s).`, 'error');
      setConfirmId(null);
      return;
    }
    setDelLoading(true);
    try {
      await callApi('deleteUser', { id:confirmId });
      await qc.invalidateQueries({ queryKey:['users'] });
      toast('Utilizador eliminado.');
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Erro.','error');
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
          <h1 style={{ fontSize:'22px', fontWeight:'700', color:c.text, margin:0 }}>Utilizadores</h1>
          <p style={{ fontSize:'14px', color:c.textSecondary, margin:'2px 0 0' }}>{users.length} utilizadores</p>
        </div>
        <Btn icon={<IconPlus size={14}/>} onClick={() => setCreateOpen(true)}>Novo Utilizador</Btn>
      </div>

      <DataTable
        data={users as unknown as Record<string,unknown>[]}
        columns={[
          { key:'username',     header:'Username',   render: row => <code style={{fontSize:'13px',background:'#F1F5F9',padding:'2px 6px',borderRadius:'4px'}}>{(row as unknown as UserProfile).username}</code> },
          { key:'display_name', header:'Nome',       render: row => (row as unknown as UserProfile).display_name ?? '—' },
          { key:'role',         header:'Perfil',     render: row => <Badge value={(row as unknown as UserProfile).role} />, width:'90px' },
          { key:'parish',       header:'Paróquia',   render: row => parMap[(row as unknown as UserProfile).parish_id ?? ''] ?? '—', hideOnMobile:true },
          { key:'status',       header:'Estado',     render: row => <Badge value={(row as unknown as UserProfile).status} />, width:'90px' },
        ]}
        actions={(row) => {
          const u = row as unknown as UserProfile;
          return (
            <>
              <button onClick={() => setEditUser({...u})} aria-label="Editar"
                style={{ background:'none', border:'none', cursor:'pointer', color:c.textMuted, padding:'4px', lineHeight:0 }}
                onMouseEnter={e => (e.currentTarget.style.color = c.primary)}
                onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
              ><IconEdit size={15}/></button>
              <button onClick={() => setConfirmId(u.id)} aria-label="Eliminar"
                style={{ background:'none', border:'none', cursor:'pointer', color:c.textMuted, padding:'4px', lineHeight:0 }}
                onMouseEnter={e => (e.currentTarget.style.color = c.error)}
                onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
              ><IconTrash size={15}/></button>
            </>
          );
        }}
      />

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Novo Utilizador"
        footer={<><Btn variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Btn><Btn onClick={handleCreate} loading={creating}>Criar</Btn></>}>
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <FormField label="Username" required hint="Sem espaços ou caracteres especiais">
              <Input value={newUser.username} onChange={e => setNewUser(u => ({...u,username:e.target.value.replace(/[^a-zA-Z0-9_]/g,'')}))} placeholder="ex: joao_silva" autoFocus />
            </FormField>
            <FormField label="Nome de Exibição">
              <Input value={newUser.display_name} onChange={e => setNewUser(u => ({...u,display_name:e.target.value}))} placeholder="João Silva" />
            </FormField>
          </div>
          <FormField label="Senha" required hint="Mínimo 6 caracteres">
            <Input type="password" value={newUser.password} onChange={e => setNewUser(u => ({...u,password:e.target.value}))} />
          </FormField>
          <FormField label="Perfil" required>
            <Select value={newUser.role} onChange={e => setNewUser(u => ({...u,role:e.target.value as 'admin'|'parish'}))}>
              <option value="parish">Coordenador de Paróquia</option>
              <option value="admin">Administrador</option>
            </Select>
          </FormField>
          {newUser.role === 'parish' && (
            <FormField label="Paróquia" required>
              <Select value={newUser.parish_id} onChange={e => {
                const pid = e.target.value;
                const pName = parishes.find(p => p.id === pid)?.parish_name ?? '';
                setNewUser(u => ({
                  ...u,
                  parish_id:    pid,
                  display_name: u.display_name || pName,
                }));
              }}>
                <option value="">Seleccione a paróquia</option>
                {parishes.map(p => <option key={p.id} value={p.id}>{p.parish_name}</option>)}
              </Select>
            </FormField>
          )}
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Editar Utilizador"
        footer={<><Btn variant="ghost" onClick={() => setEditUser(null)}>Cancelar</Btn><Btn onClick={handleSave} loading={saving}>Guardar</Btn></>}>
        {editUser && (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <FormField label="Username">
              <code style={{ padding:'9px 12px', border:`1px solid ${c.border}`, borderRadius:'8px', background:'#F8FAFC', fontSize:'14px', display:'block' }}>
                {editUser.username}
              </code>
            </FormField>
            <FormField label="Nome de Exibição">
              <Input value={editUser.display_name ?? ''} onChange={e => setEditUser(u => u && {...u,display_name:e.target.value})} />
            </FormField>
            <FormField label="Nova Senha" hint="Deixe em branco para manter a actual">
              <Input type="password" placeholder="Nova senha (opcional)" onChange={e => setEditUser(u => u && {...u,password:e.target.value})} />
            </FormField>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <FormField label="Perfil">
                <Select value={editUser.role ?? 'parish'} onChange={e => setEditUser(u => u && {...u,role:e.target.value as UserProfile['role']})}>
                  <option value="parish">Coordenador</option>
                  <option value="admin">Administrador</option>
                </Select>
              </FormField>
              <FormField label="Estado">
                <Select value={editUser.status ?? 'active'} onChange={e => setEditUser(u => u && {...u,status:e.target.value as UserProfile['status']})}>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </Select>
              </FormField>
            </div>
            {editUser.role === 'parish' && (
              <FormField label="Paróquia">
                <Select value={editUser.parish_id ?? ''} onChange={e => setEditUser(u => u && {...u,parish_id:e.target.value})}>
                  <option value="">Nenhuma</option>
                  {parishes.map(p => <option key={p.id} value={p.id}>{p.parish_name}</option>)}
                </Select>
              </FormField>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={handleDelete} loading={delLoading}
        title="Eliminar Utilizador" message="Esta acção é irreversível. O utilizador perderá o acesso ao sistema." />
    </div>
  );
}