
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Prompt, UserProfile } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import {
  ChevronLeft,
  Heart,
  MessageSquare,
  Share2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user?: UserProfile;
}

export default function PromptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Fetch prompt details
  const {
    data: promptData,
    isLoading: isPromptLoading,
    error: promptError,
  } = useQuery({
    queryKey: ["prompt", id],
    queryFn: async () => {
      if (!id) throw new Error("Prompt ID not provided");

      const { data: prompt, error: promptError } = await supabase
        .from("prompts")
        .select("*, user_id(*)")
        .eq("id", id)
        .single();

      if (promptError) throw promptError;

      // Get prompt sections
      const { data: sections, error: sectionsError } = await supabase
        .from("prompt_sections")
        .select("*")
        .eq("prompt_id", id)
        .order("order_index", { ascending: true });

      if (sectionsError) throw sectionsError;

      // Get user profile
      const { data: userProfile, error: userError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", prompt.user_id)
        .single();

      if (userError) throw userError;

      return {
        ...prompt,
        sections: sections || [],
        userProfile,
      };
    },
    enabled: !!id,
  });

  // Fetch likes count
  const { data: likesData } = useQuery({
    queryKey: ["prompt-likes", id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("likes")
        .select("*", { count: "exact" })
        .eq("prompt_id", id);

      if (error) throw error;
      return { count };
    },
    enabled: !!id,
  });

  // Check if user has liked the prompt
  const { data: userLikeData } = useQuery({
    queryKey: ["user-like", id, user?.id],
    queryFn: async () => {
      if (!user) return { hasLiked: false };

      const { data, error } = await supabase
        .from("likes")
        .select("id")
        .eq("prompt_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return { hasLiked: !!data };
    },
    enabled: !!id && !!user,
  });

  // Fetch comments
  const {
    data: commentsData,
    isLoading: isCommentsLoading,
    error: commentsError,
  } = useQuery({
    queryKey: ["comments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("prompt_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles for comments
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((comment) => comment.user_id))];
        
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .in("id", userIds);

        if (profilesError) throw profilesError;

        return data.map((comment) => ({
          ...comment,
          user: profiles?.find((profile) => profile.id === comment.user_id),
        }));
      }

      return data || [];
    },
    enabled: !!id,
  });

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error("User not authenticated or prompt ID not provided");

      if (userLikeData?.hasLiked) {
        // Unlike
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("prompt_id", id)
          .eq("user_id", user.id);

        if (error) throw error;
        return { action: "unliked" };
      } else {
        // Like
        const { error } = await supabase
          .from("likes")
          .insert([{ prompt_id: id, user_id: user.id }]);

        if (error) throw error;
        return { action: "liked" };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["prompt-likes", id] });
      queryClient.invalidateQueries({ queryKey: ["user-like", id, user?.id] });
      toast.success(`Prompt ${data.action}`);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error("User not authenticated or prompt ID not provided");
      if (!comment.trim()) throw new Error("Comment cannot be empty");

      const { error } = await supabase
        .from("comments")
        .insert([{ prompt_id: id, user_id: user.id, content: comment.trim() }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
      setComment("");
      toast.success("Comment added successfully");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const copyToClipboard = () => {
    if (!promptData) return;

    let fullPrompt = "";
    promptData.sections.forEach((section) => {
      const sectionType = section.section_type.charAt(0).toUpperCase() + section.section_type.slice(1);
      fullPrompt += `**${sectionType}:** ${section.content}\n\n`;
    });

    navigator.clipboard.writeText(fullPrompt.trim());
    setIsCopied(true);
    toast.success("Prompt copied to clipboard");

    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  if (isPromptLoading) {
    return (
      <div className="container py-8">
        <Link
          to="/community"
          className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Community
        </Link>
        <div className="grid gap-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-[250px]" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-[120px]" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (promptError || !promptData) {
    return (
      <div className="container py-8">
        <Link
          to="/community"
          className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Community
        </Link>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-xl font-semibold">
            {promptError
              ? `Error: ${(promptError as Error).message}`
              : "Prompt not found"}
          </p>
          <p className="mt-2 text-muted-foreground">
            The prompt you're looking for might have been removed or doesn't exist.
          </p>
          <Button asChild className="mt-6">
            <Link to="/community">Browse Community</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 animate-in fade-in duration-500">
      <Link
        to="/community"
        className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Community
      </Link>
      
      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{promptData.title}</h1>
            {promptData.description && (
              <p className="mt-2 text-muted-foreground">{promptData.description}</p>
            )}
            
            <div className="mt-4 flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={promptData.userProfile?.avatar_url || ""} />
                <AvatarFallback>
                  {promptData.userProfile?.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {promptData.userProfile?.full_name || "Anonymous"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(promptData.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            {promptData.sections.map((section) => (
              <Card key={section.id} className="p-5">
                <h3 className="mb-3 text-lg font-semibold capitalize text-purple-700">
                  {section.section_type}
                </h3>
                <p className="whitespace-pre-wrap">{section.content}</p>
              </Card>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => toggleLikeMutation.mutate()}
              disabled={!user}
            >
              <Heart
                className={`h-4 w-4 ${userLikeData?.hasLiked ? "fill-red-500 text-red-500" : ""}`}
              />
              <span>{likesData?.count || 0}</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={copyToClipboard}
            >
              {isCopied ? (
                <>
                  <ThumbsUp className="h-4 w-4 text-green-500" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => {
                navigator.share({
                  title: promptData.title,
                  text: promptData.description || "Check out this prompt",
                  url: window.location.href,
                }).catch(() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied to clipboard");
                });
              }}
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
          </div>
          
          <div className="space-y-4 pt-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <MessageSquare className="h-5 w-5" />
              Comments
              <Badge variant="outline" className="ml-2">
                {commentsData?.length || 0}
              </Badge>
            </h2>
            
            {user ? (
              <div className="flex gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.user_metadata?.avatar_url || ""} />
                  <AvatarFallback>
                    {user.user_metadata?.full_name?.[0] || user.email?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => addCommentMutation.mutate()}
                      disabled={!comment.trim() || addCommentMutation.isPending}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Comment
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Please <Link to="/auth" className="text-primary hover:underline">sign in</Link> to leave a comment
                </p>
              </div>
            )}
            
            <Separator className="my-6" />
            
            {isCommentsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-[120px]" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : commentsData && commentsData.length > 0 ? (
              <div className="space-y-6">
                {commentsData.map((comment: Comment) => (
                  <div key={comment.id} className="flex gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={comment.user?.avatar_url || ""} />
                      <AvatarFallback>
                        {comment.user?.full_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {comment.user?.full_name || "Anonymous"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="mt-2 rounded-lg bg-muted p-3">
                        <p className="whitespace-pre-wrap text-sm">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border p-6 text-center">
                <p className="text-sm text-muted-foreground">No comments yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="font-semibold">About the author</h3>
            <div className="mt-4 flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={promptData.userProfile?.avatar_url || ""} />
                <AvatarFallback>
                  {promptData.userProfile?.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {promptData.userProfile?.full_name || "Anonymous"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Member since {new Date(promptData.userProfile?.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Separator className="my-4" />
            <p className="text-sm text-muted-foreground">
              This prompt was created by {promptData.userProfile?.full_name || "Anonymous"} and shared with the community.
            </p>
          </Card>
          
          <Card className="p-5">
            <h3 className="font-semibold">Related Topics</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {/* In a real app, these would be dynamic based on the prompt content */}
              <Badge variant="secondary">AI</Badge>
              <Badge variant="secondary">Prompt Engineering</Badge>
              <Badge variant="secondary">Development</Badge>
              <Badge variant="secondary">LLM</Badge>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
