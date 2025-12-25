"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Package, Archive as ArchiveIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { BudgetProgress } from "@/components/budget-progress";
import { AddGiftDialog } from "@/components/add-gift-dialog";
import { GiftCard } from "@/components/gift-card";
import { ListSelector } from "@/components/list-selector";
import { List, Gift } from "@/db/schema";
import { unarchiveList } from "@/actions/list-actions";

interface DashboardContentProps {
  profile: {
    name: string | null;
    currency: string;
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
      alert(error instanceof Error ? error.message : "Failed to unarchive list");
    } finally {
      setUnarchiving(null);
    }
  };

  const currentList = lists.find((l) => l.id === currentListId);
  const gifts = initialGifts;

  const totalSpent = gifts
    .filter((gift) => gift.isPurchased)
    .reduce((sum, gift) => sum + parseFloat(gift.targetPrice), 0);

  const savingsAlerts = gifts.filter((gift) => {
    if (!gift.currentPrice || gift.isPurchased) return false;
    const target = parseFloat(gift.targetPrice);
    const current = parseFloat(gift.currentPrice);
    return current < target;
  });

  const totalPotentialSavings = savingsAlerts.reduce((sum, gift) => {
    const target = parseFloat(gift.targetPrice);
    const current = parseFloat(gift.currentPrice!);
    return sum + (target - current);
  }, 0);

  const bestDeal = savingsAlerts.reduce<{ name: string; savings: number } | null>((best, gift) => {
    const target = parseFloat(gift.targetPrice);
    const current = parseFloat(gift.currentPrice!);
    const savings = target - current;
    if (!best || savings > best.savings) {
      return { name: gift.name, savings };
    }
    return best;
  }, null);

  const giftsWithoutPrices = gifts.filter((g) => !g.isPurchased && !g.currentPrice).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <Header
        listId={currentListId}
        listName={currentList?.name}
        currency={profile.currency}
        userName={profile.name || undefined}
        gifts={gifts}
      />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {profile.name}
          </h2>
          <p className="text-muted-foreground">
            Track your gift shopping and stay on budget
          </p>
        </div>

        <div className="mb-6">
          <ListSelector
            lists={lists}
            currentListId={currentListId}
            onListChange={handleListChange}
          />
        </div>

        {currentList ? (
          <>
            <div className="grid gap-6 md:grid-cols-3 mb-8">
              <BudgetProgress
                totalBudget={currentList.budget || "0"}
                totalSpent={totalSpent}
              />
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Gifts</p>
                      <p className="text-3xl font-bold">{gifts.length}</p>
                    </div>
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    {gifts.filter((g) => g.isPurchased).length} purchased
                  </div>
                </CardContent>
              </Card>
              <Card className={savingsAlerts.length > 0 ? "border-green-500/50 bg-green-500/10" : ""}>
                <CardContent className="p-6">
                  {savingsAlerts.length > 0 ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-green-500" />
                        <p className="font-semibold text-green-500">Savings Unlocked!</p>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        ${totalPotentialSavings.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {savingsAlerts.length} item{savingsAlerts.length > 1 ? "s" : ""} below target
                      </p>
                      {bestDeal && (
                        <p className="text-xs text-green-600 mt-2">
                          Best: {bestDeal.name} (${bestDeal.savings.toFixed(2)} off)
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <p className="font-semibold">Price Tracking</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {giftsWithoutPrices > 0
                          ? `${giftsWithoutPrices} item${giftsWithoutPrices > 1 ? "s" : ""} waiting for price check`
                          : "All prices up to date"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Update prices to find the best deals
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold">
                {currentList.name}
                {currentList.description && (
                  <span className="text-sm text-muted-foreground ml-2">
                    - {currentList.description}
                  </span>
                )}
              </h3>
              <AddGiftDialog lists={lists} currentListId={currentListId} />
            </div>

            {gifts.length === 0 ? (
              <Card className="p-12">
                <div className="text-center space-y-4">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">No gifts yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start adding gifts to this list
                    </p>
                    <AddGiftDialog lists={lists} currentListId={currentListId} />
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {gifts.map((gift) => (
                  <GiftCard key={gift.id} gift={gift} />
                ))}
              </div>
            )}

            {archivedLists.length > 0 && (
              <div className="mt-12">
                <Button
                  variant="ghost"
                  className="w-full justify-between mb-4"
                  onClick={() => setShowArchived(!showArchived)}
                >
                  <div className="flex items-center gap-2">
                    <ArchiveIcon className="h-5 w-5" />
                    <span className="font-semibold">
                      Archived Lists ({archivedLists.length})
                    </span>
                  </div>
                  {showArchived ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </Button>

                {showArchived && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {archivedLists.map((list) => (
                      <Card key={list.id} className="p-4">
                        <div className="flex flex-col gap-3">
                          <div>
                            <h4 className="font-semibold">{list.name}</h4>
                            {list.description && (
                              <p className="text-sm text-muted-foreground">
                                {list.description}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnarchive(list.id)}
                            disabled={unarchiving === list.id}
                          >
                            {unarchiving === list.id ? "Unarchiving..." : "Unarchive"}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <Package className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-xl font-semibold mb-2">No lists yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first list to get started
                </p>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
