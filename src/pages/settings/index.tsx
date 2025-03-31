
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, Settings, Bell, Lock, Shield, Download, Upload, Trash2
} from "lucide-react";
import { UserSettings } from "@/lib/types";

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  
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
      
      setFullName(data.full_name || "");
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
      
      return data as UserSettings;
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (profileData: { full_name: string }) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("id", user.id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", user?.id] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (settingsData: Partial<UserSettings>) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from("user_settings")
        .update(settingsData)
        .eq("user_id", user.id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSettings", user?.id] });
      toast({
        title: "Settings updated",
        description: "Your settings have been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error updating settings:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({ full_name: fullName });
  };

  const toggleLearningPreference = (value: boolean) => {
    updateSettings.mutate({ allow_learning: value });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Feature not available",
      description: "Account deletion is not implemented in this demo.",
    });
  };

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
                <div>
                  <h2 className="text-xl font-semibold mb-1">Account Settings</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage your account information and preferences
                  </p>
                </div>
                
                <Separator />
                
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your email address cannot be changed
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Profile Picture</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={userProfile?.avatar_url || ""} />
                        <AvatarFallback className="text-lg">
                          {userProfile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-x-2">
                        <Button type="button" variant="outline" size="sm">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </Button>
                        <Button type="button" variant="outline" size="sm">
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Button type="submit">
                    Save Changes
                  </Button>
                </form>
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
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch id="email-notifications" defaultChecked={true} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="likes-comments">Likes & Comments</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when someone likes or comments on your prompts
                      </p>
                    </div>
                    <Switch id="likes-comments" defaultChecked={true} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="marketing">Marketing</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about new features and products
                      </p>
                    </div>
                    <Switch id="marketing" defaultChecked={false} />
                  </div>
                </div>
                
                <Button className="mt-4">
                  Save Preferences
                </Button>
              </TabsContent>
              
              <TabsContent value="privacy" className="p-6 space-y-6 animate-in fade-in-50">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Privacy Settings</h2>
                  <p className="text-sm text-muted-foreground">
                    Control your privacy and data preferences
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="allowLearning">Allow AI Learning</Label>
                      <p className="text-sm text-muted-foreground">
                        Let us use your prompts to improve our AI systems
                      </p>
                    </div>
                    {settingsLoading ? (
                      <Skeleton className="w-12 h-6" />
                    ) : (
                      <Switch 
                        id="allowLearning" 
                        checked={userSettings?.allow_learning || false}
                        onCheckedChange={toggleLearningPreference}
                      />
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="publicProfile">Public Profile</Label>
                      <p className="text-sm text-muted-foreground">
                        Make your profile visible to other users
                      </p>
                    </div>
                    <Switch id="publicProfile" defaultChecked={true} />
                  </div>
                </div>
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
                  <div>
                    <h3 className="text-lg font-medium mb-2">Export Data</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Download all your prompts and settings as a JSON file
                    </p>
                    <Button>
                      <Download className="mr-2 h-4 w-4" />
                      Export All Data
                    </Button>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Import Data</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Import prompts from a JSON file
                    </p>
                    <Button>
                      <Upload className="mr-2 h-4 w-4" />
                      Import Prompts
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="danger" className="p-6 space-y-6 animate-in fade-in-50">
                <div>
                  <h2 className="text-xl font-semibold text-destructive mb-1">Danger Zone</h2>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and data
                  </p>
                </div>
                
                <Separator />
                
                <div className="border border-destructive/20 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-destructive mb-2">Delete Account</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete your account and all of your data. This action cannot be undone.
                  </p>
                  <Button variant="destructive" onClick={handleDeleteAccount}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
