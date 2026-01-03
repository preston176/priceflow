"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ExternalLink, Trash2, TrendingDown, TrendingUp, BarChart3, Loader2, Store, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency, calculateSavings } from "@/lib/utils";
import { togglePurchased, deleteItem, autoUpdatePrice, toggleAutoUpdate } from "@/actions/item-actions";
import { getMarketplaceProducts } from "@/actions/marketplace-actions";
import { PriceHistoryChart } from "@/components/price-history-chart";
import { UpdatePriceDialog } from "@/components/update-price-dialog";
import { MarketplaceComparison } from "@/components/marketplace-comparison";
import { Item, MarketplaceProduct } from "@/db/schema";
import { useToast } from "@/hooks/use-toast";

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [showMarketplaces, setShowMarketplaces] = useState(false);
  const [isAutoUpdating, setIsAutoUpdating] = useState(false);
  const [isTogglingPurchased, setIsTogglingPurchased] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingAutoUpdate, setIsTogglingAutoUpdate] = useState(false);
  const [marketplaceProducts, setMarketplaceProducts] = useState<MarketplaceProduct[]>([]);
  const [loadingMarketplaces, setLoadingMarketplaces] = useState(false);
  const { toast } = useToast();
  const savings = calculateSavings(item.targetPrice, item.currentPrice);
  const hasSavings = savings !== null && savings > 0;

  // Load marketplace products when component mounts or when showing marketplaces
  useEffect(() => {
    if (showMarketplaces && marketplaceProducts.length === 0) {
      loadMarketplaceProducts();
    }
  }, [showMarketplaces]);

  const loadMarketplaceProducts = async () => {
    setLoadingMarketplaces(true);
    try {
      const result = await getMarketplaceProducts(item.id);
      if (result.success) {
        setMarketplaceProducts(result.products);
      }
    } catch (error) {
      console.error("Failed to load marketplace products:", error);
    } finally {
      setLoadingMarketplaces(false);
    }
  };

  const handleTogglePurchased = async () => {
    setIsTogglingPurchased(true);
    try {
      await togglePurchased(item.id);
    } catch (error) {
      console.error("Failed to toggle purchased:", error);
      toast({
        title: "Error",
        description: "Failed to update purchase status",
        variant: "destructive",
      });
    } finally {
      setIsTogglingPurchased(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this item?")) {
      setIsDeleting(true);
      try {
        await deleteItem(item.id);
        toast({
          title: "Item deleted",
          description: "The item has been removed from your list",
        });
      } catch (error) {
        console.error("Failed to delete item:", error);
        toast({
          title: "Error",
          description: "Failed to delete item",
          variant: "destructive",
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleToggleAutoUpdate = async () => {
    const newState = !item.autoUpdateEnabled;
    setIsTogglingAutoUpdate(true);

    try {
      await toggleAutoUpdate(item.id, newState);

      toast({
        title: newState ? "Auto Update Enabled" : "Auto Update Disabled",
        description: newState
          ? "This item will be automatically updated periodically"
          : "Automatic updates have been turned off",
      });
    } catch (error) {
      console.error("Failed to toggle auto update:", error);
      toast({
        title: "Error",
        description: "Failed to toggle auto update",
        variant: "destructive",
      });
    } finally {
      setIsTogglingAutoUpdate(false);
    }
  };

  const handleAutoUpdate = async () => {
    setIsAutoUpdating(true);
    try {
      const result = await autoUpdatePrice(item.id);

      if (result.success) {
        toast({
          title: "Auto Update Started",
          description: result.message || "You'll receive an email when the price update is complete.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to start auto update",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to start auto update:", error);
      toast({
        title: "Error",
        description: "Failed to start auto update",
        variant: "destructive",
      });
    } finally {
      setIsAutoUpdating(false);
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
        item.isPurchased ? "opacity-60" : ""
      } border-l-4 ${getPriorityColor(item.priority)}`}
    >
      {item.imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold line-clamp-1">{item.name}</h3>
            <p className="text-sm text-muted-foreground">
              For: {item.recipientName}
            </p>
          </div>
          {item.url && (
            <a
              href={item.url}
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
            <span className="font-medium">{formatCurrency(item.targetPrice)}</span>
          </div>
          {item.currentPrice && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current:</span>
              <span className="font-medium">
                {formatCurrency(item.currentPrice)}
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
        {item.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {item.notes}
          </p>
        )}

        {/* Marketplace comparison toggle */}
        {(item.primaryMarketplace || showMarketplaces) && (
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between h-auto py-2 px-3"
              onClick={() => setShowMarketplaces(!showMarketplaces)}
            >
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                <Store className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium truncate">
                  {marketplaceProducts.length > 0
                    ? `${marketplaceProducts.length} Marketplace${marketplaceProducts.length !== 1 ? 's' : ''}`
                    : "View Marketplaces"}
                </span>
                {item.primaryMarketplace && (
                  <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0 hidden sm:inline-flex">
                    {item.primaryMarketplace}
                  </Badge>
                )}
              </div>
              {showMarketplaces ? (
                <ChevronUp className="h-4 w-4 flex-shrink-0 ml-2" />
              ) : (
                <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" />
              )}
            </Button>

            {/* Marketplace comparison view */}
            {showMarketplaces && (
              <div className="mt-3 -mx-1 sm:mx-0">
                {loadingMarketplaces ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : marketplaceProducts.length > 0 ? (
                  <MarketplaceComparison
                    itemId={item.id}
                    itemName={item.name}
                    products={marketplaceProducts}
                    currentPrimaryMarketplace={item.primaryMarketplace}
                  />
                ) : (
                  <div className="text-center py-4 text-xs sm:text-sm text-muted-foreground">
                    No marketplace products tracked yet
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        <div className="flex gap-2 w-full">
          <UpdatePriceDialog item={item} />
          <Button
            onClick={handleToggleAutoUpdate}
            variant={item.autoUpdateEnabled ? "default" : "outline"}
            size="sm"
            className="flex-1"
            disabled={isTogglingAutoUpdate}
          >
            {isTogglingAutoUpdate ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-1" />
            )}
            {item.autoUpdateEnabled ? "Auto: ON" : "Auto: OFF"}
          </Button>
          {item.autoUpdateEnabled && (
            <Button
              onClick={handleAutoUpdate}
              variant="secondary"
              size="sm"
              disabled={isAutoUpdating}
              title="Update now"
            >
              {isAutoUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        {item.url && (
          <Dialog open={showPriceHistory} onOpenChange={setShowPriceHistory}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Price History
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{item.name}</DialogTitle>
              </DialogHeader>
              <PriceHistoryChart
                itemId={item.id}
                itemName={item.name}
                currentPrice={item.currentPrice}
                targetPrice={item.targetPrice}
              />
            </DialogContent>
          </Dialog>
        )}
        <div className="flex gap-2 w-full">
          <Button
            onClick={handleTogglePurchased}
            variant={item.isPurchased ? "outline" : "default"}
            className="flex-1"
            size="sm"
            disabled={isTogglingPurchased || isDeleting}
          >
            {isTogglingPurchased ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>{item.isPurchased ? "Mark Unpurchased" : "Mark Purchased"}</>
            )}
          </Button>
          <Button
            onClick={handleDelete}
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={isDeleting || isTogglingPurchased}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
