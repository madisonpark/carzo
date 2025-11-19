import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Shield, Users, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Carzo',
  description:
    'Learn about Carzo - connecting car shoppers with trusted dealerships nationwide. Browse thousands of quality vehicles with confidence.',
};

/**
 * About Page
 *
 * Company overview with hero section, mission, and value propositions.
 * Clean, Apple-esque design with plenty of whitespace and clear hierarchy.
 */
export default function AboutPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand to-brand-hover text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Welcome to Carzo
          </h1>
          <p className="text-xl sm:text-2xl text-white/90 leading-relaxed">
            Connecting car shoppers with quality vehicles from trusted dealerships nationwide.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 text-center">
            Our Mission
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed text-center mb-12">
            We believe car shopping should be simple, transparent, and stress-free. Carzo brings
            together thousands of quality vehicles from certified dealerships, making it easy to
            find your perfect ride.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
            <FeatureCard
              icon={<Zap className="h-8 w-8 text-brand" />}
              title="Fast & Easy"
              description="Search thousands of vehicles in seconds. Advanced filters help you find exactly what you're looking for."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8 text-brand" />}
              title="Trusted Dealers"
              description="All dealerships are certified partners. Buy with confidence from reputable sellers nationwide."
            />
            <FeatureCard
              icon={<CheckCircle2 className="h-8 w-8 text-brand" />}
              title="Quality Inventory"
              description="Every vehicle listing includes detailed specs, photos, and pricing. No surprises, just transparency."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8 text-brand" />}
              title="Customer First"
              description="Your experience matters. We're here to help you find the right vehicle at the right price."
            />
          </div>
        </div>
      </section>

      {/* Why Carzo Section */}
      <section className="bg-muted/50 dark:bg-muted/10 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-8 text-center">
            Why Choose Carzo?
          </h2>
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">Nationwide Inventory:</strong> Access thousands
              of vehicles from dealerships across the country. Whether you're looking for a sedan,
              SUV, truck, or sports car, we've got you covered.
            </p>
            <p>
              <strong className="text-foreground">Smart Search:</strong> Our advanced search
              filters let you narrow down by make, model, price, mileage, location, and more. Find
              your perfect vehicle in minutes, not hours.
            </p>
            <p>
              <strong className="text-foreground">Transparent Pricing:</strong> No hidden fees or
              surprises. See real dealer prices upfront and contact dealers directly to get the
              best deal.
            </p>
            <p>
              <strong className="text-foreground">Mobile Optimized:</strong> Shop on any device.
              Our platform works seamlessly on desktop, tablet, and mobile, so you can browse
              vehicles wherever you are.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
            Ready to Find Your Perfect Vehicle?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start browsing thousands of quality vehicles from trusted dealerships today.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Search Vehicles
          </Link>
        </div>
      </section>
    </div>
  );
}

/**
 * Feature Card Component
 */
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 bg-background rounded-lg border border-border hover:border-brand/50 transition-smooth">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
