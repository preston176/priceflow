"use client";

import { useState, useRef } from "react";
import { ExternalLink, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import html2canvas from "html2canvas";
import { analyzeProductScreenshot } from "@/actions/gift-actions";

interface CaptureFromUrlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPriceExtracted: (price: number, name?: string) => void;
}

export function CaptureFromUrlDialog({
  open,
  onOpenChange,
  onPriceExtracted,
}: CaptureFromUrlDialogProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingIframe, setLoadingIframe] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [error, setError] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setPageLoaded(false);
    setError("");

    // Auto-load if valid URL
    try {
      if (newUrl && (newUrl.startsWith('http://') || newUrl.startsWith('https://'))) {
        new URL(newUrl); // Validate URL
        setLoadingIframe(true);
      }
    } catch {
      // Invalid URL, don't load
    }
  };

  const handleIframeLoad = () => {
    setLoadingIframe(false);
    setPageLoaded(true);
  };

  const handleCapture = async () => {
    if (!iframeRef.current) return;

    setLoading(true);
    setError("");

    try {
      const iframe = iframeRef.current;
      let base64Image: string;

      // Try direct DOM access first (for sites that don't block)
      try {
        const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;

        if (!iframeDocument) {
          throw new Error("CORS_BLOCKED");
        }

        // Direct capture works - use html2canvas
        const canvas = await html2canvas(iframeDocument.body, {
          allowTaint: true,
          useCORS: true,
          scale: 1,
          logging: false,
        });

        base64Image = canvas.toDataURL("image/jpeg", 0.8);
      } catch (securityError) {
        // CORS blocked - fall back to Screen Capture API
        setError("📸 This site blocks direct capture. Your browser will ask to share your screen - please select THIS browser window/tab.");

        // Request screen sharing with high resolution
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "browser",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
          } as MediaTrackConstraints,
          audio: false,
          preferCurrentTab: true,
        } as any);

        // Create video element to capture frame
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => resolve();
        });

        // Wait a bit for the video to start playing
        await new Promise(resolve => setTimeout(resolve, 500));

        // Create canvas for full screenshot
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error("Could not create canvas context");
        }

        // Draw the full captured screen
        ctx.drawImage(video, 0, 0);

        // Stop the stream
        stream.getTracks().forEach(track => track.stop());

        // Convert to base64
        base64Image = canvas.toDataURL("image/jpeg", 0.8);

        // Clear the error message
        setError("");
      }

      // Extract price using AI
      const result = await analyzeProductScreenshot(base64Image);

      if (result.success && result.price) {
        onPriceExtracted(result.price, result.name);
        onOpenChange(false);
        // Reset state
        setUrl("");
        setPageLoaded(false);
      } else {
        setError(result.error || "Could not extract price from the page. Please try manual entry.");
      }
    } catch (err) {
      console.error("Capture error:", err);

      // Check for user denying screen share permission
      if (err instanceof Error && err.name === "NotAllowedError") {
        setError(
          "Screen sharing was denied. Please click 'Extract Price' again and allow screen sharing, or use the Screenshot Upload method instead."
        );
      } else if (err instanceof Error && err.name === "NotSupportedError") {
        setError(
          "Screen sharing is not supported in your browser. Please use the Screenshot Upload method instead."
        );
      } else if (
        err instanceof Error &&
        (err.message.includes("CORS") ||
         err.message === "CORS_BLOCKED" ||
         err.name === "SecurityError")
      ) {
        setError(
          "This website blocks automatic capture. Please use the Screenshot Upload method instead."
        );
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to capture page. Please try the Screenshot Upload method instead."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUrl("");
    setPageLoaded(false);
    setError("");
    setLoadingIframe(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Capture Price from URL</DialogTitle>
          <DialogDescription>
            Enter the product URL, scroll to make the price visible, then capture to extract it automatically.
            For secure sites, your browser will ask to share your screen - select this browser tab.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* URL Input - Always visible */}
          <div className="space-y-2">
            <Label htmlFor="product-url">Paste Product URL</Label>
            <div className="flex gap-2">
              <Input
                id="product-url"
                type="url"
                placeholder="https://www.amazon.com/product-name/..."
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="text-base"
                autoFocus
              />
              {url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUrlChange("")}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Mini Browser Preview - Shows when URL is valid */}
          {url && (
            <>
              {loadingIframe && (
                <div className="flex items-center justify-center py-12 border-2 border-dashed border-primary/20 rounded-lg">
                  <div className="text-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm font-medium">Loading page...</p>
                    <p className="text-xs text-muted-foreground">Please wait while we load the product page</p>
                  </div>
                </div>
              )}

              <div className={`flex-1 border-2 rounded-lg overflow-auto bg-white shadow-lg transition-all ${
                loadingIframe ? 'opacity-0 h-0' : 'opacity-100'
              } ${pageLoaded ? 'border-green-500/50' : 'border-primary/20'}`}>
                <iframe
                  ref={iframeRef}
                  src={url}
                  className="origin-top-left"
                  onLoad={handleIframeLoad}
                  sandbox="allow-same-origin allow-scripts"
                  style={{
                    minHeight: "2000px",
                    height: "2000px",
                    width: "333.33%",
                    transform: "scale(0.3)",
                    transformOrigin: "top left"
                  }}
                  title="Product page preview"
                />
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20 whitespace-pre-line">
                  {error}
                </div>
              )}

              {/* Success indicator and action button */}
              {pageLoaded && !loadingIframe && (
                <div className="space-y-3">
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 rounded-lg space-y-2">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                      <span className="text-lg">✓</span>
                      Page loaded successfully!
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      <strong>Important:</strong> Scroll the page above to make sure the <strong>price is visible</strong> before clicking Extract Price.
                    </p>
                  </div>

                  <Button
                    onClick={handleCapture}
                    disabled={loading}
                    size="lg"
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Extracting price
                      </>
                    ) : (
                      <>
                        <Camera className="h-5 w-5 mr-2" />
                        Extract Price
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Initial state - No URL */}
          {!url && (
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg">
              <div className="text-center space-y-3 p-8">
                <ExternalLink className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <div className="space-y-1">
                  <p className="font-medium text-muted-foreground">Paste a product URL above</p>
                  <p className="text-sm text-muted-foreground/70">The page will load automatically in a mini browser</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
