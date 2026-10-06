import React from "react";
import { useQuery } from "@tanstack/react-query";
import { leaderboardApi } from "@/lib/backend";
import { LeaderboardUser } from "@/lib/api";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, Crown } from "lucide-react";

export default function LeaderboardPage() {
  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { items } = await leaderboardApi.get();
      return items as LeaderboardUser[];
    },
  });

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Trophy className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <Award className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getRankBadgeColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 1:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case 2:
        return "bg-gradient-to-r from-amber-500 to-amber-700 text-white";
      default:
        return "bg-muted";
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8 animate-in fade-in duration-500">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          
          
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Leaderboard</CardTitle>
            <CardDescription>
              We couldn't load the leaderboard at this time. Please try again later.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 animate-in fade-in duration-500">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Leaderboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Top prompt engineers in our community
          </p>
        </div>
        
        {(!leaderboard || leaderboard.length === 0) ? (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle>No Rankings Yet</CardTitle>
              <CardDescription>
                Be the first to earn points and climb the leaderboard!
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((user, index) => (
              <Card key={user.user_id} className={`overflow-hidden transition-all hover:shadow-lg ${
                index < 3 ? 'ring-2 ring-purple-200 shadow-lg' : ''
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${getRankBadgeColor(index)}`}>
                        {index < 3 ? getRankIcon(index) : `#${index + 1}`}
                      </div>
                      <Avatar className="h-12 w-12 ring-2 ring-background">
                        <AvatarImage src={user.avatar_url || ""} alt={user.full_name || "User"} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100 text-purple-700 font-semibold">
                          {user.full_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold truncate">
                        {user.full_name || "Anonymous User"}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1">
                          <Trophy className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-medium">{user.total_points.toLocaleString()} points</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Award className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-muted-foreground">{user.badge_count} badges</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-1">
                      <Badge 
                        variant={index < 3 ? "default" : "secondary"}
                        className={index < 3 ? getRankBadgeColor(index) : ""}
                      >
                        Rank #{index + 1}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}