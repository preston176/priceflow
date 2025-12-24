"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/header";
import { BudgetProgress } from "@/components/budget-progress";
import { AddGiftDialog } from "@/components/add-gift-dialog";
import { GiftCard } from "@/components/gift-card";
import { ListSelector } from "@/components/list-selector";
import { List, Gift } from "@/db/schema";

interface DashboardContentProps {
  profile: {
    name: string | null;
  };
  lists: List[];
  initialListId?: string;
  initialGifts: Gift[];
}

export function DashboardContent({
  profile,
  lists,
  initialListId,
  initialGifts,
}: DashboardContentProps) {
  const router = useRouter();
  const [currentListId, setCurrentListId] = useState(initialListId);

  const handleListChange = (listId: string) => {
    setCurrentListId(listId);
    router.push(`/dashboard?list=${listId}`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <Header listId={currentListId} listName={currentList?.name} />
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
              {savingsAlerts.length > 0 && (
                <Card className="border-green-500/50 bg-green-500/10">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-green-500" />
                      <p className="font-semibold text-green-500">Savings Alert!</p>
                    </div>
                    <p className="text-sm">
                      {savingsAlerts.length} gift{savingsAlerts.length > 1 ? "s" : ""}{" "}
                      below target price
                    </p>
                  </CardContent>
                </Card>
              )}
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
