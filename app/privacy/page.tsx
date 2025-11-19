import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Carzo Privacy Policy - Learn about our data collection, cookie usage, and privacy practices.',
};

/**
 * Privacy Policy Page
 *
 * Displays privacy policy content from docs/legal/privacy-policy.md
 * Clean typography article layout with proper heading hierarchy.
 *
 * Content Source: @/docs/legal/privacy-policy.md
 */
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8">
      <article className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
        <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last Updated: November 13, 2025</p>

        <p className="text-lg text-muted-foreground leading-relaxed mb-8">
          This Privacy Policy describes how Carzo collects, uses, and protects your information when
          you use our platform.
        </p>

        <Section title="Data Collection Overview">
          <p>
            Carzo collects minimal data necessary to provide vehicle search and discovery services.
            We prioritize user privacy and do not collect personally identifiable information (PII)
            unless explicitly provided by you.
          </p>
        </Section>

        <Section title="Anonymous User Tracking">
          <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">User ID & Session ID</h3>
          <ul>
            <li>
              <strong>User ID:</strong> Random UUID stored in cookie (365-day expiration)
            </li>
            <li>
              <strong>Session ID:</strong> Random UUID stored in cookie (session expiration)
            </li>
            <li>
              <strong>No PII:</strong> These identifiers are anonymous and not linked to your
              identity
            </li>
          </ul>
        </Section>

        <Section title="Location Data">
          <ul>
            <li>
              <strong>IP-based Geolocation:</strong> We use MaxMind GeoIP2 to determine your
              approximate location based on your IP address
            </li>
            <li>
              <strong>Stored Coordinates:</strong> Latitude/longitude are used for search radius
              filtering
            </li>
            <li>
              <strong>Not Linked to Identity:</strong> Location data is not connected to your
              personal identity
            </li>
          </ul>
        </Section>

        <Section title="Interaction Data">
          <p>We collect the following interaction data to improve our service and dealer billing:</p>
          <ul>
            <li>
              <strong>Click Tracking:</strong> Which vehicles you click to view dealer details
            </li>
            <li>
              <strong>Impression Tracking:</strong> Which vehicles appear in your search results
            </li>
            <li>
              <strong>Search Filters:</strong> Make, model, price range, and other search criteria
            </li>
          </ul>
          <p className="mt-4">
            This data is used for analytics and dealer billing purposes only. It is not sold to
            third parties.
          </p>
        </Section>

        <Section title="Cookie Usage">
          <p>Carzo uses the following cookies:</p>
          <div className="bg-muted/30 dark:bg-muted/10 p-4 rounded-lg font-mono text-sm mt-4">
            <p>
              <strong>carzo_user_id:</strong> Random UUID for user tracking (365 days)
            </p>
            <p className="mt-2">
              <strong>carzo_session_id:</strong> Random UUID for session tracking (session)
            </p>
          </div>
          <p className="mt-4">
            You can clear these cookies at any time through your browser settings to reset your
            tracking ID.
          </p>
        </Section>

        <Section title="Third-Party Services">
          <p>Carzo integrates with the following third-party services:</p>
          <ul>
            <li>
              <strong>Supabase:</strong> Database hosting with encryption at rest (SOC 2 Type II
              compliant)
            </li>
            <li>
              <strong>Vercel:</strong> Application hosting (ISO 27001 certified)
            </li>
            <li>
              <strong>MaxMind GeoIP2:</strong> IP-based geolocation (no PII shared)
            </li>
            <li>
              <strong>LotLinx:</strong> Vehicle inventory feed provider (public data only)
            </li>
          </ul>
        </Section>

        <Section title="No PII Collected">
          <p>Carzo does not collect the following types of personally identifiable information:</p>
          <ul>
            <li>❌ Email addresses</li>
            <li>❌ Phone numbers</li>
            <li>❌ Names or user accounts</li>
            <li>❌ Payment information</li>
            <li>✅ All tracking is anonymous and cookie-based</li>
          </ul>
        </Section>

        <Section title="User Rights">
          <ul>
            <li>
              <strong>Clear Tracking:</strong> Clear your browser cookies to reset your tracking ID
            </li>
            <li>
              <strong>No Account Deletion Needed:</strong> We don't require accounts, so there's
              nothing to delete
            </li>
            <li>
              <strong>Data Inquiries:</strong> Contact us at{' '}
              <a
                href="mailto:[email protected]"
                className="text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-md"
              >
                [email protected]
              </a>{' '}
              for data-related questions
            </li>
          </ul>
        </Section>

        <Section title="Data Retention">
          <ul>
            <li>
              <strong>User Cookies:</strong> 365 days (user ID) or session duration (session ID)
            </li>
            <li>
              <strong>Interaction Data:</strong> Retained for analytics and billing purposes (up to
              2 years)
            </li>
            <li>
              <strong>Location Data:</strong> Not permanently stored; calculated on-demand
            </li>
          </ul>
        </Section>

        <Section title="GDPR & CCPA Compliance">
          <p>
            <strong>GDPR (European Users):</strong> We do not collect personal data as defined by
            GDPR. Anonymous tracking IDs are not considered personal data under GDPR unless linked
            to identity.
          </p>
          <p className="mt-4">
            <strong>CCPA (California Users):</strong> We do not sell your personal information. You
            have the right to opt out of tracking by clearing cookies.
          </p>
        </Section>

        <Section title="Changes to Privacy Policy">
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this
            page with an updated "Last Updated" date. Continued use of Carzo after changes
            constitutes acceptance of the updated policy.
          </p>
        </Section>

        <Section title="Contact Information">
          <p>
            For privacy-related inquiries, please contact us at{' '}
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
 * Section Component for Privacy Policy Layout
 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-foreground mb-4">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-4">{children}</div>
    </section>
  );
}
