'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type User = {
  id: string
  name: string
  email: string | null
  avatar_url: string | null
  company_name: string | null
  subscription_status: string
}

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

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filter, setFilter] = useState<'all' | 'flagged' | 'healthy'>('all')
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [trendData, setTrendData] = useState<number[]>([])

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d?.user) {
          router.push('/')
          return
        }
        setUser(d.user)
        if (d.campaigns) setCampaigns(d.campaigns)
        if (d.trend) setTrendData(d.trend)
      })
      .catch(() => router.push('/'))
  }, [router])

  const handleSync = async () => {
    setSyncing(true)
    setSyncMessage('')
    try {
      const res = await fetch('/api/ingest', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setSyncMessage(data.message || 'Sync complete')
        const me = await fetch('/api/me').then((r) => r.json())
        if (me.campaigns) setCampaigns(me.campaigns)
        if (me.trend) setTrendData(me.trend)
      } else {
        setSyncMessage(data.error || 'Sync failed')
      }
    } catch {
      setSyncMessage('Network error during sync')
    }
    setSyncing(false)
    setTimeout(() => setSyncMessage(''), 4000)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const totalSpend = campaigns.reduce((s, c) => s + (c.spend || 0), 0)
  const totalRevenue = campaigns.reduce((s, c) => s + (c.revenue || 0), 0)
  const blendedRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const wasteSpend = campaigns
    .filter((c) => c.health === 'critical' || c.health === 'warning')
    .reduce((s, c) => s + (c.spend || 0), 0)
  const wastePercent = totalSpend > 0 ? Math.round((wasteSpend / totalSpend) * 100) : 0
  const flaggedCount = campaigns.filter((c) => c.health !== 'healthy').length

  const filteredCampaigns = campaigns.filter((c) => {
    if (filter === 'flagged') return c.health !== 'healthy'
    if (filter === 'healthy') return c.health === 'healthy'
    return true
  })

  if (!user) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingText}>Loading your dashboard...</div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <div style={styles.logo}>
            <span style={styles.logoOpti}>Opti</span>
            <span style={styles.logoLens}>Lens</span>
          </div>
          <div style={styles.tagline}>Ad spend intelligence</div>
        </div>

        <div style={styles.menu}>
          <div style={styles.menuLabel}>MENU</div>
          <a style={{ ...styles.menuItem, ...styles.menuItemActive }}>Dashboard</a>
          <a style={styles.menuItem}>Campaigns</a>
          <a style={styles.menuItem}>History</a>
          <a style={styles.menuItem}>Meta Ads</a>
          <a style={styles.menuItem}>Shopify</a>
        </div>

        <div style={styles.sidebarBottom}>
          <div style={styles.betaBadge}>
            <span style={styles.betaDot} />
            BETA · Free for life
          </div>
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.topbar}>
          <div>
            <h1 style={styles.title}>Dashboard</h1>
            <div style={styles.subtitle}>Live · synced from Meta Ads</div>
          </div>
          <div style={styles.topActions}>
            {syncMessage && <div style={styles.syncMessage}>{syncMessage}</div>}
            <button onClick={handleSync} disabled={syncing} style={styles.syncBtn}>
              {syncing ? 'Syncing...' : 'Sync now'}
            </button>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowMenu(!showMenu)} style={styles.avatarBtn}>
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar_url} alt={user.name} style={styles.avatar} />
                ) : (
                  <div style={styles.avatarFallback}>{user.name?.[0] || '?'}</div>
                )}
              </button>
              {showMenu && (
                <div style={styles.dropdown}>
                  <div style={styles.dropdownHeader}>
                    <div style={styles.dropdownName}>{user.name}</div>
                    <div style={styles.dropdownEmail}>{user.email}</div>
                  </div>
                  <button onClick={handleLogout} style={styles.dropdownItem}>Sign out</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {flaggedCount > 0 && (
          <div style={styles.alertBanner}>
            <div>
              <div style={styles.alertLabel}>ACTION REQUIRED</div>
              <div style={styles.alertTitle}>
                {flaggedCount} campaigns burning money with poor returns
              </div>
              <div style={styles.alertSub}>Pause these immediately to stop the bleed</div>
            </div>
            <div style={styles.alertNumber}>
              <div style={styles.alertAmount}>${Math.round(wasteSpend).toLocaleString()}</div>
              <div style={styles.alertNumberSub}>wasted this month</div>
            </div>
          </div>
        )}

        <div style={styles.metricsRow}>
          <Metric label="TOTAL SPEND" value={`$${Math.round(totalSpend).toLocaleString()}`} sub="Last 30 days" />
          <Metric label="REVENUE" value={`$${Math.round(totalRevenue).toLocaleString()}`} sub="Meta attributed" tone="green" />
          <Metric label="BLENDED ROAS" value={`${blendedRoas.toFixed(2)}x`} sub="Target: 2.0x+" tone={blendedRoas >= 2 ? 'green' : 'amber'} />
          <Metric label="BUDGET WASTED" value={`${wastePercent}%`} sub={`$${Math.round(wasteSpend).toLocaleString()} lost`} tone={wastePercent > 30 ? 'red' : 'amber'} />
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <div>
              <div style={styles.chartTitle}>30-day waste trend</div>
              <div style={styles.chartSub}>Daily spend on flagged campaigns · ↓ Goal: keep this flat</div>
            </div>
            <div style={styles.chartLegend}>
              <span style={styles.legendDot} />
              Wasted spend
            </div>
          </div>
          <TrendChart data={trendData.length ? trendData : DEMO_TREND} />
        </div>

        <div style={styles.campaignsHeader}>
          <h2 style={styles.campaignsTitle}>
            Campaign performance <span style={styles.campaignsCount}>{campaigns.length} campaigns</span>
          </h2>
          <div style={styles.filterTabs}>
            <button onClick={() => setFilter('all')} style={{ ...styles.filterTab, ...(filter === 'all' ? styles.filterTabActive : {}) }}>All</button>
            <button onClick={() => setFilter('flagged')} style={{ ...styles.filterTab, ...(filter === 'flagged' ? styles.filterTabActive : {}) }}>Flagged</button>
            <button onClick={() => setFilter('healthy')} style={{ ...styles.filterTab, ...(filter === 'healthy' ? styles.filterTabActive : {}) }}>Healthy</button>
          </div>
        </div>

        <div style={styles.campaignTable}>
          <div style={styles.tableHeader}>
            <div style={{ flex: 2 }}>CAMPAIGN</div>
            <div style={{ width: 90, textAlign: 'right' }}>SPEND</div>
            <div style={{ width: 90, textAlign: 'right' }}>REVENUE</div>
            <div style={{ width: 70, textAlign: 'right' }}>ROAS</div>
            <div style={{ width: 90, textAlign: 'center' }}>WASTE</div>
            <div style={{ width: 110, textAlign: 'center' }}>HEALTH</div>
            <div style={{ width: 110, textAlign: 'right' }}>ACTION</div>
          </div>

          {filteredCampaigns.length === 0 ? (
            <div style={styles.emptyState}>No campaigns match this filter.</div>
          ) : (
            filteredCampaigns.map((c) => <CampaignRow key={c.id} campaign={c} />)
          )}
        </div>
      </main>
    </div>
  )
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: string }) {
  const valueColor = tone === 'green' ? '#34D399' : tone === 'amber' ? '#FBBF24' : tone === 'red' ? '#F87171' : '#fff'
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={{ ...styles.metricValue, color: valueColor }}>{value}</div>
      <div style={styles.metricSub}>{sub}</div>
    </div>
  )
}

