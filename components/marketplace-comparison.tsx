"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ExternalLink,
  Trash2,
  Check,
  AlertCircle,
  RefreshCw,
  Star,
} from "lucide-react";
import { MarketplaceProduct } from "@/db/schema";
import {
  removeMarketplaceProduct,
  setPrimaryMarketplace,
  syncMarketplacePrices,
} from "@/actions/marketplace-actions";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface MarketplaceComparisonProps {
  giftId: string;
  giftName: string;
  products: MarketplaceProduct[];
  currentPrimaryMarketplace?: string | null;
}

const MARKETPLACE_COLORS: Record<string, string> = {
  amazon: "bg-orange-500",
  walmart: "bg-blue-500",
  target: "bg-red-500",
  bestbuy: "bg-yellow-500",
};

const MARKETPLACE_NAMES: Record<string, string> = {
  amazon: "Amazon",
  walmart: "Walmart",
  target: "Target",
  bestbuy: "Best Buy",
};

const getMarketplaceSearchUrl = (marketplace: string, productName: string): string => {
  const searchQuery = encodeURIComponent(productName);

  switch (marketplace.toLowerCase()) {
    case "amazon":
      return `https://www.amazon.com/s?k=${searchQuery}`;
    case "walmart":
      return `https://www.walmart.com/search?q=${searchQuery}`;
    case "target":
      return `https://www.target.com/s?searchTerm=${searchQuery}`;
    case "bestbuy":
      return `https://www.bestbuy.com/site/searchpage.jsp?st=${searchQuery}`;
    default:
      return `https://www.google.com/search?q=${searchQuery}`;
  }
};

