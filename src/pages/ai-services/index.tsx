import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { aiApi } from "@/lib/backend";
import { AIServiceRow, AIProviderInfo } from "@/lib/api";

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
import {
  Check,
  KeyRound,
  Plus,
  RefreshCw,
  Settings,
  ShieldAlert,
  Sparkles,
  Trash2,
  FlaskConical,
  X,
} from "lucide-react";

// Brand-neutral gradient initials used instead of external logo CDNs (which are
// unreliable and leak user IPs).
const SERVICE_META: Record<string, { short: string; color: string; blurb: string }> = {
  nvidia: { short: "NV", color: "from-green-500 to-emerald-700", blurb: "Zero-cost NVIDIA NIM models — the built-in free tier." },
  openai: { short: "OAI", color: "from-teal-500 to-emerald-600", blurb: "Access GPT models for text generation and analysis." },
  anthropic: { short: "AN", color: "from-orange-400 to-amber-600", blurb: "Use Claude for nuanced, detailed, creative generation." },
  gemini: { short: "GE", color: "from-blue-500 to-indigo-600", blurb: "Google's multimodal Gemini models." },
  mistral: { short: "MI", color: "from-orange-500 to-red-600", blurb: "Efficient, powerful open models from Mistral AI." },
  cohere: { short: "CO", color: "from-violet-500 to-purple-600", blurb: "Text generation, embeddings and semantic search." },
  deepseek: { short: "DS", color: "from-sky-500 to-blue-700", blurb: "Strong reasoning and code-specialized models." },
  groq: { short: "GQ", color: "from-red-500 to-orange-600", blurb: "Ultra-fast LLM inference." },
  perplexity: { short: "PX", color: "from-cyan-500 to-teal-600", blurb: "Research-backed responses with real-time web data." },
  llama: { short: "LL", color: "from-blue-600 to-violet-700", blurb: "Meta's open-source Llama models." },
};

const ServiceLogo = ({ id, name }: { id: string; name: string }) => {
  const meta = SERVICE_META[id] ?? { short: name.slice(0, 2).toUpperCase(), color: "from-gray-500 to-gray-700" };
  return (
    <div
      className={`h-10 w-10 shrink-0 rounded-full bg-gradient-to-br ${meta.color} flex items-center justify-center text-white text-xs font-bold`}
      aria-hidden
    >
      {meta.short}
    </div>
  );
};

const AIServicesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [selectedService, setSelectedService] = useState<AIProviderInfo | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [modelName, setModelName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["ai-services", user?.id],
    queryFn: () => aiApi.services(),
    enabled: !!user,
  });

  const providers = data?.providers ?? [];
  const connected = data?.services ?? [];
  const platform = data?.platform;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["ai-services"] });

  const connectMutation = useMutation({
    mutationFn: () =>
      aiApi.connect(selectedService!.id, apiKey, {
        base_url: baseUrl || undefined,
        model: modelName || undefined,
      }),
    onMutate: () => setIsSubmitting(true),
    onSuccess: () => {
      invalidate();
      toast.success(`${selectedService?.label} connected successfully!`);
      setIsAddingKey(false);
      setSelectedService(null);
      setApiKey("");
      setBaseUrl("");
      setModelName("");
    },
    onError: (error: any) => toast.error(`Error connecting key: ${error.message}`),
    onSettled: () => setIsSubmitting(false),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ name, active }: { name: string; active: boolean }) => aiApi.setActive(name, active),
    onSuccess: () => {
      invalidate();
      toast.success("Service status updated");
    },
    onError: (e: any) => toast.error(`Error updating service: ${e.message}`),
  });

  const disconnectMutation = useMutation({
    mutationFn: (name: string) => aiApi.disconnect(name),
    onSuccess: () => {
      invalidate();
      toast.success("Service disconnected");
    },
    onError: (e: any) => toast.error(`Error disconnecting: ${e.message}`),
  });

  const testMutation = useMutation({
    mutationFn: (name: string) => aiApi.test(name),
    onSuccess: (res) => toast.success(`Connection works! Verified with model ${res.model}`),
    onError: (e: any) => toast.error(e.message),
  });

  const isConnected = (id: string) => connected.some((s) => s.service_name === id);
  const getService = (id: string): AIServiceRow | undefined =>
    connected.find((s) => s.service_name === id);

  const handleAddApiKey = () => {
    if (!selectedService) return;
    if (!apiKey.trim()) {
      toast.error("Please enter a valid API key");
      return;
    }
    if (selectedService.id === "custom" && (!baseUrl.trim() || !modelName.trim())) {
      toast.error("Custom providers need a base URL and model name");
      return;
    }
    connectMutation.mutate();
  };

  return (
    <div className="container py-8">
      <AdBanner size="small" position="top" className="mb-6" />

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Services</h1>
          <p className="text-muted-foreground">
            Generate with the built-in free tier, or connect your own keys (BYOK) for unlimited use.
          </p>
        </div>

        <Dialog open={isAddingKey} onOpenChange={(open) => {
          setIsAddingKey(open);
          if (!open) {
            setSelectedService(null);
            setApiKey("");
            setBaseUrl("");
            setModelName("");
          }
        }}>
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
                Keys are encrypted on the server and only ever used to call the provider you choose.
              </DialogDescription>
            </DialogHeader>

            {!selectedService ? (
              <div className="grid gap-2 py-2 max-h-[320px] overflow-y-auto">
                <p className="text-sm mb-1">Select a provider to connect:</p>
                {providers
                  .filter((p) => p.id !== "custom")
                  .map((provider) => (
                    <Button
                      key={provider.id}
                      variant="outline"
                      className="flex w-full justify-start gap-3 text-left h-auto py-2"
                      onClick={() => setSelectedService(provider)}
                    >
                      <ServiceLogo id={provider.id} name={provider.label} />
                      <span>{provider.label}</span>
                    </Button>
                  ))}
              </div>
            ) : (
              <div className="grid gap-4 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ServiceLogo id={selectedService.id} name={selectedService.label} />
                    <span className="font-medium">{selectedService.label}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedService(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="apiKey">{selectedService.label} API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1"
                  />
                  {selectedService.id === "custom" && (
                    <>
                      <Input
                        placeholder="Base URL, e.g. https://api.example.com/v1"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                      />
                      <Input
                        placeholder="Model name, e.g. my-model"
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                      />
                    </>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Encrypted with AES-256-GCM before storage. We never expose your keys.
                  </p>
                  {selectedService.docs_url && (
                    <Button
                      variant="link"
                      type="button"
                      className="px-0 text-xs justify-start"
                      onClick={() => window.open(selectedService.docs_url, "_blank")}
                    >
                      Get your {selectedService.label} API key →
                    </Button>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingKey(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddApiKey}
                disabled={!selectedService || !apiKey || isSubmitting}
              >
                {isSubmitting ? (
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

      {/* Built-in free tier card */}
      {platform && (
        <Card className="mb-6 border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Built-in Free AI (NVIDIA NIM)
                    <Badge className="bg-green-600">$0</Badge>
                  </CardTitle>
                  <CardDescription>No key needed — works out of the box.</CardDescription>
                </div>
              </div>
              <Badge variant={platform.available ? "default" : "secondary"}>
                {platform.available ? "Active" : "Unavailable"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Every signed-in user gets free generations on zero-cost NVIDIA models.
              {platform.daily_limit !== null && (
                <>
                  {" "}
                  You've used <span className="font-semibold">{platform.used_today}</span> of{" "}
                  <span className="font-semibold">{platform.daily_limit}</span> today
                  {platform.remaining_today !== null && platform.remaining_today >= 0 && (
                    <> — {platform.remaining_today} left.</>
                  )}
                </>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {platform.models.map((m) => (
                <Badge key={m} variant="outline" className="font-mono text-xs">
                  {m}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Providers</TabsTrigger>
          <TabsTrigger value="connected">Connected</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="h-16 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <TabsContent value="all">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {providers
                  .filter((p) => p.id !== "custom")
                  .map((provider) => (
                    <ServiceCard
                      key={provider.id}
                      provider={provider}
                      service={getService(provider.id)}
                      isConnected={isConnected(provider.id)}
                      onConnect={() => {
                        setSelectedService(provider);
                        setIsAddingKey(true);
                      }}
                      onToggle={(active) => toggleMutation.mutate({ name: provider.id, active })}
                      onDisconnect={() => disconnectMutation.mutate(provider.id)}
                      onTest={() => testMutation.mutate(provider.id)}
                      testing={testMutation.isPending}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="connected">
              {connected.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
                  <KeyRound className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-xl font-medium">No Connected Services</h3>
                  <p className="mb-4 text-muted-foreground">
                    You're using the built-in free tier. Connect your own key for unlimited generations.
                  </p>
                  <Button onClick={() => setIsAddingKey(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Connect Service
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {connected.map((svc) => {
                    const provider = providers.find((p) => p.id === svc.service_name);
                    if (!provider) return null;
                    return (
                      <ServiceCard
                        key={svc.service_name}
                        provider={provider}
                        service={svc}
                        isConnected
                        onConnect={() => {
                          setSelectedService(provider);
                          setIsAddingKey(true);
                        }}
                        onToggle={(active) => toggleMutation.mutate({ name: svc.service_name, active })}
                        onDisconnect={() => disconnectMutation.mutate(svc.service_name)}
                        onTest={() => testMutation.mutate(svc.service_name)}
                        testing={testMutation.isPending}
                      />
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </>
        )}
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
                  <li>API keys are encrypted (AES-256-GCM) before storage</li>
                  <li>Keys are never sent back to the browser</li>
                  <li>You can disable or remove any service at any time</li>
                  <li>Keys are only used for the provider you connect</li>
                </ul>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="flex items-center gap-2 text-lg font-medium">
                  <Settings className="h-5 w-5 text-blue-500" />
                  Usage Information
                </h3>
                <ul className="ml-6 list-disc space-y-1 text-muted-foreground">
                  <li>The free tier has a daily generation limit</li>
                  <li>Your own keys bypass the free limit entirely</li>
                  <li>Provider billing is handled by each provider</li>
                  <li>Use "Test" to verify a key before relying on it</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface ServiceCardProps {
  provider: AIProviderInfo;
  service?: AIServiceRow;
  isConnected: boolean;
  onConnect: () => void;
  onToggle: (active: boolean) => void;
  onDisconnect: () => void;
  onTest: () => void;
  testing: boolean;
}

const ServiceCard = ({
  provider,
  service,
  isConnected,
  onConnect,
  onToggle,
  onDisconnect,
  onTest,
  testing,
}: ServiceCardProps) => {
  const meta = SERVICE_META[provider.id];
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ServiceLogo id={provider.id} name={provider.label} />
            <CardTitle className="text-lg">{provider.label}</CardTitle>
          </div>
          {isConnected && (
            <Badge variant={service?.is_active ? "default" : "outline"}>
              {service?.is_active ? "Active" : "Inactive"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4 text-sm">
          {meta?.blurb ?? `Connect ${provider.label} with your own API key.`}
        </CardDescription>
        {isConnected && service && (
          <div className="mb-4 flex items-center justify-between rounded-lg border bg-muted p-3">
            <span className="text-sm font-medium">Enable this service</span>
            <Switch checked={service.is_active} onCheckedChange={onToggle} />
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-muted pt-2">
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {isConnected ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onTest} disabled={testing}>
                <FlaskConical className="mr-1 h-3.5 w-3.5" />
                Test
              </Button>
              <Button variant="ghost" size="sm" className="text-red-600" onClick={onDisconnect}>
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          ) : (
            <Button
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={() => provider.docs_url && window.open(provider.docs_url, "_blank")}
            >
              View API Docs
            </Button>
          )}

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
