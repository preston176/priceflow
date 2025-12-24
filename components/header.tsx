"use client";

import { UserButton } from "@clerk/nextjs";
import { Gift, Share2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "./share-dialog";

export function Header() {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Gift className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">GiftFlow</h1>
        </Link>
        <div className="flex items-center gap-4">
          <ShareDialog />
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>
    </header>
  );
}
