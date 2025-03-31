
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Prompt, PromptTemplate } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  ArrowUp, Clock, Star, Search, MessageSquare, Users
} from "lucide-react";

export default function CommunityPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"popular" | "recent">("popular");

  const { data: publicPrompts, isLoading: promptsLoading } = useQuery({
    queryKey: ["publicPrompts", filter, searchTerm],
    queryFn: async () => {
      const query = supabase
        .from("prompts")
        .select(`
          id, title, description, created_at, updated_at,
          profiles:user_id(full_name, avatar_url)
        `)
        .eq("is_public", true)
        .order(filter === "popular" ? "likes" : "created_at", { ascending: false })
        .limit(20);

      if (searchTerm) {
        query.ilike("title", `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: publicTemplates, isLoading: templatesLoading } = useQuery({
    queryKey: ["publicTemplates", filter, searchTerm],
    queryFn: async () => {
      const query = supabase
        .from("prompt_templates")
        .select(`
          id, title, description, created_at, updated_at,
          profiles:user_id(full_name, avatar_url)
        `)
        .eq("is_public", true)
        .order(filter === "popular" ? "likes" : "created_at", { ascending: false })
        .limit(20);

      if (searchTerm) {
        query.ilike("title", `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 animate-gradient-x">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500 animate-text">Prompt-Gineer Community</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover, share, and collaborate on AI prompts with prompt engineers from around the world
          </p>
        </header>

        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search prompts and templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 py-2 pr-4 rounded-lg border border-input bg-background/80 backdrop-blur-sm transition-all focus:ring-2 focus:ring-primary/50 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "popular" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("popular")}
              className="flex items-center gap-1"
            >
              <Star size={16} />
              Popular
            </Button>
            <Button
              variant={filter === "recent" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("recent")}
              className="flex items-center gap-1"
            >
              <Clock size={16} />
              Recent
            </Button>
          </div>
        </div>

        <Tabs defaultValue="prompts" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="prompts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} />
                Prompts
              </div>
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
              <div className="flex items-center gap-2">
                <Users size={16} />
                Templates
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prompts" className="space-y-4 animate-fade-in">
            {promptsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <PromptCardSkeleton key={i} />
                ))}
              </div>
            ) : publicPrompts && publicPrompts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicPrompts.map((prompt: any) => (
                  <Link 
                    to={`/community/prompt/${prompt.id}`} 
                    key={prompt.id}
                    className="group"
                  >
                    <div className="bg-card border border-border rounded-lg p-4 h-full shadow-sm hover:shadow-md transition-all hover:border-primary/50 hover:translate-y-[-2px]">
                      <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">{prompt.title}</h3>
                      <p className="text-muted-foreground text-sm mt-2 line-clamp-3">{prompt.description || "No description provided."}</p>
                      
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                            {prompt.profiles?.full_name?.[0] || "U"}
                          </div>
                          <span className="text-xs text-muted-foreground">{prompt.profiles?.full_name || "Anonymous"}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="flex items-center text-xs text-muted-foreground">
                            <ArrowUp size={12} className="mr-1" />
                            {Math.floor(Math.random() * 100)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(prompt.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No prompts found. Be the first to share one!</p>
                <Button asChild className="mt-4">
                  <Link to="/create">Create Prompt</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-4 animate-fade-in">
            {templatesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <PromptCardSkeleton key={i} />
                ))}
              </div>
            ) : publicTemplates && publicTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicTemplates.map((template: any) => (
                  <Link 
                    to={`/community/template/${template.id}`} 
                    key={template.id}
                    className="group"
                  >
                    <div className="bg-card border border-border rounded-lg p-4 h-full shadow-sm hover:shadow-md transition-all hover:border-primary/50 hover:translate-y-[-2px]">
                      <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">{template.title}</h3>
                      <p className="text-muted-foreground text-sm mt-2 line-clamp-3">{template.description || "No description provided."}</p>
                      
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                            {template.profiles?.full_name?.[0] || "U"}
                          </div>
                          <span className="text-xs text-muted-foreground">{template.profiles?.full_name || "Anonymous"}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="flex items-center text-xs text-muted-foreground">
                            <Star size={12} className="mr-1" />
                            {Math.floor(Math.random() * 100)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(template.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No templates found. Be the first to share one!</p>
                <Button asChild className="mt-4">
                  <Link to="/create">Create Template</Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const PromptCardSkeleton = () => (
  <div className="bg-card border border-border rounded-lg p-4 h-full shadow-sm animate-pulse">
    <div className="h-6 w-3/4 bg-muted rounded mb-3"></div>
    <div className="h-4 w-full bg-muted rounded mb-2"></div>
    <div className="h-4 w-full bg-muted rounded mb-2"></div>
    <div className="h-4 w-2/3 bg-muted rounded mb-4"></div>
    
    <div className="flex justify-between items-center mt-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-muted"></div>
        <div className="h-3 w-20 bg-muted rounded"></div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="h-3 w-8 bg-muted rounded"></div>
        <div className="h-3 w-16 bg-muted rounded"></div>
      </div>
    </div>
  </div>
);
