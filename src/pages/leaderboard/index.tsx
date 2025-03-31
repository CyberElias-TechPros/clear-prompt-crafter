import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Award, Star, Zap, MessageSquare, Users, Plus, Trophy, Medal, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface LeaderboardUser {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  total_points: number;
  badge_count: number;
  rank?: number;
}

export default function LeaderboardPage() {
  const [timeFrame, setTimeFrame] = useState<"all" | "month" | "week">("all");

  // Fetch leaderboard data
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ["leaderboard", timeFrame],
    queryFn: async () => {
      let query = supabase
        .from("user_leaderboard")
        .select("*")
        .order("total_points", { ascending: false })
        .limit(20);

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Add rank to each user
      return data.map((user, index) => ({
        ...user,
        rank: index + 1
      })) as LeaderboardUser[];
    },
  });

  // Fetch badges for top users
  const { data: badgesList } = useQuery({
    queryKey: ["top_badges"],
    queryFn: async () => {
      if (!leaderboardData || leaderboardData.length === 0) return [];
      
      // Get badges for top 5 users
      const topUserIds = leaderboardData.slice(0, 5).map(user => user.user_id);
      
      const { data, error } = await supabase
        .from("user_badges")
        .select("user_id, badge_type")
        .in("user_id", topUserIds);
      
      if (error) throw error;
      return data;
    },
    enabled: !!leaderboardData && leaderboardData.length > 0,
  });

  // Group badges by user
  const getUserBadges = (userId: string) => {
    if (!badgesList) return [];
    return badgesList
      .filter(badge => badge.user_id === userId)
      .map(badge => badge.badge_type);
  };

  const getBadgeIcon = (badgeType: string) => {
    switch (badgeType) {
      case "prompt_master":
        return <Star className="h-3 w-3" />;
      case "template_creator":
        return <Zap className="h-3 w-3" />;
      case "feedback_expert":
        return <MessageSquare className="h-3 w-3" />;
      case "community_contributor":
        return <Users className="h-3 w-3" />;
      case "early_adopter":
        return <Clock className="h-3 w-3" />;
      default:
        return <Trophy className="h-3 w-3" />;
    }
  };

  const getBadgeColor = (badgeType: string): string => {
    switch (badgeType) {
      case "prompt_master":
        return "bg-yellow-500 text-yellow-50";
      case "template_creator":
        return "bg-blue-500 text-blue-50";
      case "feedback_expert":
        return "bg-green-500 text-green-50";
      case "community_contributor":
        return "bg-purple-500 text-purple-50";
      case "early_adopter":
        return "bg-orange-500 text-orange-50";
      default:
        return "bg-gray-500 text-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 animate-gradient-x">
      <div className="container mx-auto px-4 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 animate-text">Leaderboard</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            The most active and skilled prompt engineers in our community
          </p>
        </header>

        <Tabs defaultValue="leaderboard" className="w-full max-w-4xl mx-auto">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Leaderboard
              </div>
            </TabsTrigger>
            <TabsTrigger value="badges" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
              <div className="flex items-center gap-2">
                <Medal className="h-4 w-4" />
                Badges
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="space-y-8 animate-fade-in">
            <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-border">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Top Contributors</h2>
                  <div className="flex bg-muted rounded-md p-1">
                    <button 
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${timeFrame === "all" ? "bg-card shadow-sm" : "hover:bg-background/50"}`}
                      onClick={() => setTimeFrame("all")}
                    >
                      All Time
                    </button>
                    <button 
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${timeFrame === "month" ? "bg-card shadow-sm" : "hover:bg-background/50"}`}
                      onClick={() => setTimeFrame("month")}
                    >
                      This Month
                    </button>
                    <button 
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${timeFrame === "week" ? "bg-card shadow-sm" : "hover:bg-background/50"}`}
                      onClick={() => setTimeFrame("week")}
                    >
                      This Week
                    </button>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="p-6">
                  <div className="flex justify-center items-center min-h-[400px]">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {/* Top 3 users with special styling */}
                  {leaderboardData && leaderboardData.slice(0, 3).map((user, index) => (
                    <div key={user.user_id} className="p-4 sm:p-6 flex items-center gap-4 bg-gradient-to-r from-background to-muted/30">
                      <div className="flex items-center justify-center min-w-[36px]">
                        {index === 0 && (
                          <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          </div>
                        )}
                        {index === 1 && (
                          <div className="h-8 w-8 rounded-full bg-gray-300/20 flex items-center justify-center">
                            <Trophy className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        {index === 2 && (
                          <div className="h-8 w-8 rounded-full bg-amber-600/20 flex items-center justify-center">
                            <Trophy className="h-4 w-4 text-amber-600" />
                          </div>
                        )}
                      </div>
                      
                      <Avatar className="h-12 w-12 border-2 border-background">
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex flex-col flex-grow">
                        <span className="font-semibold">{user.full_name || "Anonymous User"}</span>
                        <div className="flex items-center gap-2 mt-1">
                          {getUserBadges(user.user_id).slice(0, 3).map((badge, idx) => (
                            <Badge key={idx} variant="outline" className={`text-xs py-0 h-5 ${getBadgeColor(badge)}`}>
                              {getBadgeIcon(badge)}
                              <span className="ml-1">{formatBadgeName(badge)}</span>
                            </Badge>
                          ))}
                          {getUserBadges(user.user_id).length > 3 && (
                            <Badge variant="outline" className="text-xs py-0 h-5">
                              +{getUserBadges(user.user_id).length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 text-lg font-bold text-primary">
                        <Star className="h-5 w-5 text-primary fill-primary" />
                        {user.total_points}
                      </div>
                    </div>
                  ))}
                  
                  {/* Rest of the users */}
                  {leaderboardData && leaderboardData.slice(3).map((user) => (
                    <div key={user.user_id} className="p-4 sm:px-6 sm:py-4 flex items-center gap-4">
                      <div className="text-muted-foreground font-medium min-w-[36px] text-center">
                        {user.rank}
                      </div>
                      
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-grow">
                        <span className="font-medium">{user.full_name || "Anonymous User"}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 font-semibold">
                        <Star className="h-4 w-4 text-muted-foreground" />
                        {user.total_points}
                      </div>
                    </div>
                  ))}

                  {(!leaderboardData || leaderboardData.length === 0) && (
                    <div className="p-6 text-center">
                      <p className="text-muted-foreground">No data available for this time period.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="badges" className="space-y-8 animate-fade-in">
            <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-semibold">Badges & Achievements</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Earn these badges by contributing to the community and using the platform
                </p>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {badgeTypes.map((badge) => (
                  <div key={badge.type} className="flex gap-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${badge.bgColor}`}>
                      {badge.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{badge.name}</h3>
                      <p className="text-sm text-muted-foreground">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const badgeTypes = [
  {
    type: "prompt_master",
    name: "Prompt Master",
    description: "Create 10 public prompts that receive at least 5 likes each",
    icon: <Star className="h-6 w-6 text-yellow-500" />,
    bgColor: "bg-yellow-500/20"
  },
  {
    type: "template_creator",
    name: "Template Creator",
    description: "Create 5 templates that are used by at least 10 other users",
    icon: <Zap className="h-6 w-6 text-blue-500" />,
    bgColor: "bg-blue-500/20"
  },
  {
    type: "feedback_expert",
    name: "Feedback Expert",
    description: "Provide thoughtful comments on at least 20 community prompts",
    icon: <MessageSquare className="h-6 w-6 text-green-500" />,
    bgColor: "bg-green-500/20"
  },
  {
    type: "community_contributor",
    name: "Community Contributor",
    description: "Make meaningful contributions that help the prompt engineering community",
    icon: <Users className="h-6 w-6 text-purple-500" />,
    bgColor: "bg-purple-500/20"
  },
  {
    type: "early_adopter",
    name: "Early Adopter",
    description: "Join the platform during its first month of launch",
    icon: <Clock className="h-6 w-6 text-orange-500" />,
    bgColor: "bg-orange-500/20"
  },
  {
    type: "innovation_award",
    name: "Innovation Award",
    description: "Create a prompt that uses a novel approach or technique",
    icon: <Trophy className="h-6 w-6 text-primary" />,
    bgColor: "bg-primary/20"
  }
];

function formatBadgeName(badgeType: string): string {
  // Convert snake_case to Title Case
  return badgeType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
