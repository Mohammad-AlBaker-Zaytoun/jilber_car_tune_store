import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | JILBER Performance',
  description: 'How JILBER Performance Engineering collects, uses, and protects your personal data.',
};

const LAST_UPDATED = 'May 10, 2025';

export default function PrivacyPolicyPage() {
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
            PRIVACY POLICY
          </h1>
          <p className="text-xs text-zinc-600 tracking-widest uppercase">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <div className="flex flex-col gap-6 text-sm text-zinc-400 leading-relaxed">

          {/* Intro */}
          <div className="border border-zinc-800/50 bg-zinc-900/20 p-7">
            <p>
              JILBER Performance Engineering (&ldquo;JILBER&rdquo;, &ldquo;we&rdquo;,
              &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is committed to protecting your privacy.
              This policy explains what personal data we collect, why we collect it, how we use
              it, and your rights in relation to it. It applies to data collected through our
              website and when you engage with our services.
            </p>
          </div>

          {/* 1 */}
          <Section title="1. Data We Collect">
            <div className="flex flex-col gap-4">
              <Subsection label="Account information">
                When you create an account we collect your <strong className="text-zinc-300">full
                name</strong>, <strong className="text-zinc-300">email address</strong>, and
                optionally your <strong className="text-zinc-300">phone number</strong>. Your
                password is stored exclusively as a cryptographic hash — we never store your
                password in plain text and we cannot retrieve it.
              </Subsection>
              <Subsection label="Order and checkout information">
                When you place an order or book a service we collect contact details, delivery or
                location address, and <strong className="text-zinc-300">vehicle information</strong>{' '}
                including make, model, year, engine specification, existing modifications, and
                preferred service date. This information is necessary to provide the service.
              </Subsection>
              <Subsection label="Technical data">
                We may automatically collect basic technical information such as your IP address,
                browser type, and pages visited for security and analytics purposes. We do not
                build advertising profiles from this data.
              </Subsection>
              <Subsection label="Communications">
                If you contact us by email or through our contact form, we retain a copy of the
                correspondence to manage and respond to your enquiry.
              </Subsection>
            </div>
          </Section>

          {/* 2 */}
          <Section title="2. How We Use Your Data">
            <ul className="list-none flex flex-col gap-2.5 mt-1">
              {[
                { label: 'Service delivery', desc: 'To schedule and complete the work you have booked, contact you regarding your appointment, and dispatch any parts you have ordered.' },
                { label: 'Account management', desc: 'To maintain your account, authenticate your identity, and provide access to your order history.' },
                { label: 'Communications', desc: 'To send confirmation emails, appointment reminders, and service updates. We will not send marketing emails without your explicit consent.' },
                { label: 'Legal compliance', desc: 'To comply with applicable laws, respond to lawful requests from authorities, and resolve disputes.' },
                { label: 'Security', desc: 'To detect and prevent fraud, abuse, and unauthorised access to our systems.' },
              ].map(({ label, desc }) => (
                <li key={label} className="flex items-start gap-2.5">
                  <span className="w-1 h-1 rounded-full bg-cyan-400/50 mt-2 shrink-0" aria-hidden="true" />
                  <span><strong className="text-zinc-300">{label}:</strong> {desc}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* 3 */}
          <Section title="3. Legal Basis for Processing">
            <div className="flex flex-col gap-3">
              <p>We process your personal data on the following legal bases:</p>
              <ul className="list-none flex flex-col gap-2">
                {[
                  'Contract performance — to fulfil a service or order you have requested.',
                  'Legitimate interests — to operate, secure, and improve our website and services.',
                  'Legal obligation — where required by applicable law.',
                  'Consent — where you have explicitly opted in, such as marketing communications.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-cyan-400/50 mt-2 shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          {/* 4 */}
          <Section title="4. Data Storage and Security">
            <div className="flex flex-col gap-3">
              <p>
                Your data is stored securely on servers located in our operating region. We use
                industry-standard security measures including HTTPS encryption, hashed password
                storage, and httpOnly session cookies to protect your information.
              </p>
              <p>
                Session authentication is managed via a cryptographically signed JSON Web Token
                (JWT) stored in a secure, httpOnly cookie that is inaccessible to JavaScript
                running in your browser. Your cart data is stored locally in your browser&rsquo;s
                localStorage and is never transmitted to our servers unless you explicitly check out.
              </p>
              <p>
                No system can guarantee absolute security. In the event of a data breach that
                affects your personal data, we will notify you and relevant authorities as required
                by law.
              </p>
            </div>
          </Section>

          {/* 5 */}
          <Section title="5. Data Sharing">
            <div className="flex flex-col gap-3">
              <p>
                We do not sell, rent, or trade your personal data to third parties. We may share
                data in the following limited circumstances:
              </p>
              <ul className="list-none flex flex-col gap-2">
                {[
                  'Service providers who assist us in operating our website and delivering services (e.g. hosting, email delivery), bound by confidentiality agreements.',
                  'Authorities when required to comply with a legal obligation, court order, or to protect our rights.',
                  'A successor entity in the event of a business sale or merger, subject to the same privacy obligations.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-cyan-400/50 mt-2 shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          {/* 6 */}
          <Section title="6. Data Retention">
            <p>
              We retain your personal data for as long as your account is active or as needed to
              provide services. Account data is deleted upon request unless we are required by law
              to retain it. Order records may be retained for up to 7 years for legal and
              accounting purposes.
            </p>
          </Section>

          {/* 7 */}
          <Section title="7. Cookies">
            <p>
              We use cookies and similar browser storage technologies. For full details, please
              read our{' '}
              <a
                href="/cookie-policy"
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Cookie Policy
              </a>
              .
            </p>
          </Section>

          {/* 8 */}
          <Section title="8. Your Rights">
            <div className="flex flex-col gap-3">
              <p>Depending on your location, you may have the following rights:</p>
              <ul className="list-none flex flex-col gap-2">
                {[
                  'Access — request a copy of the personal data we hold about you.',
                  'Correction — request correction of inaccurate or incomplete data.',
                  'Deletion — request deletion of your personal data, subject to our legal obligations.',
                  'Portability — receive your data in a structured, machine-readable format.',
                  'Objection — object to processing based on legitimate interests.',
                  'Restriction — request that we restrict processing of your data in certain circumstances.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-cyan-400/50 mt-2 shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <p>
                To exercise any of these rights, contact us through our{' '}
                <a href="/#contact" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  contact form
                </a>
                . We will respond within 30 days.
              </p>
            </div>
          </Section>

          {/* 9 */}
          <Section title="9. Children's Privacy">
            <p>
              Our services are not directed at individuals under the age of 18. We do not
              knowingly collect personal data from minors. If you believe we have inadvertently
              collected data from a minor, please contact us immediately and we will delete it
              promptly.
            </p>
          </Section>

          {/* 10 */}
          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our
              practices or applicable law. The date at the top of this page will indicate the most
              recent revision. Continued use of our website after an update constitutes acceptance
              of the revised policy.
            </p>
          </Section>

          {/* 11 */}
          <Section title="11. Contact Us">
            <p>
              For any privacy-related questions or to exercise your rights, please contact us
              through the{' '}
              <a href="/#contact" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                contact form
              </a>{' '}
              on our homepage.
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

function Subsection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-1.5">{label}</p>
      <p>{children}</p>
    </div>
  );
}
