
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AdBannerProps {
  size: "small" | "medium" | "large";
  position: "top" | "side" | "inline" | "bottom";
  className?: string;
}

interface Ad {
  id: string;
  title: string;
  content: string;
  image_url?: string | null;
  link_url: string;
  ad_size: string;
  ad_position: string;
  is_active: boolean;
  created_at: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ size, position, className = "" }) => {
  const [ad, setAd] = useState<Ad | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const { user } = useAuth();

  // Check if the user has a pro subscription
  const [isProUser, setIsProUser] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (user) {
        // Check the user's premium status
        const { data, error } = await supabase
          .from('user_settings')
          .select('is_premium')
          .eq('user_id', user.id)
          .single();
        
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
        // Fetch a random ad from the database
        const { data, error } = await supabase
          .from('ads')
          .select('*')
          .eq('is_active', true)
          .eq('ad_size', size)
          .eq('ad_position', position)
          .limit(10);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Pick a random ad from the results
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
