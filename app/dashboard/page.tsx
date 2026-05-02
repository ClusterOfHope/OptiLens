'use client'

import { useState, useEffect } from 'react'
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

export default function Dashboard() {
  const vp = useViewport()
  const isMobile = vp === 'mobile'
  const isTablet = vp === 'tablet'

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filter, setFilter] = useState<'all' | 'flagged' | 'healthy'>('all')
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [trendData, setTrendData] = useState<number[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)

  // Handle post-auth redirect intents (e.g. user came from "Start trial" button)
  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )optilens_post_auth_intent=([^;]+)/)
    const intent = match ? match[1] : null

    if (intent === 'checkout') {
      // Clear the cookie immediately
      document.cookie = 'optilens_post_auth_intent=; path=/; max-age=0; SameSite=Lax'

      // Redirect to Stripe checkout
      ;(async () => {
        try {
          const res = await fetch('/api/billing/checkout', { method: 'POST' })
          const data = await res.json()
          if (data.url) {
            window.location.href = data.url
          } else if (data.redirect) {
            window.location.href = data.redirect
          }
        } catch {
          // Network error - stay on dashboard silently
        }
      })()
    }
  }, [])
  
  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.campaigns) setCampaigns(d.campaigns)
        if (d.trend) setTrendData(d.trend)
        setHasLoaded(true)
      })
      .catch(() => setHasLoaded(true))
  }, [])

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
    } catch { setSyncMessage('Network error') }
    setSyncing(false)
    setTimeout(() => setSyncMessage(''), 4000)
  }

  const totalSpend = campaigns.reduce((s, c) => s + (c.spend || 0), 0)
  const totalRevenue = campaigns.reduce((s, c) => s + (c.revenue || 0), 0)
  const blendedRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const wasteSpend = campaigns.filter((c) => c.health === 'critical' || c.health === 'warning').reduce((s, c) => s + (c.spend || 0), 0)
  const wastePercent = totalSpend > 0 ? Math.round((wasteSpend / totalSpend) * 100) : 0
  const flaggedCount = campaigns.filter((c) => c.health !== 'healthy').length

  // Detect whether we have ANY meaningful data
  const hasData = campaigns.length > 0 && totalSpend > 0
  const hasTrendData = trendData.length > 0 && trendData.some((v) => v > 0)

  const filteredCampaigns = campaigns.filter((c) => {
    if (filter === 'flagged') return c.health !== 'healthy'
    if (filter === 'healthy') return c.health === 'healthy'
    return true
  })

  const rightActions = (
    <>
      {syncMessage && !isMobile && <div style={S.syncMessage}>{syncMessage}</div>}
      <button onClick={handleSync} disabled={syncing} style={S.syncBtn}>
        {syncing ? 'Syncing...' : 'Sync now'}
      </button>
    </>
  )

  return (
    <DashboardLayout pageTitle="Dashboard" pageSubtitle="Live · synced from Meta Ads" rightActions={rightActions}>
      {syncMessage && isMobile && <div style={{ ...S.syncMessage, marginBottom: 16 }}>{syncMessage}</div>}

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

      <div style={{
        ...S.metricsRow,
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
      }}>
        <Metric label="TOTAL SPEND" value={hasData ? `$${Math.round(totalSpend).toLocaleString()}` : '—'} sub={hasData ? 'Last 30 days' : 'No data yet'} mobile={isMobile} />
        <Metric label="REVENUE" value={hasData ? `$${Math.round(totalRevenue).toLocaleString()}` : '—'} sub={hasData ? 'Meta attributed' : 'No data yet'} tone={hasData ? 'green' : undefined} mobile={isMobile} />
        <Metric label="BLENDED ROAS" value={hasData ? `${blendedRoas.toFixed(2)}x` : '—'} sub={hasData ? 'Target: 2.0x+' : 'No data yet'} tone={hasData ? (blendedRoas >= 2 ? 'green' : 'amber') : undefined} mobile={isMobile} />
        <Metric label="BUDGET WASTED" value={hasData ? `${wastePercent}%` : '—'} sub={hasData ? `$${Math.round(wasteSpend).toLocaleString()} lost` : 'No data yet'} tone={hasData ? (wastePercent > 30 ? 'red' : 'amber') : undefined} mobile={isMobile} />
      </div>

      <div style={S.chartCard}>
        <div style={S.chartHeader}>
          <div>
            <div style={S.chartTitle}>30-day waste trend</div>
            {!isMobile && <div style={S.chartSub}>Daily spend on flagged campaigns</div>}
          </div>
          {hasTrendData && (
            <div style={S.chartLegend}>
              <span style={S.legendDot} />
              {!isMobile && <span>Wasted spend</span>}
            </div>
          )}
        </div>
        {hasTrendData ? (
          <TrendChart data={trendData} />
        ) : (
          <EmptyChart />
        )}
      </div>

      <div style={{
        ...S.campaignsHeader,
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? 12 : 0,
      }}>
        <h2 style={S.campaignsTitle}>
          Recent campaigns <span style={S.campaignsCount}>{campaigns.length}</span>
        </h2>
        <div style={S.filterTabs}>
          <button onClick={() => setFilter('all')} style={{ ...S.filterTab, ...(filter === 'all' ? S.filterTabActive : {}) }}>All</button>
          <button onClick={() => setFilter('flagged')} style={{ ...S.filterTab, ...(filter === 'flagged' ? S.filterTabActive : {}) }}>Flagged</button>
          <button onClick={() => setFilter('healthy')} style={{ ...S.filterTab, ...(filter === 'healthy' ? S.filterTabActive : {}) }}>Healthy</button>
        </div>
      </div>

      <div style={S.campaignTable}>
        {!isMobile && (
          <div style={S.tableHeader}>
            <div style={{ flex: 2 }}>CAMPAIGN</div>
            <div style={{ width: 90, textAlign: 'right' }}>SPEND</div>
            <div style={{ width: 90, textAlign: 'right' }}>REVENUE</div>
            <div style={{ width: 70, textAlign: 'right' }}>ROAS</div>
            <div style={{ width: 90, textAlign: 'center' }}>WASTE</div>
            <div style={{ width: 110, textAlign: 'right' }}>ACTION</div>
          </div>
        )}
        {filteredCampaigns.length === 0 ? (
          <div style={S.emptyState}>No campaigns yet — click Sync now to fetch from Meta.</div>
        ) : isMobile ? (
          filteredCampaigns.map((c) => <CampaignCardMobile key={c.id} campaign={c} />)
        ) : (
          filteredCampaigns.map((c) => <CampaignRow key={c.id} campaign={c} />)
        )}
      </div>
    </DashboardLayout>
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
    <a href={`/campaigns/${c.id}`} style={{ ...S.campaignRow, borderLeft: `3px solid ${barColor}`, textDecoration: 'none', color: 'inherit' }}>
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
      <div style={{ width: 110, textAlign: 'right' }}>
        <span style={{ ...S.actionTag, ...actionStyle }}>{action}</span>
      </div>
    </a>
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
    <a href={`/campaigns/${c.id}`} style={{ ...S.campaignCardMobile, borderLeft: `3px solid ${barColor}`, textDecoration: 'none', color: 'inherit' }}>
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
    </a>
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

function EmptyChart() {
  return (
    <div style={S.chartContainer}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: 140, display: 'block' }}>
        {/* Flat dotted baseline */}
        <line
          x1="0" y1="60" x2="100" y2="60"
          stroke="#2D3340"
          strokeWidth="0.5"
          strokeDasharray="2,2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div style={S.emptyChartOverlay}>
        <div style={S.emptyChartText}>Chart will populate after your first sync</div>
      </div>
      <div style={S.chartXAxis}>
        <span>30 days ago</span>
        <span>15 days</span>
        <span>Today</span>
      </div>
    </div>
  )
}

