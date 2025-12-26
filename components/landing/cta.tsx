import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CTA() {
  return (
    <section id="pricing" className="py-24 bg-neutral-950 text-white">
      <div className="container max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-6xl font-semibold mb-6">
          Ready to Stop{" "}
          <span className="text-teal-400">
            Overpaying
          </span>
          ?
        </h2>
        <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
          Join thousands of smart shoppers who track prices and save money effortlessly.
        </p>

        <Link href="/sign-up">
          <Button
            size="lg"
            className="bg-teal-600 hover:bg-teal-500 text-white font-semibold border-none h-14 px-10 rounded-full cursor-pointer shadow-lg shadow-teal-900/40 text-lg"
          >
            Start Tracking Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>

        <p className="text-slate-500 text-sm mt-6">
          Free forever. No credit card required. Cancel anytime.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-4 mt-12">
          {["Unlimited Products", "Real-time Alerts", "Multi-marketplace", "Email Notifications"].map(
            (feature) => (
              <div
                key={feature}
                className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-full text-sm text-slate-400 backdrop-blur-sm"
              >
                {feature}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
