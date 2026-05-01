'use client'

import Link from 'next/link'

export default function PrivacyPolicyPage() {
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
        <h1 style={S.title}>Privacy Policy</h1>
        <p style={S.lastUpdated}>Last updated: April 2026</p>

        <Section title="1. Introduction">
          OptiLens (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates optilens.io (the &quot;Service&quot;).
          This page explains what information we collect, how we use it, and your rights regarding your data.
          By using OptiLens, you agree to the collection and use of information in accordance with this policy.
        </Section>

        <Section title="2. Information We Collect">
          When you use OptiLens, we collect:
          <ul style={S.list}>
            <li>Basic account information (name, email) provided by Meta during OAuth authentication</li>
            <li>Read-only access to your Meta Ads data including campaigns, ad sets, ads, and performance metrics</li>
            <li>If connected: read-only access to your Shopify orders for attribution analysis</li>
            <li>Usage information about how you interact with the Service</li>
          </ul>
          We do NOT collect payment information, store passwords, or access any data beyond what is needed to detect ad waste.
        </Section>

        <Section title="3. How We Use Your Information">
          Your data is used exclusively to:
          <ul style={S.list}>
            <li>Detect waste and inefficiencies in your ad campaigns</li>
            <li>Display your performance dashboards and analytics</li>
            <li>Provide actionable recommendations</li>
            <li>Improve the Service (in aggregated, anonymized form only)</li>
          </ul>
          We never sell your data. We never use your campaign data to train AI models.
          We never share your data with third parties for marketing purposes.
        </Section>

        <Section title="4. Data Security">
          OAuth access tokens are stored encrypted in our database. All data transmission uses HTTPS/TLS.
          Our infrastructure is hosted on Vercel and Supabase, which maintain SOC 2 compliance and industry-standard security practices.
          We follow the principle of least privilege — OptiLens never requests write access to your Meta or Shopify accounts.
        </Section>

        <Section title="5. Data Retention">
          Your data is retained for as long as your account is active. If you disconnect your Meta or Shopify account, the access token is deleted immediately.
          Historical campaign data may be retained in anonymized form for product improvement purposes.
          You can request full data deletion at any time by emailing support@optilens.io.
        </Section>

        <Section title="6. Meta API Compliance">
          OptiLens uses Meta&apos;s official Marketing API in accordance with Meta&apos;s Platform Terms and Developer Policies.
          We request only the minimum permissions needed: ads_read, ads_management (for read operations), and business_management.
          We do not store, share, or display Meta user data beyond what is necessary to provide the Service.
        </Section>

        <Section title="7. Your Rights">
          You have the right to:
          <ul style={S.list}>
            <li>Access the data we hold about you</li>
            <li>Request correction or deletion of your data</li>
            <li>Disconnect your accounts at any time</li>
            <li>Export your data in a machine-readable format</li>
            <li>Withdraw consent for data processing</li>
          </ul>
          To exercise any of these rights, contact us at support@optilens.io.
        </Section>

        <Section title="8. Cookies">
          We use a single essential cookie (optilens_uid) to maintain your session. This cookie is httpOnly,
          secure, and expires after 60 days. We do not use any third-party tracking cookies, analytics scripts,
          or advertising pixels.
        </Section>

        <Section title="9. Changes to This Policy">
          We may update this Privacy Policy from time to time. Material changes will be communicated via email
          to all active users at least 30 days before the change takes effect.
        </Section>

        <Section title="10. Contact">
          Questions about this Privacy Policy or your data can be sent to:{' '}
          <a href="mailto:support@optilens.io" style={S.link}>support@optilens.io</a>
        </Section>

        <div style={S.footer}>
          <Link href="/" style={S.footerLink}>← Back to OptiLens</Link>
          <Link href="/terms" style={S.footerLink}>Terms of Service →</Link>
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
