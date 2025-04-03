
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, ArrowLeft, ChevronLeft, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SupportedAIService } from "@/lib/types";

const supportedServices: SupportedAIService[] = [
  {
    id: "openai",
    name: "OpenAI",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
    description: "Connect with OpenAI's models like GPT-4o and DALL-E.",
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

export default function ConnectServicePage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [service, setService] = useState<SupportedAIService | null>(null);
  const [error, setError] = useState("");

  // Find the service based on serviceId
  useEffect(() => {
    const foundService = supportedServices.find(s => s.id === serviceId);
    if (foundService) {
      setService(foundService);
    } else {
      setError("Invalid service");
    }
  }, [serviceId]);

  // Check if this service is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (!user || !service) return;

      try {
        const { data, error } = await supabase
          .from("user_ai_services")
          .select("*")
          .eq("user_id", user.id)
          .eq("service_name", service.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error checking connection:", error);
          throw error;
        }

        setIsConnected(!!data);
      } catch (err) {
        console.error("Error checking service connection:", err);
      }
    };

    checkConnection();
  }, [user, service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError("API key is required");
      return;
    }

    if (!service) {
      setError("Invalid service");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Call the Supabase Edge Function to securely store the API key
      const { data, error } = await supabase.functions.invoke("store-api-key", {
        body: {
          service_name: service.id,
          api_key: apiKey,
        },
      });

      if (error) throw error;

      toast({
        title: `${service.name} connected successfully!`,
        description: "Your API key has been securely stored.",
      });

      setIsConnected(true);
      navigate("/ai-services");
    } catch (error: any) {
      console.error("Error connecting service:", error);
      setError(error.message || "Failed to connect service. Please try again.");
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setApiKey("");
    }
  };

  if (!service) {
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
          <h1 className="text-2xl font-bold">Connect AI Service</h1>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "The requested service was not found."}
          </AlertDescription>
        </Alert>
      </div>
    );
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

      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <img 
              src={service.logo} 
              alt={`${service.name} logo`} 
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <CardTitle>{service.name}</CardTitle>
              <CardDescription>{service.description}</CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium mb-1">
                    {service.apiKeyTitle}
                  </label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`Enter your ${service.name} ${service.apiKeyTitle}`}
                    className="w-full"
                    required
                  />
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-between items-center">
                  <a 
                    href={service.authUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary flex items-center"
                  >
                    Get your API key <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                  
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Connecting..." : isConnected ? "Update Connection" : "Connect"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
          
          <CardFooter className="bg-muted/40 flex flex-col items-start text-sm text-muted-foreground">
            <p className="mb-2">Your API key will be securely stored and encrypted.</p>
            <p>Note: This will enable integration with {service.name} for prompt generation and AI-assisted features.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
