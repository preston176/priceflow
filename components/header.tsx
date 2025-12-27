"use client";

import { UserButton } from "@clerk/nextjs";
import { Gift as GiftIcon } from "lucide-react";
import Link from "next/link";
import { ShareDialog } from "./share-dialog";
import { ShareByEmailDialog } from "./share-by-email-dialog";
import { ShareAsImageDialog } from "./share-as-image-dialog";
import { ThemeToggle } from "./theme-toggle";
import { CurrencySelector } from "./currency-selector";
import { FeedbackButton } from "./feedback-button";
import { Gift } from "@/db/schema";

interface HeaderProps {
  listId?: string;
  listName?: string;
  currency?: string;
  userName?: string;
  gifts?: Gift[];
}

export function Header({
  listId,
  listName,
  currency = "USD",
  userName,
  gifts = [],
}: HeaderProps) {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <GiftIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">PriceFlow</h1>
        </Link>
        <div className="flex items-center gap-2">
          <CurrencySelector currentCurrency={currency} />
          <ThemeToggle />
          <FeedbackButton />
          {listId && listName && (
            <>
              <ShareAsImageDialog
                listId={listId}
                listName={listName}
                userName={userName}
                gifts={gifts}
              />
              <ShareByEmailDialog listId={listId} listName={listName} />
              <ShareDialog listId={listId} listName={listName} />
            </>
          )}
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
