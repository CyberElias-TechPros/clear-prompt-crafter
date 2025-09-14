import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { AdBanner } from "@/components/ads";
import { AIService, SupportedAIService } from "@/lib/types";
import {
  Check,
  KeyRound,
  Plus,
  RefreshCw,
  Settings,
  ShieldAlert,
  X,
} from "lucide-react";

const AIServicesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [selectedService, setSelectedService] = useState<SupportedAIService | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // List of supported AI services
  const supportedServices: SupportedAIService[] = [
    {
      id: "openai",
      name: "OpenAI",
      logo: "https://cdn.lovable.ai/images/avatars/openai.png",
      description: "Access GPT models for text generation, analysis, and more.",
      authUrl: "https://platform.openai.com/api-keys",
      apiKeyTitle: "OpenAI API Key",
    },
    {
      id: "anthropic",
      name: "Anthropic",
      logo: "https://cdn.lovable.ai/images/avatars/anthropic.png",
      description: "Use Claude for nuanced, detailed, and creative text generation.",
      authUrl: "https://console.anthropic.com/settings/keys",
      apiKeyTitle: "Anthropic API Key",
    },
    {
      id: "perplexity",
      name: "Perplexity",
      logo: "https://cdn.lovable.ai/images/avatars/perplexity.svg",
      description: "Generate research-backed responses with citations and real-time web data.",
      authUrl: "https://www.perplexity.ai/settings/api",
      apiKeyTitle: "Perplexity API Key",
    },
    {
      id: "gemini",
      name: "Google Gemini",
      logo: "https://cdn.lovable.ai/images/avatars/google.png",
      description: "Use Google's powerful multimodal Gemini models for text and image analysis.",
      authUrl: "https://aistudio.google.com/app/apikey",
      apiKeyTitle: "Google Gemini API Key",
    },
    {
      id: "mistral",
      name: "Mistral AI",
      logo: "https://cdn.lovable.ai/images/avatars/mistral.png",
      description: "Access efficient, powerful open models with Mistral AI's offerings.",
      authUrl: "https://console.mistral.ai/api-keys/",
      apiKeyTitle: "Mistral API Key",
    },
    {
      id: "llama",
      name: "Llama (Meta)",
      logo: "https://cdn.lovable.ai/images/avatars/meta.png",
      description: "Use Meta's open-source large language models for various NLP tasks.",
      authUrl: "https://llama.meta.com/get-api-key/",
      apiKeyTitle: "Llama API Key",
    },
    {
      id: "cohere",
      name: "Cohere",
      logo: "https://cdn.lovable.ai/images/avatars/cohere.png",
      description: "Generate text, embeddings, and semantic search capabilities.",
      authUrl: "https://dashboard.cohere.ai/api-keys",
      apiKeyTitle: "Cohere API Key",
    },
    {
      id: "deepseek",
      name: "DeepSeek",
      logo: "https://cdn.lovable.ai/images/avatars/deepseek.png",
      description: "Access cutting-edge AI models specialized in code and language tasks.",
      authUrl: "https://platform.deepseek.com/api-keys",
      apiKeyTitle: "DeepSeek API Key",
    },
    {
      id: "groq",
      name: "Groq",
      logo: "https://cdn.lovable.ai/images/avatars/groq.png",
      description: "Ultra-fast inference for LLMs with specialized hardware acceleration.",
      authUrl: "https://console.groq.com/keys",
      apiKeyTitle: "Groq API Key",
    },
    {
      id: "azure_openai",
      name: "Azure OpenAI",
      logo: "https://cdn.lovable.ai/images/avatars/azure.png",
      description: "Enterprise-grade OpenAI models with Azure's security and compliance.",
      authUrl: "https://portal.azure.com/",
      apiKeyTitle: "Azure OpenAI API Key",
    },
  ];

  // Fetch connected services
  const { data: connectedServices } = useQuery({
    queryKey: ["ai-services", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("user_ai_services")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data as AIService[];
    },
    enabled: !!user,
  });

  // Add API key mutation
  const addApiKeyMutation = useMutation({
    mutationFn: async ({ serviceName, apiKey }: { serviceName: string; apiKey: string }) => {
      setIsLoading(true);
      
      const response = await fetch(`https://sahpsmlnzrkedjusdbib.supabase.co/functions/v1/store-api-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ 
          service_name: serviceName,
          api_key: apiKey
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to store API key");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-services"] });
      toast.success("API key connected successfully!");
      setIsAddingKey(false);
      setApiKey("");
      setSelectedService(null);
      setIsLoading(false);
    },
    onError: (error) => {
      toast.error(`Error connecting API key: ${error.message}`);
      setIsLoading(false);
    },
  });

  // Toggle service activation
  const toggleServiceMutation = useMutation({
    mutationFn: async ({ serviceId, isActive }: { serviceId: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from("user_ai_services")
        .update({ is_active: isActive })
        .eq("id", serviceId)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-services"] });
      toast.success("Service status updated");
    },
    onError: (error) => {
      toast.error(`Error updating service: ${error.message}`);
    },
  });

  // Handle API key submission
  const handleAddApiKey = () => {
    if (!selectedService) return;
    
    if (!apiKey || apiKey.trim() === "") {
      toast.error("Please enter a valid API key");
      return;
    }
    
    addApiKeyMutation.mutate({
      serviceName: selectedService.id,
      apiKey,
    });
  };

  // Handle service toggle
  const handleToggleService = (service: AIService) => {
    toggleServiceMutation.mutate({
      serviceId: service.id,
      isActive: !service.is_active,
    });
  };

  // Check if a service is connected
  const isServiceConnected = (serviceId: string) => {
    return connectedServices?.some(s => s.service_name === serviceId) || false;
  };

  // Get service status
  const getServiceStatus = (serviceId: string) => {
    const service = connectedServices?.find(s => s.service_name === serviceId);
    return service ? service.is_active : false;
  };

  // Get service record
  const getServiceRecord = (serviceId: string) => {
    return connectedServices?.find(s => s.service_name === serviceId) || null;
  };

  return (
    <div className="container py-8">
      <AdBanner size="small" position="top" className="mb-6" />
      
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Services</h1>
          <p className="text-muted-foreground">
            Connect your preferred AI services to power your prompts
          </p>
        </div>
        
        <Dialog open={isAddingKey} onOpenChange={setIsAddingKey}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <KeyRound className="mr-2 h-4 w-4" />
              Add New API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add API Key</DialogTitle>
              <DialogDescription>
                Securely store your AI service API key to use with Prompt-Gineer
              </DialogDescription>
            </DialogHeader>
            
            {!selectedService ? (
              <div className="grid gap-4 py-4">
                <p className="mb-2 text-sm">Select an AI service to connect:</p>
                <div className="grid max-h-[300px] gap-2 overflow-y-auto">
                  {supportedServices.map((service) => (
                    <Button
                      key={service.id}
                      variant="outline"
                      className="flex w-full justify-start gap-3 text-left"
                      onClick={() => setSelectedService(service)}
                    >
                      <div className="h-6 w-6 overflow-hidden rounded-full">
                        <img
                          src={service.logo}
                          alt={service.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span>{service.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid gap-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 overflow-hidden rounded-full">
                    <img
                      src={selectedService.logo}
                      alt={selectedService.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{selectedService.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedService.description}</p>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="apiKey">{selectedService.apiKeyTitle}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="Enter your API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={() => setSelectedService(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your API key will be securely stored. We never share your keys.
                  </p>
                  
                  <div className="mt-2 flex justify-between">
                    <Button
                      variant="link"
                      type="button"
                      className="px-0 text-xs"
                      onClick={() => window.open(selectedService.authUrl, "_blank")}
                    >
                      Get your {selectedService.name} API key →
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedService(null);
                  setApiKey("");
                  setIsAddingKey(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddApiKey}
                disabled={!selectedService || !apiKey || isLoading}
                className={!selectedService ? "opacity-50" : ""}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Connect
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Services</TabsTrigger>
          <TabsTrigger value="connected">Connected</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {supportedServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isConnected={isServiceConnected(service.id)}
                isActive={getServiceStatus(service.id)}
                serviceRecord={getServiceRecord(service.id)}
                onConnect={() => {
                  setSelectedService(service);
                  setIsAddingKey(true);
                }}
                onToggle={handleToggleService}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="connected">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {supportedServices
              .filter((service) => isServiceConnected(service.id))
              .map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isConnected={true}
                  isActive={getServiceStatus(service.id)}
                  serviceRecord={getServiceRecord(service.id)}
                  onConnect={() => {
                    setSelectedService(service);
                    setIsAddingKey(true);
                  }}
                  onToggle={handleToggleService}
                />
              ))}
              
            {(!connectedServices || connectedServices.length === 0) && (
              <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
                <KeyRound className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-medium">No Connected Services</h3>
                <p className="mb-4 text-muted-foreground">
                  Connect your first AI service to start creating prompts
                </p>
                <Button
                  onClick={() => setIsAddingKey(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Connect Service
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="popular">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {supportedServices
              .slice(0, 5)
              .map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isConnected={isServiceConnected(service.id)}
                  isActive={getServiceStatus(service.id)}
                  serviceRecord={getServiceRecord(service.id)}
                  onConnect={() => {
                    setSelectedService(service);
                    setIsAddingKey(true);
                  }}
                  onToggle={handleToggleService}
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8">
        <h2 className="mb-4 text-2xl font-bold">Understanding API Keys</h2>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1 space-y-2">
                <h3 className="flex items-center gap-2 text-lg font-medium">
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                  Security Information
                </h3>
                <ul className="ml-6 list-disc space-y-1 text-muted-foreground">
                  <li>API keys are encrypted before storage</li>
                  <li>Keys are never exposed in client-side code</li>
                  <li>You can disable any connected service at any time</li>
                  <li>Keys are used only for the services you explicitly request</li>
                </ul>
              </div>
              
              <div className="flex-1 space-y-2">
                <h3 className="flex items-center gap-2 text-lg font-medium">
                  <Settings className="h-5 w-5 text-blue-500" />
                  Usage Information
                </h3>
                <ul className="ml-6 list-disc space-y-1 text-muted-foreground">
                  <li>API usage is billed by the respective service providers</li>
                  <li>Check your service dashboard for usage metrics</li>
                  <li>Set usage limits on your provider's platform</li>
                  <li>Use our logs to monitor your API calls</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Service Card Component
interface ServiceCardProps {
  service: SupportedAIService;
  isConnected: boolean;
  isActive: boolean;
  serviceRecord: AIService | null;
  onConnect: () => void;
  onToggle: (service: AIService) => void;
}

const ServiceCard = ({
  service,
  isConnected,
  isActive,
  serviceRecord,
  onConnect,
  onToggle,
}: ServiceCardProps) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full">
              <img
                src={service.logo}
                alt={service.name}
                className="h-full w-full object-cover"
              />
            </div>
            <CardTitle className="text-lg">{service.name}</CardTitle>
          </div>
          {isConnected && (
            <Badge variant={isActive ? "default" : "outline"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4 text-sm">
          {service.description}
        </CardDescription>
        {isConnected && serviceRecord && (
          <div className="mb-4 flex items-center justify-between rounded-lg border bg-muted p-3">
            <span className="text-sm font-medium">Enable this service</span>
            <Switch
              checked={isActive}
              onCheckedChange={() => onToggle(serviceRecord)}
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-muted pt-2">
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="link"
            className="h-auto p-0 text-xs"
            onClick={() => window.open(service.authUrl, "_blank")}
          >
            View API Docs
          </Button>
          
          <Button
            variant={isConnected ? "outline" : "default"}
            onClick={onConnect}
            className={isConnected ? "" : "bg-purple-600 hover:bg-purple-700"}
          >
            {isConnected ? "Update Key" : "Connect"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AIServicesPage;
