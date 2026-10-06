import React, { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Check,
  CircleDot,
  LockKeyhole,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
} from "lucide-react";
import PromptPreview from "./PromptPreview";
import type { PromptSectionDraft } from "./types";

interface StructuredPromptProps {
  onPromptDataChange?: (sections: PromptSectionDraft[]) => void;
}

const sections = [
  {
    id: "context",
    title: "Context",
    description: "Set the scene. What should the AI know about the project, role, or audience?",
    placeholder: "You are a product designer helping a small team build a clear, accessible onboarding flow...",
    icon: CircleDot,
  },
  {
    id: "task",
    title: "Task",
    description: "Name the outcome you need. Be specific about what a good answer should do.",
    placeholder: "Outline the first-run experience, including the key screens and the information each one should collect...",
    icon: Target,
  },
  {
    id: "guidelines",
    title: "Guidelines",
    description: "Add tone, tools, format, examples, or any preferred way of working.",
    placeholder: "Keep the copy warm and concise. Use plain language, accessible labels, and one clear action per screen...",
    icon: SlidersHorizontal,
  },
  {
    id: "constraints",
    title: "Constraints",
    description: "Set guardrails. What must stay true, or what should the AI avoid?",
    placeholder: "Avoid dark patterns, do not ask for unnecessary personal information, and keep the flow under five steps...",
    icon: ShieldCheck,
  },
];

const optionalSections = [
  {
    id: "errorHandling",
    title: "Edge cases",
    description: "Consider unusual inputs, errors, and recovery states.",
    placeholder: "If a user skips a step or loses connection, explain what should happen next...",
    icon: Sparkles,
  },
  {
    id: "security",
    title: "Security & privacy",
    description: "Include privacy, data handling, or security requirements.",
    placeholder: "Collect only the information required and explain how it will be used...",
    icon: LockKeyhole,
  },
  {
    id: "performance",
    title: "Quality checks",
    description: "Describe how the result should be checked or measured.",
    placeholder: "Include acceptance criteria and a short checklist for accessibility and mobile layouts...",
    icon: Check,
  },
];

