import React, { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Heart,
  Eye,
  Copy,
  Share2,
  Calendar,
} from "lucide-react";
import { AdBanner } from "@/components/ads";

type PromptDetails = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_name: string | null;
  user_avatar: string | null;
  is_public: boolean;
  likes: number;
  views: number;
  sections: Array<{
    id: string;
    section_type: string;
    content: string;
    order_index: number;
  }>;
};

export default function PromptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: prompt, isLoading, error } = useQuery({
    queryKey: ["prompt-details", id],
    queryFn: async () => {
      if (!id) throw new Error("No prompt ID provided");
      
      const { data, error } = await supabase.rpc("get_prompt_details", {
        prompt_id: id,
      });
      
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Prompt not found");
      
      return data[0] as PromptDetails;
    },
    enabled: !!id,
  });

  // Increment view count on load
  useEffect(() => {
    if (id && prompt) {
      supabase.rpc("increment_prompt_views", { prompt_id: id });
    }
  }, [id, prompt]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("No prompt ID provided");
      
      const { data, error } = await supabase.rpc("toggle_prompt_like", {
        prompt_id: id,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompt-details", id] });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const copyPrompt = () => {
    if (!prompt) return;
    
    let promptText = `# ${prompt.title}\n\n`;
    if (prompt.description) {
      promptText += `${prompt.description}\n\n`;
    }
    
    prompt.sections
      .sort((a, b) => a.order_index - b.order_index)
      .forEach((section) => {
        const sectionTitle = section.section_type.charAt(0).toUpperCase() + section.section_type.slice(1);
        promptText += `**${sectionTitle}:** ${section.content}\n\n`;
      });
    
    navigator.clipboard.writeText(promptText.trim());
    toast.success("Prompt copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="container py-8 animate-in fade-in duration-500">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-32" />
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div className="container py-8">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h1 className="text-2xl font-bold">Prompt Not Found</h1>
          <p className="text-muted-foreground">
            The prompt you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/community">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Community
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <AdBanner size="small" position="top" className="mb-6" />
        
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <CardTitle className="text-2xl">{prompt.title}</CardTitle>
                {prompt.description && (
                  <CardDescription className="text-base">
                    {prompt.description}
                  </CardDescription>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyPrompt}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                {user && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => likeMutation.mutate()}
                    disabled={likeMutation.isPending}
                  >
                    <Heart className="h-4 w-4 mr-1" />
                    {prompt.likes}
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={prompt.user_avatar || ""} alt={prompt.user_name || ""} />
                  <AvatarFallback>
                    {prompt.user_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{prompt.user_name || "Anonymous"}</p>
                  <div className="flex items-center text-sm text-muted-foreground space-x-3">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(prompt.created_at), { addSuffix: true })}
                    </span>
                    <span className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {prompt.views} views
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Prompt Sections</h2>
          
          {prompt.sections.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No sections available for this prompt.</p>
              </CardContent>
            </Card>
          ) : (
            prompt.sections
              .sort((a, b) => a.order_index - b.order_index)
              .map((section, index) => (
                <Card key={section.id}>
                  <CardHeader>
                    <CardTitle className="text-lg capitalize flex items-center">
                      <Badge variant="outline" className="mr-3">
                        {index + 1}
                      </Badge>
                      {section.section_type.replace('_', ' ')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {section.content}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </div>
    </div>
  );
}