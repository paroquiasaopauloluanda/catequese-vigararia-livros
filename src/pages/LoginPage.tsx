import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { c, r, shadow } from '../styles/theme';
import { Input } from '../components/FormField';
import { Btn } from '../components/Btn';

export function LoginPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) { setError('Preencha todos os campos.'); return; }
    setLoading(true);
    try {
      await login(username.trim(), password);
      const session = JSON.parse(localStorage.getItem('catequese_session') || '{}');
      navigate(session.role === 'admin' ? '/dashboard' : '/records', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar sessão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      background:     `linear-gradient(135deg, ${c.sidebar} 0%, #2D2A5E 50%, #1E1B4B 100%)`,
      padding:        '20px',
    }}>
      <div style={{ width:'100%', maxWidth:'380px' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{
            width:'64px', height:'64px', borderRadius:'16px',
            background:'linear-gradient(135deg,#7C3AED,#A78BFA)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 16px',
            boxShadow:`0 8px 20px rgba(124,58,237,0.4)`,
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <h1 style={{ fontSize:'22px', fontWeight:'700', color:'#fff', margin:'0 0 4px', lineHeight:1.2 }}>
            Catequese Vigararia
          </h1>
          <p style={{ fontSize:'14px', color:'#C4B5FD', margin:0 }}>
            Sistema de gestão de livros
          </p>
        </div>

        {/* Card */}
        <div style={{
          background:   'rgba(255,255,255,0.97)',
          borderRadius: '20px',
          padding:      '32px',
          boxShadow:    '0 24px 48px rgba(0,0,0,0.2)',
        }}>
          <h2 style={{ fontSize:'18px', fontWeight:'600', color:c.text, margin:'0 0 24px', textAlign:'center' }}>
            Iniciar Sessão
          </h2>

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div>
                <label htmlFor="username" style={{ display:'block', fontSize:'13px', fontWeight:'500', color:c.textSecondary, marginBottom:'4px' }}>
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="O seu username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoFocus
                  error={!!error}
                />
              </div>

              <div>
                <label htmlFor="password" style={{ display:'block', fontSize:'13px', fontWeight:'500', color:c.textSecondary, marginBottom:'4px' }}>
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="A sua senha"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  error={!!error}
                />
              </div>

              {error && (
                <div role="alert" style={{
                  padding:      '10px 12px',
                  borderRadius: r.md,
                  background:   c.errorLight,
                  border:       `1px solid ${c.error}`,
                  fontSize:     '13px',
                  color:        c.errorText,
                }}>
                  {error}
                </div>
              )}

              <Btn
                type="submit"
                loading={loading}
                style={{ width:'100%', justifyContent:'center', padding:'12px', fontSize:'15px' }}
              >
                {loading ? 'A verificar...' : 'Entrar'}
              </Btn>
            </div>
          </form>
        </div>

        <p style={{ textAlign:'center', marginTop:'20px', fontSize:'12px', color:'rgba(196,181,253,0.6)' }}>
          Vigararia · Sistema interno
        </p>
      </div>
    </div>
  );
}