const StructuredPrompt: React.FC<StructuredPromptProps> = ({ onPromptDataChange }) => {
  const [promptSections, setPromptSections] = useState<Record<string, string>>(
    Object.fromEntries(sections.map((section) => [section.id, ""]))
  );
  const [additionalSections, setAdditionalSections] = useState<string[]>([]);

  const handleSectionChange = (sectionId: string, content: string) => {
    setPromptSections((previous) => ({ ...previous, [sectionId]: content }));
  };

  const addSection = (sectionId: string) => {
    if (additionalSections.includes(sectionId)) return;
    setAdditionalSections((previous) => [...previous, sectionId]);
    setPromptSections((previous) => ({ ...previous, [sectionId]: "" }));
  };

  const generateFullPrompt = () => {
    const promptParts = [
      ...sections.map((section) => ({ title: section.title, content: promptSections[section.id] })),
      ...additionalSections.map((sectionId) => {
        const section = optionalSections.find((item) => item.id === sectionId);
        return { title: section?.title ?? sectionId, content: promptSections[sectionId] };
      }),
    ];

    return promptParts
      .filter((section) => section.content?.trim())
      .map((section) => `**${section.title}:** ${section.content.trim()}`)
      .join("\n\n");
  };

  useEffect(() => {
    if (!onPromptDataChange) return;
    const sectionsData = [
      ...sections
        .filter((section) => promptSections[section.id]?.trim())
        .map((section) => ({ type: section.id, content: promptSections[section.id] })),
      ...additionalSections
        .filter((sectionId) => promptSections[sectionId]?.trim())
        .map((sectionId) => ({ type: sectionId, content: promptSections[sectionId] })),
    ];
    onPromptDataChange(sectionsData);
  }, [promptSections, additionalSections, onPromptDataChange]);

  const completedCount = sections.filter((section) => promptSections[section.id]?.trim()).length;
  const isPromptComplete = completedCount === sections.length;
  const progress = Math.round((completedCount / sections.length) * 100);

  const copyToClipboard = () => {
    void navigator.clipboard
      .writeText(generateFullPrompt())
      .then(() => toast.success("Prompt copied to clipboard"))
      .catch(() => toast.error("Couldn't access the clipboard. Please copy the preview manually."));
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:items-start">
      <div className="space-y-5">
        <div className="rounded-2xl border border-border/80 bg-white/80 p-4 shadow-[0_5px_20px_rgba(30,30,48,0.025)] dark:bg-card sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-[-0.02em]">Build your brief</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Four essentials make a strong starting point. Fill in what you know; refine as you go.</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#f2f1f7] px-2.5 py-1 text-[10px] font-semibold text-[#737382] dark:bg-[#2a293e] dark:text-[#c4c2d4]">{completedCount} of {sections.length}</span>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#edecf2] dark:bg-[#2a2a3b]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#7668e9] to-[#8a7ef0] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="space-y-3">
          {sections.map((section, index) => {
            const Icon = section.icon;
            const isFilled = Boolean(promptSections[section.id]?.trim());
            return (
              <section key={section.id} className="rounded-2xl border border-border/80 bg-card p-4 shadow-[0_5px_20px_rgba(30,30,48,0.025)] transition-colors focus-within:border-[#c9c2f4] sm:p-5">
                <div className="mb-3 flex items-start gap-3">
                  <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isFilled ? "bg-[#efedff] text-[#6455d5] dark:bg-[#302c4a] dark:text-[#c4bdff]" : "bg-[#f3f3f6] text-[#7e7f8c] dark:bg-[#2a2a3b] dark:text-[#b9b8c9]"}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#9a9ba8]">0{index + 1}</span>
                      <h2 className="text-sm font-semibold tracking-[-0.02em]">{section.title}</h2>
                      {isFilled && <Check className="ml-auto h-3.5 w-3.5 text-[#6859d5]" aria-label="Complete" />}
                    </div>
                    <p className="mt-1 text-[11px] leading-[1.55] text-muted-foreground">{section.description}</p>
                  </div>
                </div>
                <Textarea
                  aria-label={section.title}
                  placeholder={section.placeholder}
                  className="min-h-[100px] resize-y rounded-xl border-[#e7e7ed] bg-[#fbfbfc] px-3.5 py-3 text-[13px] leading-6 placeholder:text-[#a4a5b0] focus-visible:border-[#a9a0ef] focus-visible:ring-[#dcd8fb] dark:border-border dark:bg-[#191a2a] dark:placeholder:text-white/35 sm:min-h-[112px]"
                  value={promptSections[section.id]}
                  onChange={(event) => handleSectionChange(section.id, event.target.value)}
                />
              </section>
            );
          })}
        </div>

        <div className="rounded-2xl border border-dashed border-[#d8d7e2] bg-white/45 p-4 dark:border-border dark:bg-card/60 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#777887] shadow-sm dark:bg-[#292a3e] dark:text-white/70"><Plus className="h-4 w-4" /></span>
            <div>
              <p className="text-sm font-semibold">Add more detail, if it helps</p>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">Optional sections are here when the brief needs another layer.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {optionalSections
              .filter((section) => !additionalSections.includes(section.id))
              .map((section) => {
                const Icon = section.icon;
                return (
                  <Button
                    key={section.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-xl border-[#e1e0e8] bg-white px-3 text-[11px] font-medium text-[#575866] hover:border-[#ccc6f4] hover:bg-[#f7f6ff] hover:text-[#5142bf] dark:border-border dark:bg-[#242538] dark:text-[#d3d1e2] dark:hover:bg-[#302c4a] dark:hover:text-[#c7c1ff]"
                    onClick={() => addSection(section.id)}
                  >
                    <Icon className="mr-1.5 h-3.5 w-3.5" />
                    {section.title}
                    <Plus className="ml-1 h-3 w-3 opacity-55" />
                  </Button>
                );
              })}
          </div>
        </div>

        {additionalSections.map((sectionId) => {
          const section = optionalSections.find((item) => item.id === sectionId);
          if (!section) return null;
          const Icon = section.icon;
          return (
            <section key={section.id} className="rounded-2xl border border-border/80 bg-card p-4 shadow-[0_5px_20px_rgba(30,30,48,0.025)] sm:p-5">
              <div className="mb-3 flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1efff] text-[#6554dc]"><Icon className="h-4 w-4" /></span>
                <div>
                  <h2 className="text-sm font-semibold tracking-[-0.02em]">{section.title}</h2>
                  <p className="mt-1 text-[11px] leading-[1.55] text-muted-foreground">{section.description}</p>
                </div>
              </div>
              <Textarea
                aria-label={section.title}
                placeholder={section.placeholder}
                className="min-h-[100px] resize-y rounded-xl border-[#e7e7ed] bg-[#fbfbfc] px-3.5 py-3 text-[13px] leading-6 placeholder:text-[#a4a5b0] focus-visible:border-[#a9a0ef] focus-visible:ring-[#dcd8fb] dark:border-border dark:bg-[#191a2a] dark:placeholder:text-white/35"
                value={promptSections[section.id] ?? ""}
                onChange={(event) => handleSectionChange(section.id, event.target.value)}
              />
            </section>
          );
        })}
      </div>

      <div className="xl:sticky xl:top-[90px]">
        <PromptPreview prompt={generateFullPrompt()} isComplete={isPromptComplete} onCopy={copyToClipboard} />
      </div>
    </div>
  );
};

export default StructuredPrompt;
