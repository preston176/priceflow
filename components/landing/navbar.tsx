"use client";

import { Button } from "@/components/ui/button";
import { Menu, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="py-4 bg-neutral-950 text-white sticky top-0 z-50 border-b border-white/10">
      <nav className="container max-w-6xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-3 border border-white/15 rounded-full h-16 items-center px-4 backdrop-blur-sm bg-neutral-950/80">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-teal-600 rounded-lg blur-md opacity-40" />
              {/* <div className="relative bg-gradient-to-br from-teal-600 to-teal-700 p-2 rounded-lg">
                <Sparkles className="h-4 w-4 text-white" />
              </div> */}
            </div>
            <span className="font-semibold text-white text-lg">PriceFlow</span>
          </Link>

          {/* LINKS */}
          <div className="hidden lg:flex justify-center items-center">
            <div className="flex gap-6 font-medium text-white/80">
              {navLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex justify-end items-center gap-3">
            <Menu className="lg:hidden w-6 h-6 cursor-pointer" />

            <SignedOut>
              <Link href="/sign-up">
                <Button className="bg-teal-600 hover:bg-teal-500 text-white font-semibold border-none h-12 px-6 rounded-full cursor-pointer shadow-lg shadow-teal-900/50">
                  Get Started
                </Button>
              </Link>
            </SignedOut>

            <SignedIn>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="hidden md:block bg-transparent hover:bg-white/5 text-white font-semibold border-white/20 h-12 px-6 rounded-full cursor-pointer"
                >
                  Dashboard
                </Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </nav>
    </header>
  );
}
