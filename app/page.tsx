'use client'

import { useState, useEffect } from 'react'
import { useViewport } from '@/lib/useViewport'

export default function LandingPage() {
  const vp = useViewport()
  const isMobile = vp === 'mobile'
  const isTablet = vp === 'tablet'
  const isMobileOrTablet = isMobile || isTablet

  const [scrolled, setScrolled] = useState(false)
  const [betaSpotsLeft] = useState(47)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => setHasSession(!!d?.user))
      .catch(() => {})
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleConnect = () => { window.location.href = '/api/auth/meta/connect' }
  const handleOpenDashboard = () => { window.location.href = '/dashboard' }

  return (
    <div style={S.page}>
      <div style={S.glow1} />
      <div style={S.glow2} />

      <nav style={{ ...S.nav, ...(scrolled ? S.navScrolled : {}) }}>
        <div style={{ ...S.navInner, padding: isMobile ? '0 16px' : '0 32px' }}>
          <div style={{ ...S.logo, fontSize: isMobile ? 18 : 22 }}>
            <span style={S.logoOpti}>Opti</span>
            <span style={S.logoLens}>Lens</span>
          </div>
          <div style={{ ...S.navLinks, gap: isMobile ? 12 : 32 }}>
            {!isMobile && (
              <>
                <a href="#how" style={S.navLink}>How it works</a>
                <a href="#what" style={S.navLink}>What we find</a>
                <a href="#pricing" style={S.navLink}>Pricing</a>
              </>
            )}
            {hasSession ? (
              <button onClick={handleOpenDashboard} style={{ ...S.navCta, ...(isMobile ? S.navCtaMobile : {}) }}>
                {isMobile ? 'Open →' : 'Open Dashboard →'}
              </button>
            ) : (
              <>
                <a onClick={handleConnect} style={{ ...S.navLink, cursor: 'pointer', fontSize: isMobile ? 13 : 14 }}>Sign in</a>
                <button onClick={handleConnect} style={{ ...S.navCta, ...(isMobile ? S.navCtaMobile : {}) }}>
                  {isMobile ? 'Connect →' : 'Connect Meta Ads →'}
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        ...S.hero,
        gridTemplateColumns: isMobileOrTablet ? '1fr' : '1fr 1fr',
        gap: isMobile ? 40 : isTablet ? 50 : 80,
        padding: isMobile ? '110px 20px 60px' : isTablet ? '120px 24px 70px' : '140px 32px 80px',
      }}>
        <div style={S.heroInner}>
          <div style={S.eyebrow}>
            <span style={S.eyebrowDot} />
            Beta · {betaSpotsLeft} spots remaining
          </div>
          <h1 style={{
            ...S.heroTitle,
            fontSize: isMobile ? 42 : isTablet ? 56 : 72,
          }}>
            Find the ads<br />
            <span style={S.heroAccent}>burning your money.</span>
          </h1>
          <p style={{ ...S.heroSub, fontSize: isMobile ? 16 : 19 }}>
            OptiLens scans your Meta ad account daily and surfaces every campaign
            wasting spend — in plain English, with the numbers to prove it.
          </p>
          <div style={{
            ...S.heroActions,
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
          }}>
            <button onClick={hasSession ? handleOpenDashboard : handleConnect} style={{
              ...S.primaryBtn,
              width: isMobile ? '100%' : 'auto',
              padding: isMobile ? '14px 20px' : '16px 28px',
            }}>
              {hasSession ? 'Open Dashboard →' : 'Connect Meta Ads — Free'}
            </button>
            {!isMobile && <a href="#how" style={S.secondaryBtn}>See how it works →</a>}
          </div>
          <div style={{ ...S.heroTrust, flexWrap: 'wrap' }}>
            <span style={S.trustItem}>✓ 60-second setup</span>
            <span style={S.trustDivider}>·</span>
            <span style={S.trustItem}>✓ Read-only access</span>
            <span style={S.trustDivider}>·</span>
            <span style={S.trustItem}>✓ No credit card</span>
          </div>
        </div>

        {/* Hero visual — hide on mobile, show on tablet+ */}
        {!isMobile && (
          <div style={S.heroVisual}>
            <div style={{ ...S.dashboardMock, padding: isTablet ? 16 : 20 }}>
              <div style={S.mockHeader}>
                <div style={S.mockDot} />
                <div style={S.mockDotLight} />
                <div style={S.mockDotLight} />
                <span style={S.mockTitle}>OptiLens · Live</span>
              </div>
              <div style={S.alertBanner}>
                <div>
                  <div style={S.alertLabel}>ACTION REQUIRED</div>
                  <div style={S.alertTitle}>4 campaigns burning money</div>
                </div>
                <div style={S.alertNumber}>
                  <span style={S.alertAmount}>$9,300</span>
                  <span style={S.alertSub}>wasted</span>
                </div>
              </div>
              <div style={S.mockGrid}>
                <MetricCard label="TOTAL SPEND" value="$19,180" sub="Last 30 days" />
                <MetricCard label="REVENUE" value="$27,920" sub="Meta attributed" tone="green" />
                <MetricCard label="BLENDED ROAS" value="1.46x" sub="Target: 2.0x+" tone="amber" />
                <MetricCard label="BUDGET WASTED" value="48%" sub="$9,300 lost" tone="red" />
              </div>
              <div style={S.chartCard}>
                <div style={S.chartHeader}>
                  <div style={S.chartTitle}>30-day waste trend</div>
                  <div style={S.chartLegend}>
                    <span style={S.legendDot} />
                    <span style={S.legendText}>Wasted</span>
                  </div>
                </div>
                <MiniTrendChart />
              </div>
              <div style={S.campaignRow}>
                <div style={{ ...S.campaignBar, background: '#F87171' }} />
                <div style={S.campaignInfo}>
                  <div style={S.campaignName}>Black Friday Retargeting</div>
                  <div style={S.campaignMeta}>$6,200 · $0 revenue</div>
                </div>
                <div style={S.pauseTag}>PAUSE</div>
              </div>
              <div style={S.campaignRow}>
                <div style={{ ...S.campaignBar, background: '#34D399' }} />
                <div style={S.campaignInfo}>
                  <div style={S.campaignName}>Spring Sale 2026</div>
                  <div style={S.campaignMeta}>$4,200 · 3.19x ROAS</div>
                </div>
                <div style={S.scaleTag}>SCALE</div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile-only mini visual */}
        {isMobile && (
          <div style={S.mobileVisual}>
            <div style={S.mobileVisualInner}>
              <div style={S.mobileVisualLabel}>EXAMPLE FINDING</div>
              <div style={S.mobileVisualNumber}>$9,300</div>
              <div style={S.mobileVisualSub}>wasted across 4 campaigns last month</div>
              <MiniTrendChart />
            </div>
          </div>
        )}
      </section>

      {/* PROBLEM */}
      <section style={{ ...S.problem, padding: isMobile ? '60px 20px' : '120px 32px' }}>
        <div style={S.sectionInner}>
          <div style={S.sectionEyebrow}>The problem</div>
          <h2 style={{
            ...S.sectionTitle,
            fontSize: isMobile ? 32 : isTablet ? 44 : 56,
            marginBottom: isMobile ? 36 : 64,
          }}>
            Meta&apos;s dashboard makes it<br />
            <span style={S.heroAccent}>almost impossible</span> to spot waste.
          </h2>
          <div style={{
            ...S.problemGrid,
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
            gap: isMobile ? 14 : 24,
          }}>
            <ProblemCard num="01" title="Surface metrics lie" body="A campaign with 'good CTR' can still produce zero conversions. Meta highlights the wrong numbers." />
            <ProblemCard num="02" title="Waste compounds quietly" body="A bad audience burns $200/day. By the time you notice at month-end, you've lost $6,000." />
            <ProblemCard num="03" title="Attribution is broken" body="Meta over-reports purchases by 20–40%. Your real ROAS is lower than what you're shown." />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ ...S.how, padding: isMobile ? '60px 20px' : '120px 32px' }}>
        <div style={S.sectionInner}>
          <div style={S.sectionEyebrow}>How it works</div>
          <h2 style={{
            ...S.sectionTitle,
            fontSize: isMobile ? 32 : isTablet ? 44 : 56,
            marginBottom: isMobile ? 36 : 64,
          }}>
            From connection to first finding<br />
            <span style={S.heroAccent}>in under 5 minutes.</span>
          </h2>
          <div style={{
            ...S.steps,
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? 14 : 32,
          }}>
            <Step num="1" title="Connect" body="Click connect, authorize Meta, done. Read-only access — we never touch your campaigns." time="60 seconds" />
            <Step num="2" title="Scan" body="OptiLens pulls 30 days of campaign data and runs 12 waste-detection rules across every ad." time="2 minutes" />
            <Step num="3" title="Save" body="Get a clear list of campaigns to pause, scale, or refresh — with the exact dollar impact." time="Always live" />
          </div>
        </div>
      </section>

      {/* WHAT WE FIND */}
      <section id="what" style={{ ...S.findings, padding: isMobile ? '60px 20px' : '120px 32px' }}>
        <div style={S.sectionInner}>
          <div style={S.sectionEyebrow}>What we find</div>
          <h2 style={{
            ...S.sectionTitle,
            fontSize: isMobile ? 32 : isTablet ? 44 : 56,
            marginBottom: isMobile ? 36 : 64,
          }}>
            12 patterns that quietly<br />
            <span style={S.heroAccent}>drain your budget.</span>
          </h2>
          <div style={{
            ...S.findingsGrid,
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: isMobile ? 12 : 16,
          }}>
            {findings.map((f) => (
              <div key={f.title} style={S.findingCard}>
                <div style={{ ...S.findingTag, ...severityStyle(f.severity) }}>{f.severity}</div>
                <h3 style={S.findingTitle}>{f.title}</h3>
                <p style={S.findingBody}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ ...S.pricing, padding: isMobile ? '60px 20px' : '120px 32px' }}>
        <div style={S.sectionInner}>
          <div style={S.sectionEyebrow}>Pricing</div>
          <h2 style={{
            ...S.sectionTitle,
            fontSize: isMobile ? 32 : isTablet ? 44 : 56,
            marginBottom: isMobile ? 36 : 64,
          }}>
            Free during beta.<br />
            <span style={S.heroAccent}>Forever, for the first 50.</span>
          </h2>
          <div style={{
            ...S.pricingCard,
            padding: isMobile ? 24 : 48,
          }}>
            <div style={{
              ...S.pricingHeader,
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 16 : 0,
            }}>
              <div>
                <div style={S.pricingTier}>BETA ACCESS</div>
                <div style={S.pricingPrice}>
                  <span style={{ ...S.priceAmount, fontSize: isMobile ? 48 : 64 }}>$0</span>
                  <span style={S.pricePeriod}>/ month</span>
                </div>
              </div>
              <div style={S.spotsTag}>{betaSpotsLeft} of 50 spots left</div>
            </div>
            <ul style={S.pricingFeatures}>
              <li style={S.pricingFeature}>✓ Unlimited campaigns scanned</li>
              <li style={S.pricingFeature}>✓ Daily waste detection across 12 rules</li>
              <li style={S.pricingFeature}>✓ Real-time alerts on flagged campaigns</li>
              <li style={S.pricingFeature}>✓ Direct support from the founders</li>
              <li style={S.pricingFeature}>✓ Beta users keep free access forever</li>
            </ul>
            <button onClick={handleConnect} style={S.pricingCta}>Claim your beta spot →</button>
            <div style={S.pricingFootnote}>
              Paid plans start at $99/mo after public launch. Beta users locked in free for life.
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ ...S.finalCta, padding: isMobile ? '80px 20px' : '140px 32px' }}>
        <div style={S.sectionInner}>
          <h2 style={{ ...S.finalTitle, fontSize: isMobile ? 36 : isTablet ? 50 : 64 }}>
            Stop guessing where the money went.
          </h2>
          <p style={{ ...S.finalSub, fontSize: isMobile ? 16 : 18 }}>
            Connect your Meta account. See the truth in 5 minutes.
          </p>
          <button onClick={hasSession ? handleOpenDashboard : handleConnect} style={{
            ...S.primaryBtn,
            width: isMobile ? '100%' : 'auto',
          }}>
            {hasSession ? 'Open Dashboard →' : 'Connect Meta Ads — Free'}
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={S.footer}>
        <div style={{
          ...S.footerInner,
          flexDirection: isMobile ? 'column' : 'row',
          textAlign: isMobile ? 'center' : 'left',
          gap: isMobile ? 16 : 0,
        }}>
          <div style={S.logo}>
            <span style={S.logoOpti}>Opti</span>
            <span style={S.logoLens}>Lens</span>
          </div>
          <div style={{
            ...S.footerMeta,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 8 : 24,
          }}>
            <span>Built for brands that take ad spend seriously.</span>
            <span style={S.footerCopyright}>© 2026 OptiLens</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function MetricCard({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: string }) {
  const valueColor = tone === 'green' ? '#34D399' : tone === 'amber' ? '#FBBF24' : tone === 'red' ? '#F87171' : '#fff'
  return (
    <div style={S.metricCard}>
      <div style={S.metricLabel}>{label}</div>
      <div style={{ ...S.metricValue, color: valueColor }}>{value}</div>
      <div style={S.metricSub}>{sub}</div>
    </div>
  )
}

