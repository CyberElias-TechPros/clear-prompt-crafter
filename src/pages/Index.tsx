import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/MainLayout";
import Header from "@/components/prompt-generator/Header";
import StructuredPrompt from "@/components/prompt-generator/StructuredPrompt";
import ConversationalPrompt from "@/components/prompt-generator/ConversationalPrompt";
import MetaPrompt from "@/components/prompt-generator/MetaPrompt";
import PromptGuidelineCard from "@/components/prompt-guidelines/PromptGuidelineCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { HelpCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const LEARNING_DIALOG_KEY = "pg_learning_dialog_shown";

const Index = () => {
  const [activeTab, setActiveTab] = useState("structured");
  const [showLearningDialog, setShowLearningDialog] = useState(() => {
    try {
      return !localStorage.getItem(LEARNING_DIALOG_KEY);
    } catch {
      return false;
    }
  });
  const [learningChoice, setLearningChoice] = useState(true);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const guidelines = {
    debuggingBestPractices: {
      title: "Debugging Best Practices",
      description: "Tips for effective debugging with AI",
      content: [
        "Always provide specific, detailed descriptions of what you want to achieve",
        "Break down complex problems into smaller, manageable steps",
        "Use clear, unambiguous language in your prompts",
        "Include relevant context and constraints",
        "Specify the desired outcome explicitly",
      ],
      variant: "debug",
    },
    promptEngineeringGuidelines: {
      title: "Prompt Engineering Guidelines",
      description: "Best practices for writing effective prompts",
      content: [
        "Start with a clear context setting",
        "Define tasks with measurable outcomes",
        "Include specific guidelines and constraints",
        "Consider error handling and edge cases",
        "Review and iterate on your prompts",
      ],
      variant: "tip",
    },
    debuggingWorkflows: {
      title: "Debugging Workflows",
      description: "Step-by-step approaches to solve problems",
      content: [
        "When something doesn't work, add more specificity to your request",
        "Use the console logs to understand how data is flowing through your application",
        "Isolate the problem area before attempting fixes",
        "For complex bugs, create a minimal reproducible example",
        "Add 'console.log' statements strategically to track the execution flow",
      ],
      variant: "warning",
    },
    promptRefinementTechniques: {
      title: "Prompt Refinement Techniques",
      description: "How to iterate and improve your prompts",
      content: [
        "After initial results, refine prompts by adding more specific constraints",
        "Use the CLEAR framework: Concise, Logical, Explicit, Adaptive, Reflective",
        "For code generation, specify exact function signatures and return types",
        "Include examples of expected inputs and outputs for better understanding",
        "When refactoring, explicitly mention what should NOT change",
      ],
      variant: "success",
    },
  } as const;

  const handleLearningPermission = async (allow: boolean) => {
    try {
      if (user) await updateUser({ allow_learning: allow });
      toast({
        title: allow ? "Learning enabled" : "Learning disabled",
        description: allow
          ? "We'll learn from your history to provide better suggestions."
          : "We won't use your history for learning.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating settings",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      try {
        localStorage.setItem(LEARNING_DIALOG_KEY, "1");
      } catch {
        /* no-op */
      }
      setShowLearningDialog(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen flex flex-col animate-in fade-in duration-500">
        <div className="container px-4 py-2">
          <div className="flex justify-between items-center mb-2">
            <Header activeTab={activeTab} setActiveTab={setActiveTab} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGuidelines(!showGuidelines)}
              className="flex items-center gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              {showGuidelines ? "Hide Guidelines" : "Prompt Guidelines"}
            </Button>
          </div>

          <Collapsible open={showGuidelines} onOpenChange={setShowGuidelines} className="mb-4">
            <CollapsibleContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 pb-6">
                <PromptGuidelineCard
                  title={guidelines.debuggingBestPractices.title}
                  description={guidelines.debuggingBestPractices.description}
                  content={[...guidelines.debuggingBestPractices.content]}
                  variant="debug"
                />
                <PromptGuidelineCard
                  title={guidelines.promptEngineeringGuidelines.title}
                  description={guidelines.promptEngineeringGuidelines.description}
                  content={[...guidelines.promptEngineeringGuidelines.content]}
                  variant="tip"
                />
                <PromptGuidelineCard
                  title={guidelines.debuggingWorkflows.title}
                  description={guidelines.debuggingWorkflows.description}
                  content={[...guidelines.debuggingWorkflows.content]}
                  variant="warning"
                />
                <PromptGuidelineCard
                  title={guidelines.promptRefinementTechniques.title}
                  description={guidelines.promptRefinementTechniques.description}
                  content={[...guidelines.promptRefinementTechniques.content]}
                  variant="success"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <main className="flex-1">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            {activeTab === "structured" && <StructuredPrompt />}
            {activeTab === "conversational" && <ConversationalPrompt />}
            {activeTab === "meta" && <MetaPrompt />}
          </div>
        </main>

        <Dialog open={showLearningDialog} onOpenChange={(open) => {
          if (!open) {
            try {
              localStorage.setItem(LEARNING_DIALOG_KEY, "1");
            } catch {
              /* no-op */
            }
          }
          setShowLearningDialog(open);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enhance Your Experience</DialogTitle>
              <DialogDescription>
                Would you like to enable learning from your prompt history? This helps us provide
                better suggestions based on your previous prompts.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2 py-4">
              <Switch
                id="learning-mode"
                checked={learningChoice}
                onCheckedChange={(checked) => setLearningChoice(checked)}
              />
              <Label htmlFor="learning-mode">Enable personalized suggestions</Label>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
              <Button type="button" variant="outline" onClick={() => handleLearningPermission(false)}>
                No thanks
              </Button>
              <Button type="button" onClick={() => handleLearningPermission(learningChoice)}>
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
