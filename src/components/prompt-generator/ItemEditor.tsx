import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { itemApi, ItemKind } from "@/lib/backend";

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

interface ItemEditorProps {
  kind: ItemKind;
}

export default function ItemEditor({ kind }: ItemEditorProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("structured");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(kind === "templates");
  const [promptSections, setPromptSections] = useState<any[]>([]);

  const singular = kind === "prompts" ? "Prompt" : "Template";

  const saveMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; isPublic: boolean; sections: any[] }) => {
      if (!user) throw new Error(`You must be logged in to save a ${singular.toLowerCase()}`);

      const sections = data.sections.map((section) => ({
        section_type: section.type,
        content: section.content,
      }));

      const { id } = await itemApi.create(kind, {
        title: data.title,
        description: data.description,
        is_public: data.isPublic,
        sections,
      });
      return id;
    },
    onSuccess: (id) => {
      toast.success(`${singular} saved successfully! You earned 10 points.`);
      const slug = kind === "prompts" ? "prompt" : "template";
      navigate(`/community/${slug}/${id}`);
    },
    onError: (error: any) => {
      console.error(`Error saving ${singular.toLowerCase()}:`, error);
      toast.error(error?.message || `Failed to save ${singular.toLowerCase()}. Please try again.`);
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast.error(`Please enter a title for your ${singular.toLowerCase()}`);
      return;
    }
    if (promptSections.length === 0) {
      toast.error(`Please add at least one section to your ${singular.toLowerCase()}`);
      return;
    }
    saveMutation.mutate({ title, description, isPublic, sections: promptSections });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
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
                    <Label htmlFor="title">{singular} Title</Label>
                    <Input
                      id="title"
                      placeholder={`Enter a title for your ${singular.toLowerCase()}`}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      placeholder={`Briefly describe what this ${singular.toLowerCase()} does`}
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
                    <Label htmlFor="isPublic">Share with community</Label>
                  </div>

                  {isPublic && (
                    <Alert variant="default" className="bg-muted">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Community Sharing</AlertTitle>
                      <AlertDescription>
                        Your {singular.toLowerCase()} will be visible to all members of the
                        Prompt-Gineer community. You can change this setting later.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {activeTab === "structured" && (
            <StructuredPrompt onPromptDataChange={setPromptSections} />
          )}
          {activeTab === "conversational" && (
            <ConversationalPrompt onPromptDataChange={setPromptSections} />
          )}
          {activeTab === "meta" && <MetaPrompt onPromptDataChange={setPromptSections} />}

          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline" onClick={() => navigate("/community")}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saveMutation.isPending ? "Saving..." : `Save ${singular}`}
            </Button>
            {isPublic && (
              <Button variant="outline" className="flex items-center gap-2" onClick={handleShare}>
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
