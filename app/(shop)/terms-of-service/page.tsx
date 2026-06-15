import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | JILBER Performance',
  description: 'Terms and conditions governing the use of JILBER Performance Engineering services and website.',
};

const LAST_UPDATED = 'May 10, 2025';

export default function TermsOfServicePage() {
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
            TERMS OF SERVICE
          </h1>
          <p className="text-xs text-zinc-600 tracking-widest uppercase">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <div className="flex flex-col gap-6 text-sm text-zinc-400 leading-relaxed">

          {/* Intro */}
          <div className="border border-zinc-800/50 bg-zinc-900/20 p-7">
            <p>
              Please read these Terms of Service carefully before using the JILBER Performance
              Engineering website or booking any of our services. By accessing our website, placing
              an order, or booking a service appointment, you agree to be bound by these terms. If
              you do not agree, please do not use our services.
            </p>
          </div>

          {/* 1 */}
          <Section title="1. About JILBER Performance Engineering">
            <p>
              JILBER Performance Engineering (&ldquo;JILBER&rdquo;, &ldquo;we&rdquo;,
              &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is a specialist automotive performance
              workshop providing ECU tuning, exhaust systems, suspension upgrades, brake
              modifications, aerodynamic components, and related performance parts and services. Our
              services are intended for road-legal and track-use vehicles operated by adults.
            </p>
          </Section>

          {/* 2 */}
          <Section title="2. Eligibility">
            <ul className="list-none flex flex-col gap-2 mt-2">
              {[
                'You must be at least 18 years of age to place an order or book a service.',
                'You must be the registered owner of the vehicle, or have written authorisation from the registered owner.',
                'You are responsible for ensuring that any modifications comply with the laws and regulations of your jurisdiction.',
                'Track-only modifications may void road legality. It is your sole responsibility to ensure compliance.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="w-1 h-1 rounded-full bg-cyan-400/50 mt-2 shrink-0" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          {/* 3 */}
          <Section title="3. Services and Bookings">
            <div className="flex flex-col gap-3">
              <p>
                <strong className="text-zinc-300">Appointments.</strong> All service bookings are
                subject to availability. A booking is confirmed only when you receive a written
                confirmation from us via email. We reserve the right to decline any booking at our
                discretion.
              </p>
              <p>
                <strong className="text-zinc-300">Quotations.</strong> All prices shown on our
                website are indicative. A final price will be confirmed after vehicle inspection.
                Prices may change if the scope of work differs from what was initially described.
              </p>
              <p>
                <strong className="text-zinc-300">Cancellations.</strong> Cancellations made more
                than 48 hours before a scheduled appointment will incur no charge. Cancellations
                within 48 hours may be subject to a cancellation fee of up to 20% of the quoted
                price.
              </p>
              <p>
                <strong className="text-zinc-300">Parts orders.</strong> Once an order for parts
                has been placed and confirmed, it may not be cancelled if the parts have been
                specially ordered or are already in transit.
              </p>
            </div>
          </Section>

          {/* 4 */}
          <Section title="4. Vehicle Modifications and Liability">
            <div className="flex flex-col gap-3">
              <p>
                Performance modifications alter the operating parameters of your vehicle beyond the
                original manufacturer&rsquo;s specifications. By agreeing to these terms, you
                acknowledge the following:
              </p>
              <ul className="list-none flex flex-col gap-2">
                {[
                  'Performance tuning may affect your vehicle\'s manufacturer warranty. JILBER is not liable for any warranty claims rejected by a manufacturer as a result of our work.',
                  'Increases in power output and changes to suspension, brakes, or aerodynamics may affect vehicle behaviour. You accept full responsibility for safe operation of your modified vehicle.',
                  'JILBER will not be held liable for any mechanical failure, accident, injury, or loss arising from the use of a modified vehicle, except where directly caused by our proven negligence.',
                  'We reserve the right to decline work we consider unsafe, illegal, or likely to cause damage to the vehicle or third parties.',
                  'ECU tuning may affect fuel consumption and emissions. Compliance with local emissions standards is your responsibility.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-cyan-400/50 mt-2 shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          {/* 5 */}
          <Section title="5. Payment">
            <div className="flex flex-col gap-3">
              <p>
                Payment is due in full upon completion of work unless otherwise agreed in writing.
                We accept payment by bank transfer and in-person at our workshop. Card payment
                options will be announced when available.
              </p>
              <p>
                All prices are displayed in USD and are exclusive of applicable taxes unless
                stated otherwise. Tax will be calculated and displayed at checkout.
              </p>
              <p>
                Ownership of parts supplied by JILBER remains with us until full payment is
                received.
              </p>
            </div>
          </Section>

          {/* 6 */}
          <Section title="6. Warranty and Guarantee">
            <div className="flex flex-col gap-3">
              <p>
                JILBER provides a <strong className="text-zinc-300">12-month workmanship
                guarantee</strong> on all labour and parts supplied by us, covering defects in
                materials and workmanship under normal operating conditions.
              </p>
              <p>This guarantee does not cover:</p>
              <ul className="list-none flex flex-col gap-2">
                {[
                  'Damage caused by misuse, accidents, neglect, or modifications carried out by third parties after our work.',
                  'Normal wear and tear on consumable parts.',
                  'Damage resulting from racing, track days, or use beyond the agreed purpose.',
                  'Consequential losses of any kind.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-cyan-400/50 mt-2 shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          {/* 7 */}
          <Section title="7. Intellectual Property">
            <p>
              All content on this website — including text, graphics, logos, images, and software —
              is the property of JILBER Performance Engineering and is protected by applicable
              intellectual property laws. You may not reproduce, distribute, or create derivative
              works without our prior written consent.
            </p>
          </Section>

          {/* 8 */}
          <Section title="8. Website Use">
            <div className="flex flex-col gap-3">
              <p>You agree not to:</p>
              <ul className="list-none flex flex-col gap-2">
                {[
                  'Use our website for any unlawful purpose.',
                  'Attempt to gain unauthorised access to any part of our systems.',
                  'Transmit any harmful, offensive, or disruptive content.',
                  'Use automated tools to scrape or harvest data from our website.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-cyan-400/50 mt-2 shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <p>
                Our website is provided on an &ldquo;as is&rdquo; basis. We do not guarantee
                uninterrupted availability and reserve the right to suspend or withdraw the site
                at any time without notice.
              </p>
            </div>
          </Section>

          {/* 9 */}
          <Section title="9. Limitation of Liability">
            <p>
              To the fullest extent permitted by law, JILBER Performance Engineering shall not be
              liable for any indirect, incidental, special, or consequential damages arising from
              your use of our website or services, including but not limited to loss of profits,
              data, or business opportunity. Our total liability in any case shall not exceed the
              amount you paid for the specific service giving rise to the claim.
            </p>
          </Section>

          {/* 10 */}
          <Section title="10. Changes to These Terms">
            <p>
              We may update these Terms of Service from time to time. The date at the top of this
              page will reflect the latest revision. Continued use of our website or services after
              any update constitutes acceptance of the revised terms.
            </p>
          </Section>

          {/* 11 */}
          <Section title="11. Governing Law">
            <p>
              These terms are governed by and construed in accordance with applicable local law.
              Any disputes arising in connection with these terms shall be subject to the exclusive
              jurisdiction of the courts in our operating jurisdiction.
            </p>
          </Section>

          {/* 12 */}
          <Section title="12. Contact Us">
            <p>
              If you have any questions about these Terms of Service, please contact us through the{' '}
              <Link href="/#contact" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                contact form
              </Link>{' '}
              on our homepage or visit our workshop directly.
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
