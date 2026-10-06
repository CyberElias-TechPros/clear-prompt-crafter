import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { itemApi, ItemKind } from "@/lib/backend";

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
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Heart, Eye, Copy, Calendar, Send, MessageSquare } from "lucide-react";

interface CommunityDetailProps {
  kind: "prompt" | "template";
}

export default function CommunityDetailPage({ kind }: CommunityDetailProps) {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const apiKind: ItemKind = kind === "prompt" ? "prompts" : "templates";
  const label = kind === "prompt" ? "Prompt" : "Template";

  const [commentText, setCommentText] = useState("");

  const { data: item, isLoading, error } = useQuery({
    queryKey: [`${kind}-details`, id],
    queryFn: () => {
      if (!id) throw new Error(`No ${kind} ID provided`);
      return itemApi.get(apiKind, id);
    },
    enabled: !!id,
  });

  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: [`${kind}-comments`, id],
    queryFn: () => itemApi.comments(apiKind, id!),
    select: (d) => d.items,
    enabled: !!id,
  });

  const likeMutation = useMutation({
    mutationFn: () => itemApi.toggleLike(apiKind, id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${kind}-details`, id] });
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? `Error: ${error.message}` : "Something went wrong. Please try again."),
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => itemApi.addComment(apiKind, id!, content),
    onSuccess: () => {
      setCommentText("");
      refetchComments();
      toast.success("Comment posted!");
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? `Error posting comment: ${error.message}` : "Couldn't post your comment. Please try again."),
  });

  const copyItem = () => {
    if (!item) return;
    let text = `# ${item.title}\n\n`;
    if (item.description) text += `${item.description}\n\n`;
    item.sections
      .slice()
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .forEach((section) => {
        const title = section.section_type.charAt(0).toUpperCase() + section.section_type.slice(1);
        text += `**${title}:** ${section.content}\n\n`;
      });
    navigator.clipboard.writeText(text.trim());
    toast.success(`${label} copied to clipboard!`);
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

  if (error || !item) {
    return (
      <div className="container py-8">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h1 className="text-2xl font-bold">{label} Not Found</h1>
          <p className="text-muted-foreground">
            The {kind} you're looking for doesn't exist or has been removed.
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
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <CardTitle className="text-2xl">{item.title}</CardTitle>
                {item.description && (
                  <CardDescription className="text-base">{item.description}</CardDescription>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <Button variant="outline" size="sm" onClick={copyItem}>
                  <Copy className="h-4 w-4" />
                </Button>
                {user && (
                  <Button
                    variant={item.liked_by_me ? "default" : "outline"}
                    size="sm"
                    onClick={() => likeMutation.mutate()}
                    disabled={likeMutation.isPending}
                    className={item.liked_by_me ? "bg-red-600 hover:bg-red-700" : ""}
                  >
                    <Heart className="h-4 w-4 mr-1" fill={item.liked_by_me ? "currentColor" : "none"} />
                    {item.likes}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={item.user_avatar || ""} alt={item.user_name || ""} />
                  <AvatarFallback>{item.user_name?.[0] || "P"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{item.user_name || "Prompt-Gineer Team"}</p>
                  <div className="flex items-center text-sm text-muted-foreground space-x-3">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                    <span className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {item.views} views
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">{label} Sections</h2>

          {item.sections.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No sections available for this {kind}.</p>
              </CardContent>
            </Card>
          ) : (
            item.sections
              .slice()
              .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
              .map((section, index) => (
                <Card key={section.id ?? index}>
                  <CardHeader>
                    <CardTitle className="text-lg capitalize flex items-center">
                      <Badge variant="outline" className="mr-3">
                        {index + 1}
                      </Badge>
                      {section.section_type.replace(/_/g, " ")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{section.content}</p>
                  </CardContent>
                </Card>
              ))
          )}
        </div>

        {/* Comments */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments {comments ? `(${comments.length})` : ""}
          </h2>

          {user ? (
            <Card>
              <CardContent className="p-4">
                <Textarea
                  placeholder="Share your thoughts..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[80px] mb-3"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={() => commentText.trim() && commentMutation.mutate(commentText.trim())}
                    disabled={!commentText.trim() || commentMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {commentMutation.isPending ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 text-center text-muted-foreground">
                <Link to="/auth" className="text-primary underline">
                  Sign in
                </Link>{" "}
                to join the discussion.
              </CardContent>
            </Card>
          )}

          {comments && comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user_avatar || ""} />
                        <AvatarFallback>{comment.user_name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {comment.user_name || "Anonymous"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
          )}
        </div>
      </div>
    </div>
  );
}
