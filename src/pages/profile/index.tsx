import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  Heart,
  Eye,
  Calendar,
  Trophy,
  Award,
  Settings,
  Plus,
} from "lucide-react";
import { AdBanner } from "@/components/ads";

type UserProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

type UserPrompt = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  is_public: boolean;
  likes: number;
  views: number;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("prompts");

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!user?.id,
  });

  const { data: userPrompts, isLoading: promptsLoading } = useQuery({
    queryKey: ["user-prompts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as UserPrompt[];
    },
    enabled: !!user?.id,
  });

  if (profileLoading) {
    return (
      <div className="container py-8 animate-in fade-in duration-500">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="container py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You need to be logged in to view this page.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-6">
        <AdBanner size="small" position="top" className="mb-6" />
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <Avatar className="h-20 w-20 ring-4 ring-background shadow-lg">
                  <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100 text-purple-700 text-2xl font-bold">
                    {profile.full_name?.[0] || user.email?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">{profile.full_name || "Anonymous User"}</h1>
                  <p className="text-muted-foreground">{user.email}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                    </span>
                    <Badge variant="outline" className="capitalize">
                      {profile.role}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button asChild variant="outline">
                <Link to="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="prompts" className="flex-1">My Prompts</TabsTrigger>
            <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="prompts" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Prompts</h2>
              <Button asChild className="bg-purple-600 hover:bg-purple-700">
                <Link to="/prompts/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Prompt
                </Link>
              </Button>
            </div>
            
            {promptsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : !userPrompts || userPrompts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No prompts yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first prompt to get started.
                  </p>
                  <Button asChild className="bg-purple-600 hover:bg-purple-700">
                    <Link to="/prompts/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Prompt
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {userPrompts.map((prompt) => (
                  <Card key={prompt.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <CardTitle className="text-lg">{prompt.title}</CardTitle>
                          {prompt.description && (
                            <CardDescription>{prompt.description}</CardDescription>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDistanceToNow(new Date(prompt.created_at), { addSuffix: true })}
                            </span>
                            <span className="flex items-center">
                              <Heart className="h-4 w-4 mr-1" />
                              {prompt.likes} likes
                            </span>
                            <span className="flex items-center">
                              <Eye className="h-4 w-4 mr-1" />
                              {prompt.views} views
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Activity feed coming soon</h3>
                <p className="text-muted-foreground">
                  We're working on a detailed activity feed.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}