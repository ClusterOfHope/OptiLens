'use client'

import { useState, useEffect } from 'react'

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [betaSpotsLeft] = useState(47)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)

    // Check if returning user (cookie-based session)
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => setHasSession(!!d?.user))
      .catch(() => {})

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleConnect = () => {
    window.location.href = '/api/auth/meta/connect'
  }

  const handleOpenDashboard = () => {
    window.location.href = '/dashboard'
  }

  return (
    <div style={styles.page}>
      <div style={styles.grain} />

      {/* NAV */}
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
              <button onClick={handleOpenDashboard} style={styles.navCta}>
                Open Dashboard →
              </button>
            ) : (
              <>
                <a onClick={handleConnect} style={{ ...styles.navLink, cursor: 'pointer' }}>
                  Sign in
                </a>
                <button onClick={handleConnect} style={styles.navCta}>
                  Connect Meta Ads →
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
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
            <a href="#how" style={styles.secondaryBtn}>
              See how it works →
            </a>
          </div>

          <div style={styles.heroTrust}>
            <span style={styles.trustItem}>✓ 60-second setup</span>
            <span style={styles.trustDivider}>·</span>
            <span style={styles.trustItem}>✓ Read-only access</span>
            <span style={styles.trustDivider}>·</span>
            <span style={styles.trustItem}>✓ No credit card</span>
          </div>
        </div>

        {/* Hero visual: stylized dashboard preview */}
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

            <div style={styles.campaignRow}>
              <div style={{ ...styles.campaignBar, background: '#F87171' }} />
              <div style={styles.campaignInfo}>
                <div style={styles.campaignName}>Black Friday Retargeting</div>
                <div style={styles.campaignMeta}>$6,200 spent · $0 revenue</div>
              </div>
              <div style={styles.pauseTag}>PAUSE NOW</div>
            </div>
            <div style={styles.campaignRow}>
              <div style={{ ...styles.campaignBar, background: '#FBBF24' }} />
              <div style={styles.campaignInfo}>
                <div style={styles.campaignName}>Brand Awareness Broad</div>
                <div style={styles.campaignMeta}>$3,100 spent · 0.90x ROAS</div>
              </div>
              <div style={styles.warnTag}>HIGH WASTE</div>
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

      {/* PROBLEM */}
      <section style={styles.problem}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionEyebrow}>The problem</div>
          <h2 style={styles.sectionTitle}>
            Meta&apos;s dashboard makes it<br />
            <span style={styles.heroAccent}>almost impossible</span> to spot waste.
          </h2>
          <div style={styles.problemGrid}>
            <ProblemCard
              num="01"
              title="Surface metrics lie"
              body="A campaign with 'good CTR' can still produce zero conversions. Meta highlights the wrong numbers."
            />
            <ProblemCard
              num="02"
              title="Waste compounds quietly"
              body="A bad audience burns $200/day. By the time you notice at month-end, you've lost $6,000."
            />
            <ProblemCard
              num="03"
              title="Attribution is broken"
              body="Meta over-reports purchases by 20–40%. Your real ROAS is lower than what you&apos;re shown."
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={styles.how}>
        <div style={styles.sectionInner}>
          <div style={styles.sectionEyebrow}>How it works</div>
          <h2 style={styles.sectionTitle}>
            From connection to first finding<br />
            <span style={styles.heroAccent}>in under 5 minutes.</span>
          </h2>

          <div style={styles.steps}>
            <Step
              num="1"
              title="Connect"
              body="Click connect, authorize Meta, done. Read-only access — we never touch your campaigns."
              time="60 seconds"
            />
            <Step
              num="2"
              title="Scan"
              body="OptiLens pulls 30 days of campaign data and runs 12 waste-detection rules across every ad."
              time="2 minutes"
            />
            <Step
              num="3"
              title="Save"
              body="Get a clear list of campaigns to pause, scale, or refresh — with the exact dollar impact."
              time="Always live"
            />
          </div>
        </div>
      </section>

      {/* WHAT WE FIND */}
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

      {/* PRICING */}
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
              <div style={styles.spotsTag}>
                {betaSpotsLeft} of 50 spots left
              </div>
            </div>

            <ul style={styles.pricingFeatures}>
              <li style={styles.pricingFeature}>✓ Unlimited campaigns scanned</li>
              <li style={styles.pricingFeature}>✓ Daily waste detection across 12 rules</li>
              <li style={styles.pricingFeature}>✓ Real-time alerts on flagged campaigns</li>
              <li style={styles.pricingFeature}>✓ Direct support from the founders</li>
              <li style={styles.pricingFeature}>✓ Beta users keep free access forever</li>
            </ul>

            <button onClick={handleConnect} style={styles.pricingCta}>
              Claim your beta spot →
            </button>

            <div style={styles.pricingFootnote}>
              Paid plans start at $99/mo after public launch. Beta users locked in free for life.
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={styles.finalCta}>
        <div style={styles.sectionInner}>
          <h2 style={styles.finalTitle}>
            Stop guessing where the money went.
          </h2>
          <p style={styles.finalSub}>
            Connect your Meta account. See the truth in 5 minutes.
          </p>
          <button onClick={hasSession ? handleOpenDashboard : handleConnect} style={styles.primaryBtn}>
            {hasSession ? 'Open Dashboard →' : 'Connect Meta Ads — Free'}
          </button>
        </div>
      </section>

      {/* FOOTER */}
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

