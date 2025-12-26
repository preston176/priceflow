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
    <section id="features" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            Features
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to master holiday shopping
          </h2>
          <p className="text-lg text-muted-foreground">
            From budget tracking to price monitoring, PriceFlow helps you make smarter gift decisions.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <CardHeader className="p-0 mb-4">
                  <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <CardDescription className="text-base">
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
