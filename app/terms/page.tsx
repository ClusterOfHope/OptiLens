'use client'

import Link from 'next/link'

export default function TermsPage() {
  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <Link href="/" style={S.logoLink}>
          <span style={S.logoOpti}>Opti</span><span style={S.logoLens}>Lens</span>
        </Link>
        <Link href="/" style={S.backLink}>← Back to home</Link>
      </nav>

      <main style={S.main}>
        <div style={S.eyebrow}>LEGAL</div>
        <h1 style={S.title}>Terms of Service</h1>
        <p style={S.lastUpdated}>Last updated: April 2026</p>

        <Section title="1. Acceptance of Terms">
          By accessing or using OptiLens (the &quot;Service&quot;), you agree to be bound by these Terms of Service.
          If you do not agree to these terms, do not use the Service.
        </Section>

        <Section title="2. Description of Service">
          OptiLens is a Software-as-a-Service platform that analyzes Meta Ads (Facebook and Instagram) campaign data
          to identify wasted spend, inefficiencies, and optimization opportunities. The Service operates in read-only mode
          and does not modify, pause, or delete your campaigns.
        </Section>

        <Section title="3. Beta Program">
          OptiLens is currently in beta. The Service is provided &quot;as-is&quot; with no service-level guarantees.
          Beta users who sign up during the beta period (first 50 accounts) receive free access in perpetuity, even after public launch.
          Public pricing will start at $99/month for new accounts after beta.
        </Section>

        <Section title="4. Account Eligibility">
          You must be at least 18 years old and have legal authority to bind your business to these Terms.
          You must own or have authorized access to the Meta Ads accounts you connect.
          You are responsible for maintaining the security of your account credentials.
        </Section>

        <Section title="5. Acceptable Use">
          You agree not to:
          <ul style={S.list}>
            <li>Use the Service for any illegal purpose or in violation of any laws</li>
            <li>Attempt to reverse engineer, decompile, or extract source code</li>
            <li>Use the Service to violate Meta&apos;s Platform Terms or any third-party terms</li>
            <li>Resell, sublicense, or redistribute the Service without written authorization</li>
            <li>Attempt to access other users&apos; data or accounts</li>
            <li>Overload our infrastructure with automated requests</li>
          </ul>
        </Section>

        <Section title="6. Data Ownership">
          You retain all ownership of your campaign data, ad performance data, and any other data you bring into the Service.
          We process this data solely to provide the Service. See our{' '}
          <Link href="/privacy" style={S.link}>Privacy Policy</Link> for details on how data is handled.
        </Section>

        <Section title="7. Disclaimers">
          The Service provides analytical insights and recommendations based on automated rules and pattern detection.
          OptiLens does not guarantee specific results, increased revenue, or reduced ad waste. All optimization decisions
          remain solely your responsibility. We are not responsible for changes you make to your ad campaigns based on our recommendations.
          THE SERVICE IS PROVIDED &quot;AS-IS&quot; WITHOUT WARRANTIES OF ANY KIND.
        </Section>

        <Section title="8. Limitation of Liability">
          To the maximum extent permitted by law, OptiLens and its operators shall not be liable for any indirect, incidental,
          consequential, or punitive damages arising from your use of the Service. Total liability in any case shall not exceed
          the amount you paid for the Service in the 12 months preceding the claim (or $0 for free beta users).
        </Section>

        <Section title="9. Termination">
          You may terminate your account at any time by disconnecting all integrations and emailing support@optilens.io.
          We may terminate or suspend your account if you breach these Terms, or if continued operation poses legal or security risk.
          Upon termination, your data will be deleted within 30 days.
        </Section>

        <Section title="10. Changes to Terms">
          We may modify these Terms from time to time. Material changes will be communicated via email at least 30 days before they take effect.
          Continued use of the Service after changes constitutes acceptance of the modified Terms.
        </Section>

        <Section title="11. Governing Law">
          These Terms are governed by the laws of the jurisdiction in which OptiLens is registered, without regard to conflict of law principles.
          Any disputes shall be resolved in the courts of that jurisdiction.
        </Section>

        <Section title="12. Contact">
          Questions about these Terms can be sent to:{' '}
          <a href="mailto:support@optilens.io" style={S.link}>support@optilens.io</a>
        </Section>

        <div style={S.footer}>
          <Link href="/" style={S.footerLink}>← Back to OptiLens</Link>
          <Link href="/privacy" style={S.footerLink}>Privacy Policy →</Link>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={S.section}>
      <h2 style={S.sectionTitle}>{title}</h2>
      <div style={S.sectionBody}>{children}</div>
    </section>
  )
}

const C = {
  bg: '#0A0B0E', surface: '#1A1D24', border: '#2D3340',
  text: '#FFFFFF', textSecondary: '#A0A8B5', textTertiary: '#6B7280',
  amber: '#FBBF24',
}
const F = {
  display: '"Fraunces", Georgia, serif',
  body: '"Inter", -apple-system, system-ui, sans-serif',
  mono: '"JetBrains Mono", Menlo, monospace',
}

const S: Record<string, React.CSSProperties> = {
  page: { background: C.bg, color: C.text, fontFamily: F.body, minHeight: '100vh' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${C.border}` },
  logoLink: { fontFamily: F.display, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', textDecoration: 'none' },
  logoOpti: { color: C.text },
  logoLens: { color: C.amber },
  backLink: { color: C.textSecondary, fontSize: 13, textDecoration: 'none' },
  main: { maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' },
  eyebrow: { fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: C.amber, marginBottom: 16 },
  title: { fontFamily: F.display, fontSize: 48, fontWeight: 500, letterSpacing: '-0.03em', marginBottom: 12, lineHeight: 1.1 },
  lastUpdated: { fontSize: 13, color: C.textTertiary, fontFamily: F.mono, marginBottom: 48 },
  section: { marginBottom: 36, paddingBottom: 36, borderBottom: `1px solid ${C.border}` },
  sectionTitle: { fontFamily: F.display, fontSize: 22, fontWeight: 500, marginBottom: 14, letterSpacing: '-0.01em' },
  sectionBody: { fontSize: 15, color: C.textSecondary, lineHeight: 1.7 },
  list: { paddingLeft: 24, marginTop: 8, marginBottom: 8 },
  link: { color: C.amber, textDecoration: 'none', borderBottom: `1px solid ${C.amber}` },
  footer: { display: 'flex', justifyContent: 'space-between', marginTop: 48 },
  footerLink: { color: C.textSecondary, fontSize: 14, textDecoration: 'none' },
}