/* ─── Sub-components ─────────────────────────────── */

function MetricCard({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: string }) {
  const valueColor =
    tone === 'green' ? '#34D399' :
    tone === 'amber' ? '#FBBF24' :
    tone === 'red' ? '#F87171' : '#fff'
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={{ ...styles.metricValue, color: valueColor }}>{value}</div>
      <div style={styles.metricSub}>{sub}</div>
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
  if (sev === 'CRITICAL') return { background: 'rgba(248,113,113,0.12)', color: '#F87171' }
  if (sev === 'HIGH') return { background: 'rgba(251,191,36,0.12)', color: '#FBBF24' }
  return { background: 'rgba(144,144,160,0.12)', color: '#9090A0' }
}

const findings = [
  { severity: 'CRITICAL', title: 'Zero conversions, real spend', body: 'Campaigns burning $100+/day with no purchases over 7 days.' },
  { severity: 'HIGH', title: 'Audience fatigue', body: 'Frequency above 4.0 with declining CTR — your audience is tuning out.' },
  { severity: 'HIGH', title: 'ROAS below break-even', body: 'Spending $1 to make 80¢. Quietly losing money on every dollar.' },
  { severity: 'MEDIUM', title: 'Creative fatigue', body: 'CTR dropped 40%+ over last 14 days — time to refresh the ad.' },
  { severity: 'MEDIUM', title: 'Negative trend', body: 'ROAS dropping week over week — campaign is dying, intervene now.' },
  { severity: 'LOW', title: 'Budget pacing issues', body: 'Spending too fast or too slow vs. monthly target.' },
]

/* ─── Styles ─────────────────────────────────────── */

