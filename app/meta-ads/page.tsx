'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/lib/DashboardLayout'

type MetaAccount = {
  id: string
  ad_account_id: string
  account_name: string | null
  account_status: number | null
  currency: string | null
  updated_at: string
  last_sync_at?: string
}

export default function MetaAdsPage() {
  const [accounts, setAccounts] = useState<MetaAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    fetch('/api/meta-ads')
      .then((r) => r.json())
      .then((d) => {
        setAccounts(d.accounts || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleReconnect = () => {
    window.location.href = '/api/auth/meta/connect'
  }

  const handleDisconnect = async (id: string) => {
    if (!confirm('Disconnect this Meta account? Your historical data will be kept but no new syncs will run.')) return
    setDisconnecting(true)
    try {
      const res = await fetch(`/api/meta-ads/disconnect?id=${id}`, { method: 'POST' })
      if (res.ok) {
        setAccounts(accounts.filter((a) => a.id !== id))
      } else {
        alert('Failed to disconnect. Try again?')
      }
    } catch {
      alert('Network error.')
    }
    setDisconnecting(false)
  }

  return (
    <DashboardLayout pageTitle="Meta Ads" pageSubtitle="Connected accounts and sync settings">
      {loading ? (
        <div style={S.loading}>Loading your Meta accounts...</div>
      ) : accounts.length === 0 ? (
        <div style={S.emptyState}>
          <div style={S.emptyIcon}>🔌</div>
          <h2 style={S.emptyTitle}>No Meta accounts connected</h2>
          <p style={S.emptySub}>Connect your Meta ad account to start scanning for waste.</p>
          <button onClick={handleReconnect} style={S.primaryBtn}>
            Connect Meta Ads →
          </button>
        </div>
      ) : (
        <>
          <div style={S.accountsHeader}>
            <h2 style={S.sectionTitle}>Connected accounts <span style={S.count}>({accounts.length})</span></h2>
            <button onClick={handleReconnect} style={S.secondaryBtn}>+ Connect another</button>
          </div>

          <div style={S.accountsList}>
            {accounts.map((account) => {
              const isActive = account.account_status === 1
              const lastUpdate = new Date(account.updated_at).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
              })
              return (
                <div key={account.id} style={S.accountCard}>
                  <div style={S.accountHeader}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={S.accountName}>{account.account_name || 'Unnamed account'}</div>
                      <div style={S.accountId}>{account.ad_account_id}</div>
                    </div>
                    <div style={{ ...S.statusBadge, ...(isActive ? S.statusActive : S.statusInactive) }}>
                      <span style={{
                        ...S.statusDot,
                        background: isActive ? '#34D399' : '#6B7280',
                      }} />
                      {isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  <div style={S.accountMeta}>
                    <div style={S.metaItem}>
                      <div style={S.metaLabel}>CURRENCY</div>
                      <div style={S.metaValue}>{account.currency || '—'}</div>
                    </div>
                    <div style={S.metaItem}>
                      <div style={S.metaLabel}>LAST SYNC</div>
                      <div style={S.metaValue}>{lastUpdate}</div>
                    </div>
                    <div style={S.metaItem}>
                      <div style={S.metaLabel}>TOKEN STATUS</div>
                      <div style={{ ...S.metaValue, color: '#34D399' }}>● Valid</div>
                    </div>
                  </div>

                  <div style={S.accountActions}>
                    <button onClick={handleReconnect} style={S.actionBtn}>
                      Refresh token
                    </button>
                    <button
                      onClick={() => handleDisconnect(account.id)}
                      disabled={disconnecting}
                      style={{ ...S.actionBtn, ...S.dangerBtn }}
                    >
                      {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={S.helpSection}>
            <h3 style={S.helpTitle}>About your Meta connection</h3>
            <p style={S.helpText}>
              OptiLens uses read-only access to your Meta Ads account. We can never modify, pause, or delete your campaigns.
              Tokens are valid for 60 days — we'll prompt you to refresh before expiry.
            </p>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}

const C = {
  bg: '#0A0B0E', surface: '#334155', surfaceLight: '#3D4F6B',
  border: '#475569', text: '#FFFFFF',
  textSecondary: '#A0A8B5', textTertiary: '#6B7280',
  primary: '#FFFFFF', amber: '#FBBF24', red: '#F87171', green: '#34D399',
}

const F = {
  display: '"Fraunces", Georgia, serif',
  body: '"Inter", -apple-system, system-ui, sans-serif',
  mono: '"JetBrains Mono", Menlo, monospace',
}

const S: Record<string, React.CSSProperties> = {
  loading: {
    padding: '60px 20px', textAlign: 'center', color: C.textSecondary,
    fontSize: 14, fontFamily: F.mono,
  },
  emptyState: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: '60px 32px', textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontFamily: F.display, fontSize: 24, fontWeight: 500, marginBottom: 8 },
  emptySub: { fontSize: 14, color: C.textSecondary, marginBottom: 24 },
  primaryBtn: {
    background: C.primary, color: '#0A0B0E', border: 'none',
    padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: F.body,
    boxShadow: '0 4px 12px rgba(255,255,255,0.1)',
  },
  secondaryBtn: {
    background: 'transparent', color: C.text,
    border: `1px solid ${C.border}`,
    padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', fontFamily: F.body,
  },
  accountsHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: 600 },
  count: { fontWeight: 400, color: C.textTertiary, fontSize: 14, marginLeft: 8 },
  accountsList: { display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 },
  accountCard: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: '20px 24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  accountHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 20, gap: 16,
  },
  accountName: { fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 4 },
  accountId: { fontSize: 12, color: C.textTertiary, fontFamily: F.mono },
  statusBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600,
  },
  statusActive: { background: 'rgba(52,211,153,0.12)', color: C.green },
  statusInactive: { background: 'rgba(107,114,128,0.12)', color: C.textTertiary },
  statusDot: { width: 6, height: 6, borderRadius: '50%' },
  accountMeta: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
    marginBottom: 20, padding: '16px', background: C.surfaceLight,
    border: `1px solid ${C.border}`, borderRadius: 8,
  },
  metaItem: {},
  metaLabel: { fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: C.textTertiary, marginBottom: 4 },
  metaValue: { fontSize: 14, fontWeight: 500, color: C.text },
  accountActions: { display: 'flex', gap: 10 },
  actionBtn: {
    background: C.surfaceLight, color: C.text,
    border: `1px solid ${C.border}`,
    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', fontFamily: F.body,
  },
  dangerBtn: {
    background: 'rgba(248,113,113,0.08)', color: C.red,
    borderColor: 'rgba(248,113,113,0.2)',
  },
  helpSection: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: '20px 24px',
  },
  helpTitle: { fontSize: 14, fontWeight: 600, marginBottom: 8 },
  helpText: { fontSize: 13, color: C.textSecondary, lineHeight: 1.6 },
}
