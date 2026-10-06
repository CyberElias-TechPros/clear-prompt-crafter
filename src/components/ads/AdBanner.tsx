import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { adsApi } from "@/lib/backend";
import { Ad } from "@/lib/api";

interface AdBannerProps {
  size: "small" | "medium" | "large";
  position: "top" | "side" | "inline" | "bottom";
  className?: string;
}

// First-party promotion slots remain off unless explicitly enabled after a policy review.
// This app does not bundle the Google Mobile Ads SDK or AdMob scripts.
const ADS_ENABLED = import.meta.env.VITE_ENABLE_ADS === "true";

const AdBanner: React.FC<AdBannerProps> = ({ size, position, className = "" }) => {
  const [ad, setAd] = useState<Ad | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Do not request or render promotional content by default. This is a fail-closed
    // guard while ad placements are being reviewed for policy and content suitability.
    if (!ADS_ENABLED || user?.is_premium) {
      setAd(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { items } = await adsApi.list(size, position);
        if (cancelled) return;
        if (items && items.length > 0) {
          setAd(items[Math.floor(Math.random() * items.length)]);
        } else {
          setAd(null);
        }
      } catch {
        // Backend unavailable or no matching ad: render nothing instead of a fake ad.
        if (!cancelled) setAd(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [size, position, user?.is_premium]);

  if (!ADS_ENABLED || user?.is_premium || dismissed || !ad) return null;

  const sizeClasses = {
    small: "min-h-[100px] w-full",
    medium: "min-h-[160px] w-full",
    large: "min-h-[220px] w-full",
  };

  // Internal links (starting with "/") should use SPA navigation semantics;
  // open external links in a new tab.
  const isInternal = ad.link_url.startsWith("/");

  return (
    <Card className={`relative overflow-hidden ${sizeClasses[size]} ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1 z-10 h-6 w-6 rounded-full bg-background/80 p-1"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Button>

      <a
        href={ad.link_url}
        target={isInternal ? "_self" : "_blank"}
        rel={isInternal ? undefined : "noopener noreferrer"}
        className="block h-full w-full"
      >
        <CardContent className="flex h-full flex-col items-center justify-center p-4">
          {ad.image_url && (
            <div className="mb-2 max-h-[60%] w-full overflow-hidden">
              <img src={ad.image_url} alt={ad.title} className="mx-auto max-h-40 object-contain" />
            </div>
          )}
          <div className="text-center">
            <h4 className="font-bold">{ad.title}</h4>
            <p className="text-sm text-muted-foreground">{ad.content}</p>
          </div>
          <div className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
            Advertisement
          </div>
        </CardContent>
      </a>
    </Card>
  );
};

export default AdBanner;
