"use client";

import { UserButton } from "@clerk/nextjs";
import { Gift } from "lucide-react";
import Link from "next/link";
import { ShareDialog } from "./share-dialog";

interface HeaderProps {
  listId?: string;
  listName?: string;
}

export function Header({ listId, listName }: HeaderProps) {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Gift className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">GiftFlow</h1>
        </Link>
        <div className="flex items-center gap-4">
          <ShareDialog listId={listId} listName={listName} />
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>
    </header>
  );
}
