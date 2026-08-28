import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

export function SettingsForm() {
  const { user, updateUser } = useAuth();

  const handleToggleLearning = async (checked: boolean) => {
    try {
      await updateUser({ allow_learning: checked });
      toast({
        title: checked ? "Learning enabled" : "Learning disabled",
        description: checked
          ? "We'll use your prompts to improve our AI suggestions."
          : "Your prompts won't be used for learning.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTheme = async (theme: "light" | "dark" | "system") => {
    try {
      await updateUser({ theme });
      toast({ title: "Theme updated", description: `Default theme set to ${theme}.` });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <form className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Privacy Settings</h2>
        <p className="text-sm text-muted-foreground">
          Control your privacy and data preferences
        </p>
      </div>

      <Separator />

      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label className="text-base">Allow AI Learning</Label>
          <p className="text-sm text-muted-foreground">
            Let us use your prompts to improve our AI systems
          </p>
        </div>
        <Switch checked={!!user?.allow_learning} onCheckedChange={handleToggleLearning} />
      </div>

      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label className="text-base">Default Theme</Label>
          <p className="text-sm text-muted-foreground">Set your preferred default theme</p>
        </div>
        <div className="flex space-x-2">
          <Button
            type="button"
            size="sm"
            variant={user?.theme === "light" ? "default" : "outline"}
            onClick={() => handleTheme("light")}
          >
            Light
          </Button>
          <Button
            type="button"
            size="sm"
            variant={user?.theme === "dark" ? "default" : "outline"}
            onClick={() => handleTheme("dark")}
          >
            Dark
          </Button>
          <Button
            type="button"
            size="sm"
            variant={user?.theme === "system" ? "default" : "outline"}
            onClick={() => handleTheme("system")}
          >
            System
          </Button>
        </div>
      </div>
    </form>
  );
}
