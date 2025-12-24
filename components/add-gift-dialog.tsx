"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Loader2, Sparkles, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/image-upload";
import { addGift, fetchProductInfo, analyzeProductScreenshot } from "@/actions/gift-actions";
import { List } from "@/db/schema";
import { useToast } from "@/hooks/use-toast";

interface AddGiftDialogProps {
  lists: List[];
  currentListId?: string;
}

export function AddGiftDialog({ lists, currentListId }: AddGiftDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const { toast } = useToast();
  const urlTimeoutRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    listId: currentListId || "",
    name: "",
    url: "",
    imageUrl: "",
    targetPrice: "",
    currentPrice: "",
    recipientName: "",
    priority: "medium" as "low" | "medium" | "high",
    notes: "",
  });

  // Auto-fetch product info when URL changes
  useEffect(() => {
    if (!formData.url || formData.url.length < 10) return;

    // Clear previous timeout
    if (urlTimeoutRef.current) {
      clearTimeout(urlTimeoutRef.current);
    }

    // Debounce URL input
    urlTimeoutRef.current = setTimeout(async () => {
      try {
        // Validate URL
        new URL(formData.url);

        setFetchingInfo(true);

        const result = await fetchProductInfo(formData.url);

        if (result.success) {
          // Only auto-fill empty fields
          setFormData(prev => ({
            ...prev,
            name: prev.name || result.name || prev.name,
            imageUrl: prev.imageUrl || result.imageUrl || prev.imageUrl,
            currentPrice: prev.currentPrice || (result.price ? result.price.toString() : prev.currentPrice),
          }));

          toast({
            title: "Product info loaded! ✨",
            description: `Found: ${result.name || "product"}${result.price ? ` - $${result.price}` : ""}`,
          });
        }
      } catch (error) {
        // Invalid URL or fetch failed - silently ignore
        console.log("Could not fetch product info:", error);
      } finally {
        setFetchingInfo(false);
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => {
      if (urlTimeoutRef.current) {
        clearTimeout(urlTimeoutRef.current);
      }
    };
  }, [formData.url, toast]);

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setFetchingInfo(true);

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;

        toast({
          title: "Analyzing screenshot...",
          description: "AI is extracting product info from your image",
        });

        const result = await analyzeProductScreenshot(base64);

        if (result.success) {
          setFormData(prev => ({
            ...prev,
            name: prev.name || result.name || prev.name,
            currentPrice: prev.currentPrice || (result.price ? result.price.toString() : prev.currentPrice),
            imageUrl: prev.imageUrl || base64, // Use screenshot as product image
          }));

          toast({
            title: "Screenshot analyzed! 🎯",
            description: `Found: ${result.name || "product"}${result.price ? ` - $${result.price}` : ""}`,
          });
        } else {
          toast({
            title: "Could not analyze screenshot",
            description: result.error || "Try pasting the product URL instead",
            variant: "destructive",
          });
        }

        setFetchingInfo(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Screenshot upload failed:", error);
      toast({
        title: "Upload failed",
        description: "Could not process screenshot",
        variant: "destructive",
      });
      setFetchingInfo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addGift(formData);
      setFormData({
        listId: currentListId || "",
        name: "",
        url: "",
        imageUrl: "",
        targetPrice: "",
        currentPrice: "",
        recipientName: "",
        priority: "medium",
        notes: "",
      });
      setOpen(false);
    } catch (error) {
      console.error("Failed to add gift:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Add Gift
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Gift</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* AI Auto-fill Section - MOVED TO TOP */}
          <div className="space-y-4 p-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>AI Auto-fill (paste URL or upload screenshot)</span>
              {fetchingInfo && (
                <Loader2 className="h-4 w-4 animate-spin text-primary ml-auto" />
              )}
            </div>

            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="url">Product URL</Label>
              <div className="relative">
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://amazon.com/product..."
                  className={fetchingInfo ? "pr-10" : ""}
                />
                {fetchingInfo && (
                  <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-pulse" />
                )}
              </div>
            </div>

            {/* OR Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            {/* Screenshot Upload */}
            <div className="space-y-2">
              <Label>Upload Screenshot</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleScreenshotUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={fetchingInfo}
              >
                <Camera className="h-4 w-4 mr-2" />
                {fetchingInfo ? "Analyzing..." : "Upload Product Screenshot"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                AI will extract product name and price from the image
              </p>
            </div>
          </div>

          {/* Rest of the form */}
          <div className="grid grid-cols-2 gap-4">
            {lists.length > 0 && (
              <div className="space-y-2 col-span-2">
                <Label htmlFor="listId">Add to List *</Label>
                <Select
                  value={formData.listId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, listId: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a list" />
                  </SelectTrigger>
                  <SelectContent>
                    {lists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Gift Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="e.g., Wireless Headphones"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="recipientName">Recipient *</Label>
              <Input
                id="recipientName"
                value={formData.recipientName}
                onChange={(e) =>
                  setFormData({ ...formData, recipientName: e.target.value })
                }
                required
                placeholder="e.g., Mom, Dad, Sarah"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetPrice">Target Price *</Label>
              <Input
                id="targetPrice"
                type="number"
                step="0.01"
                value={formData.targetPrice}
                onChange={(e) =>
                  setFormData({ ...formData, targetPrice: e.target.value })
                }
                required
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentPrice">Current Price</Label>
              <Input
                id="currentPrice"
                type="number"
                step="0.01"
                value={formData.currentPrice}
                onChange={(e) =>
                  setFormData({ ...formData, currentPrice: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: "low" | "medium" | "high") =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Product Image (optional)</Label>
              <ImageUpload
                value={formData.imageUrl}
                onChange={(value) =>
                  setFormData({ ...formData, imageUrl: value })
                }
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Size, color, or other details..."
              />
            </div>
          </div>

          <Button type="submit" disabled={loading || fetchingInfo} className="w-full">
            {loading ? "Adding..." : "Add Gift"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
