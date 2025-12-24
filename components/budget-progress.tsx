"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { updateBudget } from "@/actions/profile-actions";
import { DollarSign, Edit } from "lucide-react";

interface BudgetProgressProps {
  totalBudget: string;
  totalSpent: number;
}

export function BudgetProgress({ totalBudget, totalSpent }: BudgetProgressProps) {
  const [open, setOpen] = useState(false);
  const [newBudget, setNewBudget] = useState(totalBudget);
  const [loading, setLoading] = useState(false);

  const budget = parseFloat(totalBudget);
  const percentage = budget > 0 ? (totalSpent / budget) * 100 : 0;

  const handleUpdateBudget = async () => {
    setLoading(true);
    try {
      await updateBudget(newBudget);
      setOpen(false);
    } catch (error) {
      console.error("Failed to update budget:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Overview
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Your Budget</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Total Budget</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <Button
                  onClick={handleUpdateBudget}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Updating..." : "Update Budget"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Spent</span>
          <span className="font-semibold">{formatCurrency(totalSpent)}</span>
        </div>
        <Progress value={Math.min(percentage, 100)} className="h-3" />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Budget</span>
          <span className="font-semibold">{formatCurrency(budget)}</span>
        </div>
        {budget > 0 && (
          <div className="text-center pt-2">
            <span
              className={`text-sm font-medium ${
                totalSpent > budget ? "text-destructive" : "text-green-500"
              }`}
            >
              {totalSpent > budget
                ? `${formatCurrency(totalSpent - budget)} over budget`
                : `${formatCurrency(budget - totalSpent)} remaining`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
