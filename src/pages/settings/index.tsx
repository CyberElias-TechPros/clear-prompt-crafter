
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, Settings, Bell, Lock, Shield, Download, Trash2
} from "lucide-react";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { DangerZone } from "@/components/settings/DangerZone";

export default function SettingsPage() {
  const { user } = useAuth();
  
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
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: userSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["userSettings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Record not found, create default settings
          const defaultSettings = {
            user_id: user.id,
            allow_learning: false,
            theme: "light",
          };
          
          const { data: newData, error: insertError } = await supabase
            .from("user_settings")
            .insert(defaultSettings)
            .select()
            .single();
            
          if (insertError) throw insertError;
          return newData;
        }
        throw error;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container px-4 py-8 mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr]">
          <Tabs defaultValue="account" className="w-full" orientation="vertical">
            <div className="hidden md:block">
              <TabsList className="flex flex-col h-auto p-0 bg-transparent">
                <TabsTrigger 
                  value="account" 
                  className="justify-start w-full p-2 data-[state=active]:bg-muted"
                >
                  <User className="w-4 h-4 mr-2" />
                  Account
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="justify-start w-full p-2 data-[state=active]:bg-muted"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger 
                  value="privacy" 
                  className="justify-start w-full p-2 data-[state=active]:bg-muted"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Privacy
                </TabsTrigger>
                <TabsTrigger 
                  value="data" 
                  className="justify-start w-full p-2 data-[state=active]:bg-muted"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Data
                </TabsTrigger>
                <TabsTrigger 
                  value="danger" 
                  className="justify-start w-full p-2 data-[state=active]:bg-muted"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Danger Zone
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="block md:hidden mb-6">
              <TabsList className="w-full grid grid-cols-3 h-auto">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="notifications">Notify</TabsTrigger>
                <TabsTrigger value="privacy">Privacy</TabsTrigger>
              </TabsList>
              <TabsList className="w-full grid grid-cols-2 h-auto mt-2">
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="danger">Danger</TabsTrigger>
              </TabsList>
            </div>

            <div className="rounded-lg border shadow-sm bg-card">
              <TabsContent value="account" className="p-6 space-y-6 animate-in fade-in-50">
                {profileLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-28" />
                  </div>
                ) : (
                  <ProfileForm 
                    initialProfile={userProfile} 
                    isLoading={profileLoading} 
                  />
                )}
              </TabsContent>
              
              <TabsContent value="notifications" className="p-6 space-y-6 animate-in fade-in-50">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Notification Settings</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage how and when you receive notifications
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  {/* Notification settings would go here */}
                  <p className="text-center text-muted-foreground py-8">
                    Notification settings will be available soon.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="privacy" className="p-6 space-y-6 animate-in fade-in-50">
                {settingsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-28" />
                  </div>
                ) : (
                  <SettingsForm 
                    initialSettings={userSettings} 
                    isLoading={settingsLoading} 
                  />
                )}
              </TabsContent>
              
              <TabsContent value="data" className="p-6 space-y-6 animate-in fade-in-50">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Data Management</h2>
                  <p className="text-sm text-muted-foreground">
                    Export or import your data
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-6">
                  {/* Data management features would go here */}
                  <p className="text-center text-muted-foreground py-8">
                    Data management features will be available soon.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="danger" className="p-6 space-y-6 animate-in fade-in-50">
                <DangerZone />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
