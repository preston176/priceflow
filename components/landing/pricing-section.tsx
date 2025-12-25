import { Check } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "Unlimited wishlists",
      "Unlimited gifts",
      "Automated price tracking & Alerts",
      "Share with family & friends",
      "Budget management",
      "Email sharing",
    ],
    cta: "Get Started Free",
    ctaLink: "/sign-up",
    popular: false,
    comingSoon: false,
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "month",
    description: "For power users who want automation",
    features: [
      "Everything in Free",
      "Automatic price tracking",
      "Price drop alerts",
      "Price history charts",
      "Multi-currency support",
      "Priority support",
      "Advanced analytics",
    ],
    cta: "Coming Soon",
    popular: true,
    comingSoon: true,
  },
  {
    name: "Family",
    price: "$19.99",
    period: "month",
    description: "Best for families coordinating gifts",
    features: [
      "Everything in Pro",
      "Up to 5 family accounts",
      "Shared budgets",
      "Gift coordination",
      "Duplicate prevention",
      "Family calendar",
      "Group chat",
    ],
    cta: "Coming Soon",
    popular: false,
    comingSoon: true,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            Pricing
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Get started free. Upgrade when you need more features.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative ${
                tier.popular
                  ? "border-primary shadow-xl scale-105"
                  : tier.comingSoon
                  ? "opacity-90"
                  : ""
              }`}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              {tier.comingSoon && (
                <Badge
                  variant="secondary"
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                >
                  Coming Soon
                </Badge>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="text-4xl font-bold my-4">
                  {tier.price}
                  <span className="text-lg text-muted-foreground font-normal">
                    {" "}
                    / {tier.period}
                  </span>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {tier.comingSoon ? (
                  <Button
                    size="lg"
                    className="w-full"
                    variant="outline"
                    disabled
                  >
                    {tier.cta}
                  </Button>
                ) : (
                  <Button size="lg" className="w-full" asChild>
                    <Link href={tier.ctaLink!}>{tier.cta}</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
