"use client";

import { useMemo } from "react";
import Navbar from "./navbar";
import Hero from "./hero";
import VideoSection from "./video-section";
import Features from "./features";
import HowItWorks from "./how-it-works";
import CTA from "./cta";
import Footer from "./footer";
import { Snowfall } from "frost-react";

export function LandingPage() {
  // Show snow during holiday season (December 1 - January 6)
  const isHolidaySeason = useMemo(() => {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const day = now.getDate();

    return (month === 11) || (month === 0 && day <= 6); // December or Jan 1-6
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* Snow Effect - Only during holiday season */}
      {isHolidaySeason && (
        <Snowfall
          flakeCount={100}
          color="#60a5fa"
          speed={[0.5, 3]}
          wind={[-0.5, 2]}
          style={{
            position: "fixed",
            width: "100vw",
            height: "100vh",
            zIndex: 999,
            pointerEvents: "none",
          }}
        />
      )}

      <Navbar />
      <Hero />
      <VideoSection />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
}
