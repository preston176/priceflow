"use client";

import { useState } from "react";
import { TrendingDown, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift } from "@/db/schema";
import { updateGiftPrice } from "@/actions/gift-actions";
import { extractMetadataFromScreenshot } from "@/lib/price-scraper";
import { useRouter } from "next/navigation";

interface UpdatePriceDialogProps {
  gift: Gift;
}

export function UpdatePriceDialog({ gift }: UpdatePriceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualPrice, setManualPrice] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("manual");

  const handleManualUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPrice) return;

    setLoading(true);
    try {
      await updateGiftPrice(gift.id, parseFloat(manualPrice));
      setOpen(false);
      setManualPrice("");
      router.refresh();
    } catch (error) {
      console.error("Failed to update price:", error);
      alert(error instanceof Error ? error.message : "Failed to update price");
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshotUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshotFile) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;

        const result = await extractMetadataFromScreenshot(base64);

        if (result.success && result.price) {
          await updateGiftPrice(gift.id, result.price);
          setOpen(false);
          setScreenshotFile(null);
          router.refresh();
        } else {
          alert("Could not extract price from screenshot. Please try manual entry.");
        }
        setLoading(false);
      };
      reader.readAsDataURL(screenshotFile);
    } catch (error) {
      console.error("Failed to extract price:", error);
      alert(error instanceof Error ? error.message : "Failed to extract price");
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotFile(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <TrendingDown className="h-4 w-4 mr-2" />
          Update Price
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Price for {gift.name}</DialogTitle>
          <DialogDescription>
            Enter the current price manually or upload a screenshot for AI extraction
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="screenshot">Screenshot</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <form onSubmit={handleManualUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Current Price</Label>
                <div className="flex gap-2">
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    required
                  />
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update"
                    )}
                  </Button>
                </div>
                {gift.currentPrice && (
                  <p className="text-sm text-muted-foreground">
                    Last recorded: ${parseFloat(gift.currentPrice).toFixed(2)}
                  </p>
                )}
              </div>
            </form>
          </TabsContent>

          <TabsContent value="screenshot" className="space-y-4">
            <form onSubmit={handleScreenshotUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="screenshot">Upload Screenshot</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Input
                      id="screenshot"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      required
                    />
                  </div>
                  {screenshotFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {screenshotFile.name}
                    </p>
                  )}
                </div>
              </div>
              <Button type="submit" disabled={loading || !screenshotFile} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Extracting Price...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Extract & Update Price
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-sm text-muted-foreground pt-4 border-t">
          <p className="font-medium mb-1">Target Price: ${parseFloat(gift.targetPrice).toFixed(2)}</p>
          {gift.currentPrice && parseFloat(gift.currentPrice) < parseFloat(gift.targetPrice) && (
            <p className="text-green-500 font-medium">
              Current price is below target! Save $
              {(parseFloat(gift.targetPrice) - parseFloat(gift.currentPrice)).toFixed(2)}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