function MiniTrendChart() {
  const data = [120, 145, 165, 190, 220, 245, 280, 310, 340, 380, 425, 470, 520, 580, 640, 720]
  const max = Math.max(...data, 1)
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - (v / max) * 75
    return `${x},${y}`
  }).join(' ')
  const fillPoints = `0,100 ${points} 100,100`
  return (
    <div style={{ position: 'relative', width: '100%', height: 70 }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
        <polyline points={fillPoints} fill="rgba(248,113,113,0.18)" stroke="none" />
        <polyline points={points} fill="none" stroke="#F87171" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  )
}

function ProblemCard({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div style={S.problemCard}>
      <div style={S.problemNum}>{num}</div>
      <h3 style={S.problemTitle}>{title}</h3>
      <p style={S.problemBody}>{body}</p>
    </div>
  )
}

function Step({ num, title, body, time }: { num: string; title: string; body: string; time: string }) {
  return (
    <div style={S.stepCard}>
      <div style={S.stepNum}>{num}</div>
      <h3 style={S.stepTitle}>{title}</h3>
      <p style={S.stepBody}>{body}</p>
      <div style={S.stepTime}>{time}</div>
    </div>
  )
}

function severityStyle(sev: string): React.CSSProperties {
  if (sev === 'CRITICAL') return { background: 'rgba(248,113,113,0.15)', color: '#F87171' }
  if (sev === 'HIGH') return { background: 'rgba(251,191,36,0.15)', color: '#FBBF24' }
  if (sev === 'MEDIUM') return { background: 'rgba(160,168,181,0.15)', color: '#A0A8B5' }
  return { background: 'rgba(107,114,128,0.15)', color: '#6B7280' }
}

