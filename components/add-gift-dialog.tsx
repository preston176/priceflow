"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Loader2, Sparkles, Camera, ExternalLink } from "lucide-react";
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
import { CropImageDialog } from "@/components/crop-image-dialog";
import { CaptureFromUrlDialog } from "@/components/capture-from-url-dialog";
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
  const [analyzingScreenshot, setAnalyzingScreenshot] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>("");
  const [showCaptureDialog, setShowCaptureDialog] = useState(false);
  const { toast } = useToast();
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


  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setAnalyzingScreenshot(true);

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
          }));

          toast({
            title: "Screenshot analyzed! 🎯",
            description: `Found: ${result.name || "product"}${result.price ? ` - $${result.price}` : ""}`,
          });

          // Open crop dialog with the screenshot
          setImageToCrop(base64);
          setCropDialogOpen(true);
        } else {
          toast({
            title: "Could not analyze screenshot",
            description: result.error || "Please try another screenshot or enter details manually",
            variant: "destructive",
          });
        }

        setAnalyzingScreenshot(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Screenshot upload failed:", error);
      toast({
        title: "Upload failed",
        description: "Could not process screenshot",
        variant: "destructive",
      });
      setAnalyzingScreenshot(false);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    // Set the cropped image as the product image
    setFormData(prev => ({
      ...prev,
      imageUrl: croppedImage,
    }));

    toast({
      title: "Image cropped successfully!",
      description: "Your product image is ready",
    });
  };

  const handlePriceExtracted = (price: number, name?: string) => {
    setFormData(prev => ({
      ...prev,
      currentPrice: price.toString(),
      name: name || prev.name, // Update name if provided, otherwise keep existing
    }));

    toast({
      title: "Product info extracted!",
      description: name
        ? `${name} - $${price.toFixed(2)}`
        : `Current price set to $${price.toFixed(2)}`,
    });
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
          {/* AI Screenshot Analysis Section */}
          <div className="space-y-4 p-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>AI Auto-fill from Screenshot</span>
              {analyzingScreenshot && (
                <Loader2 className="h-4 w-4 animate-spin text-primary ml-auto" />
              )}
            </div>

            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Choose your preferred method:</p>

              {/* Method 1: URL Capture with Mini Browser */}
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => setShowCaptureDialog(true)}
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                Paste URL & Extract with Mini Browser
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Method 2: Screenshot Upload */}
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
                size="lg"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={analyzingScreenshot}
              >
                <Camera className="h-5 w-5 mr-2" />
                {analyzingScreenshot ? "Analyzing Screenshot..." : "Upload Product Screenshot"}
              </Button>

              <div className="bg-muted/50 p-3 rounded-md text-xs text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">How AI Auto-fill works:</p>
                <div className="space-y-2">
                  <div>
                    <p className="font-medium text-foreground">Method 1: Mini Browser</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Paste product URL</li>
                      <li>Page loads in mini browser</li>
                      <li>Click capture when loaded</li>
                      <li>Browser may ask to share screen (select this window/tab)</li>
                      <li>AI extracts price automatically</li>
                    </ol>
                    <p className="text-xs mt-1 text-blue-600 dark:text-blue-400">
                      💡 For secure sites (Amazon, etc.), you'll be asked to share your screen - this is normal!
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Method 2: Screenshot</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Take screenshot of product page</li>
                      <li>Upload it here</li>
                      <li>AI extracts name, price, and image</li>
                    </ol>
                  </div>
                </div>
              </div>
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

          <Button type="submit" disabled={loading || analyzingScreenshot} className="w-full">
            {loading ? "Adding..." : "Add Gift"}
          </Button>
        </form>
      </DialogContent>

      {/* Crop Image Dialog */}
      <CropImageDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
      />

      {/* URL Capture Dialog */}
      <CaptureFromUrlDialog
        open={showCaptureDialog}
        onOpenChange={setShowCaptureDialog}
        onPriceExtracted={handlePriceExtracted}
      />
    </Dialog>
  );
}
