import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Carzo Terms of Service - Read our terms and conditions for using the Carzo platform.',
};

/**
 * Terms of Service Page
 *
 * Standard terms and conditions with clean article layout.
 * Accessible typography with proper heading hierarchy.
 */
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8">
      <article className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
        <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last Updated: January 2025</p>

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing and using Carzo ("the Platform"), you accept and agree to be bound by the
            terms and provision of this agreement. If you do not agree to these Terms of Service,
            please do not use the Platform.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            Carzo is a vehicle marketplace platform that connects users with automotive dealerships.
            We provide a search and discovery platform for vehicles listed by third-party dealers.
            Carzo does not sell vehicles directly, nor do we own the inventory displayed on the
            Platform.
          </p>
        </Section>

        <Section title="3. User Conduct">
          <p>You agree to use the Platform only for lawful purposes. You agree not to:</p>
          <ul>
            <li>Use the Platform in any way that violates any applicable laws or regulations</li>
            <li>Transmit any harmful code, viruses, or malicious software</li>
            <li>
              Attempt to gain unauthorized access to any portion of the Platform or any systems or
              networks
            </li>
            <li>Scrape, harvest, or collect data from the Platform using automated means</li>
            <li>
              Impersonate any person or entity or falsely state or misrepresent your affiliation
            </li>
          </ul>
        </Section>

        <Section title="4. Intellectual Property">
          <p>
            All content on Carzo, including but not limited to text, graphics, logos, images, and
            software, is the property of Carzo or its content suppliers and is protected by
            international copyright laws.
          </p>
          <p>
            Vehicle images and descriptions are provided by dealerships and remain the property of
            their respective owners.
          </p>
        </Section>

        <Section title="5. Third-Party Links and Services">
          <p>
            The Platform may contain links to third-party websites or services (such as dealership
            websites) that are not owned or controlled by Carzo. We have no control over, and assume
            no responsibility for, the content, privacy policies, or practices of any third-party
            sites or services.
          </p>
        </Section>

        <Section title="6. Disclaimer of Warranties">
          <p>
            The Platform is provided "as is" and "as available" without warranties of any kind,
            either express or implied. Carzo does not warrant that the Platform will be
            uninterrupted, error-free, or free of viruses or other harmful components.
          </p>
          <p>
            Vehicle listings, prices, and availability are provided by third-party dealerships.
            Carzo makes no representations or warranties regarding the accuracy, completeness, or
            reliability of such information.
          </p>
        </Section>

        <Section title="7. Limitation of Liability">
          <p>
            In no event shall Carzo, its directors, employees, or agents be liable for any indirect,
            incidental, special, consequential, or punitive damages arising out of or related to
            your use of the Platform.
          </p>
        </Section>

        <Section title="8. User Data and Privacy">
          <p>
            Your use of the Platform is also governed by our{' '}
            <a
              href="/privacy"
              className="text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md"
            >
              Privacy Policy
            </a>
            . Please review our Privacy Policy to understand our data collection and usage
            practices.
          </p>
        </Section>

        <Section title="9. Changes to Terms">
          <p>
            Carzo reserves the right to modify these Terms of Service at any time. We will notify
            users of any material changes by updating the "Last Updated" date at the top of this
            page. Your continued use of the Platform after such changes constitutes your acceptance
            of the new Terms.
          </p>
        </Section>

        <Section title="10. Contact Information">
          <p>
            If you have any questions about these Terms of Service, please contact us at{' '}
            <a
              href="mailto:[email protected]"
              className="text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md"
            >
              [email protected]
            </a>
            .
          </p>
        </Section>
      </article>
    </div>
  );
}

/**
 * Section Component for Terms Layout
 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-foreground mb-4">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-4">{children}</div>
    </section>
  );
}
