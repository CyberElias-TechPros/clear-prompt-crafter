
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import Header from "@/components/prompt-generator/Header";
import StructuredPrompt from "@/components/prompt-generator/StructuredPrompt";
import ConversationalPrompt from "@/components/prompt-generator/ConversationalPrompt";
import MetaPrompt from "@/components/prompt-generator/MetaPrompt";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Share2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function NewPromptPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("structured");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [promptSections, setPromptSections] = useState<any[]>([]);

  // Mutation for saving a new prompt
  const savePromptMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; isPublic: boolean; sections: any[] }) => {
      if (!user) throw new Error("You must be logged in to save a prompt");
      
      // Insert the prompt
      const { data: prompt, error: promptError } = await supabase
        .from("prompts")
        .insert([
          {
            title: data.title,
            description: data.description,
            is_public: data.isPublic,
            user_id: user.id
          }
        ])
        .select()
        .single();
      
      if (promptError) throw promptError;
      
      // Insert the sections
      const sectionsWithPromptId = data.sections.map((section, index) => ({
        prompt_id: prompt.id,
        section_type: section.type,
        content: section.content,
        order_index: index
      }));
      
      const { error: sectionError } = await supabase
        .from("prompt_sections")
        .insert(sectionsWithPromptId);
      
      if (sectionError) throw sectionError;
      
      return prompt;
    },
    onSuccess: (data) => {
      toast.success("Prompt saved successfully!");
      navigate(`/community/prompt/${data.id}`);
    },
    onError: (error) => {
      console.error("Error saving prompt:", error);
      toast.error("Failed to save prompt. Please try again.");
    },
  });

  const handleSavePrompt = () => {
    if (!title.trim()) {
      toast.error("Please enter a title for your prompt");
      return;
    }
    
    if (promptSections.length === 0) {
      toast.error("Please add at least one section to your prompt");
      return;
    }
    
    savePromptMutation.mutate({
      title,
      description,
      isPublic,
      sections: promptSections
    });
  };

  const handlePromptDataChange = (sections: any[]) => {
    setPromptSections(sections);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1">
        <div className="container py-4">
          <div className="grid grid-cols-1 gap-6 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Prompt Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter a title for your prompt"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Briefly describe what this prompt does"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isPublic"
                      checked={isPublic}
                      onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                    />
                    <Label htmlFor="isPublic">
                      Share with community
                    </Label>
                  </div>

                  {isPublic && (
                    <Alert variant="default" className="bg-muted">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Community Sharing</AlertTitle>
                      <AlertDescription>
                        Your prompt will be visible to all members of the Prompt-Gineer community. You can change this setting later.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {activeTab === "structured" && (
            <StructuredPrompt onPromptDataChange={handlePromptDataChange} />
          )}
          
          {activeTab === "conversational" && (
            <ConversationalPrompt />
          )}
          
          {activeTab === "meta" && (
            <MetaPrompt />
          )}
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline" onClick={() => navigate('/community')}>
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={handleSavePrompt}
              disabled={savePromptMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {savePromptMutation.isPending ? "Saving..." : "Save Prompt"}
            </Button>
            {isPublic && (
              <Button variant="outline" className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
