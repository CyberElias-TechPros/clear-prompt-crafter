
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/MainLayout";
import Header from "@/components/prompt-generator/Header";
import StructuredPrompt from "@/components/prompt-generator/StructuredPrompt";
import ConversationalPrompt from "@/components/prompt-generator/ConversationalPrompt";
import MetaPrompt from "@/components/prompt-generator/MetaPrompt";
import { UserSettings } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Index = () => {
  const [activeTab, setActiveTab] = useState("structured");
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLearningDialog, setShowLearningDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        setUserSettings(data);
        
        // Show learning dialog if setting not yet configured
        if (data && !data.allow_learning) {
          setShowLearningDialog(true);
        }
      } catch (error: any) {
        console.error("Error fetching user settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserSettings();
  }, [user]);

  const handleLearningPermission = async (allow: boolean) => {
    if (!user || !userSettings) return;
    
    try {
      const { error } = await supabase
        .from("user_settings")
        .update({ allow_learning: allow })
        .eq("user_id", user.id);

      if (error) throw error;

      setUserSettings({
        ...userSettings,
        allow_learning: allow,
      });

      toast({
        title: allow ? "Learning enabled" : "Learning disabled",
        description: allow
          ? "We'll learn from your history to provide better suggestions."
          : "We won't use your history for learning.",
      });
      
      setShowLearningDialog(false);
    } catch (error: any) {
      toast({
        title: "Error updating settings",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen flex flex-col animate-in fade-in duration-500">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            {activeTab === "structured" && <StructuredPrompt />}
            {activeTab === "conversational" && <ConversationalPrompt />}
            {activeTab === "meta" && <MetaPrompt />}
          </div>
        </main>
        
        <Dialog open={showLearningDialog} onOpenChange={setShowLearningDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enhance Your Experience</DialogTitle>
              <DialogDescription>
                Would you like to enable learning from your prompt history? 
                This helps us provide better suggestions based on your previous prompts.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2 py-4">
              <Switch id="learning-mode" />
              <Label htmlFor="learning-mode">Enable personalized suggestions</Label>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleLearningPermission(false)}
              >
                No thanks
              </Button>
              <Button type="button" onClick={() => handleLearningPermission(true)}>
                Enable learning
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Index;
