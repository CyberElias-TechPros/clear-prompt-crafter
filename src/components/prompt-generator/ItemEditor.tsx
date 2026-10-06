import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { itemApi, ItemKind } from "@/lib/backend";
import type { PromptSectionDraft } from "@/components/prompt-generator/types";

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
import { AlertCircle, ArrowLeft, ArrowRight, Check, Globe2, LockKeyhole } from "lucide-react";
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
  const [promptSections, setPromptSections] = useState<PromptSectionDraft[]>([]);

  const singular = kind === "prompts" ? "Prompt" : "Template";
  const lowercaseSingular = singular.toLowerCase();

  const saveMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; isPublic: boolean; sections: PromptSectionDraft[] }) => {
      if (!user) throw new Error(`You must be logged in to save a ${lowercaseSingular}`);
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
    onError: (error: unknown) => {
      console.error(`Error saving ${lowercaseSingular}:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to save ${lowercaseSingular}. Please try again.`);
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast.error(`Please enter a title for your ${lowercaseSingular}`);
      return;
    }
    if (promptSections.length === 0) {
      toast.error(`Please add at least one section to your ${lowercaseSingular}`);
      return;
    }
    saveMutation.mutate({ title: title.trim(), description: description.trim(), isPublic, sections: promptSections });
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            <Link to="/dashboard" className="transition-colors hover:text-primary">Workspace</Link>
            <span className="text-border">/</span>
            <span>{kind === "prompts" ? "New prompt" : "New template"}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-[-0.05em] sm:text-[30px]">Create a {lowercaseSingular}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Give your idea a name, set its visibility, then shape the prompt.</p>
        </div>
        <Button asChild variant="ghost" size="sm" className="h-9 self-start rounded-xl text-muted-foreground sm:self-auto">
          <Link to="/community"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" />Back to library</Link>
        </Button>
      </div>

      <Card className="border-border/80 bg-white/85 shadow-[0_5px_22px_rgba(25,27,49,0.035)] dark:bg-card">
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.72fr)] lg:items-start">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="item-title" className="text-xs font-semibold">{singular} name</Label>
                <Input
                  id="item-title"
                  placeholder={`Give your ${lowercaseSingular} a clear, memorable name`}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={120}
                  className="h-11 bg-[#fbfbfc]"
                />
                <p className="text-right text-[10px] text-muted-foreground">{title.length}/120</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-description" className="text-xs font-semibold">Description <span className="font-normal text-muted-foreground">· optional</span></Label>
                <Textarea
                  id="item-description"
                  placeholder={`In a sentence, what does this ${lowercaseSingular} help with?`}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={280}
                  className="min-h-[88px] resize-y bg-[#fbfbfc]"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-[#fafaff] p-4 dark:bg-[#1d1e31]">
              <div className="flex items-center gap-2.5">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${isPublic ? "bg-[#efedff] text-[#6252d1]" : "bg-[#eff1f5] text-[#6c7180]"}`}>
                  {isPublic ? <Globe2 className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
                </span>
                <div>
                  <p className="text-xs font-semibold">Sharing</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{isPublic ? "Visible in the community" : "Only you can see this draft"}</p>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-border/70 bg-white p-3 dark:bg-[#25263a]">
                <Checkbox id="isPublic" checked={isPublic} onCheckedChange={(checked) => setIsPublic(checked === true)} className="mt-0.5" />
                <div className="space-y-1">
                  <Label htmlFor="isPublic" className="cursor-pointer text-xs font-semibold">Share with the community</Label>
                  <p className="text-[10px] leading-4 text-muted-foreground">You can change visibility later. Your work stays private until you choose to share it.</p>
                </div>
              </div>
              {isPublic && (
                <Alert className="mt-3 border-[#dedaf8] bg-[#f4f2ff] dark:bg-[#27243e] px-3 py-2.5 [&>svg]:top-3">
                  <AlertCircle className="h-3.5 w-3.5 text-[#6554dc]" />
                  <AlertTitle className="text-[11px] text-[#5145b4]">Community-ready</AlertTitle>
                  <AlertDescription className="text-[10px] leading-4 text-[#726ca0]">Public work appears alongside other member-created prompts.</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="min-w-0">
        {activeTab === "structured" && <StructuredPrompt onPromptDataChange={setPromptSections} />}
        {activeTab === "conversational" && <ConversationalPrompt onPromptDataChange={setPromptSections} />}
        {activeTab === "meta" && <MetaPrompt onPromptDataChange={setPromptSections} />}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border/80 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><LockKeyhole className="h-3.5 w-3.5" />Your draft is saved only when you choose Save.</p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => navigate("/community")} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending} className="min-w-[145px] rounded-xl bg-[#6554dc] text-white hover:bg-[#5142bf]">
            {saveMutation.isPending ? "Saving…" : <>Save {lowercaseSingular}<ArrowRight className="h-4 w-4" /></>}
          </Button>
        </div>
      </div>
    </div>
  );
}
