import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { callApi } from '../api/sheets';
import type { DashboardData } from '../types';
import { c, r, shadow } from '../styles/theme';
import { LoadingState, ErrorState, KpiCard } from '../components/LoadingState';
import { Modal } from '../components/Modal';
import { Btn } from '../components/Btn';
import { IconRefresh } from '../components/Icons';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, ChartDataLabels);

const CHART_COLORS = ['#7C3AED','#A78BFA','#5B21B6','#C4B5FD','#DDD6FE','#4C1D95','#8B5CF6','#EDE9FE'];

export function Dashboard() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  () => callApi('getDashboard') as Promise<{ data?: DashboardData } & DashboardData>,
    select:   d => (d as { data?: DashboardData } & DashboardData).data ?? d,
    staleTime: 60_000,
  });

  const [divergenceModal, setDivergenceModal] = useState<null | DashboardData['divergences'][0]>(null);

  if (isLoading) return <LoadingState message="A carregar dashboard..." />;
  if (isError)   return <ErrorState message={error instanceof Error ? error.message : 'Erro ao carregar.'} onRetry={() => refetch()} />;
  if (!data)     return null;

  const { kpis, topBooks, byParish, byStage, divergences } = data as DashboardData;

  const uniformColor = kpis.uniformRate >= 70 ? c.success : kpis.uniformRate >= 40 ? c.warning : c.error;

  const dataLabelBase = {
    color:     '#475569',
    font:      { size: 11, weight: 'bold' as const },
    formatter: (v: number) => v > 0 ? v : '',
  };

  // Horizontal bar (Top Books)
  const hBarOptions = {
    indexAxis:          'y' as const,
    responsive:          true, maintainAspectRatio: false,
    layout:             { padding: { right: 32 } },
    plugins: {
      legend:     { display: false },
      tooltip:    { callbacks: { label: (ctx: { raw: unknown }) => ` ${ctx.raw} registos` } },
      datalabels: { ...dataLabelBase, anchor: 'end' as const, align: 'right' as const, clamp: true },
    },
    scales: {
      x: { grid: { color: '#F1F5F9' }, ticks: { font: { size: 11 } }, afterDataLimits: (ax: { max: number }) => { ax.max = ax.max * 1.2; } },
      y: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  };

  // Vertical bar (By Stage)
  const vBarOptions = {
    responsive: true, maintainAspectRatio: false,
    layout:     { padding: { top: 24 } },
    plugins: {
      legend:     { display: false },
      tooltip:    { callbacks: { label: (ctx: { raw: unknown }) => ` ${ctx.raw} registos` } },
      datalabels: { ...dataLabelBase, anchor: 'end' as const, align: 'top' as const },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: '#F1F5F9' }, ticks: { stepSize: 1, font: { size: 11 } }, afterDataLimits: (ax: { max: number }) => { ax.max = ax.max * 1.2; } },
    },
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px', gap:'12px', flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'700', color:c.text, margin:0 }}>Dashboard</h1>
          <p style={{ fontSize:'14px', color:c.textSecondary, margin:'2px 0 0' }}>Visão global da uniformização</p>
        </div>
        <Btn variant="ghost" icon={<IconRefresh size={14}/>} onClick={() => refetch()} size="sm">
          Actualizar
        </Btn>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:'14px', marginBottom:'24px' }}>
        <KpiCard label="Total Registos"  value={kpis.totalRecords}   color={c.primary} />
        <KpiCard label="Paróquias Activas" value={kpis.activeParishes} color="#059669" />
        <KpiCard label="Livros Distintos" value={kpis.distinctBooks}  color="#D97706" />
        <KpiCard label="Etapas Cobertas" value={kpis.stagesCovered}  color="#2563EB" />
      </div>

      {/* Uniformization bar */}
      <div style={{
        background:c.surface, borderRadius:r.lg, border:`1px solid ${c.border}`,
        padding:'20px', marginBottom:'24px', boxShadow:shadow.sm,
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
          <div>
            <p style={{ fontSize:'14px', fontWeight:'600', color:c.text, margin:0 }}>Taxa de Uniformização</p>
            <p style={{ fontSize:'12px', color:c.textMuted, margin:'2px 0 0' }}>
              Percentagem de etapas com apenas 1 livro em uso
            </p>
          </div>
          <span style={{
            fontSize:'24px', fontWeight:'700', color:uniformColor,
          }}>{kpis.uniformRate}%</span>
        </div>
        <div style={{ height:'10px', borderRadius:r.full, background:'#E2E8F0', overflow:'hidden' }}>
          <div style={{
            height:'100%',
            width:`${kpis.uniformRate}%`,
            background:`linear-gradient(90deg, ${uniformColor}, ${uniformColor}CC)`,
            borderRadius:r.full,
            transition:'width 600ms ease',
          }} />
        </div>
        <p style={{ fontSize:'12px', color:c.textMuted, margin:'8px 0 0' }}>
          {kpis.uniformRate >= 70 ? 'Boa uniformização' : kpis.uniformRate >= 40 ? 'Uniformização parcial — acção recomendada' : 'Baixa uniformização — intervenção necessária'}
        </p>
      </div>

      {/* Charts row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'16px', marginBottom:'24px' }}>
        {/* Top Books */}
        <div style={{ background:c.surface, borderRadius:r.lg, border:`1px solid ${c.border}`, padding:'20px', boxShadow:shadow.sm }}>
          <p style={{ fontSize:'14px', fontWeight:'600', color:c.text, margin:'0 0 16px' }}>Livros Mais Usados</p>
          <div style={{ height:'240px' }}>
            {topBooks.length > 0 ? (
              <Bar
                data={{
                  labels:   topBooks.map(b => b.name.length > 20 ? b.name.slice(0,20)+'…' : b.name),
                  datasets: [{ data: topBooks.map(b => b.count), backgroundColor: CHART_COLORS, borderRadius: 4 }],
                }}
                options={hBarOptions}
              />
            ) : <p style={{ color:c.textMuted, fontSize:'13px', textAlign:'center', paddingTop:'80px' }}>Sem dados</p>}
          </div>
        </div>

        {/* By Parish */}
        <div style={{ background:c.surface, borderRadius:r.lg, border:`1px solid ${c.border}`, padding:'20px', boxShadow:shadow.sm }}>
          <p style={{ fontSize:'14px', fontWeight:'600', color:c.text, margin:'0 0 16px' }}>Registos por Paróquia</p>
          <div style={{ height:'240px' }}>
            {byParish.length > 0 ? (
              <Doughnut
                data={{
                  labels:   byParish.map(p => p.name),
                  datasets: [{ data: byParish.map(p => p.count), backgroundColor: CHART_COLORS, borderWidth: 2, borderColor: '#fff' }],
                }}
                options={{
                  responsive:true, maintainAspectRatio:false,
                  plugins:{
                    legend:{ position:'bottom', labels:{ boxWidth:10, font:{ size:11 } } },
                    datalabels:{
                      color:'#fff',
                      font:{ size:11, weight:'bold' as const },
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter:(value:number, ctx:any) => {
                        const data  = (ctx.dataset.data as number[]).filter((v): v is number => v !== null);
                        const total = data.reduce((a:number, b:number) => a + b, 0);
                        const pct   = total > 0 ? Math.round((value / total) * 100) : 0;
                        return pct >= 7 ? `${pct}%` : '';
                      },
                    },
                  },
                }}
              />
            ) : <p style={{ color:c.textMuted, fontSize:'13px', textAlign:'center', paddingTop:'80px' }}>Sem dados</p>}
          </div>
        </div>

        {/* By Stage */}
        <div style={{ background:c.surface, borderRadius:r.lg, border:`1px solid ${c.border}`, padding:'20px', boxShadow:shadow.sm }}>
          <p style={{ fontSize:'14px', fontWeight:'600', color:c.text, margin:'0 0 16px' }}>Registos por Etapa</p>
          <div style={{ height:'240px' }}>
            {byStage.length > 0 ? (
              <Bar
                data={{
                  labels:   byStage.map(s => s.name.length > 18 ? s.name.slice(0,18)+'…' : s.name),
                  datasets: [{ data: byStage.map(s => s.count), backgroundColor: c.primary, borderRadius: 4 }],
                }}
                options={vBarOptions}
              />
            ) : <p style={{ color:c.textMuted, fontSize:'13px', textAlign:'center', paddingTop:'80px' }}>Sem dados</p>}
          </div>
        </div>
      </div>

      {/* Divergences Table */}
      <div style={{ background:c.surface, borderRadius:r.lg, border:`1px solid ${c.border}`, overflow:'hidden', boxShadow:shadow.sm }}>
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${c.border}` }}>
          <p style={{ fontSize:'14px', fontWeight:'600', color:c.text, margin:0 }}>Divergências por Etapa</p>
          <p style={{ fontSize:'12px', color:c.textMuted, margin:'2px 0 0' }}>Clique numa etapa para ver detalhes</p>
        </div>
        {divergences.length === 0 ? (
          <p style={{ padding:'32px', textAlign:'center', color:c.textMuted, fontSize:'14px' }}>Sem dados de divergências</p>
        ) : (
          <div>
            {divergences.map(div => (
              <button
                key={div.stageId}
                onClick={() => setDivergenceModal(div)}
                style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  width:'100%', padding:'12px 20px', background:'none', border:'none',
                  borderBottom:`1px solid ${c.border}`, cursor:'pointer',
                  textAlign:'left', transition:'background 120ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <span style={{ fontSize:'14px', color:c.text, fontWeight:'500' }}>{div.stageName}</span>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{
                    fontSize:'12px', padding:'2px 10px', borderRadius:r.full,
                    background: div.bookCount === 1 ? c.successLight : div.bookCount === 2 ? c.warningLight : c.errorLight,
                    color:      div.bookCount === 1 ? c.successText  : div.bookCount === 2 ? c.warningText  : c.errorText,
                    fontWeight: '600',
                  }}>
                    {div.bookCount} livro{div.bookCount !== 1 ? 's' : ''}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.textMuted} strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Divergence Detail Modal */}
      <Modal
        open={!!divergenceModal}
        onClose={() => setDivergenceModal(null)}
        title={`Divergências — ${divergenceModal?.stageName}`}
        size="lg"
      >
        {divergenceModal && (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {divergenceModal.books.length === 0 ? (
              <p style={{ color:c.textMuted, fontSize:'14px' }}>Sem dados.</p>
            ) : (
              divergenceModal.books.map((book, i) => (
                <div key={i} style={{
                  padding:'14px', borderRadius:r.md,
                  background: '#F8FAFC', border:`1px solid ${c.border}`,
                }}>
                  <p style={{ fontSize:'14px', fontWeight:'600', color:c.text, margin:'0 0 8px' }}>
                    {book.name}
                  </p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                    {book.parishes.map((p, j) => (
                      <span key={j} style={{
                        fontSize:'12px', padding:'2px 8px', borderRadius:r.full,
                        background:c.primaryLight, color:c.primaryText,
                      }}>{p}</span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}