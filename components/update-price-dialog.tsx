"use client";

import { useState } from "react";
import { TrendingDown, Upload, Loader2, Link as LinkIcon } from "lucide-react";
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
import { Item } from "@/db/schema";
import { updateItemPrice, analyzeProductScreenshot } from "@/actions/item-actions";
import { useRouter } from "next/navigation";
import { CaptureFromUrlDialog } from "./capture-from-url-dialog";

interface UpdatePriceDialogProps {
  item: Item;
}

export function UpdatePriceDialog({ item }: UpdatePriceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualPrice, setManualPrice] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("manual");
  const [showCaptureDialog, setShowCaptureDialog] = useState(false);

  const handleManualUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPrice) return;

    setLoading(true);
    try {
      await updateItemPrice(item.id, parseFloat(manualPrice));
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

        const result = await analyzeProductScreenshot(base64);

        if (result.success && result.price) {
          await updateItemPrice(item.id, result.price);
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

  const handlePriceExtracted = async (price: number, name?: string) => {
    setLoading(true);
    try {
      await updateItemPrice(item.id, price);
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to update price:", error);
      alert(error instanceof Error ? error.message : "Failed to update price");
    } finally {
      setLoading(false);
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
          <DialogTitle>Update Price for {item.name}</DialogTitle>
          <DialogDescription>
            Enter the current price manually or upload a screenshot for AI extraction
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="url">URL Capture</TabsTrigger>
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
                {item.currentPrice && (
                  <p className="text-sm text-muted-foreground">
                    Last recorded: ${parseFloat(item.currentPrice).toFixed(2)}
                  </p>
                )}
              </div>
            </form>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <LinkIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">How it works:</p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Paste the product URL</li>
                      <li>The page loads in a preview</li>
                      <li>Click "Capture" to take a screenshot</li>
                      <li>AI automatically extracts the price</li>
                    </ol>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowCaptureDialog(true)}
                className="w-full"
                size="lg"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Open URL Capture Tool
              </Button>

              <p className="text-xs text-muted-foreground">
                💡 Works best with product pages from Amazon, Walmart, Target, Best Buy, and most online stores
              </p>
            </div>
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
          <p className="font-medium mb-1">Target Price: ${parseFloat(item.targetPrice).toFixed(2)}</p>
          {item.currentPrice && parseFloat(item.currentPrice) < parseFloat(item.targetPrice) && (
            <p className="text-green-500 font-medium">
              Current price is below target! Save $
              {(parseFloat(item.targetPrice) - parseFloat(item.currentPrice)).toFixed(2)}
            </p>
          )}
        </div>
      </DialogContent>

      <CaptureFromUrlDialog
        open={showCaptureDialog}
        onOpenChange={setShowCaptureDialog}
        onPriceExtracted={handlePriceExtracted}
      />
    </Dialog>
  );
}
