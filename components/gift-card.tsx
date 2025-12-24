"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink, Trash2, TrendingDown, TrendingUp, BarChart3, Bell, BellOff, Loader2 } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency, calculateSavings } from "@/lib/utils";
import { togglePurchased, deleteGift } from "@/actions/gift-actions";
import { togglePriceTracking, checkPriceNow } from "@/actions/price-actions";
import { PriceHistoryChart } from "@/components/price-history-chart";
import { Gift } from "@/db/schema";
import { useToast } from "@/hooks/use-toast";

interface GiftCardProps {
  gift: Gift;
}

export function GiftCard({ gift }: GiftCardProps) {
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [isCheckingPrice, setIsCheckingPrice] = useState(false);
  const { toast } = useToast();
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

  const handleToggleTracking = async () => {
    const wasEnabled = gift.priceTrackingEnabled;

    try {
      setIsCheckingPrice(true);

      // Toggle tracking
      await togglePriceTracking(
        gift.id,
        !wasEnabled,
        gift.targetPrice
      );

      // If enabling tracking, immediately check the price
      if (!wasEnabled && gift.url) {
        toast({
          title: "Checking price...",
          description: "Fetching current price from product page",
        });

        const result = await checkPriceNow(gift.id);

        if (result.success && result.price) {
          toast({
            title: "Price tracking enabled!",
            description: `Current price: ${formatCurrency(result.price)}`,
          });
        } else {
          toast({
            title: "Tracking enabled",
            description: result.error || "Could not fetch price automatically. Try 'Check Now' in price history.",
            variant: "default",
          });
        }
      } else {
        toast({
          title: wasEnabled ? "Tracking disabled" : "Tracking enabled",
          description: wasEnabled
            ? "Price tracking has been turned off"
            : "Price tracking has been turned on",
        });
      }
    } catch (error) {
      console.error("Failed to toggle price tracking:", error);
      toast({
        title: "Error",
        description: "Failed to update price tracking",
        variant: "destructive",
      });
    } finally {
      setIsCheckingPrice(false);
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
          {gift.priceTrackingEnabled && gift.url && (
            <div className="absolute top-2 left-2 bg-green-500/90 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <Bell className="h-3 w-3" />
              Tracking
            </div>
          )}
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
      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        {gift.url && (
          <div className="flex gap-2 w-full">
            <Button
              onClick={handleToggleTracking}
              variant={gift.priceTrackingEnabled ? "default" : "outline"}
              size="sm"
              className="flex-1"
              disabled={isCheckingPrice}
            >
              {isCheckingPrice ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Checking...
                </>
              ) : gift.priceTrackingEnabled ? (
                <>
                  <Bell className="h-4 w-4 mr-1" />
                  Tracking
                </>
              ) : (
                <>
                  <BellOff className="h-4 w-4 mr-1" />
                  Track Price
                </>
              )}
            </Button>
            <Dialog open={showPriceHistory} onOpenChange={setShowPriceHistory}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{gift.name}</DialogTitle>
                </DialogHeader>
                <PriceHistoryChart
                  giftId={gift.id}
                  giftName={gift.name}
                  currentPrice={gift.currentPrice}
                  targetPrice={gift.targetPrice}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
        <div className="flex gap-2 w-full">
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
        </div>
      </CardFooter>
    </Card>
  );
}
