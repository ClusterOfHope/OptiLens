'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useViewport } from '@/lib/useViewport'

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
  const vp = useViewport()
  const isMobile = vp === 'mobile'
  const isTablet = vp === 'tablet'

  const [user, setUser] = useState<User | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filter, setFilter] = useState<'all' | 'flagged' | 'healthy'>('all')
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [trendData, setTrendData] = useState<number[]>([])

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d?.user) { router.push('/'); return }
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
    } catch { setSyncMessage('Network error during sync') }
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
  const wasteSpend = campaigns.filter((c) => c.health === 'critical' || c.health === 'warning').reduce((s, c) => s + (c.spend || 0), 0)
  const wastePercent = totalSpend > 0 ? Math.round((wasteSpend / totalSpend) * 100) : 0
  const flaggedCount = campaigns.filter((c) => c.health !== 'healthy').length

  const filteredCampaigns = campaigns.filter((c) => {
    if (filter === 'flagged') return c.health !== 'healthy'
    if (filter === 'healthy') return c.health === 'healthy'
    return true
  })

  if (!user) {
    return <div style={S.loadingPage}><div style={S.loadingText}>Loading your dashboard...</div></div>
  }

  const sidebar = (
    <aside style={{
      ...S.sidebar,
      ...(isMobile ? S.sidebarMobile : {}),
      ...(isMobile && !showSidebar ? { transform: 'translateX(-100%)' } : {}),
    }}>
      <div style={S.sidebarTop}>
        <div style={S.logo}>
          <span style={S.logoOpti}>Opti</span>
          <span style={S.logoLens}>Lens</span>
        </div>
        <div style={S.tagline}>Ad spend intelligence</div>
      </div>
      <div style={S.menu}>
        <div style={S.menuLabel}>MENU</div>
        <a style={{ ...S.menuItem, ...S.menuItemActive }}>Dashboard</a>
        <a style={S.menuItem}>Campaigns</a>
        <a style={S.menuItem}>History</a>
        <a style={S.menuItem}>Meta Ads</a>
        <a style={S.menuItem}>Shopify</a>
      </div>
      <div style={S.sidebarBottom}>
        <div style={S.betaBadge}>
          <span style={S.betaDot} />
          BETA · Free for life
        </div>
      </div>
    </aside>
  )

  return (
    <div style={{ ...S.page, gridTemplateColumns: isMobile ? '1fr' : '240px 1fr' }}>
      {!isMobile && sidebar}
      {isMobile && showSidebar && (
        <>
          <div onClick={() => setShowSidebar(false)} style={S.overlay} />
          {sidebar}
        </>
      )}

      <main style={{ ...S.main, padding: isMobile ? '16px 16px 60px' : '32px 40px 80px' }}>
        {/* TOP BAR */}
        <div style={{
          ...S.topbar,
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? 16 : 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <button onClick={() => setShowSidebar(true)} style={S.hamburger}>
                <span style={S.hamburgerLine} />
                <span style={S.hamburgerLine} />
                <span style={S.hamburgerLine} />
              </button>
            )}
            <div>
              <h1 style={{ ...S.title, fontSize: isMobile ? 26 : 36 }}>Dashboard</h1>
              <div style={S.subtitle}>Live · synced from Meta Ads</div>
            </div>
          </div>
          <div style={{
            ...S.topActions,
            justifyContent: isMobile ? 'space-between' : 'flex-end',
          }}>
            {syncMessage && !isMobile && <div style={S.syncMessage}>{syncMessage}</div>}
            <button onClick={handleSync} disabled={syncing} style={S.syncBtn}>
              {syncing ? 'Syncing...' : 'Sync now'}
            </button>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowMenu(!showMenu)} style={S.avatarBtn}>
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar_url} alt={user.name} style={S.avatar} />
                ) : (
                  <div style={S.avatarFallback}>{user.name?.[0] || '?'}</div>
                )}
              </button>
              {showMenu && (
                <div style={S.dropdown}>
                  <div style={S.dropdownHeader}>
                    <div style={S.dropdownName}>{user.name}</div>
                    <div style={S.dropdownEmail}>{user.email || 'No email on file'}</div>
                  </div>
                  <button onClick={handleLogout} style={S.dropdownItem}>Sign out</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {syncMessage && isMobile && <div style={{ ...S.syncMessage, marginBottom: 16 }}>{syncMessage}</div>}

        {/* ALERT BANNER */}
        {flaggedCount > 0 && (
          <div style={{
            ...S.alertBanner,
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? 12 : 0,
          }}>
            <div>
              <div style={S.alertLabel}>ACTION REQUIRED</div>
              <div style={{ ...S.alertTitle, fontSize: isMobile ? 15 : 18 }}>
                {flaggedCount} campaigns burning money
              </div>
              <div style={S.alertSub}>Pause these immediately to stop the bleed</div>
            </div>
            <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
              <div style={{ ...S.alertAmount, fontSize: isMobile ? 28 : 36 }}>${Math.round(wasteSpend).toLocaleString()}</div>
              <div style={S.alertNumberSub}>wasted this month</div>
            </div>
          </div>
        )}

        {/* METRICS */}
        <div style={{
          ...S.metricsRow,
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? 8 : 12,
        }}>
          <Metric label="TOTAL SPEND" value={`$${Math.round(totalSpend).toLocaleString()}`} sub="Last 30 days" mobile={isMobile} />
          <Metric label="REVENUE" value={`$${Math.round(totalRevenue).toLocaleString()}`} sub="Meta attributed" tone="green" mobile={isMobile} />
          <Metric label="BLENDED ROAS" value={`${blendedRoas.toFixed(2)}x`} sub="Target: 2.0x+" tone={blendedRoas >= 2 ? 'green' : 'amber'} mobile={isMobile} />
          <Metric label="BUDGET WASTED" value={`${wastePercent}%`} sub={`$${Math.round(wasteSpend).toLocaleString()} lost`} tone={wastePercent > 30 ? 'red' : 'amber'} mobile={isMobile} />
        </div>

        {/* CHART */}
        <div style={{ ...S.chartCard, padding: isMobile ? '16px 18px' : '20px 24px' }}>
          <div style={S.chartHeader}>
            <div>
              <div style={S.chartTitle}>30-day waste trend</div>
              {!isMobile && <div style={S.chartSub}>Daily spend on flagged campaigns · ↓ Goal: keep this flat</div>}
            </div>
            <div style={S.chartLegend}>
              <span style={S.legendDot} />
              {!isMobile && <span>Wasted spend</span>}
            </div>
          </div>
          <TrendChart data={trendData.length ? trendData : DEMO_TREND} />
        </div>

        {/* CAMPAIGNS HEADER */}
        <div style={{
          ...S.campaignsHeader,
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? 12 : 0,
        }}>
          <h2 style={S.campaignsTitle}>
            Campaign performance <span style={S.campaignsCount}>{campaigns.length}</span>
          </h2>
          <div style={S.filterTabs}>
            <button onClick={() => setFilter('all')} style={{ ...S.filterTab, ...(filter === 'all' ? S.filterTabActive : {}) }}>All</button>
            <button onClick={() => setFilter('flagged')} style={{ ...S.filterTab, ...(filter === 'flagged' ? S.filterTabActive : {}) }}>Flagged</button>
            <button onClick={() => setFilter('healthy')} style={{ ...S.filterTab, ...(filter === 'healthy' ? S.filterTabActive : {}) }}>Healthy</button>
          </div>
        </div>

        {/* CAMPAIGNS — different layouts mobile vs desktop */}
        <div style={S.campaignTable}>
          {!isMobile && (
            <div style={S.tableHeader}>
              <div style={{ flex: 2 }}>CAMPAIGN</div>
              <div style={{ width: 90, textAlign: 'right' }}>SPEND</div>
              <div style={{ width: 90, textAlign: 'right' }}>REVENUE</div>
              <div style={{ width: 70, textAlign: 'right' }}>ROAS</div>
              <div style={{ width: 90, textAlign: 'center' }}>WASTE</div>
              <div style={{ width: 110, textAlign: 'center' }}>HEALTH</div>
              <div style={{ width: 110, textAlign: 'right' }}>ACTION</div>
            </div>
          )}
          {filteredCampaigns.length === 0 ? (
            <div style={S.emptyState}>No campaigns match this filter.</div>
          ) : isMobile ? (
            filteredCampaigns.map((c) => <CampaignCardMobile key={c.id} campaign={c} />)
          ) : (
            filteredCampaigns.map((c) => <CampaignRow key={c.id} campaign={c} />)
          )}
        </div>
      </main>
    </div>
  )
}

