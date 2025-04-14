
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Ad, UserSettings } from "@/lib/types";

interface AdBannerProps {
  size: "small" | "medium" | "large";
  position: "top" | "side" | "inline" | "bottom";
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ size, position, className = "" }) => {
  const [ad, setAd] = useState<Ad | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const { user } = useAuth();
  const [isProUser, setIsProUser] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('user_settings')
          .select('is_premium')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!error && data) {
          setIsProUser(data.is_premium || false);
        }
      }
    };

    checkUserStatus();
  }, [user]);

  useEffect(() => {
    const fetchRandomAd = async () => {
      // Don't show ads for pro users
      if (isProUser) return;
      
      try {
        const { data, error } = await supabase
          .from('ads')
          .select('*')
          .eq('is_active', true)
          .eq('ad_size', size)
          .eq('ad_position', position)
          .limit(10);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const randomAd = data[Math.floor(Math.random() * data.length)] as Ad;
          setAd(randomAd);
        }
      } catch (error) {
        console.error("Error fetching ad:", error);
        
        // Fallback mock ad for development
        setAd({
          id: 'mock-ad',
          title: 'Upgrade to Pro',
          content: 'Remove ads and get unlimited prompts with our Pro plan!',
          image_url: 'https://via.placeholder.com/300x200?text=Prompt-Gineer+Pro',
          link_url: '/auth',
          ad_size: size,
          ad_position: position,
          is_active: true,
          created_at: new Date().toISOString()
        });
      }
    };

    if (!dismissed) {
      fetchRandomAd();
    }
  }, [size, position, dismissed, isProUser]);

  // Don't render anything if the user is Pro or ad was dismissed
  if (isProUser || dismissed || !ad) return null;

  // Define sizes for the ad container
  const sizeClasses = {
    small: "h-[100px] w-full",
    medium: "h-[200px] w-full",
    large: "h-[300px] w-full",
  };

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
        target="_blank" 
        rel="noopener noreferrer" 
        className="block h-full w-full"
      >
        <CardContent className="flex h-full flex-col items-center justify-center p-4">
          {ad.image_url && (
            <div className="mb-2 max-h-[70%] w-full overflow-hidden">
              <img 
                src={ad.image_url} 
                alt={ad.title} 
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="text-center">
            <h4 className="font-bold">{ad.title}</h4>
            <p className="text-sm text-muted-foreground">{ad.content}</p>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Advertisement</div>
        </CardContent>
      </a>
    </Card>
  );
};

export default AdBanner;
