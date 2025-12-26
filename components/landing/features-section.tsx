import { Wallet, TrendingDown, List, Share2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Wallet,
    title: "Stay Within Budget",
    description:
      "Set spending limits and track every purchase in real-time. Never overspend again with visual budget progress.",
  },
  {
    icon: TrendingDown,
    title: "Automatic Price Tracking",
    description:
      "Monitor price changes over time and get alerted when items drop below your target price.",
  },
  {
    icon: List,
    title: "Organized Wishlists",
    description:
      "Create multiple lists for different occasions. Add photos, notes, and links to keep everything organized.",
  },
  {
    icon: Share2,
    title: "Share with Family",
    description:
      "Share your wishlists via link, QR code, or email. Perfect for Secret Santa and family gift exchanges.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-16 md:py-24 overflow-hidden">
      {/* Glass Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-blue-50/20 to-pink-50/30 dark:from-purple-950/10 dark:via-blue-950/10 dark:to-pink-950/10" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <Badge
            variant="secondary"
            className="mb-4 backdrop-blur-md bg-white/60 dark:bg-black/40 border border-white/20 dark:border-white/10"
          >
            Features
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            Everything you need for smart shopping
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            From budget tracking to price monitoring, PriceFlow helps you make smarter decisions.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="p-6 backdrop-blur-xl bg-white/50 dark:bg-black/30 border border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-black/40 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1"
              >
                <CardHeader className="p-0 mb-4">
                  <div className="mb-4 p-3 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-400/20 dark:to-purple-400/20 rounded-xl w-fit backdrop-blur-sm border border-white/20 dark:border-white/10">
                    <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