const findings = [
  { severity: 'CRITICAL', title: 'Zero conversions, real spend', body: 'Campaigns burning $100+/day with no purchases over 7 days.' },
  { severity: 'CRITICAL', title: 'ROAS below break-even', body: 'Spending $1 to make 80¢. Quietly losing money on every dollar.' },
  { severity: 'HIGH', title: 'Audience fatigue', body: 'Frequency above 4.0 with declining CTR — your audience is tuning out.' },
  { severity: 'HIGH', title: 'Creative fatigue', body: 'CTR dropped 40%+ over last 14 days — time to refresh the ad.' },
  { severity: 'HIGH', title: 'Negative trend', body: 'ROAS dropping week over week — campaign is dying, intervene now.' },
  { severity: 'HIGH', title: 'Frequency cap exceeded', body: 'Same user seeing your ad 8+ times. You\'re paying to annoy them.' },
  { severity: 'MEDIUM', title: 'High CPM, low CTR', body: 'Paying premium prices for impressions nobody clicks. Bad audience match.' },
  { severity: 'MEDIUM', title: 'Budget pacing issues', body: 'Spending too fast or too slow vs. monthly target.' },
  { severity: 'MEDIUM', title: 'Conversion drop-off', body: 'Clicks happening but purchases stopped — landing page or offer issue.' },
  { severity: 'LOW', title: 'Underspending top performers', body: 'Best campaigns throttled by low daily caps. Leaving revenue on the table.' },
  { severity: 'LOW', title: 'Weekend underperformance', body: 'Heavy weekend spend with poor weekend ROAS — adjust day-parting.' },
  { severity: 'LOW', title: 'Bid inefficiency', body: 'Cost per result rising 30%+ vs your historical average.' },
]

