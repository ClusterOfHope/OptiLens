'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/lib/DashboardLayout'

type ShopifyAccount = {
  id: string
  shop_domain: string
  shop_name: string | null
  shop_email: string | null
  currency: string | null
  is_active: boolean
  connected_at: string
  last_sync_at: string | null
}

type AttributionData = {
  meta_attributed_revenue: number
  shopify_actual_revenue: number
  meta_attributed_orders: number
  shopify_actual_orders: number
  match_rate: number
  over_attribution_pct: number
}

export default function ShopifyPage() {
  const [account, setAccount] = useState<ShopifyAccount | null>(null)
  const [attribution, setAttribution] = useState<AttributionData | null>(null)
  const [shopDomain, setShopDomain] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/shopify')
      .then((r) => r.json())
      .then((d) => {
        setAccount(d.account || null)
        setAttribution(d.attribution || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault()
    if (!shopDomain.trim()) return
    setConnecting(true)
    // Redirect to Shopify OAuth
    let domain = shopDomain.trim().replace('https://', '').replace('http://', '')
    if (!domain.includes('.myshopify.com')) domain = `${domain}.myshopify.com`
    window.location.href = `/api/auth/shopify/connect?shop=${encodeURIComponent(domain)}`
  }

  const handleDisconnect = async () => {
    if (!account) return
    if (!confirm('Disconnect Shopify? Historical orders will be kept but no new orders will sync.')) return
    try {
      const res = await fetch(`/api/shopify/disconnect?id=${account.id}`, { method: 'POST' })
      if (res.ok) {
        setAccount(null)
        setAttribution(null)
      }
    } catch {
      alert('Failed to disconnect.')
    }
  }

  return (
    <DashboardLayout
      pageTitle="Shopify"
      pageSubtitle={account ? 'Verify Meta attribution against real Shopify orders' : 'Connect your store for true attribution'}
    >
      {loading ? (
        <div style={S.loading}>Loading...</div>
      ) : !account ? (
        <ShopifyConnectForm
          shopDomain={shopDomain}
          setShopDomain={setShopDomain}
          onSubmit={handleConnect}
          connecting={connecting}
        />
      ) : (
        <>
          {/* Connected state */}
          <div style={S.connectionCard}>
            <div style={S.connectionHeader}>
              <div>
                <div style={S.connectedLabel}>
                  <span style={S.greenDot} /> Connected
                </div>
                <div style={S.shopName}>{account.shop_name || account.shop_domain}</div>
                <div style={S.shopMeta}>{account.shop_domain}</div>
              </div>
              <button onClick={handleDisconnect} style={S.disconnectBtn}>
                Disconnect
              </button>
            </div>
          </div>

          {/* Attribution comparison */}
          {attribution && (
            <>
              <div style={S.sectionTitle}>Attribution truth check</div>
              <div style={S.attributionGrid}>
                <AttrCard
                  label="Meta says you made"
                  value={`$${Math.round(attribution.meta_attributed_revenue).toLocaleString()}`}
                  sub={`${attribution.meta_attributed_orders} orders`}
                  tone="amber"
                />
                <AttrCard
                  label="Shopify actually shows"
                  value={`$${Math.round(attribution.shopify_actual_revenue).toLocaleString()}`}
                  sub={`${attribution.shopify_actual_orders} orders`}
                  tone="green"
                />
                <AttrCard
                  label="Over-attribution"
                  value={`${attribution.over_attribution_pct.toFixed(1)}%`}
                  sub="Meta inflates this"
                  tone="red"
                />
                <AttrCard
                  label="Match rate"
                  value={`${attribution.match_rate.toFixed(1)}%`}
                  sub="Orders linked to Meta UTMs"
                />
              </div>

              <div style={S.insightCard}>
                <div style={S.insightHeader}>
                  <span style={S.insightIcon}>💡</span>
                  <div style={S.insightTitle}>The truth about your ROAS</div>
                </div>
                <p style={S.insightBody}>
                  Meta is reporting <strong style={{ color: '#FBBF24' }}>${Math.round(attribution.meta_attributed_revenue - attribution.shopify_actual_revenue).toLocaleString()} more revenue</strong> than what actually showed up in your Shopify store this period.
                  This means your real ROAS is roughly <strong style={{ color: '#F87171' }}>{attribution.over_attribution_pct.toFixed(0)}% lower</strong> than what Meta tells you.
                </p>
              </div>
            </>
          )}

          {/* Last sync */}
          <div style={S.metaRow}>
            <div>
              <div style={S.metaLabel}>LAST SYNC</div>
              <div style={S.metaValue}>
                {account.last_sync_at
                  ? new Date(account.last_sync_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                  : 'Never'}
              </div>
            </div>
            <div>
              <div style={S.metaLabel}>CONNECTED</div>
              <div style={S.metaValue}>
                {new Date(account.connected_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <div>
              <div style={S.metaLabel}>CURRENCY</div>
              <div style={S.metaValue}>{account.currency || 'USD'}</div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}

function ShopifyConnectForm({ shopDomain, setShopDomain, onSubmit, connecting }: {
  shopDomain: string
  setShopDomain: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  connecting: boolean
}) {
  return (
    <>
      <div style={S.heroCard}>
        <div style={S.heroIcon}>🛍️</div>
        <h2 style={S.heroTitle}>Get the truth on your Meta ROAS</h2>
        <p style={S.heroSub}>
          Meta over-reports purchases by 20–40%. Connect your Shopify store and OptiLens will compare
          Meta&apos;s attribution against your actual Shopify orders — so you know what&apos;s real.
        </p>

        <form onSubmit={onSubmit} style={S.form}>
          <div style={S.inputRow}>
            <input
              type="text"
              placeholder="yourstore.myshopify.com"
              value={shopDomain}
              onChange={(e) => setShopDomain(e.target.value)}
              style={S.input}
              autoFocus
            />
            <button type="submit" disabled={connecting || !shopDomain.trim()} style={{
              ...S.submitBtn,
              opacity: shopDomain.trim() && !connecting ? 1 : 0.5,
            }}>
              {connecting ? 'Connecting...' : 'Connect Shopify →'}
            </button>
          </div>
          <div style={S.formNote}>
            Read-only access. We can&apos;t modify your store.
          </div>
        </form>
      </div>

      <div style={S.benefitsTitle}>What you&apos;ll see after connecting</div>
      <div style={S.benefits}>
        <Benefit icon="✓" title="True ROAS per campaign" body="Compare Meta&apos;s reported sales against your real Shopify orders for every campaign." />
        <Benefit icon="✓" title="UTM attribution match rate" body="See what % of Shopify orders actually came from Meta — vs. organic, email, or other sources." />
        <Benefit icon="✓" title="Over-attribution alerts" body="Get flagged when a campaign&apos;s Meta numbers are way higher than your Shopify reality." />
        <Benefit icon="✓" title="Daily order sync" body="Last 90 days of orders pulled in, then refreshed daily." />
      </div>
    </>
  )
}

function AttrCard({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: string }) {
  const valueColor = tone === 'green' ? '#34D399' : tone === 'amber' ? '#FBBF24' : tone === 'red' ? '#F87171' : '#fff'
  return (
    <div style={S.attrCard}>
      <div style={S.attrLabel}>{label}</div>
      <div style={{ ...S.attrValue, color: valueColor }}>{value}</div>
      <div style={S.attrSub}>{sub}</div>
    </div>
  )
}

function Benefit({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div style={S.benefit}>
      <div style={S.benefitIcon}>{icon}</div>
      <div>
        <div style={S.benefitTitle}>{title}</div>
        <div style={S.benefitBody}>{body}</div>
      </div>
    </div>
  )
}

const C = {
  bg: '#0A0B0E', surface: '#2C3E50', surfaceLight: '#34495E',
  border: '#3D5166', text: '#FFFFFF',
  textSecondary: '#A0A8B5', textTertiary: '#6B7280',
  amber: '#FBBF24', green: '#34D399', red: '#F87171',
  primary: '#FFFFFF',
}
const F = { display: '"Fraunces", Georgia, serif', body: '"Inter", -apple-system, system-ui, sans-serif', mono: '"JetBrains Mono", Menlo, monospace' }

const S: Record<string, React.CSSProperties> = {
  loading: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '60px', textAlign: 'center', color: C.textSecondary },
  heroCard: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 16, padding: '40px 32px', marginBottom: 32,
    textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  heroIcon: { fontSize: 56, marginBottom: 16 },
  heroTitle: { fontFamily: F.display, fontSize: 32, fontWeight: 500, marginBottom: 12, letterSpacing: '-0.02em' },
  heroSub: { fontSize: 15, color: C.textSecondary, lineHeight: 1.6, maxWidth: 560, margin: '0 auto 28px' },
  form: { maxWidth: 480, margin: '0 auto' },
  inputRow: { display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  input: {
    flex: 1, minWidth: 200,
    background: C.surfaceLight, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: '14px 16px', fontSize: 15,
    color: C.text, fontFamily: F.body, outline: 'none',
  },
  submitBtn: {
    background: C.primary, color: '#0A0B0E', border: 'none',
    padding: '14px 22px', borderRadius: 10, fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: F.body, whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(255,255,255,0.1)',
  },
  formNote: { fontSize: 12, color: C.textTertiary },
  benefitsTitle: { fontSize: 14, fontWeight: 600, color: C.textTertiary, letterSpacing: '0.1em', marginBottom: 16, textTransform: 'uppercase' },
  benefits: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 },
  benefit: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: '18px 20px',
    display: 'flex', gap: 14,
  },
  benefitIcon: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'rgba(52,211,153,0.15)', color: C.green,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 700, flexShrink: 0,
  },
  benefitTitle: { fontSize: 14, fontWeight: 600, marginBottom: 4 },
  benefitBody: { fontSize: 13, color: C.textSecondary, lineHeight: 1.5 },

  /* Connected state */
  connectionCard: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: '20px 24px', marginBottom: 24,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  connectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  connectedLabel: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 11, fontWeight: 600, color: C.green,
    marginBottom: 8, letterSpacing: '0.05em',
  },
  greenDot: { width: 6, height: 6, background: C.green, borderRadius: '50%', boxShadow: `0 0 8px ${C.green}` },
  shopName: { fontFamily: F.display, fontSize: 22, fontWeight: 500, marginBottom: 4 },
  shopMeta: { fontSize: 13, color: C.textTertiary, fontFamily: F.mono },
  disconnectBtn: {
    background: 'rgba(248,113,113,0.08)', color: C.red,
    border: `1px solid rgba(248,113,113,0.2)`,
    padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', fontFamily: F.body,
  },

  sectionTitle: { fontSize: 16, fontWeight: 600, marginBottom: 14 },
  attributionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 },
  attrCard: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: '18px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  attrLabel: { fontSize: 11, color: C.textTertiary, marginBottom: 8, fontWeight: 500 },
  attrValue: { fontFamily: F.display, fontSize: 28, fontWeight: 500, lineHeight: 1, marginBottom: 6 },
  attrSub: { fontSize: 11, color: C.textTertiary },

  insightCard: {
    background: C.surface, border: `1px solid ${C.border}`,
    borderLeft: `3px solid ${C.amber}`,
    borderRadius: 10, padding: '20px 24px', marginBottom: 24,
  },
  insightHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  insightIcon: { fontSize: 20 },
  insightTitle: { fontSize: 14, fontWeight: 600 },
  insightBody: { fontSize: 14, color: C.textSecondary, lineHeight: 1.6 },

  metaRow: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: '16px 20px',
  },
  metaLabel: { fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: C.textTertiary, marginBottom: 4 },
  metaValue: { fontSize: 14, fontWeight: 500 },
}
