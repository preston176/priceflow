import { PremiumLanding } from "./premium-landing";
import { FeaturesSection } from "./features-section";
import { PricingSection } from "./pricing-section";
import { LandingFooter } from "./landing-footer";

export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Premium Hero with built-in nav */}
      <PremiumLanding />

      {/* Additional Sections */}
      <div className="relative bg-gradient-to-b from-slate-900 to-slate-950">
        <FeaturesSection />
        <PricingSection />
        <LandingFooter />
      </div>
    </div>
  );
}
