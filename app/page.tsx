'use client'

import { useState, useEffect } from 'react'

export default function LandingPage() {
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
    <div style={styles.page}>
      <div style={styles.glow1} />
      <div style={styles.glow2} />

      <nav style={{ ...styles.nav, ...(scrolled ? styles.navScrolled : {}) }}>
        <div style={styles.navInner}>
          <div style={styles.logo}>
            <span style={styles.logoOpti}>Opti</span>
            <span style={styles.logoLens}>Lens</span>
          </div>
          <div style={styles.navLinks}>
            <a href="#how" style={styles.navLink}>How it works</a>
            <a href="#what" style={styles.navLink}>What we find</a>
            <a href="#pricing" style={styles.navLink}>Pricing</a>
            {hasSession ? (
              <button onClick={handleOpenDashboard} style={styles.navCta}>Open Dashboard →</button>
            ) : (
              <>
                <a onClick={handleConnect} style={{ ...styles.navLink, cursor: 'pointer' }}>Sign in</a>
                <button onClick={handleConnect} style={styles.navCta}>Connect Meta Ads →</button>
              </>
            )}
          </div>
        </div>
      </nav>

      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.eyebrow}>
            <span style={styles.eyebrowDot} />
            Beta · {betaSpotsLeft} spots remaining
          </div>
          <h1 style={styles.heroTitle}>
            Find the ads<br />
            <span style={styles.heroAccent}>burning your money.</span>
          </h1>
          <p style={styles.heroSub}>
            OptiLens scans your Meta ad account daily and surfaces every campaign
            wasting spend — in plain English, with the numbers to prove it.
          </p>
          <div style={styles.heroActions}>
            <button onClick={hasSession ? handleOpenDashboard : handleConnect} style={styles.primaryBtn}>
              {hasSession ? 'Open Dashboard →' : 'Connect Meta Ads — Free'}
            </button>
            <a href="#how" style={styles.secondaryBtn}>See how it works →</a>
          </div>
          <div style={styles.heroTrust}>
            <span style={styles.trustItem}>✓ 60-second setup</span>
            <span style={styles.trustDivider}>·</span>
            <span style={styles.trustItem}>✓ Read-only access</span>
            <span style={styles.trustDivider}>·</span>
            <span style={styles.trustItem}>✓ No credit card</span>
          </div>
        </div>

        <div style={styles.heroVisual}>
          <div style={styles.dashboardMock}>
            <div style={styles.mockHeader}>
              <div style={styles.mockDot} />
              <div style={styles.mockDotLight} />
              <div style={styles.mockDotLight} />
              <span style={styles.mockTitle}>OptiLens · Live</span>
            </div>

            <div style={styles.alertBanner}>
              <div>
                <div style={styles.alertLabel}>ACTION REQUIRED</div>
                <div style={styles.alertTitle}>4 campaigns burning money with zero return</div>
              </div>
              <div style={styles.alertNumber}>
                <span style={styles.alertAmount}>$9,300</span>
                <span style={styles.alertSub}>wasted this month</span>
              </div>
            </div>

            <div style={styles.mockGrid}>
              <MetricCard label="TOTAL SPEND" value="$19,180" sub="Last 30 days" />
              <MetricCard label="REVENUE" value="$27,920" sub="Meta attributed" tone="green" />
              <MetricCard label="BLENDED ROAS" value="1.46x" sub="Target: 2.0x+" tone="amber" />
              <MetricCard label="BUDGET WASTED" value="48%" sub="$9,300 lost" tone="red" />
            </div>

            {/* CHART */}
            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <div style={styles.chartTitle}>30-day waste trend</div>
                <div style={styles.chartLegend}>
                  <span style={styles.legendDot} />
                  <span style={styles.legendText}>Wasted spend</span>
                </div>
              </div>
              <MiniTrendChart />
            </div>

            <div style={styles.campaignRow}>
              <div style={{ ...styles.campaignBar, background: '#F87171' }} />
              <div style={styles.campaignInfo}>
                <div style={styles.campaignName}>Black Friday Retargeting</div>
                <div style={styles.campaignMeta}>$6,200 spent · $0 revenue</div>
              </div>
              <div style={styles.pauseTag}>PAUSE NOW</div>
            </div>
            <div style={styles.campaignRow}>
              <div style={{ ...styles.campaignBar, background: '#34D399' }} />
              <div style={styles.campaignInfo}>
                <div style={styles.campaignName}>Spring Sale 2026</div>
                <div style={styles.campaignMeta}>$4,200 spent · 3.19x ROAS</div>
              </div>
              <div style={styles.scaleTag}>SCALE UP</div>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.problem}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionEyebrow}>The problem</div>
          <h2 style={styles.sectionTitle}>
            Meta&apos;s dashboard makes it<br />
            <span style={styles.heroAccent}>almost impossible</span> to spot waste.
          </h2>
          <div style={styles.problemGrid}>
            <ProblemCard num="01" title="Surface metrics lie" body="A campaign with 'good CTR' can still produce zero conversions. Meta highlights the wrong numbers." />
            <ProblemCard num="02" title="Waste compounds quietly" body="A bad audience burns $200/day. By the time you notice at month-end, you've lost $6,000." />
            <ProblemCard num="03" title="Attribution is broken" body="Meta over-reports purchases by 20–40%. Your real ROAS is lower than what you're shown." />
          </div>
        </div>
      </section>

      <section id="how" style={styles.how}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionEyebrow}>How it works</div>
          <h2 style={styles.sectionTitle}>
            From connection to first finding<br />
            <span style={styles.heroAccent}>in under 5 minutes.</span>
          </h2>
          <div style={styles.steps}>
            <Step num="1" title="Connect" body="Click connect, authorize Meta, done. Read-only access — we never touch your campaigns." time="60 seconds" />
            <Step num="2" title="Scan" body="OptiLens pulls 30 days of campaign data and runs 12 waste-detection rules across every ad." time="2 minutes" />
            <Step num="3" title="Save" body="Get a clear list of campaigns to pause, scale, or refresh — with the exact dollar impact." time="Always live" />
          </div>
        </div>
      </section>

      <section id="what" style={styles.findings}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionEyebrow}>What we find</div>
          <h2 style={styles.sectionTitle}>
            12 patterns that quietly<br />
            <span style={styles.heroAccent}>drain your budget.</span>
          </h2>
          <div style={styles.findingsGrid}>
            {findings.map((f) => (
              <div key={f.title} style={styles.findingCard}>
                <div style={{ ...styles.findingTag, ...severityStyle(f.severity) }}>{f.severity}</div>
                <h3 style={styles.findingTitle}>{f.title}</h3>
                <p style={styles.findingBody}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" style={styles.pricing}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionEyebrow}>Pricing</div>
          <h2 style={styles.sectionTitle}>
            Free during beta.<br />
            <span style={styles.heroAccent}>Forever, for the first 50.</span>
          </h2>
          <div style={styles.pricingCard}>
            <div style={styles.pricingHeader}>
              <div>
                <div style={styles.pricingTier}>BETA ACCESS</div>
                <div style={styles.pricingPrice}>
                  <span style={styles.priceAmount}>$0</span>
                  <span style={styles.pricePeriod}>/ month</span>
                </div>
              </div>
              <div style={styles.spotsTag}>{betaSpotsLeft} of 50 spots left</div>
            </div>
            <ul style={styles.pricingFeatures}>
              <li style={styles.pricingFeature}>✓ Unlimited campaigns scanned</li>
              <li style={styles.pricingFeature}>✓ Daily waste detection across 12 rules</li>
              <li style={styles.pricingFeature}>✓ Real-time alerts on flagged campaigns</li>
              <li style={styles.pricingFeature}>✓ Direct support from the founders</li>
              <li style={styles.pricingFeature}>✓ Beta users keep free access forever</li>
            </ul>
            <button onClick={handleConnect} style={styles.pricingCta}>Claim your beta spot →</button>
            <div style={styles.pricingFootnote}>
              Paid plans start at $99/mo after public launch. Beta users locked in free for life.
            </div>
          </div>
        </div>
      </section>

      <section style={styles.finalCta}>
        <div style={styles.sectionInner}>
          <h2 style={styles.finalTitle}>Stop guessing where the money went.</h2>
          <p style={styles.finalSub}>Connect your Meta account. See the truth in 5 minutes.</p>
          <button onClick={hasSession ? handleOpenDashboard : handleConnect} style={styles.primaryBtn}>
            {hasSession ? 'Open Dashboard →' : 'Connect Meta Ads — Free'}
          </button>
        </div>
      </section>

      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.logo}>
            <span style={styles.logoOpti}>Opti</span>
            <span style={styles.logoLens}>Lens</span>
          </div>
          <div style={styles.footerMeta}>
            <span>Built for brands that take ad spend seriously.</span>
            <span style={styles.footerCopyright}>© 2026 OptiLens</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function MetricCard({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: string }) {
  const valueColor = tone === 'green' ? '#34D399' : tone === 'amber' ? '#FBBF24' : tone === 'red' ? '#F87171' : '#fff'
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={{ ...styles.metricValue, color: valueColor }}>{value}</div>
      <div style={styles.metricSub}>{sub}</div>
    </div>
  )
}

function MiniTrendChart() {
  // Climbing waste trend — visually compelling for marketing
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
    <div style={styles.problemCard}>
      <div style={styles.problemNum}>{num}</div>
      <h3 style={styles.problemTitle}>{title}</h3>
      <p style={styles.problemBody}>{body}</p>
    </div>
  )
}

