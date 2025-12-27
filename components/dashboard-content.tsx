"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Package,
  Archive as ArchiveIcon,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  ShoppingBag,
  Target,
  Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { BudgetProgress } from "@/components/budget-progress";
import { AddGiftDialog } from "@/components/add-gift-dialog";
import { GiftCard } from "@/components/gift-card";
import { ListSelector } from "@/components/list-selector";
import { OnboardingDialog } from "@/components/onboarding-dialog";
import { List, Gift } from "@/db/schema";
import { unarchiveList } from "@/actions/list-actions";

interface DashboardContentProps {
  profile: {
    name: string | null;
    currency: string;
    onboardingCompleted: boolean;
  };
  lists: List[];
  archivedLists: List[];
  initialListId?: string;
  initialGifts: Gift[];
}

export function DashboardContent({
  profile,
  lists,
  archivedLists,
  initialListId,
  initialGifts,
}: DashboardContentProps) {
  const router = useRouter();
  const [currentListId, setCurrentListId] = useState(initialListId);
  const [showArchived, setShowArchived] = useState(false);
  const [unarchiving, setUnarchiving] = useState<string | null>(null);

  const handleListChange = (listId: string) => {
    setCurrentListId(listId);
    router.push(`/dashboard?list=${listId}`);
  };

  const handleUnarchive = async (listId: string) => {
    setUnarchiving(listId);
    try {
      await unarchiveList(listId);
      router.refresh();
    } catch (error) {
      console.error("Failed to unarchive list:", error);
    } finally {
      setUnarchiving(null);
    }
  };

  const currentList = lists.find((l) => l.id === currentListId) || lists[0];
  const gifts = currentList
    ? initialGifts.filter((g) => g.listId === currentList.id)
    : [];

  const totalSpent = gifts
    .filter((g) => g.isPurchased)
    .reduce((sum, g) => sum + parseFloat(g.currentPrice || g.targetPrice), 0);

  const savingsAlerts = gifts.filter((g) => {
    if (!g.currentPrice || !g.priceTrackingEnabled) return false;
    const current = parseFloat(g.currentPrice);
    const target = parseFloat(g.targetPrice);
    return current < target;
  });

  const totalPotentialSavings = savingsAlerts.reduce((sum, g) => {
    const current = parseFloat(g.currentPrice!);
    const target = parseFloat(g.targetPrice);
    return sum + (target - current);
  }, 0);

  const purchasedCount = gifts.filter((g) => g.isPurchased).length;
  const totalGifts = gifts.length;
  const purchaseProgress = totalGifts > 0 ? (purchasedCount / totalGifts) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Onboarding Dialog for new users */}
      <OnboardingDialog open={!profile.onboardingCompleted} />

      <Header
        listId={currentListId}
        listName={currentList?.name}
        currency={profile.currency}
        userName={profile.name || undefined}
        gifts={gifts}
      />

      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate">
                Welcome back, {profile.name}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Track your gift shopping and stay on budget
              </p>
            </div>
          </div>
        </div>

        {/* List Selector */}
        <div className="mb-6 sm:mb-8">
          <ListSelector
            lists={lists}
            currentListId={currentListId}
            onListChange={handleListChange}
          />
        </div>

        {currentList ? (
          <>
            {/* Stats Grid */}
            <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
              {/* Budget Card */}
              <div className="lg:col-span-2">
                <BudgetProgress
                  listId={currentList.id}
                  totalBudget={currentList.budget || "0"}
                  totalSpent={totalSpent}
                  currency={profile.currency}
                />
              </div>

              {/* Total Gifts Card */}
              <Card className="group hover:shadow-lg transition-all duration-300 border-muted/40">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                      {purchasedCount}/{totalGifts}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-1">{totalGifts}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Gifts</p>
                  {totalGifts > 0 && (
                    <div className="mt-4">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                          style={{ width: `${purchaseProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Savings Alert Card */}
              <Card className={`group hover:shadow-lg transition-all duration-300 ${
                savingsAlerts.length > 0
                  ? "border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent"
                  : "border-muted/40"
              }`}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                      savingsAlerts.length > 0
                        ? "bg-green-500/10"
                        : "bg-muted/50"
                    }`}>
                      <TrendingDown className={`h-5 w-5 sm:h-6 sm:w-6 ${
                        savingsAlerts.length > 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                      }`} />
                    </div>
                    {savingsAlerts.length > 0 && (
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    )}
                  </div>
                  {savingsAlerts.length > 0 ? (
                    <>
                      <h3 className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                        ${totalPotentialSavings.toFixed(2)}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Potential Savings
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                        {savingsAlerts.length} item{savingsAlerts.length > 1 ? "s" : ""} below target
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl sm:text-2xl font-bold mb-1">$0.00</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        No savings yet
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Gifts Section */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Your Gifts</h2>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Manage and track your gift list
                  </p>
                </div>
                <AddGiftDialog lists={lists} currentListId={currentList.id} />
              </div>

              {gifts.length > 0 ? (
                <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {gifts.map((gift) => (
                    <GiftCard key={gift.id} gift={gift} />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed border-2">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <Package className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No gifts yet</h3>
                    <p className="text-muted-foreground mb-6 text-center max-w-sm">
                      Start building your gift list by adding items you want to purchase
                    </p>
                    <AddGiftDialog lists={lists} currentListId={currentList.id} />
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        ) : (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Target className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No lists found</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                Create your first gift list to get started
              </p>
            </CardContent>
          </Card>
        )}

        {/* Archived Lists Section */}
        {archivedLists.length > 0 && (
          <div className="mt-12">
            <Button
              variant="ghost"
              onClick={() => setShowArchived(!showArchived)}
              className="mb-4 hover:bg-muted/50"
            >
              <ArchiveIcon className="h-4 w-4 mr-2" />
              Archived Lists ({archivedLists.length})
              {showArchived ? (
                <ChevronUp className="h-4 w-4 ml-2" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-2" />
              )}
            </Button>

            {showArchived && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {archivedLists.map((list) => (
                  <Card key={list.id} className="border-muted/40">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{list.name}</h3>
                          {list.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {list.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnarchive(list.id)}
                        disabled={unarchiving === list.id}
                        className="w-full mt-4"
                      >
                        {unarchiving === list.id ? "Unarchiving..." : "Unarchive"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
