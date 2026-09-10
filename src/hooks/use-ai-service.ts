import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { AIServicesResponse, ApiError, GenerateRequest } from "@/lib/api";
import { aiApi } from "@/lib/backend";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface GenerateResult {
  content: string;
  error?: string;
  model?: string;
  service?: string;
}

/**
 * useAIService
 *
 * Talks to the Cloudflare Worker AI gateway. The platform ships with a
 * zero-cost NVIDIA NIM key (free models), so generation works out of the box
 * for every signed-in user. Users may also connect their own keys (BYOK); an
 * active BYOK key for the requested service takes precedence and bypasses the
 * free daily quota.
 */
export function useAIService() {
  const { user } = useAuth();

  const { data: services, isLoading } = useQuery<AIServicesResponse>({
    queryKey: ["ai-services", user?.id],
    queryFn: () => aiApi.services(),
    enabled: !!user,
  });

  const activeServiceNames = (services?.services ?? [])
    .filter((s) => s.is_active)
    .map((s) => s.service_name);

  const platformAvailable = !!services?.platform?.available;
  const remainingToday = services?.platform?.remaining_today ?? null;

  /** Pick the best service to route a generation through. */
  const resolveService = useCallback(
    (preferred?: string): string | undefined => {
      if (preferred && activeServiceNames.includes(preferred)) return preferred;
      // Prefer a user's own "nvidia" key if they connected one.
      if (activeServiceNames.includes("nvidia")) return "nvidia";
      // Default to the free platform key (service === undefined) when available.
      if (platformAvailable) return undefined;
      // Otherwise fall back to the first active BYOK key so BYOK-only setups work.
      return activeServiceNames[0];
    },
    [activeServiceNames, platformAvailable],
  );

  const generateWithAI = useCallback(
    async (request: GenerateRequest & { service?: string }): Promise<GenerateResult> => {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to use AI services.",
          variant: "destructive",
        });
        return { content: "", error: "Authentication required" };
      }

      const hasAnyByok = activeServiceNames.length > 0;
      if (!platformAvailable && !hasAnyByok) {
        toast({
          title: "No AI service available",
          description: "Connect an API key in AI Services to get started.",
          variant: "destructive",
        });
        return { content: "", error: "No AI service available" };
      }

      try {
        const payload: GenerateRequest = { ...request };
        const service = resolveService(request.service);
        if (service) payload.service = service;

        const result = await aiApi.generate(payload);
        return { content: result.content, model: result.model, service: result.service };
      } catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred";
        const status = error instanceof ApiError ? error.status : 0;
        toast({
          title: status === 429 ? "Daily limit reached" : "Generation error",
          description: message,
          variant: "destructive",
        });
        return { content: "", error: message };
      }
    },
    [user, activeServiceNames, platformAvailable, resolveService],
  );

  return {
    services,
    isLoading,
    generateWithAI,
    platformAvailable,
    remainingToday,
    activeServiceNames,
    hasAnyByok: activeServiceNames.length > 0,
  };
}