function Step({ num, title, body, time }: { num: string; title: string; body: string; time: string }) {
  return (
    <div style={styles.stepCard}>
      <div style={styles.stepNum}>{num}</div>
      <h3 style={styles.stepTitle}>{title}</h3>
      <p style={styles.stepBody}>{body}</p>
      <div style={styles.stepTime}>{time}</div>
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

const colors = {
  bg: '#0A0B0E',
  bgSecondary: '#101218',
  surface: '#1A1D24',
  surfaceLight: '#22262F',
  border: '#2D3340',
  borderLight: '#1F242D',
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
  page: {
    background: colors.bg, color: colors.text,
    fontFamily: fonts.body, minHeight: '100vh',
    overflow: 'hidden', position: 'relative',
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
    borderBottom: `1px solid ${colors.border}`,
    padding: '14px 0',
  },
  navInner: {
    maxWidth: 1280, margin: '0 auto', padding: '0 32px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  logo: { fontFamily: fonts.display, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' },
  logoOpti: { color: colors.text },
  logoLens: { color: colors.amber },
  navLinks: { display: 'flex', alignItems: 'center', gap: 32 },
  navLink: { color: colors.textSecondary, textDecoration: 'none', fontSize: 14, fontWeight: 500 },
  navCta: {
    background: colors.primary, color: '#0A0B0E', border: 'none',
    padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: fonts.body,
    boxShadow: '0 4px 12px rgba(255,255,255,0.1)',
  },
  hero: {
    minHeight: '100vh', paddingTop: 140, paddingBottom: 80,
    paddingLeft: 32, paddingRight: 32, maxWidth: 1280, margin: '0 auto',
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80,
    alignItems: 'center', position: 'relative', zIndex: 2,
  },
  heroInner: { maxWidth: 600 },
  eyebrow: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '6px 14px', background: 'rgba(251,191,36,0.1)',
    border: `1px solid rgba(251,191,36,0.3)`, borderRadius: 100,
    fontSize: 12, fontWeight: 500, color: colors.amber,
    marginBottom: 32, letterSpacing: '0.02em',
  },
  eyebrowDot: {
    width: 6, height: 6, background: colors.amber, borderRadius: '50%',
    boxShadow: `0 0 8px ${colors.amber}`, animation: 'pulse 2s infinite',
  },
  heroTitle: {
    fontFamily: fonts.display, fontSize: 72, fontWeight: 400,
    lineHeight: 1.02, letterSpacing: '-0.04em', marginBottom: 28,
  },
  heroAccent: { color: colors.amber, fontStyle: 'italic' },
  heroSub: {
    fontSize: 19, lineHeight: 1.55, color: colors.textSecondary,
    marginBottom: 40, maxWidth: 540,
  },
  heroActions: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 },
  primaryBtn: {
    background: colors.primary, color: '#0A0B0E', border: 'none',
    padding: '16px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600,
    cursor: 'pointer', fontFamily: fonts.body,
    boxShadow: '0 8px 24px rgba(255,255,255,0.12)',
  },
  secondaryBtn: { color: colors.text, padding: '16px 8px', fontSize: 15, fontWeight: 500 },
  heroTrust: { display: 'flex', gap: 12, fontSize: 13, color: colors.textTertiary },
  trustItem: { color: colors.textSecondary },
  trustDivider: { color: colors.border },

  heroVisual: { position: 'relative' },
  dashboardMock: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 14, padding: 20,
    boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(251,191,36,0.04), 0 0 60px rgba(251,191,36,0.04)',
  },
  mockHeader: {
    display: 'flex', alignItems: 'center', gap: 6,
    paddingBottom: 16, borderBottom: `1px solid ${colors.border}`, marginBottom: 16,
  },
  mockDot: { width: 10, height: 10, borderRadius: '50%', background: '#F87171' },
  mockDotLight: { width: 10, height: 10, borderRadius: '50%', background: colors.border },
  mockTitle: {
    fontSize: 11, color: colors.textTertiary, fontFamily: fonts.mono,
    marginLeft: 12, letterSpacing: '0.05em',
  },
  alertBanner: {
    background: colors.surfaceLight,
    border: `1px solid ${colors.border}`,
    borderLeft: `3px solid ${colors.amber}`,
    color: colors.text, padding: '14px 16px', borderRadius: 8,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 14,
  },
  alertLabel: { fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4, color: colors.amber },
  alertTitle: { fontSize: 13, fontWeight: 600, color: colors.text },
  alertNumber: { textAlign: 'right' },
  alertAmount: {
    display: 'block', fontFamily: fonts.display, fontSize: 24,
    fontWeight: 600, lineHeight: 1, color: colors.amber,
  },
  alertSub: { fontSize: 9, fontWeight: 600, color: colors.textSecondary },
  mockGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 },
  metricCard: {
    background: colors.surfaceLight,
    border: `1px solid ${colors.border}`,
    borderRadius: 8, padding: '12px 14px',
  },
  metricLabel: { fontSize: 9, color: colors.textTertiary, letterSpacing: '0.08em', marginBottom: 4, fontWeight: 600 },
  metricValue: { fontFamily: fonts.display, fontSize: 22, fontWeight: 500, lineHeight: 1, marginBottom: 4 },
  metricSub: { fontSize: 9, color: colors.textTertiary },

  /* CHART CARD INSIDE MOCK */
  chartCard: {
    background: colors.surfaceLight,
    border: `1px solid ${colors.border}`,
    borderRadius: 8, padding: '12px 14px', marginBottom: 14,
  },
  chartHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 11, fontWeight: 600, color: colors.text, letterSpacing: '0.02em',
  },
  chartLegend: {
    display: 'flex', alignItems: 'center', gap: 5,
  },
  legendDot: {
    width: 6, height: 6, background: colors.red, borderRadius: '50%',
  },
  legendText: { fontSize: 9, color: colors.textTertiary },

  campaignRow: {
    display: 'flex', alignItems: 'center',
    background: colors.surfaceLight,
    border: `1px solid ${colors.border}`,
    borderRadius: 8, padding: '10px 12px',
    marginBottom: 6, gap: 12,
  },
  campaignBar: { width: 3, height: 32, borderRadius: 2 },
  campaignInfo: { flex: 1 },
  campaignName: { fontSize: 12, fontWeight: 500 },
  campaignMeta: { fontSize: 10, color: colors.textTertiary, marginTop: 2 },
  pauseTag: {
    background: 'rgba(248,113,113,0.18)', color: colors.red,
    fontSize: 9, fontWeight: 700, padding: '4px 8px', borderRadius: 4, letterSpacing: '0.05em',
  },
  warnTag: {
    background: 'rgba(251,191,36,0.18)', color: colors.amber,
    fontSize: 9, fontWeight: 700, padding: '4px 8px', borderRadius: 4, letterSpacing: '0.05em',
  },
  scaleTag: {
    background: 'rgba(52,211,153,0.18)', color: colors.green,
    fontSize: 9, fontWeight: 700, padding: '4px 8px', borderRadius: 4, letterSpacing: '0.05em',
  },

  problem: { padding: '120px 32px', position: 'relative', zIndex: 2 },
  how: { padding: '120px 32px', background: colors.bgSecondary, position: 'relative', zIndex: 2 },
  findings: { padding: '120px 32px', position: 'relative', zIndex: 2 },
  pricing: { padding: '120px 32px', background: colors.bgSecondary, position: 'relative', zIndex: 2 },
  finalCta: { padding: '140px 32px', textAlign: 'center', position: 'relative', zIndex: 2 },

  sectionInner: { maxWidth: 1100, margin: '0 auto' },
  sectionEyebrow: {
    fontSize: 12, fontWeight: 600, letterSpacing: '0.15em',
    color: colors.amber, marginBottom: 20, textTransform: 'uppercase',
  },
  sectionTitle: {
    fontFamily: fonts.display, fontSize: 56, fontWeight: 400,
    lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 64,
  },

  problemGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 },
  problemCard: {
    padding: '32px 28px', background: colors.surface,
    border: `1px solid ${colors.border}`, borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  problemNum: { fontFamily: fonts.mono, fontSize: 12, color: colors.amber, marginBottom: 16, letterSpacing: '0.1em' },
  problemTitle: { fontFamily: fonts.display, fontSize: 22, fontWeight: 500, marginBottom: 12, letterSpacing: '-0.01em' },
  problemBody: { color: colors.textSecondary, lineHeight: 1.6, fontSize: 15 },

  steps: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 },
  stepCard: {
    padding: '36px 32px', border: `1px solid ${colors.border}`,
    borderRadius: 12, background: colors.surface,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  stepNum: { fontFamily: fonts.display, fontSize: 56, fontWeight: 300, color: colors.amber, lineHeight: 1, marginBottom: 24 },
  stepTitle: { fontFamily: fonts.display, fontSize: 24, fontWeight: 500, marginBottom: 12 },
  stepBody: { color: colors.textSecondary, lineHeight: 1.6, fontSize: 14, marginBottom: 20 },
  stepTime: { fontSize: 11, color: colors.textTertiary, fontFamily: fonts.mono, letterSpacing: '0.05em' },

  findingsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 },
  findingCard: {
    padding: '24px 22px', background: colors.surface,
    border: `1px solid ${colors.border}`, borderRadius: 10,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  findingTag: {
    display: 'inline-block', fontSize: 10, fontWeight: 700,
    letterSpacing: '0.1em', padding: '3px 8px', borderRadius: 4, marginBottom: 14,
  },
  findingTitle: { fontFamily: fonts.display, fontSize: 18, fontWeight: 500, marginBottom: 8 },
  findingBody: { color: colors.textSecondary, fontSize: 14, lineHeight: 1.55 },

  pricingCard: {
    background: colors.surface,
    border: `1px solid rgba(251,191,36,0.3)`,
    borderRadius: 16, padding: 48, maxWidth: 560, margin: '0 auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 80px rgba(251,191,36,0.06)',
  },
  pricingHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  pricingTier: { fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: colors.amber, marginBottom: 8 },
  pricingPrice: { display: 'flex', alignItems: 'baseline', gap: 8 },
  priceAmount: { fontFamily: fonts.display, fontSize: 64, fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1 },
  pricePeriod: { color: colors.textTertiary, fontSize: 16 },
  spotsTag: {
    background: 'rgba(251,191,36,0.15)', color: colors.amber,
    fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 6,
  },
  pricingFeatures: { listStyle: 'none', padding: 0, marginBottom: 32 },
  pricingFeature: {
    padding: '12px 0', borderBottom: `1px solid ${colors.borderLight}`,
    fontSize: 15, color: colors.textSecondary,
  },
  pricingCta: {
    width: '100%', background: colors.primary, color: '#0A0B0E',
    border: 'none', padding: '18px', borderRadius: 10,
    fontSize: 16, fontWeight: 600, cursor: 'pointer',
    fontFamily: fonts.body, marginBottom: 16,
    boxShadow: '0 8px 24px rgba(255,255,255,0.12)',
  },
  pricingFootnote: { fontSize: 13, color: colors.textTertiary, textAlign: 'center', lineHeight: 1.5 },

  finalTitle: { fontFamily: fonts.display, fontSize: 64, fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 20 },
  finalSub: { fontSize: 18, color: colors.textSecondary, marginBottom: 40 },

  footer: {
    borderTop: `1px solid ${colors.border}`, padding: '40px 32px',
    position: 'relative', zIndex: 2,
  },
  footerInner: {
    maxWidth: 1280, margin: '0 auto', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: 16,
  },
  footerMeta: { display: 'flex', gap: 24, fontSize: 13, color: colors.textTertiary },
  footerCopyright: { color: colors.textTertiary },
}