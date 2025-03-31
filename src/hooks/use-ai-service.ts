
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface AIServiceResponse {
  content: string;
  error?: string;
}

export function useAIService() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [services, setServices] = useState<{
    openai: boolean;
    antropic: boolean;
    perplexity: boolean;
  }>({
    openai: false,
    antropic: false,
    perplexity: false,
  });

  // Fetch connected services
  const { data: connectedServices, isLoading } = useQuery({
    queryKey: ["ai-services", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("user_ai_services")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (connectedServices) {
      const newServices = { openai: false, antropic: false, perplexity: false };
      
      connectedServices.forEach((service) => {
        if (service.service_name === "openai") newServices.openai = true;
        if (service.service_name === "antropic") newServices.antropic = true;
        if (service.service_name === "perplexity") newServices.perplexity = true;
      });
      
      setServices(newServices);
    }
  }, [connectedServices]);

  const generateWithAI = async (
    prompt: string, 
    service: "openai" | "antropic" | "perplexity" = "openai",
    model?: string
  ): Promise<AIServiceResponse> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use AI services.",
        variant: "destructive",
      });
      return { content: "", error: "Authentication required" };
    }

    if (!services[service]) {
      toast({
        title: "Service not connected",
        description: `Please connect to ${service} in AI Services page first.`,
        variant: "destructive",
      });
      return { content: "", error: "Service not connected" };
    }

    setIsGenerating(true);

    try {
      const response = await fetch(`${process.env.SUPABASE_FUNCTIONS_URL || "https://fandkcurnirrnuecprtx.supabase.co/functions/v1"}/generate-ai-content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          service,
          prompt,
          model,
        }),
      });

      const data = await response.json();

      if (data.error) {
        toast({
          title: "Generation error",
          description: data.error,
          variant: "destructive",
        });
        return { content: "", error: data.error };
      }

      return { content: data.content };
    } catch (error) {
      console.error("Error generating content:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      
      toast({
        title: "Generation error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { content: "", error: errorMessage };
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    services,
    isGenerating,
    hasServices: Object.values(services).some(v => v),
    isLoading,
    generateWithAI,
  };
}
