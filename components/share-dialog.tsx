"use client";

import { useState } from "react";
import { Share2, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getOrCreateShareToken, regenerateShareToken } from "@/actions/share-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ShareDialogProps {
  listId?: string;
  listName?: string;
}

export function ShareDialog({ listId, listName }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadShareUrl = async () => {
    if (!listId) {
      return;
    }
    setLoading(true);
    try {
      const token = await getOrCreateShareToken(listId);
      const url = `${window.location.origin}/share/${token}`;
      setShareUrl(url);
    } catch (error) {
      console.error("Failed to load share URL:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!listId) {
      return;
    }
    setLoading(true);
    try {
      const token = await regenerateShareToken(listId);
      const url = `${window.location.origin}/share/${token}`;
      setShareUrl(url);
    } catch (error) {
      console.error("Failed to regenerate share URL:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && !shareUrl) {
      loadShareUrl();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={!listId}>
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Share {listName ? `"${listName}"` : "Your Wishlist"}
          </DialogTitle>
          <DialogDescription>
            Share this link with family and friends so they can see this wishlist.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="share-url">Share Link</Label>
            <div className="flex gap-2">
              <Input
                id="share-url"
                value={shareUrl}
                readOnly
                className="flex-1"
                placeholder={loading ? "Generating..." : ""}
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopy}
                disabled={!shareUrl}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={handleRegenerate}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
            {copied && (
              <p className="text-sm text-green-500">Copied to clipboard!</p>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Only unpurchased items will be visible to others. Use the regenerate
            button to create a new link and invalidate the old one.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
