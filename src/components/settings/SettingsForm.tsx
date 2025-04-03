
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { UserSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface SettingsFormProps {
  initialSettings: UserSettings | null;
  isLoading: boolean;
}

export function SettingsForm({ initialSettings, isLoading }: SettingsFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const form = useForm<Partial<UserSettings>>({
    defaultValues: {
      allow_learning: initialSettings?.allow_learning || false,
      theme: initialSettings?.theme || 'light',
    },
  });

  // Update form values when initialSettings changes
  useEffect(() => {
    if (initialSettings) {
      form.reset({
        allow_learning: initialSettings.allow_learning,
        theme: initialSettings.theme,
      });
    }
  }, [initialSettings, form]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/update-user-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.getSession().then(({ data }) => data.session?.access_token)}`,
        },
        body: JSON.stringify({ settings }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update settings');
      }
      
      return response.json();
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

  function onSubmit(data: Partial<UserSettings>) {
    updateSettingsMutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Privacy Settings</h2>
          <p className="text-sm text-muted-foreground">
            Control your privacy and data preferences
          </p>
        </div>
        
        <Separator />
        
        <FormField
          control={form.control}
          name="allow_learning"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Allow AI Learning</FormLabel>
                <FormDescription>
                  Let us use your prompts to improve our AI systems
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Default Theme</FormLabel>
                <FormDescription>
                  Set your preferred default theme
                </FormDescription>
              </div>
              <FormControl>
                <div className="flex space-x-2">
                  <Button 
                    type="button"
                    size="sm"
                    variant={field.value === 'light' ? 'default' : 'outline'}
                    onClick={() => field.onChange('light')}
                    disabled={isLoading}
                  >
                    Light
                  </Button>
                  <Button 
                    type="button"
                    size="sm"
                    variant={field.value === 'dark' ? 'default' : 'outline'}
                    onClick={() => field.onChange('dark')}
                    disabled={isLoading}
                  >
                    Dark
                  </Button>
                  <Button 
                    type="button"
                    size="sm"
                    variant={field.value === 'system' ? 'default' : 'outline'}
                    onClick={() => field.onChange('system')}
                    disabled={isLoading}
                  >
                    System
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          disabled={isLoading || updateSettingsMutation.isPending}
          className="w-full sm:w-auto"
        >
          {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </Form>
  );
}
