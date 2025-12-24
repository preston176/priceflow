"use client";

import Image from "next/image";
import { ExternalLink, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, calculateSavings } from "@/lib/utils";
import { togglePurchased, deleteGift } from "@/actions/gift-actions";
import { Gift } from "@/db/schema";

interface GiftCardProps {
  gift: Gift;
}

export function GiftCard({ gift }: GiftCardProps) {
  const savings = calculateSavings(gift.targetPrice, gift.currentPrice);
  const hasSavings = savings !== null && savings > 0;

  const handleTogglePurchased = async () => {
    try {
      await togglePurchased(gift.id);
    } catch (error) {
      console.error("Failed to toggle purchased:", error);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this gift?")) {
      try {
        await deleteGift(gift.id);
      } catch (error) {
        console.error("Failed to delete gift:", error);
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-500";
      case "medium":
        return "border-yellow-500";
      case "low":
        return "border-blue-500";
      default:
        return "border-border";
    }
  };

  return (
    <Card
      className={`group overflow-hidden transition-all hover:shadow-lg ${
        gift.isPurchased ? "opacity-60" : ""
      } border-l-4 ${getPriorityColor(gift.priority)}`}
    >
      {gift.imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <Image
            src={gift.imageUrl}
            alt={gift.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold line-clamp-1">{gift.name}</h3>
            <p className="text-sm text-muted-foreground">
              For: {gift.recipientName}
            </p>
          </div>
          {gift.url && (
            <a
              href={gift.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Target:</span>
            <span className="font-medium">{formatCurrency(gift.targetPrice)}</span>
          </div>
          {gift.currentPrice && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current:</span>
              <span className="font-medium">
                {formatCurrency(gift.currentPrice)}
              </span>
            </div>
          )}
          {hasSavings && (
            <div className="flex justify-between text-sm">
              <span className="text-green-500 font-medium">Savings:</span>
              <span className="text-green-500 font-medium">
                {formatCurrency(savings)}
              </span>
            </div>
          )}
        </div>
        {gift.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {gift.notes}
          </p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button
          onClick={handleTogglePurchased}
          variant={gift.isPurchased ? "outline" : "default"}
          className="flex-1"
          size="sm"
        >
          {gift.isPurchased ? "Mark Unpurchased" : "Mark Purchased"}
        </Button>
        <Button
          onClick={handleDelete}
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