function Metric({ label, value, sub, tone, mobile }: { label: string; value: string; sub: string; tone?: string; mobile?: boolean }) {
  const valueColor = tone === 'green' ? '#34D399' : tone === 'amber' ? '#FBBF24' : tone === 'red' ? '#F87171' : '#fff'
  return (
    <div style={S.metricCard}>
      <div style={S.metricLabel}>{label}</div>
      <div style={{ ...S.metricValue, color: valueColor, fontSize: mobile ? 22 : 32 }}>{value}</div>
      <div style={S.metricSub}>{sub}</div>
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
    <div style={{ ...S.campaignRow, borderLeft: `3px solid ${barColor}` }}>
      <div style={{ flex: 2, minWidth: 0 }}>
        <div style={S.cName}>{c.name}</div>
        <div style={S.cMeta}>
          <span>{c.objective}</span>
          <span style={S.cMetaDivider}>·</span>
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
        <span style={{ ...S.healthTag, color: barColor }}>{c.recommendation || '—'}</span>
      </div>
      <div style={{ width: 110, textAlign: 'right' }}>
        <span style={{ ...S.actionTag, ...actionStyle }}>{action}</span>
      </div>
    </div>
  )
}

function CampaignCardMobile({ campaign: c }: { campaign: Campaign }) {
  const barColor = c.health === 'critical' ? '#F87171' : c.health === 'warning' ? '#FBBF24' : '#34D399'
  const actionStyle =
    c.health === 'critical' ? { background: 'rgba(248,113,113,0.18)', color: '#F87171' } :
    c.health === 'warning' ? { background: 'rgba(251,191,36,0.18)', color: '#FBBF24' } :
    { background: 'rgba(52,211,153,0.18)', color: '#34D399' }
  const action = c.health === 'critical' ? 'Pause now' : c.health === 'warning' ? 'Pause now' : 'Scale up'
  const roasColor = c.roas >= 2 ? '#34D399' : c.roas >= 1 ? '#FBBF24' : '#F87171'

  return (
    <div style={{ ...S.campaignCardMobile, borderLeft: `3px solid ${barColor}` }}>
      <div style={S.cardMobileTop}>
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
      <div style={S.cardMobileMetrics}>
        <div style={S.cardMobileMetric}>
          <div style={S.cardMobileLabel}>SPEND</div>
          <div style={S.cardMobileValue}>${Math.round(c.spend).toLocaleString()}</div>
        </div>
        <div style={S.cardMobileMetric}>
          <div style={S.cardMobileLabel}>REVENUE</div>
          <div style={{ ...S.cardMobileValue, color: c.revenue === 0 ? '#F87171' : '#fff' }}>${Math.round(c.revenue).toLocaleString()}</div>
        </div>
        <div style={S.cardMobileMetric}>
          <div style={S.cardMobileLabel}>ROAS</div>
          <div style={{ ...S.cardMobileValue, color: roasColor }}>{c.roas.toFixed(2)}x</div>
        </div>
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
    <div style={S.chartContainer}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: 140, display: 'block' }}>
        <polyline points={fillPoints} fill="rgba(248,113,113,0.12)" stroke="none" />
        <polyline points={points} fill="none" stroke="#F87171" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div style={S.chartXAxis}>
        <span>30 days ago</span>
        <span>15 days</span>
        <span>Today</span>
      </div>
    </div>
  )
}

