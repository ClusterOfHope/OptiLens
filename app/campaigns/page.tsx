'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/lib/DashboardLayout'
import { useViewport } from '@/lib/useViewport'

type Campaign = {
  id: string
  name: string
  objective: string
  status: string
  spend: number
  revenue: number
  roas: number
  waste_score: number
  health: 'healthy' | 'warning' | 'critical'
  recommendation: string
}

type SortKey = 'name' | 'spend' | 'revenue' | 'roas' | 'waste_score'
type SortDir = 'asc' | 'desc'

export default function CampaignsPage() {
  const router = useRouter()
  const vp = useViewport()
  const isMobile = vp === 'mobile'

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'healthy'>('all')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('waste_score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.campaigns) setCampaigns(d.campaigns)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  let filtered = campaigns
  if (filter === 'critical') filtered = filtered.filter((c) => c.health === 'critical')
  else if (filter === 'warning') filtered = filtered.filter((c) => c.health === 'warning')
  else if (filter === 'healthy') filtered = filtered.filter((c) => c.health === 'healthy')

  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter((c) => c.name.toLowerCase().includes(s))
  }

  filtered = [...filtered].sort((a, b) => {
    const aVal = a[sortKey], bVal = b[sortKey]
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    }
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal))
  })

  const counts = {
    all: campaigns.length,
    critical: campaigns.filter((c) => c.health === 'critical').length,
    warning: campaigns.filter((c) => c.health === 'warning').length,
    healthy: campaigns.filter((c) => c.health === 'healthy').length,
  }

  return (
    <DashboardLayout pageTitle="Campaigns" pageSubtitle={`${campaigns.length} total · ${counts.critical + counts.warning} flagged`}>
      <div style={S.toolbar}>
        <input
          type="text"
          placeholder="Search campaigns..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...S.search, width: isMobile ? '100%' : 280 }}
        />
        <div style={S.filterTabs}>
          <FilterTab label="All" count={counts.all} active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterTab label="Critical" count={counts.critical} active={filter === 'critical'} onClick={() => setFilter('critical')} color="#F87171" />
          <FilterTab label="Warning" count={counts.warning} active={filter === 'warning'} onClick={() => setFilter('warning')} color="#FBBF24" />
          <FilterTab label="Healthy" count={counts.healthy} active={filter === 'healthy'} onClick={() => setFilter('healthy')} color="#34D399" />
        </div>
      </div>

      {loading ? (
        <div style={S.loading}>Loading campaigns...</div>
      ) : filtered.length === 0 ? (
        <div style={S.empty}>
          {campaigns.length === 0
            ? 'No campaigns yet — sync your Meta account to start.'
            : 'No campaigns match your filters.'}
        </div>
      ) : (
        <div style={S.table}>
          {!isMobile && (
            <div style={S.tableHeader}>
              <SortHeader label="CAMPAIGN" k="name" current={sortKey} dir={sortDir} onClick={handleSort} flex={2} />
              <SortHeader label="SPEND" k="spend" current={sortKey} dir={sortDir} onClick={handleSort} width={100} align="right" />
              <SortHeader label="REVENUE" k="revenue" current={sortKey} dir={sortDir} onClick={handleSort} width={100} align="right" />
              <SortHeader label="ROAS" k="roas" current={sortKey} dir={sortDir} onClick={handleSort} width={80} align="right" />
              <SortHeader label="WASTE" k="waste_score" current={sortKey} dir={sortDir} onClick={handleSort} width={100} align="center" />
              <div style={{ width: 110, textAlign: 'right', ...S.headerLabel }}>ACTION</div>
            </div>
          )}
          {filtered.map((c) => (
            isMobile
              ? <CampaignCardMobile key={c.id} campaign={c} onClick={() => router.push(`/campaigns/${c.id}`)} />
              : <CampaignRow key={c.id} campaign={c} onClick={() => router.push(`/campaigns/${c.id}`)} />
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}

function FilterTab({ label, count, active, onClick, color }: { label: string; count: number; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button onClick={onClick} style={{ ...S.filterTab, ...(active ? S.filterTabActive : {}) }}>
      {label} <span style={{ ...S.tabCount, color: active ? '#0A0B0E' : (color || '#A0A8B5') }}>{count}</span>
    </button>
  )
}

function SortHeader({ label, k, current, dir, onClick, flex, width, align }: any) {
  const isActive = current === k
  return (
    <button
      onClick={() => onClick(k)}
      style={{
        ...S.sortHeader,
        ...(flex ? { flex } : {}),
        ...(width ? { width } : {}),
        textAlign: align || 'left',
        color: isActive ? '#FFFFFF' : '#6B7280',
      }}
    >
      {label} {isActive && (dir === 'asc' ? '↑' : '↓')}
    </button>
  )
}

function CampaignRow({ campaign: c, onClick }: { campaign: Campaign; onClick: () => void }) {
  const barColor = c.health === 'critical' ? '#F87171' : c.health === 'warning' ? '#FBBF24' : '#34D399'
  const action = c.health === 'critical' ? 'Pause' : c.health === 'warning' ? 'Review' : 'Scale up'
  const actionStyle =
    c.health === 'critical' ? { background: 'rgba(248,113,113,0.18)', color: '#F87171' } :
    c.health === 'warning' ? { background: 'rgba(251,191,36,0.18)', color: '#FBBF24' } :
    { background: 'rgba(52,211,153,0.18)', color: '#34D399' }
  const roasColor = c.roas >= 2 ? '#34D399' : c.roas >= 1 ? '#FBBF24' : '#F87171'

  return (
    <div onClick={onClick} style={{ ...S.row, borderLeft: `3px solid ${barColor}` }}>
      <div style={{ flex: 2, minWidth: 0 }}>
        <div style={S.cName}>{c.name}</div>
        <div style={S.cMeta}>
          <span>{c.objective}</span>
          <span style={S.cMetaDivider}>·</span>
          <span style={{ color: '#34D399' }}>{c.status}</span>
        </div>
      </div>
      <div style={{ width: 100, textAlign: 'right', fontWeight: 500 }}>${Math.round(c.spend).toLocaleString()}</div>
      <div style={{ width: 100, textAlign: 'right', fontWeight: 500, color: c.revenue === 0 ? '#F87171' : '#fff' }}>${Math.round(c.revenue).toLocaleString()}</div>
      <div style={{ width: 80, textAlign: 'right', fontWeight: 500, color: roasColor }}>{c.roas.toFixed(2)}x</div>
      <div style={{ width: 100, textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: 60, height: 4, borderRadius: 2, background: '#475569', overflow: 'hidden' }}>
          <div style={{ width: `${c.waste_score * 10}%`, height: '100%', background: barColor }} />
        </div>
        <div style={{ fontSize: 10, color: '#6B7280', marginTop: 4 }}>{c.waste_score}/10</div>
      </div>
      <div style={{ width: 110, textAlign: 'right' }}>
        <span style={{ ...S.actionTag, ...actionStyle }}>{action}</span>
      </div>
    </div>
  )
}

function CampaignCardMobile({ campaign: c, onClick }: { campaign: Campaign; onClick: () => void }) {
  const barColor = c.health === 'critical' ? '#F87171' : c.health === 'warning' ? '#FBBF24' : '#34D399'
  const action = c.health === 'critical' ? 'Pause' : c.health === 'warning' ? 'Review' : 'Scale'
  const actionStyle =
    c.health === 'critical' ? { background: 'rgba(248,113,113,0.18)', color: '#F87171' } :
    c.health === 'warning' ? { background: 'rgba(251,191,36,0.18)', color: '#FBBF24' } :
    { background: 'rgba(52,211,153,0.18)', color: '#34D399' }
  const roasColor = c.roas >= 2 ? '#34D399' : c.roas >= 1 ? '#FBBF24' : '#F87171'
  return (
    <div onClick={onClick} style={{ ...S.cardMobile, borderLeft: `3px solid ${barColor}` }}>
      <div style={S.cardTop}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={S.cName}>{c.name}</div>
          <div style={S.cMeta}>
            <span>{c.objective}</span>
            <span style={S.cMetaDivider}>·</span>
            <span style={{ color: '#34D399' }}>{c.status}</span>
          </div>
        </div>
        <span style={{ ...S.actionTag, ...actionStyle, marginLeft: 8 }}>{action}</span>
      </div>
      <div style={S.cardMetrics}>
        <div style={S.cardMetric}>
          <div style={S.cardLabel}>SPEND</div>
          <div style={S.cardValue}>${Math.round(c.spend).toLocaleString()}</div>
        </div>
        <div style={S.cardMetric}>
          <div style={S.cardLabel}>REVENUE</div>
          <div style={{ ...S.cardValue, color: c.revenue === 0 ? '#F87171' : '#fff' }}>${Math.round(c.revenue).toLocaleString()}</div>
        </div>
        <div style={S.cardMetric}>
          <div style={S.cardLabel}>ROAS</div>
          <div style={{ ...S.cardValue, color: roasColor }}>{c.roas.toFixed(2)}x</div>
        </div>
      </div>
    </div>
  )
}

const C = {
  bg: '#0A0B0E', surface: '#334155', surfaceLight: '#3D4F6B',
  border: '#475569', text: '#FFFFFF',
  textSecondary: '#A0A8B5', textTertiary: '#6B7280',
  amber: '#FBBF24', green: '#34D399', red: '#F87171',
}

const F = {
  display: '"Fraunces", Georgia, serif',
  body: '"Inter", -apple-system, system-ui, sans-serif',
}

const S: Record<string, React.CSSProperties> = {
  toolbar: {
    display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20,
    justifyContent: 'space-between', alignItems: 'center',
  },
  search: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: '10px 14px', fontSize: 14,
    color: C.text, fontFamily: F.body, outline: 'none',
  },
  filterTabs: {
    display: 'flex', gap: 4, background: C.surface,
    border: `1px solid ${C.border}`, borderRadius: 8, padding: 3,
    flexWrap: 'wrap',
  },
  filterTab: {
    background: 'transparent', border: 'none',
    padding: '6px 12px', fontSize: 12, fontWeight: 500, color: C.textSecondary,
    borderRadius: 5, cursor: 'pointer', fontFamily: F.body,
  },
  filterTabActive: { background: C.amber, color: '#0A0B0E' },
  tabCount: { fontWeight: 700, marginLeft: 4 },
  loading: {
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: '60px 20px', textAlign: 'center', color: C.textSecondary, fontSize: 14,
  },
  empty: {
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: '60px 20px', textAlign: 'center', color: C.textTertiary, fontSize: 14,
  },
  table: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 10, overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  tableHeader: {
    display: 'flex', alignItems: 'center', padding: '14px 20px',
    borderBottom: `1px solid ${C.border}`, gap: 16,
    background: '#101218',
  },
  sortHeader: {
    background: 'transparent', border: 'none',
    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
    cursor: 'pointer', fontFamily: F.body, padding: 0,
  },
  headerLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#6B7280' },
  row: {
    display: 'flex', alignItems: 'center', padding: '16px 20px',
    borderBottom: `1px solid ${C.border}`, gap: 16, fontSize: 13,
    cursor: 'pointer', transition: 'background 0.15s',
  },
  cName: { fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 4 },
  cMeta: { fontSize: 11, color: C.textTertiary, display: 'flex', gap: 6, alignItems: 'center' },
  cMetaDivider: { color: C.border },
  actionTag: {
    display: 'inline-block', fontSize: 10, fontWeight: 700,
    padding: '5px 10px', borderRadius: 4, letterSpacing: '0.05em', textTransform: 'uppercase',
  },
  cardMobile: {
    padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
    cursor: 'pointer',
  },
  cardTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardMetrics: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  cardMetric: {
    background: C.surfaceLight, border: `1px solid ${C.border}`,
    borderRadius: 6, padding: '8px 10px',
  },
  cardLabel: { fontSize: 9, color: C.textTertiary, letterSpacing: '0.1em', marginBottom: 4, fontWeight: 600 },
  cardValue: { fontFamily: F.display, fontSize: 16, fontWeight: 500, color: C.text },
}
