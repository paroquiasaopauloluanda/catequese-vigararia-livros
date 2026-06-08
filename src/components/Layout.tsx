import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useReferenceData } from '../hooks/useReferenceData';
import { c, r, shadow } from '../styles/theme';
import {
  IconDashboard, IconList, IconBook, IconUsers,
  IconMapPin, IconAge, IconPlus, IconLogOut, IconMenu, IconX, IconHome,
} from './Icons';

interface NavItem {
  to:     string;
  label:  string;
  icon:   React.ComponentType<{ size?: number }>;
  exact?: boolean;
}

const ADMIN_NAV: NavItem[] = [
  { to: '/dashboard',       label: 'Dashboard',        icon: IconDashboard, exact: true },
  { to: '/admin/records',   label: 'Todos os Registos', icon: IconList },
  { to: '/records',         label: 'Os meus Registos',  icon: IconHome },
  { to: '/admin/parishes',  label: 'Paróquias',         icon: IconMapPin },
  { to: '/admin/users',     label: 'Utilizadores',       icon: IconUsers },
  { to: '/admin/books',     label: 'Livros',             icon: IconBook },
  { to: '/admin/age-groups',label: 'Faixas Etárias',    icon: IconAge },
];

const PARISH_NAV: NavItem[] = [
  { to: '/records',         label: 'Os meus Registos',  icon: IconList },
  { to: '/records/new',     label: 'Novo Registo',       icon: IconPlus },
];

const SIDEBAR_W = 240;

export function Layout({ children }: { children: React.ReactNode }) {
  const { session, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  useReferenceData(); // prefetch all reference data in one batch call

  const nav = isAdmin ? ADMIN_NAV : PARISH_NAV;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Logo */}
      <div style={{
        padding:     '24px 20px 20px',
        borderBottom: `1px solid rgba(255,255,255,0.08)`,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{
            width:'36px', height:'36px', borderRadius:r.md,
            background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize:'13px', fontWeight:'700', color:'#fff', margin:0, lineHeight:1.2 }}>Catequese</p>
            <p style={{ fontSize:'11px', color:c.sidebarText, margin:0, lineHeight:1.2 }}>Vigararia</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav aria-label="Navegação principal" style={{ flex:1, padding:'12px 8px', overflowY:'auto' }}>
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            onClick={() => setDrawerOpen(false)}
            style={({ isActive }) => ({
              display:      'flex',
              alignItems:   'center',
              gap:          '10px',
              padding:      '9px 12px',
              borderRadius: r.md,
              marginBottom: '2px',
              fontSize:     '14px',
              fontWeight:   '500',
              textDecoration:'none',
              transition:   'all 150ms ease',
              background:   isActive ? 'rgba(124,58,237,0.25)' : 'transparent',
              color:        isActive ? '#fff' : c.sidebarText,
              borderLeft:   isActive ? `3px solid #7C3AED` : '3px solid transparent',
            })}
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{
        padding:    '16px 12px',
        borderTop:  `1px solid rgba(255,255,255,0.08)`,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
          <div style={{
            width:'32px', height:'32px', borderRadius:r.full,
            background:'linear-gradient(135deg,#7C3AED,#A78BFA)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'13px', fontWeight:'700', color:'#fff', flexShrink:0,
          }}>
            {(session?.displayName || 'U').charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow:'hidden' }}>
            <p style={{ fontSize:'13px', fontWeight:'600', color:'#fff', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {session?.displayName}
            </p>
            <p style={{ fontSize:'11px', color:c.sidebarText, margin:0 }}>
              {session?.role === 'admin' ? 'Administrador' : 'Coordenador'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display:'flex', alignItems:'center', gap:'8px',
            width:'100%', padding:'8px 10px', borderRadius:r.md,
            background:'transparent', border:'none', cursor:'pointer',
            fontSize:'13px', color:c.sidebarText, transition:'all 150ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=c.sidebarText; }}
        >
          <IconLogOut size={14} />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:c.bg }}>
      {/* Desktop Sidebar */}
      <aside style={{
        width:        `${SIDEBAR_W}px`,
        flexShrink:   0,
        background:   c.sidebar,
        display:      'none',
        position:     'fixed',
        top:0, left:0, bottom:0,
        zIndex:       30,
        boxShadow:    shadow.lg,
      }} className="sidebar-desktop">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position:'fixed', inset:0, zIndex:40,
            background:'rgba(15,23,42,0.6)',
            backdropFilter:'blur(2px)',
          }}
        />
      )}

      {/* Mobile Drawer */}
      <aside style={{
        position:   'fixed',
        top:0, left:0, bottom:0,
        width:      `${SIDEBAR_W}px`,
        background: c.sidebar,
        zIndex:     50,
        transform:  drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 250ms ease',
        boxShadow:  shadow.xl,
      }} className="sidebar-mobile">
        <SidebarContent />
      </aside>

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }} className="main-content">
        {/* Mobile Header */}
        <header style={{
          background:   c.surface,
          borderBottom: `1px solid ${c.border}`,
          padding:      '0 16px',
          height:       '56px',
          display:      'flex',
          alignItems:   'center',
          gap:          '12px',
          position:     'sticky',
          top:          0,
          zIndex:       20,
          boxShadow:    shadow.sm,
        }} className="mobile-header">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu"
            style={{
              background:'none', border:'none', cursor:'pointer',
              color:c.textSecondary, padding:'4px', borderRadius:r.sm,
              display:'flex', lineHeight:0,
            }}
          >
            <IconMenu size={22} />
          </button>
          <span style={{ fontSize:'15px', fontWeight:'600', color:c.text }}>Catequese Vigararia</span>
          <div style={{ marginLeft:'auto' }}>
            <div style={{
              width:'30px', height:'30px', borderRadius:r.full,
              background:'linear-gradient(135deg,#7C3AED,#A78BFA)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'12px', fontWeight:'700', color:'#fff',
            }}>
              {(session?.displayName || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex:1, padding:'24px 20px', maxWidth:'1280px', width:'100%', margin:'0 auto' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .sidebar-desktop { display: flex !important; flex-direction: column; }
          .sidebar-mobile  { display: none !important; }
          .mobile-header   { display: none !important; }
          .main-content    { margin-left: ${SIDEBAR_W}px; }
        }
        @media print {
          .sidebar-desktop, .sidebar-mobile, .mobile-header { display: none !important; }
          .main-content { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}