function CampaignRow({ campaign: c }: { campaign: Campaign }) {
  const barColor = c.health === 'critical' ? '#F87171' : c.health === 'warning' ? '#FBBF24' : '#34D399'
  const actionStyle =
    c.health === 'critical' ? { background: 'rgba(248,113,113,0.18)', color: '#F87171' } :
    c.health === 'warning' ? { background: 'rgba(251,191,36,0.18)', color: '#FBBF24' } :
    { background: 'rgba(52,211,153,0.18)', color: '#34D399' }
  const action = c.health === 'critical' ? 'Pause now' : c.health === 'warning' ? 'Pause now' : 'Scale up'
  const roasColor = c.roas >= 2 ? '#34D399' : c.roas >= 1 ? '#FBBF24' : '#F87171'

  return (
    <div style={{ ...styles.campaignRow, borderLeft: `3px solid ${barColor}` }}>
      <div style={{ flex: 2, minWidth: 0 }}>
        <div style={styles.cName}>{c.name}</div>
        <div style={styles.cMeta}>
          <span>{c.objective}</span>
          <span style={styles.cMetaDivider}>·</span>
          <span style={{ color: '#34D399' }}>{c.status}</span>
        </div>
      </div>
      <div style={{ width: 90, textAlign: 'right', fontWeight: 500 }}>${Math.round(c.spend).toLocaleString()}</div>
      <div style={{ width: 90, textAlign: 'right', fontWeight: 500, color: c.revenue === 0 ? '#F87171' : '#fff' }}>${Math.round(c.revenue).toLocaleString()}</div>
      <div style={{ width: 70, textAlign: 'right', fontWeight: 500, color: roasColor }}>{c.roas.toFixed(2)}x</div>
      <div style={{ width: 90, textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: 60, height: 4, borderRadius: 2, background: '#2D3340', overflow: 'hidden' }}>
          <div style={{ width: `${c.waste_score * 10}%`, height: '100%', background: barColor }} />
        </div>
        <div style={{ fontSize: 10, color: '#6B7280', marginTop: 4 }}>{c.waste_score}/10</div>
      </div>
      <div style={{ width: 110, textAlign: 'center' }}>
        <span style={{ ...styles.healthTag, color: barColor }}>{c.recommendation || '—'}</span>
      </div>
      <div style={{ width: 110, textAlign: 'right' }}>
        <span style={{ ...styles.actionTag, ...actionStyle }}>{action}</span>
      </div>
    </div>
  )
}

function TrendChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - (v / max) * 80
    return `${x},${y}`
  }).join(' ')
  const fillPoints = `0,100 ${points} 100,100`

  return (
    <div style={styles.chartContainer}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: 180, display: 'block' }}>
        <polyline points={fillPoints} fill="rgba(248,113,113,0.12)" stroke="none" />
        <polyline points={points} fill="none" stroke="#F87171" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div style={styles.chartXAxis}>
        <span>30 days ago</span>
        <span>15 days</span>
        <span>Today</span>
      </div>
    </div>
  )
}

const DEMO_TREND = [120, 150, 180, 220, 260, 300, 340, 290, 250, 280, 310, 350, 410, 470, 520, 480, 440, 460, 510, 560, 600, 580, 540, 590, 640, 690, 720, 680, 640, 620]

const colors = {
  bg: '#0A0B0E',
  bgSecondary: '#101218',
  surface: '#1A1D24',
  surfaceLight: '#22262F',
  border: '#2D3340',
  text: '#FFFFFF',
  textSecondary: '#A0A8B5',
  textTertiary: '#6B7280',
  primary: '#FFFFFF',
  green: '#34D399',
  amber: '#FBBF24',
  red: '#F87171',
}

const fonts = {
  display: '"Fraunces", Georgia, serif',
  body: '"Inter", -apple-system, system-ui, sans-serif',
  mono: '"JetBrains Mono", Menlo, monospace',
}

