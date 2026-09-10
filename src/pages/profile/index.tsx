import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { itemApi, leaderboardApi } from "@/lib/backend";

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
import { MessageSquare, Heart, Eye, Calendar, Trophy, LayoutTemplate } from "lucide-react";
import { AdBanner } from "@/components/ads";

interface MyItem {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  is_public: boolean | number;
  likes: number;
  views: number;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("prompts");

  const { data: myPrompts, isLoading: promptsLoading } = useQuery({
    queryKey: ["my-prompts", user?.id],
    queryFn: () => itemApi.mine("prompts"),
    select: (d) => d.items as MyItem[],
    enabled: !!user?.id,
  });

  const { data: myTemplates, isLoading: templatesLoading } = useQuery({
    queryKey: ["my-templates", user?.id],
    queryFn: () => itemApi.mine("templates"),
    select: (d) => d.items as MyItem[],
    enabled: !!user?.id,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["leaderboard", user?.id],
    queryFn: () => leaderboardApi.get(),
    select: (d) => d.items,
    enabled: !!user?.id,
  });

  if (authLoading) {
    return (
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!user) {
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

  const myRank = leaderboard?.findIndex((l) => l.user_id === user.id) ?? -1;
  const myPoints = leaderboard?.find((l) => l.user_id === user.id)?.total_points ?? 0;

  const renderItemGrid = (items: MyItem[] | undefined, loading: boolean, kind: "prompt" | "template") => {
    if (loading) {
      return (
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
      );
    }
    if (!items || items.length === 0) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              No {kind}s yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Create your first {kind} to start building your collection.
            </p>
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link to={kind === "prompt" ? "/prompts/new" : "/templates/new"}>
                Create {kind === "prompt" ? "Prompt" : "Template"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      );
    }
    return (
      <div className="space-y-4">
        {items.map((item) => (
          <Link key={item.id} to={`/community/${kind}/${item.id}`}>
            <Card className="mb-4 transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {item.title}
                      {item.is_public ? (
                        <Badge variant="secondary" className="text-xs">Public</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Private</Badge>
                      )}
                    </CardTitle>
                    {item.description && <CardDescription>{item.description}</CardDescription>}
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </span>
                      <span className="flex items-center">
                        <Heart className="h-4 w-4 mr-1" />
                        {item.likes} likes
                      </span>
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {item.views} views
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="container py-8 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-6">
        <AdBanner size="small" position="top" className="mb-6" />

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar_url || ""} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-100 to-blue-100 text-purple-700">
                  {(user.full_name || user.email)?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <CardTitle className="text-2xl">{user.full_name || user.email}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
                <div className="flex items-center gap-2 pt-1">
                  {user.role === "admin" && (
                    <Badge className="bg-purple-600">Admin</Badge>
                  )}
                  {user.is_premium && (
                    <Badge className="bg-amber-500">Premium</Badge>
                  )}
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    {myPoints} points
                  </Badge>
                  {myRank >= 0 && (
                    <Badge variant="outline">Rank #{myRank + 1}</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="prompts" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              My Prompts
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4" />
              My Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prompts" className="mt-6">
            {renderItemGrid(myPrompts, promptsLoading, "prompt")}
          </TabsContent>
          <TabsContent value="templates" className="mt-6">
            {renderItemGrid(myTemplates, templatesLoading, "template")}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
