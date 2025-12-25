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

const features = [
  "Unlimited wishlists",
  "Unlimited gifts",
  "Automatic price tracking",
  "Share with family & friends",
  "Budget management",
  "Multi-currency support",
  "Price history charts",
  "Email & QR code sharing",
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
            Get started with all features completely free. No credit card required.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="p-8 border-primary shadow-lg">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-2xl mb-2">Free Forever</CardTitle>
              <CardDescription>Everything you need to track gifts</CardDescription>
              <div className="text-5xl font-bold my-6">
                $0
                <span className="text-lg text-muted-foreground font-normal"> / forever</span>
              </div>
            </CardHeader>

            <CardContent className="p-0 mb-6">
              <ul className="space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="p-0">
              <Button size="lg" className="w-full" asChild>
                <Link href="/sign-up">Get Started Free</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}
