import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileFormValues {
  full_name: string;
  avatar_url: string;
}

export function ProfileForm() {
  const { user, updateUser } = useAuth();

  const form = useForm<ProfileFormValues>({
    defaultValues: {
      full_name: user?.full_name || "",
      avatar_url: user?.avatar_url || "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        full_name: user.full_name || "",
        avatar_url: user.avatar_url || "",
      });
    }
  }, [user, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await updateUser({
        full_name: data.full_name,
        avatar_url: data.avatar_url,
      });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error?.message || "There was an error updating your profile.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Profile Information</h2>
          <p className="text-sm text-muted-foreground">Update your personal information</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <FormLabel>Profile Picture</FormLabel>
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={form.watch("avatar_url") || ""} />
                <AvatarFallback className="text-lg">
                  {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="https://example.com/avatar.png" {...field} />
                  </FormControl>
                  <FormDescription>Paste an image URL to use as your avatar.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your full name" {...field} />
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
            <Input id="email" value={user?.email || ""} disabled className="bg-muted/50" />
            <p className="text-xs text-muted-foreground">Your email address cannot be changed</p>
          </div>
        </div>

        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto">
          {form.formState.isSubmitting ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </Form>
  );
}
