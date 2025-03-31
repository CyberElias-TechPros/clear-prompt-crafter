
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SupportedAIService, AIService } from "@/lib/types";
import { ChevronLeft } from "lucide-react";

const supportedServices: SupportedAIService[] = [
  {
    id: "openai",
    name: "OpenAI",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
    description: "Connect with OpenAI's models like GPT-4 and DALL-E.",
    authUrl: "https://platform.openai.com/account/api-keys",
    apiKeyTitle: "API Key",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    logo: "https://anthropic.com/images/icons/icon-192x192.png",
    description: "Use Claude models for sensitive and complex tasks.",
    authUrl: "https://console.anthropic.com/account/keys",
    apiKeyTitle: "API Key",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    logo: "https://lh3.googleusercontent.com/a/AGNmyxbYMf1L7RCOqiDyYbM_9S1-I5XVWl0DqefSQccnRw=s96-c",
    description: "Access Google's Gemini models for advanced AI capabilities.",
    authUrl: "https://makersuite.google.com/app/apikey",
    apiKeyTitle: "API Key",
  },
];

const AIServicesPage = () => {
  const { user } = useAuth();
  const [userServices, setUserServices] = useState<AIService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserServices = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("user_ai_services")
          .select("*")
          .eq("user_id", user.id);

        if (error) throw error;
        setUserServices(data || []);
      } catch (error: any) {
        toast({
          title: "Error fetching services",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserServices();
  }, [user, toast]);

  const isServiceConnected = (serviceId: string) => {
    return userServices.some(service => service.service_name === serviceId);
  };

  const handleNavigateToConnectService = (service: SupportedAIService) => {
    navigate(`/ai-services/connect/${service.id}`);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2"
          onClick={() => navigate("/")}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">AI Services</h1>
      </div>

      <p className="text-muted-foreground mb-6">
        Connect to AI services to enhance your prompt engineering capabilities.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {supportedServices.map((service) => (
          <Card key={service.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={service.logo}
                  alt={`${service.name} logo`}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <CardTitle>{service.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {isServiceConnected(service.id) ? "Connected" : "Not connected"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {service.description}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant={isServiceConnected(service.id) ? "outline" : "default"}
                className="w-full"
                onClick={() => handleNavigateToConnectService(service)}
              >
                {isServiceConnected(service.id) ? "Update Connection" : "Connect"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AIServicesPage;