const C = {
  bg: '#0A0B0E', bgSecondary: '#101218',
  surface: '#1A1D24', surfaceLight: '#22262F',
  border: '#2D3340', borderLight: '#1F242D',
  text: '#FFFFFF', textSecondary: '#A0A8B5', textTertiary: '#6B7280',
  primary: '#FFFFFF', green: '#34D399', amber: '#FBBF24', red: '#F87171',
}

const F = {
  display: '"Fraunces", Georgia, serif',
  body: '"Inter", -apple-system, system-ui, sans-serif',
  mono: '"JetBrains Mono", Menlo, monospace',
}

const S: Record<string, React.CSSProperties> = {
  page: {
    background: C.bg, color: C.text, fontFamily: F.body,
    minHeight: '100vh', overflowX: 'hidden', position: 'relative',
  },
  glow1: {
    position: 'fixed', top: '10%', right: '-10%',
    width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 70%)',
    pointerEvents: 'none', zIndex: 0,
  },
  glow2: {
    position: 'fixed', bottom: '20%', left: '-10%',
    width: 600, height: 600, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(251,191,36,0.04) 0%, transparent 70%)',
    pointerEvents: 'none', zIndex: 0,
  },
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    transition: 'all 0.3s ease', padding: '20px 0',
  },
  navScrolled: {
    background: 'rgba(10,11,14,0.85)',
    backdropFilter: 'blur(20px)',
    borderBottom: `1px solid ${C.border}`,
    padding: '14px 0',
  },
  navInner: {
    maxWidth: 1280, margin: '0 auto',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  logo: { fontFamily: F.display, fontWeight: 600, letterSpacing: '-0.02em' },
  logoOpti: { color: C.text },
  logoLens: { color: C.amber },
  navLinks: { display: 'flex', alignItems: 'center' },
  navLink: { color: C.textSecondary, textDecoration: 'none', fontSize: 14, fontWeight: 500 },
  navCta: {
    background: C.primary, color: '#0A0B0E', border: 'none',
    padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: F.body,
    boxShadow: '0 4px 12px rgba(255,255,255,0.1)',
  },
  navCtaMobile: { padding: '8px 12px', fontSize: 12 },

  hero: {
    minHeight: '100vh',
    maxWidth: 1280, margin: '0 auto',
    display: 'grid',
    alignItems: 'center', position: 'relative', zIndex: 2,
  },
  heroInner: { maxWidth: 600 },
  eyebrow: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '6px 14px', background: 'rgba(251,191,36,0.1)',
    border: `1px solid rgba(251,191,36,0.3)`, borderRadius: 100,
    fontSize: 12, fontWeight: 500, color: C.amber,
    marginBottom: 32, letterSpacing: '0.02em',
  },
  eyebrowDot: {
    width: 6, height: 6, background: C.amber, borderRadius: '50%',
    boxShadow: `0 0 8px ${C.amber}`, animation: 'pulse 2s infinite',
  },
  heroTitle: {
    fontFamily: F.display, fontWeight: 400,
    lineHeight: 1.02, letterSpacing: '-0.04em', marginBottom: 28,
  },
  heroAccent: { color: C.amber, fontStyle: 'italic' },
  heroSub: {
    lineHeight: 1.55, color: C.textSecondary,
    marginBottom: 40, maxWidth: 540,
  },
  heroActions: { display: 'flex', gap: 16, marginBottom: 32 },
  primaryBtn: {
    background: C.primary, color: '#0A0B0E', border: 'none',
    borderRadius: 10, fontSize: 15, fontWeight: 600,
    padding: '16px 28px',
    cursor: 'pointer', fontFamily: F.body,
    boxShadow: '0 8px 24px rgba(255,255,255,0.12)',
  },
  secondaryBtn: { color: C.text, padding: '16px 8px', fontSize: 15, fontWeight: 500 },
  heroTrust: { display: 'flex', gap: 12, fontSize: 13, color: C.textTertiary },
  trustItem: { color: C.textSecondary },
  trustDivider: { color: C.border },

  heroVisual: { position: 'relative' },
  dashboardMock: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(251,191,36,0.04)',
  },

  /* Mobile-only mini visual */
  mobileVisual: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
  },
  mobileVisualInner: { display: 'flex', flexDirection: 'column', gap: 12 },
  mobileVisualLabel: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.15em',
    color: C.amber,
  },
  mobileVisualNumber: {
    fontFamily: F.display, fontSize: 48, fontWeight: 600,
    color: C.amber, lineHeight: 1, letterSpacing: '-0.03em',
  },
  mobileVisualSub: {
    fontSize: 13, color: C.textSecondary, marginBottom: 6,
  },

  mockHeader: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '0 16px 14px',
    borderBottom: `1px solid ${C.border}`, marginBottom: 14,
    paddingTop: 16,
  },
  mockDot: { width: 10, height: 10, borderRadius: '50%', background: '#F87171' },
  mockDotLight: { width: 10, height: 10, borderRadius: '50%', background: C.border },
  mockTitle: {
    fontSize: 11, color: C.textTertiary, fontFamily: F.mono,
    marginLeft: 12, letterSpacing: '0.05em',
  },
  alertBanner: {
    background: C.surfaceLight,
    border: `1px solid ${C.border}`,
    borderLeft: `3px solid ${C.amber}`,
    color: C.text, padding: '12px 14px', borderRadius: 8,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12, marginLeft: 16, marginRight: 16,
  },
  alertLabel: { fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4, color: C.amber },
  alertTitle: { fontSize: 12, fontWeight: 600, color: C.text },
  alertNumber: { textAlign: 'right' },
  alertAmount: {
    display: 'block', fontFamily: F.display, fontSize: 22,
    fontWeight: 600, lineHeight: 1, color: C.amber,
  },
  alertSub: { fontSize: 9, fontWeight: 600, color: C.textSecondary },
  mockGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
    marginBottom: 12, marginLeft: 16, marginRight: 16,
  },
  metricCard: {
    background: C.surfaceLight,
    border: `1px solid ${C.border}`,
    borderRadius: 8, padding: '10px 12px',
  },
  metricLabel: { fontSize: 9, color: C.textTertiary, letterSpacing: '0.08em', marginBottom: 4, fontWeight: 600 },
  metricValue: { fontFamily: F.display, fontSize: 20, fontWeight: 500, lineHeight: 1, marginBottom: 4 },
  metricSub: { fontSize: 9, color: C.textTertiary },

  chartCard: {
    background: C.surfaceLight,
    border: `1px solid ${C.border}`,
    borderRadius: 8, padding: '10px 12px',
    marginBottom: 12, marginLeft: 16, marginRight: 16,
  },
  chartHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 6,
  },
  chartTitle: { fontSize: 10, fontWeight: 600, color: C.text },
  chartLegend: { display: 'flex', alignItems: 'center', gap: 5 },
  legendDot: { width: 6, height: 6, background: C.red, borderRadius: '50%' },
  legendText: { fontSize: 9, color: C.textTertiary },

  campaignRow: {
    display: 'flex', alignItems: 'center',
    background: C.surfaceLight,
    border: `1px solid ${C.border}`,
    borderRadius: 8, padding: '10px 12px',
    marginBottom: 6, marginLeft: 16, marginRight: 16, gap: 12,
  },
  campaignBar: { width: 3, height: 28, borderRadius: 2 },
  campaignInfo: { flex: 1, minWidth: 0 },
  campaignName: { fontSize: 11, fontWeight: 500 },
  campaignMeta: { fontSize: 10, color: C.textTertiary, marginTop: 2 },
  pauseTag: {
    background: 'rgba(248,113,113,0.18)', color: C.red,
    fontSize: 9, fontWeight: 700, padding: '4px 8px', borderRadius: 4, letterSpacing: '0.05em',
  },
  scaleTag: {
    background: 'rgba(52,211,153,0.18)', color: C.green,
    fontSize: 9, fontWeight: 700, padding: '4px 8px', borderRadius: 4, letterSpacing: '0.05em',
  },

  problem: { position: 'relative', zIndex: 2 },
  how: { background: C.bgSecondary, position: 'relative', zIndex: 2 },
  findings: { position: 'relative', zIndex: 2 },
  pricing: { background: C.bgSecondary, position: 'relative', zIndex: 2 },
  finalCta: { textAlign: 'center', position: 'relative', zIndex: 2 },

  sectionInner: { maxWidth: 1100, margin: '0 auto' },
  sectionEyebrow: {
    fontSize: 12, fontWeight: 600, letterSpacing: '0.15em',
    color: C.amber, marginBottom: 20, textTransform: 'uppercase',
  },
  sectionTitle: {
    fontFamily: F.display, fontWeight: 400,
    lineHeight: 1.05, letterSpacing: '-0.03em',
  },

  problemGrid: { display: 'grid' },
  problemCard: {
    padding: '28px 24px', background: C.surface,
    border: `1px solid ${C.border}`, borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  problemNum: { fontFamily: F.mono, fontSize: 12, color: C.amber, marginBottom: 16, letterSpacing: '0.1em' },
  problemTitle: { fontFamily: F.display, fontSize: 22, fontWeight: 500, marginBottom: 12, letterSpacing: '-0.01em' },
  problemBody: { color: C.textSecondary, lineHeight: 1.6, fontSize: 15 },

  steps: { display: 'grid' },
  stepCard: {
    padding: '32px 28px', border: `1px solid ${C.border}`,
    borderRadius: 12, background: C.surface,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  stepNum: { fontFamily: F.display, fontSize: 56, fontWeight: 300, color: C.amber, lineHeight: 1, marginBottom: 24 },
  stepTitle: { fontFamily: F.display, fontSize: 24, fontWeight: 500, marginBottom: 12 },
  stepBody: { color: C.textSecondary, lineHeight: 1.6, fontSize: 14, marginBottom: 20 },
  stepTime: { fontSize: 11, color: C.textTertiary, fontFamily: F.mono, letterSpacing: '0.05em' },

  findingsGrid: { display: 'grid' },
  findingCard: {
    padding: '22px 20px', background: C.surface,
    border: `1px solid ${C.border}`, borderRadius: 10,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  findingTag: {
    display: 'inline-block', fontSize: 10, fontWeight: 700,
    letterSpacing: '0.1em', padding: '3px 8px', borderRadius: 4, marginBottom: 14,
  },
  findingTitle: { fontFamily: F.display, fontSize: 18, fontWeight: 500, marginBottom: 8 },
  findingBody: { color: C.textSecondary, fontSize: 14, lineHeight: 1.55 },

  pricingCard: {
    background: C.surface,
    border: `1px solid rgba(251,191,36,0.3)`,
    borderRadius: 16, maxWidth: 560, margin: '0 auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 80px rgba(251,191,36,0.06)',
  },
  pricingHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 32,
  },
  pricingTier: { fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: C.amber, marginBottom: 8 },
  pricingPrice: { display: 'flex', alignItems: 'baseline', gap: 8 },
  priceAmount: {
    fontFamily: F.display, fontWeight: 400,
    letterSpacing: '-0.04em', lineHeight: 1,
  },
  pricePeriod: { color: C.textTertiary, fontSize: 16 },
  spotsTag: {
    background: 'rgba(251,191,36,0.15)', color: C.amber,
    fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 6,
    alignSelf: 'flex-start',
  },
  pricingFeatures: { listStyle: 'none', padding: 0, marginBottom: 32 },
  pricingFeature: {
    padding: '12px 0', borderBottom: `1px solid ${C.borderLight}`,
    fontSize: 15, color: C.textSecondary,
  },
  pricingCta: {
    width: '100%', background: C.primary, color: '#0A0B0E',
    border: 'none', padding: '16px', borderRadius: 10,
    fontSize: 15, fontWeight: 600, cursor: 'pointer',
    fontFamily: F.body, marginBottom: 16,
    boxShadow: '0 8px 24px rgba(255,255,255,0.12)',
  },
  pricingFootnote: { fontSize: 13, color: C.textTertiary, textAlign: 'center', lineHeight: 1.5 },

  finalTitle: {
    fontFamily: F.display, fontWeight: 400, lineHeight: 1.05,
    letterSpacing: '-0.03em', marginBottom: 20,
  },
  finalSub: { color: C.textSecondary, marginBottom: 40 },

  footer: {
    borderTop: `1px solid ${C.border}`, padding: '32px 20px',
    position: 'relative', zIndex: 2,
  },
  footerInner: {
    maxWidth: 1280, margin: '0 auto', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: 16,
  },
  footerMeta: { display: 'flex', fontSize: 13, color: C.textTertiary },
  footerCopyright: { color: C.textTertiary },
}
