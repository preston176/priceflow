import { ShoppingCart, Bell, TrendingDown, Mail, Share2, Zap } from "lucide-react";

const features = [
  {
    icon: ShoppingCart,
    title: "Multi-Marketplace Tracking",
    description:
      "Track prices across Amazon, Walmart, Target, and Best Buy simultaneously. Never miss a deal on any platform.",
  },
  {
    icon: TrendingDown,
    title: "Real-Time Price Alerts",
    description:
      "Get instant notifications when prices drop below your target. We monitor prices 24/7 so you don't have to.",
  },
  {
    icon: Zap,
    title: "Auto-Update Technology",
    description:
      "Enable auto-update on any product and we'll check prices daily, sending you comprehensive email reports.",
  },
  {
    icon: Mail,
    title: "Smart Email Notifications",
    description:
      "Beautiful, actionable emails with price history, savings calculations, and direct purchase links.",
  },
  {
    icon: Share2,
    title: "Shareable Wishlists",
    description:
      "Share your gift lists with friends and family. Perfect for holidays, birthdays, and special occasions.",
  },
  {
    icon: Bell,
    title: "Price History & Analytics",
    description:
      "Visualize price trends over time. Make informed decisions based on historical data and patterns.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-neutral-900 text-white">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-semibold mb-4">
            Everything You Need,{" "}
            <span className="text-teal-400">
              Nothing You Don&apos;t
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Built for smart shoppers who refuse to overpay. Track, compare, and save effortlessly.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="border border-slate-800 rounded-2xl p-6 hover:border-teal-600/50 transition-all duration-300 backdrop-blur-sm bg-slate-900/50 hover:bg-slate-900/80 group"
            >
              <div className="w-12 h-12 bg-teal-600/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