const DEMO_TREND = [120, 150, 180, 220, 260, 300, 340, 290, 250, 280, 310, 350, 410, 470, 520, 480, 440, 460, 510, 560, 600, 580, 540, 590, 640, 690, 720, 680, 640, 620]

const C = {
  bg: '#0A0B0E', bgSecondary: '#101218',
  surface: '#1A1D24', surfaceLight: '#22262F',
  border: '#2D3340',
  text: '#FFFFFF', textSecondary: '#A0A8B5', textTertiary: '#6B7280',
  primary: '#FFFFFF', green: '#34D399', amber: '#FBBF24', red: '#F87171',
}

const F = {
  display: '"Fraunces", Georgia, serif',
  body: '"Inter", -apple-system, system-ui, sans-serif',
  mono: '"JetBrains Mono", Menlo, monospace',
}

const S: Record<string, React.CSSProperties> = {
  loadingPage: {
    background: C.bg, color: C.textSecondary, minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.body,
  },
  loadingText: { fontSize: 14, fontFamily: F.mono },

  page: {
    display: 'grid',
    background: C.bg, color: C.text, fontFamily: F.body,
    minHeight: '100vh', position: 'relative',
  },

  sidebar: {
    background: C.bgSecondary,
    borderRight: `1px solid ${C.border}`,
    padding: '28px 20px', display: 'flex', flexDirection: 'column',
    position: 'relative', zIndex: 2,
  },
  sidebarMobile: {
    position: 'fixed', top: 0, left: 0, bottom: 0,
    width: 240, zIndex: 200,
    transition: 'transform 0.3s ease',
    boxShadow: '8px 0 24px rgba(0,0,0,0.5)',
  },
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 199,
  },
  sidebarTop: { marginBottom: 40 },
  logo: { fontFamily: F.display, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 },
  logoOpti: { color: C.text },
  logoLens: { color: C.amber },
  tagline: { fontSize: 11, color: C.textTertiary, letterSpacing: '0.02em' },
  menu: { flex: 1 },
  menuLabel: {
    fontSize: 10, fontWeight: 600, color: C.textTertiary,
    letterSpacing: '0.15em', marginBottom: 12, paddingLeft: 12,
  },
  menuItem: {
    display: 'block', padding: '10px 12px', color: C.textSecondary,
    fontSize: 14, fontWeight: 500, borderRadius: 6, cursor: 'pointer', marginBottom: 2,
  },
  menuItemActive: { background: C.surface, color: C.amber },
  sidebarBottom: { marginTop: 'auto' },
  betaBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '8px 12px', background: 'rgba(251,191,36,0.1)',
    border: `1px solid rgba(251,191,36,0.3)`, borderRadius: 100,
    fontSize: 11, fontWeight: 600, color: C.amber, letterSpacing: '0.02em',
  },
  betaDot: { width: 6, height: 6, background: C.amber, borderRadius: '50%', boxShadow: `0 0 8px ${C.amber}` },

  main: { position: 'relative', zIndex: 2, overflow: 'auto' },
  topbar: { display: 'flex', justifyContent: 'space-between', marginBottom: 24 },

  hamburger: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    width: 40, height: 40,
    padding: 0,
    display: 'flex', flexDirection: 'column',
    justifyContent: 'center', alignItems: 'center',
    gap: 4, cursor: 'pointer',
  },
  hamburgerLine: {
    width: 18, height: 2, background: C.text, borderRadius: 1,
  },

  title: { fontFamily: F.display, fontWeight: 500, letterSpacing: '-0.02em', color: C.text },
  subtitle: { fontSize: 12, color: C.textTertiary, marginTop: 4 },
  topActions: { display: 'flex', alignItems: 'center', gap: 12 },
  syncMessage: { fontSize: 12, color: C.textSecondary, fontFamily: F.mono },
  syncBtn: {
    background: C.primary, color: '#0A0B0E', border: 'none',
    padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: F.body,
    boxShadow: '0 4px 12px rgba(255,255,255,0.1)',
  },
  avatarBtn: {
    width: 36, height: 36, borderRadius: '50%',
    border: `1px solid ${C.border}`, padding: 0, overflow: 'hidden',
    cursor: 'pointer', background: C.surface,
  },
  avatar: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarFallback: {
    width: '100%', height: '100%', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: C.surface, color: C.text, fontSize: 14, fontWeight: 600,
  },
  dropdown: {
    position: 'absolute', top: 48, right: 0,
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 10, minWidth: 220,
    boxShadow: '0 10px 30px rgba(0,0,0,0.6)', zIndex: 50,
  },
  dropdownHeader: { padding: '14px 16px', borderBottom: `1px solid ${C.border}` },
  dropdownName: { fontSize: 14, fontWeight: 600 },
  dropdownEmail: { fontSize: 12, color: C.textTertiary, marginTop: 2 },
  dropdownItem: {
    width: '100%', padding: '12px 16px', background: 'transparent',
    border: 'none', color: C.text, fontSize: 13, textAlign: 'left',
    cursor: 'pointer', fontFamily: F.body,
  },

  alertBanner: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderLeft: `3px solid ${C.amber}`, borderRadius: 10,
    padding: '20px 24px', display: 'flex',
    justifyContent: 'space-between', marginBottom: 24,
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  },
  alertLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: C.amber, marginBottom: 6 },
  alertTitle: { fontWeight: 600, color: C.text, marginBottom: 4 },
  alertSub: { fontSize: 13, color: C.textSecondary },
  alertAmount: { fontFamily: F.display, fontWeight: 600, color: C.amber, lineHeight: 1 },
  alertNumberSub: { fontSize: 11, color: C.textTertiary, marginTop: 4 },

  metricsRow: { display: 'grid', marginBottom: 24 },
  metricCard: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: '16px 18px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  metricLabel: { fontSize: 10, color: C.textTertiary, letterSpacing: '0.1em', marginBottom: 8, fontWeight: 600 },
  metricValue: { fontFamily: F.display, fontWeight: 500, lineHeight: 1, marginBottom: 6, letterSpacing: '-0.02em' },
  metricSub: { fontSize: 11, color: C.textTertiary },

  chartCard: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 10, marginBottom: 28,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  chartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  chartTitle: { fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 },
  chartSub: { fontSize: 11, color: C.textTertiary },
  chartLegend: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.textSecondary },
  legendDot: { width: 8, height: 8, background: C.red, borderRadius: '50%' },
  chartContainer: { position: 'relative' },
  chartXAxis: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 10, color: C.textTertiary, marginTop: 8, fontFamily: F.mono,
  },

  campaignsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  campaignsTitle: { fontSize: 18, fontWeight: 600 },
  campaignsCount: { fontWeight: 400, color: C.textTertiary, fontSize: 14, marginLeft: 8 },
  filterTabs: {
    display: 'flex', gap: 4, background: C.surface,
    border: `1px solid ${C.border}`, borderRadius: 8, padding: 3,
  },
  filterTab: {
    background: 'transparent', border: 'none', padding: '6px 14px',
    fontSize: 12, fontWeight: 500, color: C.textSecondary,
    borderRadius: 5, cursor: 'pointer', fontFamily: F.body,
  },
  filterTabActive: { background: C.amber, color: '#0A0B0E' },

  campaignTable: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 10, overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  tableHeader: {
    display: 'flex', alignItems: 'center', padding: '14px 20px',
    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
    color: C.textTertiary, borderBottom: `1px solid ${C.border}`, gap: 16,
    background: C.bgSecondary,
  },
  campaignRow: {
    display: 'flex', alignItems: 'center', padding: '16px 20px',
    borderBottom: `1px solid ${C.border}`, gap: 16, fontSize: 13,
  },
  cName: { fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 4 },
  cMeta: { fontSize: 11, color: C.textTertiary, display: 'flex', gap: 6, alignItems: 'center' },
  cMetaDivider: { color: C.border },
  healthTag: { fontSize: 10, fontWeight: 600, letterSpacing: '0.05em' },
  actionTag: {
    display: 'inline-block', fontSize: 10, fontWeight: 700,
    padding: '5px 10px', borderRadius: 4, letterSpacing: '0.05em', textTransform: 'uppercase',
  },
  emptyState: { padding: '60px 20px', textAlign: 'center', color: C.textTertiary, fontSize: 14 },

  /* Mobile campaign cards */
  campaignCardMobile: {
    padding: '14px 16px',
    borderBottom: `1px solid ${C.border}`,
  },
  cardMobileTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardMobileMetrics: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
  },
  cardMobileMetric: {
    background: C.surfaceLight,
    border: `1px solid ${C.border}`,
    borderRadius: 6, padding: '8px 10px',
  },
  cardMobileLabel: { fontSize: 9, color: C.textTertiary, letterSpacing: '0.1em', marginBottom: 4, fontWeight: 600 },
  cardMobileValue: { fontFamily: F.display, fontSize: 16, fontWeight: 500, color: C.text },
}
