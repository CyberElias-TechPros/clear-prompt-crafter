
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
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
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Heart,
  MessageSquare,
  ThumbsUp,
  Calendar,
  ChevronDown,
  ListFilter,
  ArrowUpDown,
  PlusIcon,
  HelpCircle,
} from "lucide-react";
import PromptGuidelineCard from "@/components/prompt-guidelines/PromptGuidelineCard";

type PromptItem = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_name: string | null;
  user_avatar: string | null;
  like_count: number;
};

export default function CommunityPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [showGuidelines, setShowGuidelines] = useState(false);
  
  const guidelines = {
    debuggingBestPractices: {
      title: "Debugging Best Practices",
      description: "Tips for effective debugging with AI",
      content: [
        "Always provide specific, detailed descriptions of what you want to achieve",
        "Break down complex problems into smaller, manageable steps",
        "Use clear, unambiguous language in your prompts",
        "Include relevant context and constraints",
        "Specify the desired outcome explicitly"
      ],
      variant: "debug"
    },
    promptEngineeringGuidelines: {
      title: "Prompt Engineering Guidelines",
      description: "Best practices for writing effective prompts",
      content: [
        "Start with a clear context setting",
        "Define tasks with measurable outcomes",
        "Include specific guidelines and constraints",
        "Consider error handling and edge cases",
        "Review and iterate on your prompts"
      ],
      variant: "tip"
    },
    debuggingWorkflows: {
      title: "Debugging Workflows",
      description: "Step-by-step approaches to solve problems",
      content: [
        "When something doesn't work, add more specificity to your request",
        "Use the console logs to understand how data is flowing through your application",
        "Isolate the problem area before attempting fixes",
        "For complex bugs, create a minimal reproducible example",
        "Add 'console.log' statements strategically to track the execution flow"
      ],
      variant: "warning"
    },
    promptRefinementTechniques: {
      title: "Prompt Refinement Techniques",
      description: "How to iterate and improve your prompts",
      content: [
        "After initial results, refine prompts by adding more specific constraints",
        "Use the CLEAR framework: Concise, Logical, Explicit, Adaptive, Reflective",
        "For code generation, specify exact function signatures and return types",
        "Include examples of expected inputs and outputs for better understanding",
        "When refactoring, explicitly mention what should NOT change"
      ],
      variant: "success"
    }
  };

  // Fetch prompts from Supabase
  const {
    data: prompts,
    isLoading: isPromptsLoading,
    error: promptsError,
    refetch: refetchPrompts,
  } = useQuery({
    queryKey: ["public-prompts", sortBy, searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_prompts", {
        sort_by: sortBy,
        search_term: searchTerm || null,
      });

      if (error) throw error;
      return data as PromptItem[];
    },
  });

  // Fetch templates from Supabase
  const {
    data: templates,
    isLoading: isTemplatesLoading,
    error: templatesError,
    refetch: refetchTemplates,
  } = useQuery({
    queryKey: ["public-templates", sortBy, searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_templates", {
        sort_by: sortBy,
        search_term: searchTerm || null,
      });

      if (error) throw error;
      return data as PromptItem[];
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetchPrompts();
    refetchTemplates();
  };

  const renderPromptGrid = (
    items: PromptItem[] | undefined,
    isLoading: boolean,
    error: Error | null,
    type: "prompt" | "template"
  ) => {
    if (isLoading) {
      return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="space-y-2">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-xl font-semibold">Error loading {type}s</p>
          <p className="mt-2 text-muted-foreground">{error.message}</p>
          <Button onClick={() => type === "prompt" ? refetchPrompts() : refetchTemplates()} className="mt-4">
            Try Again
          </Button>
        </div>
      );
    }

    if (!items || items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <p className="text-xl font-semibold">No {type}s found</p>
          <p className="text-muted-foreground">
            {searchTerm
              ? `No ${type}s match your search criteria.`
              : `There are no public ${type}s available yet.`}
          </p>
          {searchTerm && (
            <Button onClick={() => setSearchTerm("")} variant="outline" className="mt-2">
              Clear Search
            </Button>
          )}
          
          {user && (
            <Button asChild className="mt-2 bg-purple-600 hover:bg-purple-700">
              <Link to="/prompts/new">
                <PlusIcon className="mr-2 h-4 w-4" />
                Create a New {type === "prompt" ? "Prompt" : "Template"}
              </Link>
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link key={item.id} to={`/community/${type}/${item.id}`}>
            <Card className="h-full overflow-hidden transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle className="line-clamp-1">{item.title}</CardTitle>
                {item.description && (
                  <CardDescription className="line-clamp-2">
                    {item.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="line-clamp-3 text-sm text-muted-foreground">
                  {item.description || "No description provided."}
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={item.user_avatar || ""} />
                      <AvatarFallback>
                        {item.user_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {item.user_name || "Anonymous"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span>{item.like_count}</span>
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {formatDistanceToNow(new Date(item.created_at), {
                        addSuffix: true,
                      })}
                    </Badge>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="container py-8 animate-in fade-in duration-500">
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold">Community</h1>
            <p className="text-muted-foreground">
              Discover and share prompts with the community
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowGuidelines(!showGuidelines)}>
              <HelpCircle className="h-4 w-4 mr-2" />
              {showGuidelines ? "Hide Guidelines" : "Show Guidelines"}
            </Button>
            {user ? (
              <Button asChild className="bg-purple-600 hover:bg-purple-700">
                <Link to="/prompts/new">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create Prompt
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/auth">Sign in to Create</Link>
              </Button>
            )}
          </div>
        </div>

        {showGuidelines && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            <PromptGuidelineCard 
              title={guidelines.debuggingBestPractices.title}
              description={guidelines.debuggingBestPractices.description}
              content={guidelines.debuggingBestPractices.content}
              variant="debug"
            />
            <PromptGuidelineCard 
              title={guidelines.promptEngineeringGuidelines.title}
              description={guidelines.promptEngineeringGuidelines.description}
              content={guidelines.promptEngineeringGuidelines.content}
              variant="tip"
            />
            <PromptGuidelineCard 
              title={guidelines.debuggingWorkflows.title}
              description={guidelines.debuggingWorkflows.description}
              content={guidelines.debuggingWorkflows.content}
              variant="warning"
            />
            <PromptGuidelineCard 
              title={guidelines.promptRefinementTechniques.title}
              description={guidelines.promptRefinementTechniques.description}
              content={guidelines.promptRefinementTechniques.content}
              variant="success"
            />
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row">
          <form
            onSubmit={handleSearch}
            className="flex-1 items-center gap-2 sm:flex"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search prompts..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit" className="mt-2 w-full sm:mt-0 sm:w-auto">
              Search
            </Button>
          </form>

          <div className="flex items-center gap-2">
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as "recent" | "popular")}
            >
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  <span>Sort by</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Most Recent</span>
                  </div>
                </SelectItem>
                <SelectItem value="popular">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4" />
                    <span>Most Popular</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <ListFilter className="mr-2 h-4 w-4" />
                  <span>All Categories</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Chat Prompts</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Heart className="mr-2 h-4 w-4" />
                  <span>Featured</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Tabs defaultValue="prompts" className="mt-6">
          <TabsList className="mb-6">
            <TabsTrigger value="prompts" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Prompts</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <ChevronDown className="h-4 w-4" />
              <span>Templates</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prompts" className="mt-4">
            {renderPromptGrid(prompts, isPromptsLoading, promptsError as Error | null, "prompt")}
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            {renderPromptGrid(templates, isTemplatesLoading, templatesError as Error | null, "template")}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
