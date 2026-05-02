'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function BillingPageContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState(false)

  const success = params.get('success') === 'true'

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d?.user) { router.push('/'); return }
        setUser(d.user)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  const handleOpenPortal = async () => {
    setOpening(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'Failed to open billing portal')
    } catch {
      alert('Network error')
    }
    setOpening(false)
  }

  if (loading) {
    return <div style={S.loadingPage}>Loading...</div>
  }

  const status = user?.subscription_status || 'none'
  const trialEnd = user?.trial_ends_at ? new Date(user.trial_ends_at) : null
  const isBeta = user?.is_beta_user

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <Link href="/" style={S.logoLink}>
          <span style={S.logoOpti}>Opti</span><span style={S.logoLens}>Lens</span>
        </Link>
        <Link href="/dashboard" style={S.backLink}>← Back to dashboard</Link>
      </nav>

      <main style={S.main}>
        {success && (
          <div style={S.successBanner}>
            <div style={S.successIcon}>✓</div>
            <div>
              <div style={S.successTitle}>You&apos;re in!</div>
              <div style={S.successSub}>
                Your 7-day free trial has started. We&apos;ll email you before any charges.
              </div>
            </div>
          </div>
        )}

        <div style={S.eyebrow}>BILLING</div>
        <h1 style={S.title}>Your subscription</h1>

        <div style={S.statusCard}>
          <div style={S.statusRow}>
            <span style={S.statusLabel}>Status</span>
            <span style={{ ...S.statusBadge, ...statusStyle(status) }}>
              {prettyStatus(status)}
            </span>
          </div>

          {isBeta && (
            <div style={S.statusRow}>
              <span style={S.statusLabel}>Plan</span>
              <span style={S.statusValue}>Beta · $29/mo (locked for life)</span>
            </div>
          )}

          {status === 'trialing' && trialEnd && (
            <div style={S.statusRow}>
              <span style={S.statusLabel}>Trial ends</span>
              <span style={S.statusValue}>
                {trialEnd.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            </div>
          )}

          {status === 'active' && user?.subscription_ends_at && (
            <div style={S.statusRow}>
              <span style={S.statusLabel}>Next billing date</span>
              <span style={S.statusValue}>
                {new Date(user.subscription_ends_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          )}

          <div style={S.statusRow}>
            <span style={S.statusLabel}>Email</span>
            <span style={S.statusValue}>{user?.email || '—'}</span>
          </div>
        </div>

        {(status === 'trialing' || status === 'active' || status === 'past_due') ? (
          <button onClick={handleOpenPortal} disabled={opening} style={S.primaryBtn}>
            {opening ? 'Opening...' : 'Manage subscription →'}
          </button>
        ) : (
          <Link href="/pricing" style={S.primaryBtnLink}>
            View pricing →
          </Link>
        )}

        <div style={S.helpSection}>
          <h3 style={S.helpTitle}>Need help?</h3>
          <p style={S.helpText}>
            Email <a href="mailto:support@optilens.io" style={S.link}>support@optilens.io</a> and we&apos;ll get back to you within 24 hours.
          </p>
        </div>
      </main>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div style={S.loadingPage}>Loading...</div>}>
      <BillingPageContent />
    </Suspense>
  )
}

function statusStyle(status: string): React.CSSProperties {
  if (status === 'active') return { background: 'rgba(52,211,153,0.15)', color: '#34D399' }
  if (status === 'trialing') return { background: 'rgba(251,191,36,0.15)', color: '#FBBF24' }
  if (status === 'past_due') return { background: 'rgba(248,113,113,0.15)', color: '#F87171' }
  if (status === 'canceled') return { background: 'rgba(160,168,181,0.15)', color: '#A0A8B5' }
  return { background: 'rgba(107,114,128,0.15)', color: '#6B7280' }
}

function prettyStatus(status: string): string {
  const map: Record<string, string> = {
    active: 'Active',
    trialing: 'Free trial',
    past_due: 'Payment failed',
    canceled: 'Canceled',
    incomplete: 'Incomplete',
    none: 'Not subscribed',
  }
  return map[status] || status
}

const C = { bg: '#0A0B0E', surface: '#1A1D24', surfaceLight: '#22262F', border: '#2D3340', text: '#FFFFFF', textSecondary: '#A0A8B5', textTertiary: '#6B7280', amber: '#FBBF24', green: '#34D399' }
const F = { display: '"Fraunces", Georgia, serif', body: '"Inter", -apple-system, system-ui, sans-serif', mono: '"JetBrains Mono", Menlo, monospace' }

const S: Record<string, React.CSSProperties> = {
  loadingPage: { background: C.bg, color: C.textSecondary, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.body, fontSize: 14 },
  page: { background: C.bg, color: C.text, fontFamily: F.body, minHeight: '100vh' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${C.border}` },
  logoLink: { fontFamily: F.display, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', textDecoration: 'none' },
  logoOpti: { color: C.text }, logoLens: { color: C.amber },
  backLink: { color: C.textSecondary, fontSize: 13, textDecoration: 'none' },
  main: { maxWidth: 640, margin: '0 auto', padding: '60px 24px 80px' },
  successBanner: { display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', background: 'rgba(52,211,153,0.08)', border: `1px solid rgba(52,211,153,0.3)`, borderRadius: 12, marginBottom: 40 },
  successIcon: { width: 36, height: 36, borderRadius: '50%', background: C.green, color: '#0A0B0E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0 },
  successTitle: { fontFamily: F.display, fontSize: 20, fontWeight: 500, marginBottom: 2 },
  successSub: { fontSize: 14, color: C.textSecondary, lineHeight: 1.5 },
  eyebrow: { fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: C.amber, marginBottom: 16 },
  title: { fontFamily: F.display, fontSize: 40, fontWeight: 500, letterSpacing: '-0.03em', marginBottom: 32 },
  statusCard: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '8px 24px', marginBottom: 32, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
  statusRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: `1px solid ${C.border}` },
  statusLabel: { fontSize: 13, color: C.textTertiary, fontWeight: 500 },
  statusValue: { fontSize: 14, color: C.text, fontWeight: 500 },
  statusBadge: { display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 4, letterSpacing: '0.05em' },
  primaryBtn: { background: C.text, color: '#0A0B0E', border: 'none', padding: '14px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: F.body, boxShadow: '0 4px 12px rgba(255,255,255,0.1)', display: 'block', marginBottom: 32 },
  primaryBtnLink: { background: C.text, color: '#0A0B0E', textDecoration: 'none', padding: '14px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600, fontFamily: F.body, boxShadow: '0 4px 12px rgba(255,255,255,0.1)', display: 'inline-block', marginBottom: 32 },
  helpSection: { padding: '20px 24px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 },
  helpTitle: { fontSize: 14, fontWeight: 600, marginBottom: 8 },
  helpText: { fontSize: 13, color: C.textSecondary, lineHeight: 1.6 },
  link: { color: C.amber, textDecoration: 'none', borderBottom: `1px solid ${C.amber}` },
}