const colors = {
  bg: '#1F1F23',
  bgSecondary: '#1A1A1E',
  surface: '#28282E',
  surfaceLight: '#2E2E34',
  border: '#2E2E34',
  borderLight: '#26262C',
  text: '#FFFFFF',
  textSecondary: '#9090A0',
  textTertiary: '#6B6B78',
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
    background: colors.bg,
    color: colors.text,
    fontFamily: fonts.body,
    minHeight: '100vh',
    overflow: 'hidden',
    position: 'relative',
  },
  grain: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    opacity: 0.03,
    background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' /%3E%3C/svg%3E")',
    zIndex: 1,
  },

  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    transition: 'all 0.3s ease',
    padding: '20px 0',
  },
  navScrolled: {
    background: 'rgba(31,31,35,0.85)',
    backdropFilter: 'blur(20px)',
    borderBottom: `0.5px solid ${colors.border}`,
    padding: '14px 0',
  },
  navInner: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '0 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: '-0.02em',
  },
  logoOpti: { color: colors.text },
  logoLens: { color: colors.amber },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: 32,
  },
  navLink: {
    color: colors.textSecondary,
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    transition: 'color 0.2s',
  },
  navCta: {
    background: colors.primary,
    color: '#1F1F23',
    border: 'none',
    padding: '10px 18px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: fonts.body,
    transition: 'transform 0.15s, box-shadow 0.15s',
  },

  hero: {
    minHeight: '100vh',
    paddingTop: 140,
    paddingBottom: 80,
    paddingLeft: 32,
    paddingRight: 32,
    maxWidth: 1280,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 80,
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
  },
  heroInner: { maxWidth: 600 },
  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 14px',
    background: 'rgba(251,191,36,0.08)',
    border: `0.5px solid rgba(251,191,36,0.25)`,
    borderRadius: 100,
    fontSize: 12,
    fontWeight: 500,
    color: colors.amber,
    marginBottom: 32,
    letterSpacing: '0.02em',
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    background: colors.amber,
    borderRadius: '50%',
    boxShadow: `0 0 8px ${colors.amber}`,
    animation: 'pulse 2s infinite',
  },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: 72,
    fontWeight: 400,
    lineHeight: 1.02,
    letterSpacing: '-0.04em',
    marginBottom: 28,
  },
  heroAccent: {
    color: colors.amber,
    fontStyle: 'italic',
  },
  heroSub: {
    fontSize: 19,
    lineHeight: 1.55,
    color: colors.textSecondary,
    marginBottom: 40,
    maxWidth: 540,
  },
  heroActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  primaryBtn: {
    background: colors.primary,
    color: '#1F1F23',
    border: 'none',
    padding: '16px 28px',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: fonts.body,
    boxShadow: '0 8px 24px rgba(255,255,255,0.08)',
    transition: 'transform 0.15s',
  },
  secondaryBtn: {
    color: colors.text,
    textDecoration: 'none',
    padding: '16px 8px',
    fontSize: 15,
    fontWeight: 500,
    transition: 'color 0.2s',
  },
  heroTrust: {
    display: 'flex',
    gap: 12,
    fontSize: 13,
    color: colors.textTertiary,
  },
  trustItem: { color: colors.textSecondary },
  trustDivider: { color: colors.border },

  heroVisual: { position: 'relative' },
  dashboardMock: {
    background: colors.surface,
    border: `0.5px solid ${colors.border}`,
    borderRadius: 14,
    padding: 20,
    boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
  },
  mockHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 16,
    borderBottom: `0.5px solid ${colors.border}`,
    marginBottom: 16,
  },
  mockDot: { width: 10, height: 10, borderRadius: '50%', background: '#F87171' },
  mockDotLight: { width: 10, height: 10, borderRadius: '50%', background: colors.border },
  mockTitle: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    marginLeft: 12,
    letterSpacing: '0.05em',
  },
  alertBanner: {
    background: colors.surfaceLight,
    borderLeft: `2px solid ${colors.amber}`,
    color: colors.text,
    padding: '14px 16px',
    borderRadius: 8,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  alertLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.1em',
    marginBottom: 4,
    color: colors.amber,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
  },
  alertNumber: { textAlign: 'right' },
  alertAmount: {
    display: 'block',
    fontFamily: fonts.display,
    fontSize: 24,
    fontWeight: 600,
    lineHeight: 1,
    color: colors.amber,
  },
  alertSub: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.textSecondary,
  },
  mockGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: 14,
  },
  metricCard: {
    background: colors.surfaceLight,
    borderRadius: 8,
    padding: '10px 12px',
  },
  metricLabel: {
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: '0.08em',
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: 500,
    lineHeight: 1,
    marginBottom: 3,
  },
  metricSub: {
    fontSize: 9,
    color: colors.textTertiary,
  },
  campaignRow: {
    display: 'flex',
    alignItems: 'center',
    background: colors.surfaceLight,
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: 6,
    gap: 12,
  },
  campaignBar: {
    width: 3,
    height: 32,
    borderRadius: 2,
  },
  campaignInfo: { flex: 1 },
  campaignName: { fontSize: 12, fontWeight: 500 },
  campaignMeta: { fontSize: 10, color: colors.textTertiary, marginTop: 2 },
  pauseTag: {
    background: 'rgba(248,113,113,0.15)',
    color: colors.red,
    fontSize: 9,
    fontWeight: 700,
    padding: '4px 8px',
    borderRadius: 4,
    letterSpacing: '0.05em',
  },
  warnTag: {
    background: 'rgba(251,191,36,0.15)',
    color: colors.amber,
    fontSize: 9,
    fontWeight: 700,
    padding: '4px 8px',
    borderRadius: 4,
    letterSpacing: '0.05em',
  },
  scaleTag: {
    background: 'rgba(52,211,153,0.15)',
    color: colors.green,
    fontSize: 9,
    fontWeight: 700,
    padding: '4px 8px',
    borderRadius: 4,
    letterSpacing: '0.05em',
  },

  problem: { padding: '120px 32px', position: 'relative', zIndex: 2 },
  how: { padding: '120px 32px', background: colors.bgSecondary, position: 'relative', zIndex: 2 },
  findings: { padding: '120px 32px', position: 'relative', zIndex: 2 },
  pricing: { padding: '120px 32px', background: colors.bgSecondary, position: 'relative', zIndex: 2 },
  finalCta: { padding: '140px 32px', textAlign: 'center', position: 'relative', zIndex: 2 },

  sectionInner: { maxWidth: 1100, margin: '0 auto' },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.15em',
    color: colors.amber,
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 56,
    fontWeight: 400,
    lineHeight: 1.05,
    letterSpacing: '-0.03em',
    marginBottom: 64,
  },

  problemGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 24,
  },
  problemCard: {
    padding: '32px 28px',
    background: colors.surface,
    border: `0.5px solid ${colors.border}`,
    borderRadius: 12,
  },
  problemNum: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.amber,
    marginBottom: 16,
    letterSpacing: '0.1em',
  },
  problemTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: 500,
    marginBottom: 12,
    letterSpacing: '-0.01em',
  },
  problemBody: {
    color: colors.textSecondary,
    lineHeight: 1.6,
    fontSize: 15,
  },

  steps: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 32,
  },
  stepCard: {
    padding: '36px 32px',
    border: `0.5px solid ${colors.border}`,
    borderRadius: 12,
    background: colors.surface,
  },
  stepNum: {
    fontFamily: fonts.display,
    fontSize: 56,
    fontWeight: 300,
    color: colors.amber,
    lineHeight: 1,
    marginBottom: 24,
  },
  stepTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    fontWeight: 500,
    marginBottom: 12,
  },
  stepBody: {
    color: colors.textSecondary,
    lineHeight: 1.6,
    fontSize: 14,
    marginBottom: 20,
  },
  stepTime: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    letterSpacing: '0.05em',
  },

  findingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
  },
  findingCard: {
    padding: '24px 22px',
    background: colors.surface,
    border: `0.5px solid ${colors.border}`,
    borderRadius: 10,
  },
  findingTag: {
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    padding: '3px 8px',
    borderRadius: 4,
    marginBottom: 14,
  },
  findingTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: 500,
    marginBottom: 8,
  },
  findingBody: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 1.55,
  },

  pricingCard: {
    background: colors.surface,
    border: `0.5px solid ${colors.amber}40`,
    borderRadius: 16,
    padding: 48,
    maxWidth: 560,
    margin: '0 auto',
    boxShadow: '0 0 80px rgba(251,191,36,0.04)',
  },
  pricingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  pricingTier: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.15em',
    color: colors.amber,
    marginBottom: 8,
  },
  pricingPrice: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
  },
  priceAmount: {
    fontFamily: fonts.display,
    fontSize: 64,
    fontWeight: 400,
    letterSpacing: '-0.04em',
    lineHeight: 1,
  },
  pricePeriod: {
    color: colors.textTertiary,
    fontSize: 16,
  },
  spotsTag: {
    background: 'rgba(251,191,36,0.12)',
    color: colors.amber,
    fontSize: 12,
    fontWeight: 600,
    padding: '6px 12px',
    borderRadius: 6,
  },
  pricingFeatures: {
    listStyle: 'none',
    padding: 0,
    marginBottom: 32,
  },
  pricingFeature: {
    padding: '12px 0',
    borderBottom: `0.5px solid ${colors.borderLight}`,
    fontSize: 15,
    color: colors.textSecondary,
  },
  pricingCta: {
    width: '100%',
    background: colors.primary,
    color: '#1F1F23',
    border: 'none',
    padding: '18px',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: fonts.body,
    marginBottom: 16,
  },
  pricingFootnote: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 1.5,
  },

  finalTitle: {
    fontFamily: fonts.display,
    fontSize: 64,
    fontWeight: 400,
    lineHeight: 1.05,
    letterSpacing: '-0.03em',
    marginBottom: 20,
  },
  finalSub: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 40,
  },

  footer: {
    borderTop: `0.5px solid ${colors.border}`,
    padding: '40px 32px',
    position: 'relative',
    zIndex: 2,
  },
  footerInner: {
    maxWidth: 1280,
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  footerMeta: {
    display: 'flex',
    gap: 24,
    fontSize: 13,
    color: colors.textTertiary,
  },
  footerCopyright: { color: colors.textTertiary },
} 