const styles: Record<string, React.CSSProperties> = {
  loadingPage: {
    background: colors.bg, color: colors.textSecondary, minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.body,
  },
  loadingText: { fontSize: 14, fontFamily: fonts.mono },

  page: {
    display: 'grid', gridTemplateColumns: '240px 1fr',
    background: colors.bg, color: colors.text, fontFamily: fonts.body,
    minHeight: '100vh', position: 'relative',
  },

  sidebar: {
    background: colors.bgSecondary,
    borderRight: `1px solid ${colors.border}`,
    padding: '28px 20px', display: 'flex', flexDirection: 'column',
    position: 'relative', zIndex: 2,
  },
  sidebarTop: { marginBottom: 40 },
  logo: { fontFamily: fonts.display, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 },
  logoOpti: { color: colors.text },
  logoLens: { color: colors.amber },
  tagline: { fontSize: 11, color: colors.textTertiary, letterSpacing: '0.02em' },
  menu: { flex: 1 },
  menuLabel: {
    fontSize: 10, fontWeight: 600, color: colors.textTertiary,
    letterSpacing: '0.15em', marginBottom: 12, paddingLeft: 12,
  },
  menuItem: {
    display: 'block', padding: '10px 12px', color: colors.textSecondary,
    fontSize: 14, fontWeight: 500, borderRadius: 6, cursor: 'pointer', marginBottom: 2,
  },
  menuItemActive: { background: colors.surface, color: colors.amber },
  sidebarBottom: { marginTop: 'auto' },
  betaBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '8px 12px', background: 'rgba(251,191,36,0.1)',
    border: `1px solid rgba(251,191,36,0.3)`, borderRadius: 100,
    fontSize: 11, fontWeight: 600, color: colors.amber, letterSpacing: '0.02em',
  },
  betaDot: { width: 6, height: 6, background: colors.amber, borderRadius: '50%', boxShadow: `0 0 8px ${colors.amber}` },

  main: { padding: '32px 40px 80px', position: 'relative', zIndex: 2, overflow: 'auto' },
  topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  title: { fontFamily: fonts.display, fontSize: 36, fontWeight: 500, letterSpacing: '-0.02em', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textTertiary, marginTop: 4 },
  topActions: { display: 'flex', alignItems: 'center', gap: 14 },
  syncMessage: { fontSize: 12, color: colors.textSecondary, fontFamily: fonts.mono },
  syncBtn: {
    background: colors.primary, color: '#0A0B0E', border: 'none',
    padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: fonts.body,
    boxShadow: '0 4px 12px rgba(255,255,255,0.1)',
  },
  avatarBtn: {
    width: 36, height: 36, borderRadius: '50%',
    border: `1px solid ${colors.border}`, padding: 0, overflow: 'hidden',
    cursor: 'pointer', background: colors.surface,
  },
  avatar: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarFallback: {
    width: '100%', height: '100%', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: colors.surface, color: colors.text, fontSize: 14, fontWeight: 600,
  },
  dropdown: {
    position: 'absolute', top: 48, right: 0,
    background: colors.surface, border: `1px solid ${colors.border}`,
    borderRadius: 10, minWidth: 220,
    boxShadow: '0 10px 30px rgba(0,0,0,0.6)', zIndex: 50,
  },
  dropdownHeader: { padding: '14px 16px', borderBottom: `1px solid ${colors.border}` },
  dropdownName: { fontSize: 14, fontWeight: 600 },
  dropdownEmail: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  dropdownItem: {
    width: '100%', padding: '12px 16px', background: 'transparent',
    border: 'none', color: colors.text, fontSize: 13, textAlign: 'left',
    cursor: 'pointer', fontFamily: fonts.body,
  },

  alertBanner: {
    background: colors.surface, border: `1px solid ${colors.border}`,
    borderLeft: `3px solid ${colors.amber}`, borderRadius: 10,
    padding: '20px 24px', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center', marginBottom: 24,
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  },
  alertLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: colors.amber, marginBottom: 6 },
  alertTitle: { fontSize: 18, fontWeight: 600, color: colors.text, marginBottom: 4 },
  alertSub: { fontSize: 13, color: colors.textSecondary },
  alertNumber: { textAlign: 'right' },
  alertAmount: { fontFamily: fonts.display, fontSize: 36, fontWeight: 600, color: colors.amber, lineHeight: 1 },
  alertNumberSub: { fontSize: 11, color: colors.textTertiary, marginTop: 4 },

  metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 },
  metricCard: {
    background: colors.surface, border: `1px solid ${colors.border}`,
    borderRadius: 10, padding: '18px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  metricLabel: { fontSize: 10, color: colors.textTertiary, letterSpacing: '0.1em', marginBottom: 8, fontWeight: 600 },
  metricValue: { fontFamily: fonts.display, fontSize: 32, fontWeight: 500, lineHeight: 1, marginBottom: 6, letterSpacing: '-0.02em' },
  metricSub: { fontSize: 11, color: colors.textTertiary },

  chartCard: {
    background: colors.surface, border: `1px solid ${colors.border}`,
    borderRadius: 10, padding: '20px 24px', marginBottom: 32,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  chartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  chartTitle: { fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 4 },
  chartSub: { fontSize: 11, color: colors.textTertiary },
  chartLegend: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: colors.textSecondary },
  legendDot: { width: 8, height: 8, background: colors.red, borderRadius: '50%' },
  chartContainer: { position: 'relative' },
  chartXAxis: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 10, color: colors.textTertiary, marginTop: 8, fontFamily: fonts.mono,
  },

  campaignsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  campaignsTitle: { fontSize: 18, fontWeight: 600 },
  campaignsCount: { fontWeight: 400, color: colors.textTertiary, fontSize: 14, marginLeft: 8 },
  filterTabs: {
    display: 'flex', gap: 4, background: colors.surface,
    border: `1px solid ${colors.border}`, borderRadius: 8, padding: 3,
  },
  filterTab: {
    background: 'transparent', border: 'none', padding: '6px 14px',
    fontSize: 12, fontWeight: 500, color: colors.textSecondary,
    borderRadius: 5, cursor: 'pointer', fontFamily: fonts.body,
  },
  filterTabActive: { background: colors.amber, color: '#0A0B0E' },

  campaignTable: {
    background: colors.surface, border: `1px solid ${colors.border}`,
    borderRadius: 10, overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  tableHeader: {
    display: 'flex', alignItems: 'center', padding: '14px 20px',
    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
    color: colors.textTertiary, borderBottom: `1px solid ${colors.border}`, gap: 16,
    background: colors.bgSecondary,
  },
  campaignRow: {
    display: 'flex', alignItems: 'center', padding: '16px 20px',
    borderBottom: `1px solid ${colors.border}`, gap: 16, fontSize: 13,
  },
  cName: { fontSize: 14, fontWeight: 500, color: colors.text, marginBottom: 4 },
  cMeta: { fontSize: 11, color: colors.textTertiary, display: 'flex', gap: 6, alignItems: 'center' },
  cMetaDivider: { color: colors.border },
  healthTag: { fontSize: 10, fontWeight: 600, letterSpacing: '0.05em' },
  actionTag: {
    display: 'inline-block', fontSize: 10, fontWeight: 700,
    padding: '5px 10px', borderRadius: 4, letterSpacing: '0.05em', textTransform: 'uppercase',
  },
  emptyState: { padding: '60px 20px', textAlign: 'center', color: colors.textTertiary, fontSize: 14 },
}
