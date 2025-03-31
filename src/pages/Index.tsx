
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/prompt-generator/Header";
import StructuredPrompt from "@/components/prompt-generator/StructuredPrompt";
import ConversationalPrompt from "@/components/prompt-generator/ConversationalPrompt";
import MetaPrompt from "@/components/prompt-generator/MetaPrompt";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { UserSettings } from "@/lib/types";

const Index = () => {
  const [activeTab, setActiveTab] = useState("structured");
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      } catch (error: any) {
        console.error("Error fetching user settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserSettings();
  }, [user]);

  // Prompt to enable learning if setting not yet configured
  useEffect(() => {
    if (!isLoading && userSettings && !userSettings.allow_learning) {
      const askForLearningPermission = async () => {
        // Use confirm dialog to ask for permission
        const allowLearning = window.confirm(
          "Would you like to enable learning from your history? This helps us provide better suggestions based on your previous prompts."
        );

        if (allowLearning) {
          try {
            const { error } = await supabase
              .from("user_settings")
              .update({ allow_learning: true })
              .eq("user_id", user!.id);

            if (error) throw error;

            setUserSettings({
              ...userSettings,
              allow_learning: true,
            });

            toast({
              title: "Learning enabled",
              description:
                "We'll now learn from your history to provide better suggestions.",
            });
          } catch (error: any) {
            toast({
              title: "Error updating settings",
              description: error.message,
              variant: "destructive",
            });
          }
        }
      };

      askForLearningPermission();
    }
  }, [isLoading, userSettings, user, toast]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1">
        {activeTab === "structured" && <StructuredPrompt />}
        {activeTab === "conversational" && <ConversationalPrompt />}
        {activeTab === "meta" && <MetaPrompt />}
      </main>
      <footer className="p-4 border-t text-center text-sm text-muted-foreground">
        <p>Prompt-Gineer — Craft effective AI prompts with structured templates and guidance</p>
      </footer>
    </div>
  );
};

export default Index;
