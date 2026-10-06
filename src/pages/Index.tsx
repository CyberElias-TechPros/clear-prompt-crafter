import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/MainLayout";
import Header from "@/components/prompt-generator/Header";
import StructuredPrompt from "@/components/prompt-generator/StructuredPrompt";
import ConversationalPrompt from "@/components/prompt-generator/ConversationalPrompt";
import MetaPrompt from "@/components/prompt-generator/MetaPrompt";
import PromptGuidelineCard from "@/components/prompt-guidelines/PromptGuidelineCard";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { BookOpenText, Check, LockKeyhole, Sparkles } from "lucide-react";

const LEARNING_NOTICE_KEY = "pg_learning_dialog_shown";

const guidelines = [
  {
    title: "Start with context",
    description: "Give the model the background it needs before the request.",
    content: [
      "Name the audience, product, role, or environment.",
      "Include the context that changes the answer.",
      "Leave out details that do not affect the outcome.",
    ],
    variant: "tip" as const,
  },
  {
    title: "Make the outcome specific",
    description: "Describe a result someone can actually review.",
    content: [
      "Use concrete verbs and define the expected output.",
      "Mention important formats, examples, or success criteria.",
      "Break a complex request into clear steps.",
    ],
    variant: "success" as const,
  },
  {
    title: "Add useful guardrails",
    description: "Clarify the boundaries without over-constraining the answer.",
    content: [
      "Call out hard limits and things to avoid.",
      "Include edge cases only when they matter.",
      "Ask for assumptions to be surfaced when details are missing.",
    ],
    variant: "warning" as const,
  },
  {
    title: "Iterate with intent",
    description: "Treat the first answer as a draft you can improve.",
    content: [
      "Review what is useful and what is missing.",
      "Change one part of your instruction at a time.",
      "Reuse the parts that consistently improve the result.",
    ],
    variant: "debug" as const,
  },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState("structured");
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showLearningNotice, setShowLearningNotice] = useState(() => {
    try {
      return !localStorage.getItem(LEARNING_NOTICE_KEY);
    } catch {
      return false;
    }
  });
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.allow_learning) setShowLearningNotice(false);
  }, [user?.allow_learning]);

  const handleLearningPermission = async (allow: boolean) => {
    try {
      if (user) await updateUser({ allow_learning: allow });
      toast({
        title: allow ? "Personalization enabled" : "Your history stays private",
        description: allow
          ? "We'll use your prompt history to personalize suggestions."
          : "Your prompt history won't be used for personalized suggestions.",
      });
    } catch (error: unknown) {
      toast({
        title: "Couldn't update this setting",
        description: error instanceof Error ? error.message : "Please try again in Settings.",
        variant: "destructive",
      });
    } finally {
      try {
        localStorage.setItem(LEARNING_NOTICE_KEY, "1");
      } catch {
        // Storage can be unavailable in private browsing; the preference still saves to the account.
      }
      setShowLearningNotice(false);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto w-full max-w-[1280px] animate-in fade-in duration-300">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          actions={(
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGuidelines((visible) => !visible)}
              aria-expanded={showGuidelines}
              className="h-9 rounded-xl border-border bg-card px-3 text-[11px] font-semibold text-[#555667] shadow-sm hover:border-[#d0caf6] hover:bg-[#f8f7ff] hover:text-[#5142bf] dark:text-[#dedcf2] dark:hover:bg-[#28263d] dark:hover:text-[#c7c1ff]"
            >
              <BookOpenText className="mr-1.5 h-3.5 w-3.5" />
              {showGuidelines ? "Hide guide" : "Prompt guide"}
            </Button>
          )}
        />

        <Collapsible open={showGuidelines} onOpenChange={setShowGuidelines}>
          <CollapsibleContent className="animate-in slide-in-from-top-2 duration-200">
            <div className="mt-5 rounded-2xl border border-[#e5e2f5] bg-[#f5f4ff] p-4 dark:border-[#34324d] dark:bg-[#222137] sm:p-5">
              <div className="mb-4 flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#6554dc] shadow-sm dark:bg-[#302c4a] dark:text-[#c4bdff]"><Sparkles className="h-4 w-4" /></span>
                <div>
                  <p className="text-sm font-semibold">A few principles to keep close</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Use the framework as a guide, not a form you have to fill perfectly.</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {guidelines.map((guideline) => (
                  <PromptGuidelineCard
                    key={guideline.title}
                    title={guideline.title}
                    description={guideline.description}
                    content={guideline.content}
                    variant={guideline.variant}
                  />
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {showLearningNotice && !user?.allow_learning && (
          <aside className="mt-5 flex flex-col gap-4 rounded-2xl border border-[#e6e4f0] bg-white/75 p-4 shadow-[0_5px_18px_rgba(35,35,50,0.025)] dark:border-border dark:bg-card sm:flex-row sm:items-center sm:justify-between sm:p-4.5" aria-label="Personalization choices">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2f0ff] text-[#6554dc] dark:bg-[#302c4a] dark:text-[#c4bdff]"><LockKeyhole className="h-4 w-4" /></span>
              <div>
                <p className="text-xs font-semibold">Your prompts are private by default</p>
                <p className="mt-1 max-w-[580px] text-[11px] leading-5 text-muted-foreground">Choose whether your prompt history can be used to personalize suggestions. Change this any time in Settings.</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
              <Button variant="ghost" size="sm" onClick={() => void handleLearningPermission(false)} className="h-9 rounded-xl px-3 text-[11px] text-muted-foreground">Keep private</Button>
              <Button size="sm" onClick={() => void handleLearningPermission(true)} className="h-9 rounded-xl px-3 text-[11px]"><Check className="mr-1 h-3 w-3" />Allow personalization</Button>
            </div>
          </aside>
        )}

        <main className="mt-6">
          <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-200">
            {activeTab === "structured" && <StructuredPrompt />}
            {activeTab === "conversational" && <ConversationalPrompt />}
            {activeTab === "meta" && <MetaPrompt />}
          </div>
        </main>
      </div>
    </MainLayout>
  );
};

export default Index;