const C = {
  bg: '#0A0B0E', surface: '#1A1D24', surfaceLight: '#22262F',
  border: '#2D3340', text: '#FFFFFF',
  textSecondary: '#A0A8B5', textTertiary: '#6B7280',
  amber: '#FBBF24', green: '#34D399', red: '#F87171',
}
const F = { display: '"Fraunces", Georgia, serif', body: '"Inter", -apple-system, system-ui, sans-serif', mono: '"JetBrains Mono", Menlo, monospace' }

const S: Record<string, React.CSSProperties> = {
  syncMessage: { fontSize: 12, color: C.textSecondary, fontFamily: F.mono },
  syncBtn: { background: '#FFFFFF', color: '#0A0B0E', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F.body, boxShadow: '0 4px 12px rgba(255,255,255,0.1)' },
  alertBanner: { background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.amber}`, borderRadius: 10, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' },
  alertLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: C.amber, marginBottom: 6 },
  alertTitle: { fontWeight: 600, color: C.text, marginBottom: 4 },
  alertSub: { fontSize: 13, color: C.textSecondary },
  alertAmount: { fontFamily: F.display, fontWeight: 600, color: C.amber, lineHeight: 1 },
  alertNumberSub: { fontSize: 11, color: C.textTertiary, marginTop: 4 },
  metricsRow: { display: 'grid', gap: 12, marginBottom: 24 },
  metricCard: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' },
  metricLabel: { fontSize: 10, color: C.textTertiary, letterSpacing: '0.1em', marginBottom: 8, fontWeight: 600 },
  metricValue: { fontFamily: F.display, fontWeight: 500, lineHeight: 1, marginBottom: 6, letterSpacing: '-0.02em' },
  metricSub: { fontSize: 11, color: C.textTertiary },
  chartCard: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 24px', marginBottom: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' },
  chartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  chartTitle: { fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 },
  chartSub: { fontSize: 11, color: C.textTertiary },
  chartLegend: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.textSecondary },
  legendDot: { width: 8, height: 8, background: C.red, borderRadius: '50%' },
  chartContainer: { position: 'relative' },
  chartXAxis: { display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.textTertiary, marginTop: 8, fontFamily: F.mono },
  emptyChartOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'none',
  },
  emptyChartText: {
    fontSize: 12,
    color: C.textTertiary,
    fontFamily: F.mono,
    letterSpacing: '0.02em',
    background: 'rgba(26,29,36,0.7)',
    padding: '6px 14px',
    borderRadius: 6,
    border: `1px solid ${C.border}`,
  },
  campaignsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  campaignsTitle: { fontSize: 18, fontWeight: 600 },
  campaignsCount: { fontWeight: 400, color: C.textTertiary, fontSize: 14, marginLeft: 8 },
  filterTabs: { display: 'flex', gap: 4, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 3 },
  filterTab: { background: 'transparent', border: 'none', padding: '6px 14px', fontSize: 12, fontWeight: 500, color: C.textSecondary, borderRadius: 5, cursor: 'pointer', fontFamily: F.body },
  filterTabActive: { background: C.amber, color: '#0A0B0E' },
  campaignTable: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' },
  tableHeader: { display: 'flex', alignItems: 'center', padding: '14px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: C.textTertiary, borderBottom: `1px solid ${C.border}`, gap: 16, background: '#101218' },
  campaignRow: { display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${C.border}`, gap: 16, fontSize: 13 },
  cName: { fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 4 },
  cMeta: { fontSize: 11, color: C.textTertiary, display: 'flex', gap: 6, alignItems: 'center' },
  cMetaDivider: { color: C.border },
  actionTag: { display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '5px 10px', borderRadius: 4, letterSpacing: '0.05em', textTransform: 'uppercase' },
  emptyState: { padding: '60px 20px', textAlign: 'center', color: C.textTertiary, fontSize: 14 },
  campaignCardMobile: { padding: '14px 16px', borderBottom: `1px solid ${C.border}` },
  cardMobileTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  cardMobileMetrics: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  cardMobileMetric: { background: C.surfaceLight, border: `1px solid ${C.border}`, borderRadius: 6, padding: '8px 10px' },
  cardMobileLabel: { fontSize: 9, color: C.textTertiary, letterSpacing: '0.1em', marginBottom: 4, fontWeight: 600 },
  cardMobileValue: { fontFamily: F.display, fontSize: 16, fontWeight: 500, color: C.text },
}
