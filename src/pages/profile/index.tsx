
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, Edit, Settings, BookText, Heart, Clock, Plus, PenTool
} from "lucide-react";
import { UserProfile } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("prompts");

  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile", user?.id],
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

  const { data: userPoints, isLoading: pointsLoading } = useQuery({
    queryKey: ["userPoints", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { data, error } = await supabase
        .from("user_points")
        .select("points")
        .eq("user_id", user.id);

      if (error) throw error;
      
      return data.reduce((acc, item) => acc + item.points, 0);
    },
    enabled: !!user?.id,
  });

  const { data: userBadges, isLoading: badgesLoading } = useQuery({
    queryKey: ["userBadges", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("user_badges")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: userPrompts, isLoading: promptsLoading } = useQuery({
    queryKey: ["userPrompts", user?.id, activeTab],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("prompts")
        .select(`
          *,
          sections:prompt_sections(*)
        `)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && activeTab === "prompts",
  });

  const { data: userTemplates, isLoading: templatesLoading } = useQuery({
    queryKey: ["userTemplates", user?.id, activeTab],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("prompt_templates")
        .select(`
          *,
          sections:template_sections(*)
        `)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && activeTab === "templates",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container px-4 py-8 mx-auto">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_2fr]">
          <div className="space-y-6">
            <Card className="overflow-hidden border-none shadow-md">
              <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile
                </CardTitle>
                <CardDescription>Your personal information</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center pt-6 text-center">
                {profileLoading ? (
                  <>
                    <Skeleton className="w-20 h-20 mb-4 rounded-full" />
                    <Skeleton className="w-40 h-6 mb-2" />
                    <Skeleton className="w-32 h-4" />
                  </>
                ) : (
                  <>
                    <Avatar className="w-20 h-20 mb-4 border-4 border-background">
                      <AvatarImage src={userProfile?.avatar_url || ""} />
                      <AvatarFallback className="text-lg">
                        {userProfile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="mb-1 text-xl font-semibold">
                      {userProfile?.full_name || "User"}
                    </h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-center pb-6">
                <Button variant="outline" size="sm" className="gap-1">
                  <Edit className="w-4 h-4" /> Edit Profile
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Achievements
                </CardTitle>
                <CardDescription>Your badges and points</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 mb-4 rounded-lg bg-muted/50">
                  <p className="mb-1 text-sm font-medium text-muted-foreground">
                    Total Points
                  </p>
                  <p className="text-3xl font-bold">
                    {pointsLoading ? (
                      <Skeleton className="w-16 h-10" />
                    ) : (
                      userPoints || 0
                    )}
                  </p>
                </div>

                <h4 className="mb-3 font-medium">Badges</h4>
                {badgesLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="w-full h-10" />
                    ))}
                  </div>
                ) : userBadges && userBadges.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {userBadges.map((badge) => (
                      <div
                        key={badge.id}
                        className="px-3 py-2 text-sm rounded-lg bg-secondary"
                      >
                        {formatBadgeName(badge.badge_type)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No badges earned yet. Engage with the community to earn badges!
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild variant="ghost" size="sm" className="w-full gap-1">
                  <Link to="/leaderboard">
                    <Trophy className="w-4 h-4" /> View Leaderboard
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Settings
                </CardTitle>
                <CardDescription>Manage your preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Toggle between light and dark theme
                      </p>
                    </div>
                    <div>{/* Theme toggle will go here */}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Manage your notification preferences
                      </p>
                    </div>
                    <div>{/* Notification toggle will go here */}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Your Content</CardTitle>
                <CardDescription>
                  Manage your prompts, templates, and other content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  defaultValue="prompts"
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="prompts" className="flex items-center gap-1">
                      <BookText className="w-4 h-4" />
                      <span className="hidden sm:inline">Prompts</span>
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="flex items-center gap-1">
                      <PenTool className="w-4 h-4" />
                      <span className="hidden sm:inline">Templates</span>
                    </TabsTrigger>
                    <TabsTrigger value="liked" className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span className="hidden sm:inline">Liked</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="prompts" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Your Prompts</h3>
                      <Button asChild size="sm" className="gap-1">
                        <Link to="/create">
                          <Plus className="w-4 h-4" /> New Prompt
                        </Link>
                      </Button>
                    </div>

                    {promptsLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="w-full h-24" />
                        ))}
                      </div>
                    ) : userPrompts?.length ? (
                      <div className="space-y-4">
                        {userPrompts.map((prompt) => (
                          <Card key={prompt.id} className="overflow-hidden">
                            <CardHeader className="p-4">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">
                                  {prompt.title}
                                </CardTitle>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>
                                    {new Date(prompt.updated_at).toLocaleDateString()}
                                  </span>
                                  {prompt.is_public ? (
                                    <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                                      Public
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 text-xs rounded-full bg-muted">
                                      Private
                                    </span>
                                  )}
                                </div>
                              </div>
                              <CardDescription className="line-clamp-2">
                                {prompt.description || "No description provided."}
                              </CardDescription>
                            </CardHeader>
                            <CardFooter className="flex justify-end p-4 pt-0">
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  Edit
                                </Button>
                                <Button
                                  variant={prompt.is_public ? "default" : "outline"}
                                  size="sm"
                                >
                                  {prompt.is_public ? "Unpublish" : "Publish"}
                                </Button>
                              </div>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg border-dashed">
                        <BookText className="w-12 h-12 mb-2 text-muted-foreground" />
                        <h3 className="mb-1 font-medium">No prompts yet</h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                          Create your first prompt to get started.
                        </p>
                        <Button asChild>
                          <Link to="/create">
                            <Plus className="w-4 h-4 mr-2" /> Create Prompt
                          </Link>
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="templates" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Your Templates</h3>
                      <Button asChild size="sm" className="gap-1">
                        <Link to="/create-template">
                          <Plus className="w-4 h-4" /> New Template
                        </Link>
                      </Button>
                    </div>

                    {templatesLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="w-full h-24" />
                        ))}
                      </div>
                    ) : userTemplates?.length ? (
                      <div className="space-y-4">
                        {userTemplates.map((template) => (
                          <Card key={template.id} className="overflow-hidden">
                            <CardHeader className="p-4">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">
                                  {template.title}
                                </CardTitle>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>
                                    {new Date(template.updated_at).toLocaleDateString()}
                                  </span>
                                  {template.is_public ? (
                                    <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                                      Public
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 text-xs rounded-full bg-muted">
                                      Private
                                    </span>
                                  )}
                                </div>
                              </div>
                              <CardDescription className="line-clamp-2">
                                {template.description || "No description provided."}
                              </CardDescription>
                            </CardHeader>
                            <CardFooter className="flex justify-end p-4 pt-0">
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  Edit
                                </Button>
                                <Button
                                  variant={template.is_public ? "default" : "outline"}
                                  size="sm"
                                >
                                  {template.is_public ? "Unpublish" : "Publish"}
                                </Button>
                              </div>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg border-dashed">
                        <PenTool className="w-12 h-12 mb-2 text-muted-foreground" />
                        <h3 className="mb-1 font-medium">No templates yet</h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                          Create your first template to get started.
                        </p>
                        <Button asChild>
                          <Link to="/create-template">
                            <Plus className="w-4 h-4 mr-2" /> Create Template
                          </Link>
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="liked" className="p-4 text-center">
                    <Clock className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <h3 className="mb-1 text-lg font-medium">Coming Soon</h3>
                    <p className="text-muted-foreground">
                      The liked content feature is under development.
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your latest actions and interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 p-3 transition-colors rounded-lg hover:bg-muted/50"
                    >
                      <div className="p-2 rounded-full bg-primary/10">
                        <ActivityIcon index={i} />
                      </div>
                      <div>
                        <p className="font-medium">
                          {getActivityTitle(i)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getActivityDescription(i)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {getActivityTime(i)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="w-full gap-1">
                  <Clock className="w-4 h-4" /> View All Activity
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to format badge names
function formatBadgeName(badgeType: string) {
  return badgeType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Placeholder functions for activity feed
function ActivityIcon({ index }: { index: number }) {
  const icons = [
    <BookText key={1} className="w-4 h-4 text-primary" />,
    <Heart key={2} className="w-4 h-4 text-red-500" />,
    <PenTool key={3} className="w-4 h-4 text-blue-500" />,
  ];
  return icons[(index - 1) % icons.length];
}

function getActivityTitle(index: number) {
  const titles = [
    "Created a new prompt",
    "Liked a prompt",
    "Created a new template",
  ];
  return titles[(index - 1) % titles.length];
}

function getActivityDescription(index: number) {
  const descriptions = [
    "You created a new prompt titled 'Product Marketing Plan'",
    "You liked the prompt 'Customer Support Chatbot'",
    "You created a new template titled 'Sales Email Sequence'",
  ];
  return descriptions[(index - 1) % descriptions.length];
}

function getActivityTime(index: number) {
  const times = ["3 hours ago", "Yesterday", "2 days ago"];
  return times[(index - 1) % times.length];
}

// Missing import
function User(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
