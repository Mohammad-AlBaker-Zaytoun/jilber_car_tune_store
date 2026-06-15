import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy | JILBER Performance',
  description: 'How JILBER Performance Engineering uses cookies and browser storage on its website.',
};

const LAST_UPDATED = 'May 10, 2025';

export default function CookiePolicyPage() {
  return (
    <div className="bg-zinc-950 pt-28 lg:pt-32 pb-24 min-h-screen">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-7 h-px bg-cyan-400 shrink-0" aria-hidden="true" />
            <span className="text-[10px] text-cyan-400 tracking-[0.3em] uppercase font-bold">
              Legal
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none mb-4">
            COOKIE POLICY
          </h1>
          <p className="text-xs text-zinc-600 tracking-widest uppercase">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <div className="flex flex-col gap-6 text-sm text-zinc-400 leading-relaxed">

          {/* Intro */}
          <div className="border border-zinc-800/50 bg-zinc-900/20 p-7">
            <p>
              This Cookie Policy explains how JILBER Performance Engineering (&ldquo;JILBER&rdquo;,
              &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) uses cookies and
              similar browser storage technologies on our website. By continuing to use our
              website, you consent to our use of these technologies as described below.
            </p>
          </div>

          {/* 1 */}
          <Section title="1. What Are Cookies?">
            <p>
              Cookies are small text files placed on your device by a website when you visit it.
              They are widely used to make websites work efficiently, remember your preferences,
              and provide analytical information to site owners. Cookies set by the website you
              are visiting are called &ldquo;first-party cookies&rdquo;. Cookies set by parties
              other than the website you are visiting are called &ldquo;third-party cookies&rdquo;.
            </p>
          </Section>

          {/* 2 */}
          <Section title="2. Cookies and Storage We Use">
            <div className="flex flex-col gap-5 mt-1">

              {/* Auth cookie */}
              <div className="border border-zinc-800/30 bg-zinc-900/30 p-5">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="text-[10px] font-black text-white tracking-widest uppercase">
                    jilber-session
                  </span>
                  <span className="text-[9px] border border-cyan-400/30 text-cyan-400 px-2 py-0.5 font-bold tracking-wide uppercase">
                    Strictly Necessary
                  </span>
                  <span className="text-[9px] border border-zinc-700 text-zinc-500 px-2 py-0.5 font-bold tracking-wide uppercase">
                    First-party · httpOnly cookie
                  </span>
                </div>
                <p>
                  An <strong className="text-zinc-300">httpOnly, secure session cookie</strong>{' '}
                  used to keep you signed in to your JILBER account. It contains a cryptographically
                  signed JSON Web Token (JWT) that identifies your session. Because it is httpOnly,
                  JavaScript running in the browser cannot read it — this protects you against
                  cross-site scripting attacks. It cannot be used to track your browsing across
                  other websites.
                </p>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Type', value: 'httpOnly cookie' },
                    { label: 'Duration', value: '7 days' },
                    { label: 'Purpose', value: 'Authentication' },
                    { label: 'Third party', value: 'No' },
                  ].map(({ label, value }) => (
                    <div key={label} className="border border-zinc-800/40 bg-zinc-900/40 px-3 py-2">
                      <p className="text-[9px] text-zinc-600 tracking-widest uppercase font-bold">{label}</p>
                      <p className="text-xs text-zinc-300 font-semibold mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart localStorage */}
              <div className="border border-zinc-800/30 bg-zinc-900/30 p-5">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="text-[10px] font-black text-white tracking-widest uppercase">
                    jilber-cart
                  </span>
                  <span className="text-[9px] border border-cyan-400/30 text-cyan-400 px-2 py-0.5 font-bold tracking-wide uppercase">
                    Strictly Necessary
                  </span>
                  <span className="text-[9px] border border-zinc-700 text-zinc-500 px-2 py-0.5 font-bold tracking-wide uppercase">
                    First-party · localStorage
                  </span>
                </div>
                <p>
                  A <strong className="text-zinc-300">localStorage entry</strong> that stores the
                  contents of your shopping cart (product IDs, names, quantities, and prices) so
                  that your cart persists between browser sessions. This data never leaves your
                  device unless you proceed to checkout. It does not contain any personal
                  information.
                </p>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Type', value: 'localStorage' },
                    { label: 'Duration', value: 'Until cleared' },
                    { label: 'Purpose', value: 'Cart persistence' },
                    { label: 'Third party', value: 'No' },
                  ].map(({ label, value }) => (
                    <div key={label} className="border border-zinc-800/40 bg-zinc-900/40 px-3 py-2">
                      <p className="text-[9px] text-zinc-600 tracking-widest uppercase font-bold">{label}</p>
                      <p className="text-xs text-zinc-300 font-semibold mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </Section>

          {/* 3 */}
          <Section title="3. What We Do Not Use">
            <div className="flex flex-col gap-3">
              <p>We do <strong className="text-zinc-300">not</strong> use:</p>
              <ul className="list-none flex flex-col gap-2">
                {[
                  'Third-party advertising or tracking cookies.',
                  'Cross-site tracking technologies.',
                  'Analytics platforms that fingerprint individual users.',
                  'Social media tracking pixels.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-cyan-400/50 mt-2 shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <p>
                We keep our cookie footprint minimal and purposeful. We will update this policy
                if that changes.
              </p>
            </div>
          </Section>

          {/* 4 */}
          <Section title="4. Managing Cookies and Storage">
            <div className="flex flex-col gap-3">
              <p>
                <strong className="text-zinc-300">Session cookie.</strong> You can sign out of
                your account at any time using the &ldquo;Sign Out&rdquo; option in the navigation
                menu. This clears the session cookie immediately. The cookie will also expire
                automatically after 7 days of inactivity.
              </p>
              <p>
                <strong className="text-zinc-300">Cart data.</strong> You can clear your cart
                by removing all items in the cart page. You can also clear all localStorage data
                for this site through your browser&rsquo;s developer tools or privacy settings.
              </p>
              <p>
                <strong className="text-zinc-300">Browser controls.</strong> Most browsers allow
                you to block or delete cookies and clear localStorage through their settings. Note
                that blocking the session cookie will prevent you from signing in to your account,
                and clearing localStorage will empty your cart.
              </p>
            </div>
          </Section>

          {/* 5 */}
          <Section title="5. Changes to This Policy">
            <p>
              We may update this Cookie Policy to reflect changes in the technologies we use or
              applicable law. The date at the top of this page shows the most recent revision.
              Continued use of our website after an update constitutes acceptance of the changes.
            </p>
          </Section>

          {/* 6 */}
          <Section title="6. Contact Us">
            <p>
              If you have questions about our use of cookies, please contact us through the{' '}
              <Link href="/#contact" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                contact form
              </Link>{' '}
              on our homepage. You can also review our full{' '}
              <a href="/privacy-policy" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                Privacy Policy
              </a>{' '}
              for more information on how we handle your data.
            </p>
          </Section>

        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-zinc-800/50 bg-zinc-900/20 p-7">
      <h2 className="text-xs font-black text-white tracking-[0.2em] uppercase mb-4">{title}</h2>
      {children}
    </div>
  );
}
