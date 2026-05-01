'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/lib/DashboardLayout'

type SyncEntry = {
  id: string
  status: string
  campaigns_synced: number
  flags_detected: number
  flags_resolved: number
  error_message: string | null
  duration_ms: number | null
  created_at: string
}

type FlagEntry = {
  id: string
  rule_id: string
  severity: string
  message: string
  campaign_name: string
  detected_at: string
  resolved_at: string | null
  is_active: boolean
}

export default function HistoryPage() {
  const [tab, setTab] = useState<'syncs' | 'flags'>('syncs')
  const [syncs, setSyncs] = useState<SyncEntry[]>([])
  const [flags, setFlags] = useState<FlagEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/history')
      .then((r) => r.json())
      .then((d) => {
        setSyncs(d.syncs || [])
        setFlags(d.flags || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout pageTitle="History" pageSubtitle="Past syncs and detected issues">
      <div style={S.tabs}>
        <button onClick={() => setTab('syncs')} style={{ ...S.tab, ...(tab === 'syncs' ? S.tabActive : {}) }}>
          Sync runs <span style={S.count}>{syncs.length}</span>
        </button>
        <button onClick={() => setTab('flags')} style={{ ...S.tab, ...(tab === 'flags' ? S.tabActive : {}) }}>
          Flag activity <span style={S.count}>{flags.length}</span>
        </button>
      </div>

      {loading ? (
        <div style={S.loading}>Loading history...</div>
      ) : tab === 'syncs' ? (
        syncs.length === 0 ? (
          <div style={S.empty}>No sync runs yet. Click &quot;Sync now&quot; on the dashboard to run your first sync.</div>
        ) : (
          <div style={S.list}>
            {syncs.map((sync) => {
              const date = new Date(sync.created_at)
              const isSuccess = sync.status === 'success'
              return (
                <div key={sync.id} style={{ ...S.entry, borderLeft: `3px solid ${isSuccess ? '#34D399' : '#F87171'}` }}>
                  <div style={S.entryHeader}>
                    <div>
                      <div style={S.entryTitle}>
                        Sync {isSuccess ? 'completed' : 'failed'}
                      </div>
                      <div style={S.entryDate}>
                        {date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{
                      ...S.statusBadge,
                      background: isSuccess ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                      color: isSuccess ? '#34D399' : '#F87171',
                    }}>
                      {sync.status.toUpperCase()}
                    </div>
                  </div>
                  <div style={S.entryStats}>
                    <Stat label="Campaigns synced" value={sync.campaigns_synced.toString()} />
                    <Stat label="Flags detected" value={sync.flags_detected.toString()} highlight={sync.flags_detected > 0 ? '#FBBF24' : undefined} />
                    <Stat label="Flags resolved" value={sync.flags_resolved.toString()} highlight={sync.flags_resolved > 0 ? '#34D399' : undefined} />
                    <Stat label="Duration" value={sync.duration_ms ? `${(sync.duration_ms / 1000).toFixed(1)}s` : '—'} />
                  </div>
                  {sync.error_message && (
                    <div style={S.errorMessage}>Error: {sync.error_message}</div>
                  )}
                </div>
              )
            })}
          </div>
        )
      ) : (
        flags.length === 0 ? (
          <div style={S.empty}>No flags detected yet. Run a sync to start scanning for waste.</div>
        ) : (
          <div style={S.list}>
            {flags.map((flag) => {
              const detected = new Date(flag.detected_at)
              const sevColor = flag.severity === 'CRITICAL' ? '#F87171' : flag.severity === 'HIGH' ? '#FBBF24' : '#A0A8B5'
              return (
                <div key={flag.id} style={{ ...S.entry, borderLeft: `3px solid ${sevColor}` }}>
                  <div style={S.entryHeader}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={S.flagCampaign}>{flag.campaign_name}</div>
                      <div style={S.flagMessage}>{flag.message}</div>
                      <div style={S.entryDate}>
                        Detected {detected.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        {flag.resolved_at && ` · Resolved ${new Date(flag.resolved_at).toLocaleDateString()}`}
                      </div>
                    </div>
                    <div style={{
                      ...S.statusBadge,
                      background: `rgba(${flag.severity === 'CRITICAL' ? '248,113,113' : flag.severity === 'HIGH' ? '251,191,36' : '160,168,181'},0.15)`,
                      color: sevColor,
                    }}>
                      {flag.severity}
                    </div>
                  </div>
                  <div style={S.flagFooter}>
                    <span style={S.flagRule}>Rule: {flag.rule_id}</span>
                    <span style={{
                      ...S.flagState,
                      color: flag.is_active ? '#FBBF24' : '#34D399',
                    }}>
                      {flag.is_active ? '● Active' : '✓ Resolved'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
    </DashboardLayout>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div style={S.stat}>
      <div style={S.statLabel}>{label}</div>
      <div style={{ ...S.statValue, color: highlight || '#FFFFFF' }}>{value}</div>
    </div>
  )
}

const C = {
  bg: '#0A0B0E', surface: '#334155', surfaceLight: '#3D4F6B',
  border: '#475569', text: '#FFFFFF',
  textSecondary: '#A0A8B5', textTertiary: '#6B7280',
  amber: '#FBBF24',
}
const F = { display: '"Fraunces", Georgia, serif', body: '"Inter", -apple-system, system-ui, sans-serif' }

const S: Record<string, React.CSSProperties> = {
  tabs: { display: 'flex', gap: 4, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 3, marginBottom: 20, width: 'fit-content' },
  tab: { background: 'transparent', border: 'none', padding: '8px 16px', fontSize: 13, fontWeight: 500, color: C.textSecondary, borderRadius: 5, cursor: 'pointer', fontFamily: F.body },
  tabActive: { background: C.amber, color: '#0A0B0E' },
  count: { fontWeight: 700, marginLeft: 6, opacity: 0.8 },
  loading: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '60px', textAlign: 'center', color: C.textSecondary, fontSize: 14 },
  empty: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '60px', textAlign: 'center', color: C.textTertiary, fontSize: 14 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  entry: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' },
  entryHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  entryTitle: { fontSize: 14, fontWeight: 600, marginBottom: 4 },
  entryDate: { fontSize: 11, color: C.textTertiary, marginTop: 4 },
  statusBadge: { fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', padding: '4px 10px', borderRadius: 4 },
  entryStats: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: '12px 14px', background: C.surfaceLight, border: `1px solid ${C.border}`, borderRadius: 8 },
  stat: {},
  statLabel: { fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: C.textTertiary, marginBottom: 4 },
  statValue: { fontFamily: F.display, fontSize: 16, fontWeight: 500 },
  errorMessage: { marginTop: 12, padding: '10px 14px', background: 'rgba(248,113,113,0.08)', border: `1px solid rgba(248,113,113,0.2)`, borderRadius: 6, fontSize: 12, color: '#F87171' },
  flagCampaign: { fontSize: 14, fontWeight: 600, marginBottom: 4 },
  flagMessage: { fontSize: 13, color: C.textSecondary, lineHeight: 1.5 },
  flagFooter: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.textTertiary, marginTop: 8, paddingTop: 12, borderTop: `1px solid ${C.border}` },
  flagRule: { fontFamily: '"JetBrains Mono", monospace' },
  flagState: { fontWeight: 600 },
}
