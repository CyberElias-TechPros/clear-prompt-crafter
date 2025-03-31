
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowUp, ArrowDown, Trophy, Star, User, Calendar 
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function LeaderboardPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'allTime'>('week');
  
  const { data: topUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["leaderboard-users", timeRange],
    queryFn: async () => {
      let query = supabase
        .from("user_points")
        .select(`
          user_id,
          profiles:user_id(full_name, avatar_url),
          sum_points:points(sum)
        `)
        .group('user_id, profiles:full_name, profiles:avatar_url');
        
      if (timeRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('earned_at', weekAgo.toISOString());
      } else if (timeRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('earned_at', monthAgo.toISOString());
      }
      
      const { data, error } = await query.order('sum_points', { ascending: false }).limit(20);
      
      if (error) throw error;
      return data;
    },
  });
  
  const { data: topPrompts, isLoading: promptsLoading } = useQuery({
    queryKey: ["leaderboard-prompts", timeRange],
    queryFn: async () => {
      let query = supabase
        .from("prompts")
        .select(`
          id, title, description, created_at,
          profiles:user_id(full_name, avatar_url),
          likes:like_count(count)
        `)
        .eq('is_public', true);
        
      if (timeRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      } else if (timeRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('created_at', monthAgo.toISOString());
      }
      
      const { data, error } = await query.order('likes', { ascending: false }).limit(10);
      
      if (error) throw error;
      return data;
    },
  });
  
  const { data: userBadges } = useQuery({
    queryKey: ["user-badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_badges")
        .select(`
          user_id, badge_type,
          profiles:user_id(full_name, avatar_url)
        `)
        .order('earned_at', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500 animate-text">Prompt-Gineer Leaderboard</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Celebrate the most active prompt engineers in our community
          </p>
        </header>
        
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-amber-500" />
              Top Contributors
            </h2>
            
            <div className="mb-4">
              <TabsList className="w-full max-w-xs mx-auto grid grid-cols-3">
                <TabsTrigger
                  value="week"
                  onClick={() => setTimeRange('week')}
                  className={`${timeRange === 'week' ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  This Week
                </TabsTrigger>
                <TabsTrigger
                  value="month"
                  onClick={() => setTimeRange('month')}
                  className={`${timeRange === 'month' ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  This Month
                </TabsTrigger>
                <TabsTrigger
                  value="allTime"
                  onClick={() => setTimeRange('allTime')}
                  className={`${timeRange === 'allTime' ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  All Time
                </TabsTrigger>
              </TabsList>
            </div>
            
            {usersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse flex items-center p-3">
                    <div className="w-8 text-center text-muted-foreground font-bold">
                      {i}
                    </div>
                    <div className="h-10 w-10 rounded-full bg-muted mx-3"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                    </div>
                    <div className="h-6 w-16 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {topUsers?.map((user: any, index: number) => (
                  <div 
                    key={user.user_id} 
                    className={`flex items-center p-3 ${index < 3 ? 'bg-muted/30 rounded-md' : ''}`}
                  >
                    <div className="w-8 text-center font-bold">
                      {index + 1}
                    </div>
                    
                    <div className="relative mx-3">
                      <Avatar className="h-10 w-10 border-2 border-background">
                        <AvatarImage src={user.profiles?.avatar_url || ""} />
                        <AvatarFallback className={index < 3 ? 'bg-primary text-primary-foreground' : ''}>
                          {user.profiles?.full_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      
                      {index < 3 && (
                        <div className="absolute -top-1 -right-1 bg-background rounded-full p-0.5">
                          <div className={`
                            rounded-full 
                            ${index === 0 ? 'bg-yellow-500' : ''}
                            ${index === 1 ? 'bg-gray-400' : ''}
                            ${index === 2 ? 'bg-amber-700' : ''}
                            w-4 h-4 flex items-center justify-center text-xs font-bold text-white
                          `}>
                            {index + 1}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium">{user.profiles?.full_name || "Anonymous"}</div>
                      <div className="text-xs text-muted-foreground flex items-center">
                        {getUserTitle(user.sum_points || 0)}
                      </div>
                    </div>
                    
                    <div className="font-bold text-lg">
                      {user.sum_points || 0}
                      <span className="text-xs ml-1 text-muted-foreground">pts</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <Star className="mr-2 h-5 w-5 text-amber-500" />
              Top Prompts
            </h2>
            
            {promptsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-4 bg-muted rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 divide-y divide-border">
                {topPrompts?.map((prompt: any, index: number) => (
                  <div key={prompt.id} className="pt-4 first:pt-0">
                    <Link 
                      to={`/community/prompt/${prompt.id}`}
                      className="group"
                    >
                      <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                        {prompt.title}
                      </h3>
                      
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                        {prompt.description || "No description provided."}
                      </p>
                      
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center">
                          <Avatar className="h-5 w-5 mr-2">
                            <AvatarImage src={prompt.profiles?.avatar_url || ""} />
                            <AvatarFallback>
                              {prompt.profiles?.full_name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-muted-foreground">
                            {prompt.profiles?.full_name || "Anonymous"}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-muted-foreground">
                          <ArrowUp className="mr-1 h-3 w-3" />
                          {prompt.likes || 0} likes
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 text-center">
              <Button asChild variant="outline">
                <Link to="/community">
                  View All Prompts
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              Recent Achievements
            </h2>
            
            {!userBadges ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3 p-2">
                    <div className="h-10 w-10 rounded-full bg-muted"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {userBadges.map((badge: any) => (
                  <div key={`${badge.user_id}-${badge.badge_type}`} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg animate-fade-in">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={badge.profiles?.avatar_url || ""} />
                        <AvatarFallback>
                          {badge.profiles?.full_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      {getBadgeIcon(badge.badge_type)}
                    </div>
                    
                    <div>
                      <div className="font-medium">{badge.profiles?.full_name || "Anonymous"}</div>
                      <div className="text-sm text-muted-foreground">
                        Earned the <span className="font-medium text-primary">{formatBadgeType(badge.badge_type)}</span> badge!
                      </div>
                    </div>
                  </div>
                ))}
                
                {userBadges.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="mx-auto h-10 w-10 mb-4 opacity-20" />
                    <p>No badges earned yet.</p>
                    <p className="text-sm mt-2">
                      Share prompts, receive likes, and engage with the community to earn badges!
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <Separator className="my-6" />
            
            <div>
              <h3 className="font-bold mb-4">Available Badges</h3>
              <div className="grid grid-cols-3 gap-3">
                {availableBadges.map((badge) => (
                  <div key={badge.type} className="text-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="mx-auto w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                      {getBadgeIconSimple(badge.type)}
                    </div>
                    <div className="text-xs font-medium">{badge.name}</div>
                    <div className="text-xs text-muted-foreground">{badge.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getUserTitle(points: number) {
  if (points >= 1000) return "Prompt Architect";
  if (points >= 500) return "Prompt Master";
  if (points >= 200) return "Prompt Specialist";
  if (points >= 100) return "Prompt Engineer";
  if (points >= 50) return "Prompt Creator";
  return "Prompt Beginner";
}

function formatBadgeType(type: string) {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getBadgeIcon(type: string) {
  return (
    <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
      <Trophy className="h-3 w-3 text-primary-foreground" />
    </div>
  );
}

function getBadgeIconSimple(type: string) {
  switch (type) {
    case 'prompt_master':
      return <Star className="h-5 w-5 text-amber-500" />;
    case 'top_contributor':
      return <Trophy className="h-5 w-5 text-amber-500" />;
    case 'popular_author':
      return <ArrowUp className="h-5 w-5 text-primary" />;
    case 'helpful_commenter':
      return <MessageSquare className="h-5 w-5 text-primary" />;
    case 'template_creator':
      return <Plus className="h-5 w-5 text-primary" />;
    case 'early_adopter':
      return <User className="h-5 w-5 text-primary" />;
    default:
      return <Star className="h-5 w-5 text-primary" />;
  }
}

const availableBadges = [
  {
    type: 'prompt_master',
    name: 'Prompt Master',
    description: 'Create 10+ high-quality prompts'
  },
  {
    type: 'top_contributor',
    name: 'Top Contributor',
    description: 'Reach top 3 on the leaderboard'
  },
  {
    type: 'popular_author',
    name: 'Popular Author',
    description: 'Get 50+ likes on your prompts'
  },
  {
    type: 'helpful_commenter',
    name: 'Helpful Commenter',
    description: 'Write 20+ comments on prompts'
  },
  {
    type: 'template_creator',
    name: 'Template Creator',
    description: 'Create 5+ prompt templates'
  },
  {
    type: 'early_adopter',
    name: 'Early Adopter',
    description: 'Join during beta phase'
  }
];
