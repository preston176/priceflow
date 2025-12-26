"use client";

import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import QRCode from "qrcode";
import { Image, Download, Loader2, Gift as GiftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Gift } from "@/db/schema";
import { getOrCreateShareToken } from "@/actions/share-actions";

interface ShareAsImageDialogProps {
  listId?: string;
  listName?: string;
  userName?: string;
  gifts: Gift[];
}

export function ShareAsImageDialog({
  listId,
  listName = "Wishlist",
  userName = "My",
  gifts,
}: ShareAsImageDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !shareUrl && listId) {
      loadShareUrl();
    }
  }, [isOpen, shareUrl, listId]);

  const loadShareUrl = async () => {
    if (!listId) return;

    setIsLoading(true);
    try {
      const token = await getOrCreateShareToken(listId);
      const url = `${window.location.origin}/share/${token}`;
      setShareUrl(url);

      const qr = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeUrl(qr);
    } catch (error) {
      console.error("Failed to generate share URL or QR code:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${listName.replace(/\s+/g, "-")}-wishlist.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error("Failed to generate image:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const topGifts = gifts.filter((g) => !g.isPurchased).slice(0, 6);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={!listId || gifts.length === 0}>
          <Image className="h-4 w-4 mr-2" />
          Share as Image
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Your Wishlist</DialogTitle>
          <DialogDescription>
            Download this image to share on Instagram Stories, WhatsApp Status, or any social media
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div
              ref={previewRef}
              className="bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-8 rounded-lg border-2 border-primary/20"
              style={{ width: "600px", minHeight: "800px" }}
            >
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2">{userName}</h2>
              <p className="text-xl text-muted-foreground mb-1">{listName}</p>
              <p className="text-sm text-muted-foreground">
                {gifts.filter((g) => !g.isPurchased).length} items
              </p>
            </div>

            {topGifts.length > 0 && (
              <div className="space-y-3 mb-6">
                {topGifts.map((gift, index) => (
                  <div
                    key={gift.id}
                    className="bg-card border rounded-lg p-4 flex items-start gap-3"
                  >
                    {gift.imageUrl ? (
                      <img
                        src={gift.imageUrl}
                        alt={gift.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                        <GiftIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{gift.name}</p>
                      <p className="text-sm text-muted-foreground">
                        For {gift.recipientName}
                      </p>
                      {gift.targetPrice && (
                        <p className="text-sm font-medium text-primary">
                          ${parseFloat(gift.targetPrice).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {gifts.filter((g) => !g.isPurchased).length > 6 && (
              <p className="text-center text-sm text-muted-foreground mb-6">
                + {gifts.filter((g) => !g.isPurchased).length - 6} more items
              </p>
            )}

            <div className="border-t pt-6 flex flex-col items-center gap-4">
              {qrCodeUrl && (
                <div className="bg-white p-3 rounded-lg">
                  <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
                </div>
              )}
              <div className="text-center">
                <p className="text-sm font-medium mb-1">Scan to view full wishlist</p>
                <p className="text-xs text-muted-foreground break-all px-4">
                  {shareUrl}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <GiftIcon className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold">PriceFlow</span>
              </div>
            </div>
          </div>
          )}

          <Button
            onClick={handleDownload}
            disabled={isGenerating || isLoading || !shareUrl}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Image...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download Image
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
