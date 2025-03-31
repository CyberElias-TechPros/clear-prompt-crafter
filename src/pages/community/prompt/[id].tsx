
import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Prompt, PromptSection } from "@/lib/types";
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Share,
  Star,
  Copy,
  CheckCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function PromptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [comment, setComment] = useState("");
  const [liked, setLiked] = useState(false);

  const { data: promptData, isLoading } = useQuery({
    queryKey: ["prompt", id],
    queryFn: async () => {
      const { data: prompt, error: promptError } = await supabase
        .from("prompts")
        .select(`
          *,
          profiles:user_id(full_name, avatar_url),
          sections:prompt_sections(*)
        `)
        .eq("id", id)
        .single();

      if (promptError) throw promptError;

      // Record view if logged in user
      if (user) {
        await supabase.from("user_history").insert({
          user_id: user.id,
          action_type: "view_prompt",
          data: { prompt_id: id }
        });
      }

      return prompt;
    },
    enabled: !!id,
  });

  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ["prompt-comments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles:user_id(full_name, avatar_url)
        `)
        .eq("prompt_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleCopyPrompt = () => {
    if (!promptData) return;
    
    let fullPrompt = `# ${promptData.title}\n\n`;
    if (promptData.description) {
      fullPrompt += `${promptData.description}\n\n`;
    }
    
    const sections = promptData.sections as PromptSection[];
    if (sections && sections.length > 0) {
      sections
        .sort((a, b) => a.order_index - b.order_index)
        .forEach((section) => {
          if (section.content) {
            fullPrompt += `## ${capitalizeFirstLetter(section.section_type)}\n${section.content}\n\n`;
          }
        });
    }
    
    navigator.clipboard.writeText(fullPrompt);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "The prompt has been copied to your clipboard.",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLikePrompt = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to like prompts.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!liked) {
        await supabase.from("likes").insert({
          user_id: user.id,
          prompt_id: id,
        });
        
        setLiked(true);
        toast({
          title: "Prompt liked",
          description: "You've liked this prompt!",
        });
        
        // Add points to the prompt creator for receiving a like
        if (promptData?.user_id && promptData.user_id !== user.id) {
          await supabase.from("user_points").insert({
            user_id: promptData.user_id,
            points: 5,
            reason: "prompt_liked",
          });
        }
      } else {
        await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("prompt_id", id);
        
        setLiked(false);
        toast({
          title: "Like removed",
          description: "You've removed your like from this prompt.",
        });
      }
    } catch (error) {
      console.error("Error liking prompt:", error);
      toast({
        title: "Something went wrong",
        description: "Failed to like/unlike the prompt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to comment.",
        variant: "destructive",
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: "Empty comment",
        description: "Please enter a comment first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await supabase.from("comments").insert({
        user_id: user.id,
        prompt_id: id,
        content: comment.trim(),
      });
      
      setComment("");
      refetchComments();
      
      toast({
        title: "Comment added",
        description: "Your comment has been added!",
      });
      
      // Add points for commenting
      await supabase.from("user_points").insert({
        user_id: user.id,
        points: 2,
        reason: "added_comment",
      });
      
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Something went wrong",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "The link to this prompt has been copied to your clipboard.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!promptData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <h2 className="text-2xl font-bold mb-4">Prompt not found</h2>
        <p className="text-muted-foreground mb-6">The prompt you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/community">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Community
          </Link>
        </Button>
      </div>
    );
  }

  const sections = promptData.sections as PromptSection[];

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/community">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Community
            </Link>
          </Button>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{promptData.title}</h1>
              
              <div className="flex items-center mt-2 mb-4">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={promptData.profiles?.avatar_url || ""} />
                  <AvatarFallback>
                    {promptData.profiles?.full_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  {promptData.profiles?.full_name || "Anonymous"} • 
                  {new Date(promptData.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleLikePrompt}
                className={`${liked ? "text-red-500 border-red-500 hover:text-red-500 hover:border-red-500" : ""}`}
              >
                <Heart className={`mr-2 h-4 w-4 ${liked ? "fill-red-500" : ""}`} />
                {liked ? "Liked" : "Like"}
              </Button>
              
              <Button size="sm" variant="outline" onClick={handleCopyPrompt}>
                {copied ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Prompt
                  </>
                )}
              </Button>
              
              <Button size="sm" variant="outline" onClick={handleShare}>
                <Share className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
          
          {promptData.description && (
            <p className="text-muted-foreground mb-6">{promptData.description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-8">
            <div className="space-y-6 order-2 md:order-1">
              {sections && sections.length > 0 ? (
                sections
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((section) => (
                    <div 
                      key={section.id} 
                      className="bg-card rounded-lg border border-border p-6 transition-all hover:shadow-md"
                    >
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        {getSectionIcon(section.section_type)}
                        <span className="ml-2">{capitalizeFirstLetter(section.section_type)}</span>
                      </h3>
                      <p className="whitespace-pre-wrap">{section.content}</p>
                    </div>
                  ))
              ) : (
                <div className="bg-card rounded-lg border border-border p-6 text-center">
                  <p className="text-muted-foreground">This prompt doesn't have any sections.</p>
                </div>
              )}
              
              <Separator className="my-8" />
              
              <div className="space-y-6">
                <h3 className="text-xl font-semibold flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Comments
                </h3>
                
                {user ? (
                  <div className="bg-card rounded-lg border border-border p-4">
                    <Textarea
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="mb-3 min-h-24"
                    />
                    <div className="flex justify-end">
                      <Button onClick={handleSubmitComment}>
                        Post Comment
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-card rounded-lg border border-border p-4 text-center">
                    <p className="text-muted-foreground mb-3">Sign in to add a comment</p>
                    <Button asChild>
                      <Link to="/auth">Sign In</Link>
                    </Button>
                  </div>
                )}
                
                <div className="space-y-4">
                  {comments && comments.length > 0 ? (
                    comments.map((comment: any) => (
                      <div key={comment.id} className="bg-card rounded-lg border border-border p-4">
                        <div className="flex items-center mb-2">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={comment.profiles?.avatar_url || ""} />
                            <AvatarFallback>
                              {comment.profiles?.full_name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {comment.profiles?.full_name || "Anonymous"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="whitespace-pre-wrap text-sm">{comment.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="order-1 md:order-2">
              <div className="bg-card rounded-lg border border-border p-4 sticky top-4">
                <h3 className="font-semibold mb-4 pb-2 border-b">About this prompt</h3>
                
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p>{new Date(promptData.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground">Last updated</p>
                    <p>{new Date(promptData.updated_at).toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground">Sections</p>
                    <p>{sections?.length || 0} sections</p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground">Categories</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {getRandomCategories().map((category, index) => (
                        <Badge key={index} variant="secondary" className="animate-in">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {user && user.id !== promptData.user_id && (
                    <Button className="w-full mt-4" asChild>
                      <Link to={`/fork/${id}`}>
                        <Copy className="mr-2 h-4 w-4" />
                        Use as Template
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getSectionIcon(sectionType: string) {
  switch (sectionType) {
    case 'context':
      return <MessageSquare className="h-4 w-4" />;
    case 'task':
      return <CheckCircle className="h-4 w-4" />;
    case 'guidelines':
      return <Star className="h-4 w-4" />;
    case 'constraints':
      return <MessageSquare className="h-4 w-4" />;
    case 'examples':
      return <MessageSquare className="h-4 w-4" />;
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
}

function getRandomCategories() {
  const allCategories = [
    "GPT-4", "ChatGPT", "Claude", "Writing", "Creative", "Business",
    "Programming", "SEO", "Marketing", "Education", "Science"
  ];
  
  const numCategories = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...allCategories].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numCategories);
}