export function MarketplaceComparison({
  giftId,
  giftName,
  products,
  currentPrimaryMarketplace,
}: MarketplaceComparisonProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  if (!products || products.length === 0) {
    return null;
  }

  // Find best price
  const bestPrice = Math.min(
    ...products
      .filter((p) => p.currentPrice)
      .map((p) => parseFloat(p.currentPrice!))
  );

  const handleRemove = async (marketplace: string) => {
    setLoading(marketplace);
    try {
      const result = await removeMarketplaceProduct(giftId, marketplace);

      if (result.success) {
        toast({
          title: "Marketplace removed",
          description: `Removed ${MARKETPLACE_NAMES[marketplace] || marketplace} from tracking`,
        });
      } else {
        toast({
          title: "Failed to remove",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove marketplace",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleSetPrimary = async (marketplace: string) => {
    setLoading(marketplace);
    try {
      const result = await setPrimaryMarketplace(giftId, marketplace);

      if (result.success) {
        toast({
          title: "Primary marketplace updated",
          description: `${MARKETPLACE_NAMES[marketplace] || marketplace} is now the primary source`,
        });
      } else {
        toast({
          title: "Failed to update",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update primary marketplace",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleSyncPrices = async () => {
    setSyncing(true);
    try {
      const result = await syncMarketplacePrices(giftId);

      if (result.success) {
        // Show success with details about failures
        if (result.updated > 0 && result.errors.length > 0) {
          // Partial success
          toast({
            title: `${result.updated} of ${result.updated + result.errors.length} marketplace${result.updated + result.errors.length !== 1 ? 's' : ''} updated`,
            description: `✓ Synced ${result.updated}, ✗ Failed ${result.errors.length}. ${result.errors.length > 0 ? `Failed: ${result.errors.join(", ")}` : ''}`,
          });
        } else if (result.updated > 0) {
          // Full success
          toast({
            title: "All prices synced!",
            description: `Successfully updated ${result.updated} marketplace${result.updated !== 1 ? 's' : ''}`,
          });
        } else {
          // All failed
          toast({
            title: "Sync failed",
            description: result.errors.join(", "),
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Sync failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync prices",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header with sync button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
        <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
          {products.length} marketplace{products.length !== 1 ? "s" : ""} tracked
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSyncPrices}
          disabled={syncing}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? "animate-spin" : ""}`} />
          <span className="text-xs sm:text-sm">Sync Prices</span>
        </Button>
      </div>

      {/* Marketplace cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {products.map((product) => {
          const price = product.currentPrice
            ? parseFloat(product.currentPrice)
            : null;
          const isBestPrice = price !== null && price === bestPrice;
          const isPrimary = product.marketplace === currentPrimaryMarketplace;
          const confidence = product.confidenceScore
            ? parseFloat(product.confidenceScore)
            : null;

          // Determine confidence level
          const confidenceLevel =
            confidence !== null
              ? confidence >= 0.85
                ? "high"
                : confidence >= 0.7
                ? "medium"
                : "low"
              : null;

          return (
            <Card
              key={product.id}
              className={`relative ${isBestPrice ? "ring-2 ring-green-500" : ""} ${
                !product.inStock ? "opacity-60" : ""
              }`}
            >
              {/* Best Price Badge */}
              {isBestPrice && (
                <div className="absolute -top-2 -right-2 z-10">
                  <Badge className="bg-green-500 text-white">Best Price</Badge>
                </div>
              )}

              {/* Primary Star */}
              {isPrimary && (
                <div className="absolute top-2 left-2 z-10">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
              )}

              <CardHeader className="pb-2 sm:pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        MARKETPLACE_COLORS[product.marketplace] || "bg-gray-500"
                      }`}
                    />
                    <CardTitle className="text-xs sm:text-sm truncate">
                      {MARKETPLACE_NAMES[product.marketplace] ||
                        product.marketplace}
                    </CardTitle>
                  </div>

                  {/* Confidence Badge */}
                  {confidenceLevel && (
                    <Badge
                      variant={
                        confidenceLevel === "high"
                          ? "default"
                          : confidenceLevel === "medium"
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-[10px] sm:text-xs flex-shrink-0"
                    >
                      {confidence && (Math.round(confidence * 100))}% match
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6">
                {/* Price */}
                <div>
                  {price !== null ? (
                    <div className="text-xl sm:text-2xl font-bold">
                      ${price.toFixed(2)}
                    </div>
                  ) : (
                    <div className="text-base sm:text-lg text-muted-foreground">
                      Price unavailable
                    </div>
                  )}
                </div>

                {/* Stock Status */}
                <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                  {product.inStock ? (
                    <>
                      <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <span className="text-green-600">In Stock</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                      <span className="text-red-600">Out of Stock</span>
                    </>
                  )}
                </div>

                {/* Last Updated */}
                {product.lastPriceCheck && (
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    Updated{" "}
                    {formatDistanceToNow(new Date(product.lastPriceCheck), {
                      addSuffix: true,
                    })}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-1.5 sm:gap-2 pt-1 sm:pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
                    asChild
                  >
                    <a
                      href={getMarketplaceSearchUrl(product.marketplace, giftName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Search for "${giftName}" on ${MARKETPLACE_NAMES[product.marketplace] || product.marketplace}`}
                    >
                      <ExternalLink className="h-3 w-3 sm:mr-1.5" />
                      <span className="hidden sm:inline">View</span>
                    </a>
                  </Button>

                  {!isPrimary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetPrimary(product.marketplace)}
                      disabled={loading === product.marketplace}
                      title="Set as primary marketplace"
                      className="h-8 sm:h-9 px-2 sm:px-3"
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(product.marketplace)}
                    disabled={loading === product.marketplace}
                    className="text-destructive hover:text-destructive h-8 sm:h-9 px-2 sm:px-3"
                    title="Remove marketplace"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Low Confidence Warning */}
                {confidenceLevel === "low" && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-1.5 sm:p-2 mt-1.5 sm:mt-2">
                    <p className="text-[10px] sm:text-xs text-yellow-800 dark:text-yellow-200">
                      Low match confidence - verify this is the same product
                    </p>
                  </div>
                )}

                {/* Medium Confidence Info */}
                {confidenceLevel === "medium" && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-1.5 sm:p-2 mt-1.5 sm:mt-2">
                    <p className="text-[10px] sm:text-xs text-blue-800 dark:text-blue-200">
                      Possible match - please review
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      {products.length > 1 && bestPrice && (
        <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium">Best Deal</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {products.find(
                  (p) => p.currentPrice && parseFloat(p.currentPrice) === bestPrice
                )?.marketplace &&
                  MARKETPLACE_NAMES[
                    products.find(
                      (p) =>
                        p.currentPrice && parseFloat(p.currentPrice) === bestPrice
                    )!.marketplace
                  ]}{" "}
                has the lowest price
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl sm:text-2xl font-bold text-green-600">
                ${bestPrice.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
