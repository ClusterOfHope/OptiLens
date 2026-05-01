'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/lib/DashboardLayout'

type CampaignDetail = {
  id: string
  name: string
  objective: string
  status: string
  daily_budget: number | null
  metrics: Array<{
    date: string
    spend: number
    impressions: number
    clicks: number
    ctr: number
    cpm: number
    purchases: number
    purchase_value: number
    roas: number
    frequency: number
  }>
  flags: Array<{
    id: string
    rule_id: string
    severity: string
    message: string
    detected_at: string
    is_active: boolean
  }>
}

export default function CampaignDetailPage() {
  const router = useRouter()
  const params = useParams()
  const campaignId = params.id as string

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then((d) => {
        if (d?.campaign) setCampaign(d.campaign)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [campaignId])

  if (loading) {
    return (
      <DashboardLayout pageTitle="Campaign details" pageSubtitle="Loading...">
        <div style={S.loading}>Loading campaign...</div>
      </DashboardLayout>
    )
  }

  if (notFound || !campaign) {
    return (
      <DashboardLayout pageTitle="Campaign details" pageSubtitle="Not found">
        <div style={S.empty}>
          <p>This campaign couldn&apos;t be found.</p>
          <Link href="/campaigns" style={S.backLink}>← Back to campaigns</Link>
        </div>
      </DashboardLayout>
    )
  }

  // Aggregate metrics
  const totalSpend = campaign.metrics.reduce((s, m) => s + m.spend, 0)
  const totalRevenue = campaign.metrics.reduce((s, m) => s + m.purchase_value, 0)
  const totalPurchases = campaign.metrics.reduce((s, m) => s + m.purchases, 0)
  const totalClicks = campaign.metrics.reduce((s, m) => s + m.clicks, 0)
  const totalImpressions = campaign.metrics.reduce((s, m) => s + m.impressions, 0)
  const blendedRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const cpa = totalPurchases > 0 ? totalSpend / totalPurchases : 0

  return (
    <DashboardLayout pageTitle={campaign.name} pageSubtitle={`${campaign.objective} · ${campaign.status}`}>
      <div style={S.backRow}>
        <Link href="/campaigns" style={S.backLink}>← All campaigns</Link>
      </div>

      {/* Top metrics */}
      <div style={S.metricsGrid}>
        <Metric label="TOTAL SPEND" value={`$${Math.round(totalSpend).toLocaleString()}`} sub={`${campaign.metrics.length} days`} />
        <Metric label="REVENUE" value={`$${Math.round(totalRevenue).toLocaleString()}`} sub={`${totalPurchases} purchases`} tone="green" />
        <Metric label="ROAS" value={`${blendedRoas.toFixed(2)}x`} sub="Target: 2.0x+" tone={blendedRoas >= 2 ? 'green' : 'amber'} />
        <Metric label="CPA" value={`$${cpa > 0 ? cpa.toFixed(2) : '—'}`} sub="Cost per purchase" />
        <Metric label="CTR" value={`${avgCtr.toFixed(2)}%`} sub="Avg click rate" />
        <Metric label="DAILY BUDGET" value={campaign.daily_budget ? `$${campaign.daily_budget}` : '—'} sub="Set in Meta" />
      </div>

      {/* Daily spend chart */}
      <div style={S.card}>
        <div style={S.cardHeader}>
          <div>
            <div style={S.cardTitle}>Daily spend & revenue</div>
            <div style={S.cardSub}>Last {campaign.metrics.length} days</div>
          </div>
        </div>
        <DualLineChart metrics={campaign.metrics} />
      </div>

      {/* Active flags */}
      {campaign.flags.filter((f) => f.is_active).length > 0 && (
        <div style={{ ...S.card, borderLeft: `3px solid #FBBF24` }}>
          <div style={S.cardHeader}>
            <div>
              <div style={S.cardTitle}>Active flags</div>
              <div style={S.cardSub}>{campaign.flags.filter((f) => f.is_active).length} issues need attention</div>
            </div>
          </div>
          {campaign.flags.filter((f) => f.is_active).map((flag) => (
            <div key={flag.id} style={S.flagRow}>
              <div style={{
                ...S.flagSeverity,
                background: flag.severity === 'CRITICAL' ? 'rgba(248,113,113,0.18)' : 'rgba(251,191,36,0.18)',
                color: flag.severity === 'CRITICAL' ? '#F87171' : '#FBBF24',
              }}>
                {flag.severity}
              </div>
              <div style={S.flagBody}>
                <div style={S.flagMessage}>{flag.message}</div>
                <div style={S.flagMeta}>
                  Rule: {flag.rule_id} · Detected {new Date(flag.detected_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Daily metrics table */}
      <div style={S.card}>
        <div style={S.cardHeader}>
          <div style={S.cardTitle}>Daily breakdown</div>
        </div>
        <div style={S.metricsTable}>
          <div style={S.metricsTableHeader}>
            <div style={{ width: 90 }}>DATE</div>
            <div style={{ width: 80, textAlign: 'right' }}>SPEND</div>
            <div style={{ width: 80, textAlign: 'right' }}>REVENUE</div>
            <div style={{ width: 60, textAlign: 'right' }}>ROAS</div>
            <div style={{ width: 70, textAlign: 'right' }}>CLICKS</div>
            <div style={{ width: 60, textAlign: 'right' }}>CTR</div>
            <div style={{ width: 60, textAlign: 'right' }}>FREQ</div>
          </div>
          {[...campaign.metrics].reverse().slice(0, 30).map((m) => (
            <div key={m.date} style={S.metricsRow}>
              <div style={{ width: 90, fontWeight: 500 }}>{new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
              <div style={{ width: 80, textAlign: 'right' }}>${m.spend.toFixed(0)}</div>
              <div style={{ width: 80, textAlign: 'right', color: m.purchase_value === 0 ? '#F87171' : '#fff' }}>${m.purchase_value.toFixed(0)}</div>
              <div style={{ width: 60, textAlign: 'right', color: m.roas >= 2 ? '#34D399' : m.roas >= 1 ? '#FBBF24' : '#F87171' }}>{m.roas.toFixed(2)}x</div>
              <div style={{ width: 70, textAlign: 'right' }}>{m.clicks}</div>
              <div style={{ width: 60, textAlign: 'right' }}>{m.ctr.toFixed(2)}%</div>
              <div style={{ width: 60, textAlign: 'right' }}>{m.frequency.toFixed(1)}</div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: string }) {
  const valueColor = tone === 'green' ? '#34D399' : tone === 'amber' ? '#FBBF24' : tone === 'red' ? '#F87171' : '#fff'
  return (
    <div style={S.metricCard}>
      <div style={S.metricLabel}>{label}</div>
      <div style={{ ...S.metricValue, color: valueColor }}>{value}</div>
      <div style={S.metricSub}>{sub}</div>
    </div>
  )
}

function DualLineChart({ metrics }: { metrics: any[] }) {
  if (!metrics.length) return <div style={S.empty}>No metric data</div>
  const maxSpend = Math.max(...metrics.map((m) => m.spend), 1)
  const maxRev = Math.max(...metrics.map((m) => m.purchase_value), 1)
  const max = Math.max(maxSpend, maxRev)

  const spendPoints = metrics.map((m, i) => {
    const x = (i / (metrics.length - 1)) * 100
    const y = 100 - (m.spend / max) * 80
    return `${x},${y}`
  }).join(' ')

  const revPoints = metrics.map((m, i) => {
    const x = (i / (metrics.length - 1)) * 100
    const y = 100 - (m.purchase_value / max) * 80
    return `${x},${y}`
  }).join(' ')

  return (
    <div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: 200, display: 'block' }}>
        <polyline points={spendPoints} fill="none" stroke="#FBBF24" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        <polyline points={revPoints} fill="none" stroke="#34D399" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div style={S.chartLegend}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 2, background: '#FBBF24' }} /> Spend
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 2, background: '#34D399' }} /> Revenue
        </span>
      </div>
    </div>
  )
}

const C = {
  bg: '#0A0B0E', surface: '#0F2044', surfaceLight: '#162850',
  border: '#1E3566', text: '#FFFFFF',
  textSecondary: '#A0A8B5', textTertiary: '#6B7280',
}
const F = { display: '"Fraunces", Georgia, serif', body: '"Inter", -apple-system, system-ui, sans-serif', mono: '"JetBrains Mono", Menlo, monospace' }

const S: Record<string, React.CSSProperties> = {
  loading: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '60px', textAlign: 'center', color: C.textSecondary },
  empty: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '40px', textAlign: 'center', color: C.textTertiary },
  backRow: { marginBottom: 20 },
  backLink: { color: C.textSecondary, fontSize: 13, textDecoration: 'none' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 },
  metricCard: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: '16px 18px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  metricLabel: { fontSize: 10, color: C.textTertiary, letterSpacing: '0.1em', marginBottom: 8, fontWeight: 600 },
  metricValue: { fontFamily: F.display, fontSize: 24, fontWeight: 500, lineHeight: 1, marginBottom: 6 },
  metricSub: { fontSize: 11, color: C.textTertiary },
  card: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: '20px 24px', marginBottom: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  cardHeader: { marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: 600 },
  cardSub: { fontSize: 11, color: C.textTertiary, marginTop: 4 },
  chartLegend: { display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: C.textSecondary },
  flagRow: {
    display: 'flex', gap: 12, padding: '12px 0',
    borderTop: `1px solid ${C.border}`,
  },
  flagSeverity: {
    fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
    padding: '4px 8px', borderRadius: 4, height: 'fit-content',
  },
  flagBody: { flex: 1 },
  flagMessage: { fontSize: 13, color: C.text, marginBottom: 4 },
  flagMeta: { fontSize: 11, color: C.textTertiary },
  metricsTable: { fontSize: 12 },
  metricsTableHeader: {
    display: 'flex', gap: 10, padding: '10px 0',
    borderBottom: `1px solid ${C.border}`,
    fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: C.textTertiary,
  },
  metricsRow: {
    display: 'flex', gap: 10, padding: '10px 0',
    borderBottom: `1px solid ${C.border}`, fontSize: 12,
  },
}
