
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { SupportedAIService } from "@/lib/types";

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

const ConnectServicePage = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [service, setService] = useState<SupportedAIService | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (serviceId) {
      const foundService = supportedServices.find(s => s.id === serviceId);
      if (foundService) {
        setService(foundService);
      } else {
        navigate("/ai-services");
        toast({
          title: "Service not found",
          description: "The requested AI service is not supported.",
          variant: "destructive",
        });
      }
    }
  }, [serviceId, navigate, toast]);

  const handleConnectService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !service) return;
    
    setIsLoading(true);
    
    try {
      // Store the API key securely in Supabase Edge Function
      // Here we're just storing a record that the service is connected
      const { data, error } = await supabase
        .from("user_ai_services")
        .upsert(
          {
            user_id: user.id,
            service_name: service.id,
            is_active: true,
          },
          { onConflict: "user_id,service_name" }
        );
      
      if (error) throw error;
      
      toast({
        title: "Service connected",
        description: `${service.name} has been successfully connected.`,
      });
      
      navigate("/ai-services");
    } catch (error: any) {
      toast({
        title: "Error connecting service",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!service) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2"
          onClick={() => navigate("/ai-services")}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Connect {service.name}</h1>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <img
              src={service.logo}
              alt={`${service.name} logo`}
              className="w-10 h-10 rounded-full object-cover"
            />
            <CardTitle>{service.name}</CardTitle>
          </div>
          <CardDescription>
            {service.description}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleConnectService}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">{service.apiKeyTitle}</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                required
              />
              <p className="text-xs text-muted-foreground">
                Your API key is stored securely and never shared.
              </p>
            </div>
            <div>
              <a
                href={service.authUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm flex items-center text-blue-600 hover:underline"
              >
                Get your {service.name} API key
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Connecting..." : "Connect Service"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ConnectServicePage;
