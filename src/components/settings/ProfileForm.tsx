
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload } from "lucide-react";

interface ProfileFormProps {
  initialProfile: UserProfile | null;
  isLoading: boolean;
}

export function ProfileForm({ initialProfile, isLoading }: ProfileFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const form = useForm<Partial<UserProfile>>({
    defaultValues: {
      full_name: initialProfile?.full_name || "",
    },
  });

  // Update form values when initialProfile changes
  useEffect(() => {
    if (initialProfile) {
      form.reset({
        full_name: initialProfile.full_name || "",
      });
    }
  }, [initialProfile, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<UserProfile>) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("id", user?.id || "")
        .select()
        .single();
        
      if (error) throw error;
      return data;
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

  function onSubmit(data: Partial<UserProfile>) {
    updateProfileMutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Profile Information</h2>
          <p className="text-sm text-muted-foreground">
            Update your personal information
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <FormLabel>Profile Picture</FormLabel>
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={initialProfile?.avatar_url || ""} />
                <AvatarFallback className="text-lg">
                  {initialProfile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-x-2">
                <Button type="button" variant="outline" size="sm" disabled={isLoading}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={isLoading}>
                  Remove
                </Button>
              </div>
            </div>
          </div>
          
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your full name" 
                    {...field} 
                    value={field.value || ""}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  This is how you'll appear to other users in the community
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="space-y-1">
            <FormLabel htmlFor="email">Email</FormLabel>
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
        </div>
        
        <Button 
          type="submit" 
          disabled={isLoading || updateProfileMutation.isPending}
          className="w-full sm:w-auto"
        >
          {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </Form>
  );
}
