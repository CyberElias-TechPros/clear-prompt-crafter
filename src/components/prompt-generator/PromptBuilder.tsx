import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clipboard,
  FileText,
  Gauge,
  Lightbulb,
  MessageCircle,
  RotateCcw,
  Save,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  composePrompt,
  createPromptId,
  emptySections,
  savePrompt,
  type PromptMode,
  type PromptRecord,
  type PromptSections,
} from "@/lib/demo-data";

interface PromptBuilderProps {
  compact?: boolean;
  onSaved?: (prompt: PromptRecord) => void;
}

type SectionKey = keyof PromptSections;

const sectionMeta: Array<{ key: SectionKey; label: string; kicker: string; hint: string; placeholder: string; icon: React.ElementType; accent: string }> = [
  { key: "role", label: "Role", kicker: "01 / point of view", hint: "Who should the model be?", placeholder: "You are a senior product designer who...", icon: WandSparkles, accent: "#1f9883" },
  { key: "objective", label: "Objective", kicker: "02 / the job", hint: "What should happen?", placeholder: "Create a clear, practical plan for...", icon: CheckCircle2, accent: "#c0832c" },
  { key: "context", label: "Context", kicker: "03 / useful signal", hint: "What does it need to know?", placeholder: "The audience, current state, or background that changes the answer...", icon: FileText, accent: "#4675aa" },
  { key: "guidelines", label: "Guidelines", kicker: "04 / quality bar", hint: "How should it think or work?", placeholder: "Be specific, surface tradeoffs, and explain the reasoning behind...", icon: Lightbulb, accent: "#aa6b8c" },
  { key: "constraints", label: "Constraints", kicker: "05 / boundaries", hint: "What must it avoid?", placeholder: "Do not invent data. Keep the answer under...", icon: Gauge, accent: "#bd5e55" },
  { key: "output", label: "Output format", kicker: "06 / the handoff", hint: "What should the result look like?", placeholder: "Return a concise summary, then a table with...", icon: Clipboard, accent: "#6459a7" },
];

const starterSections: PromptSections = {
  role: "You are a strategic partner who makes complex work clear and actionable.",
  objective: "Turn the input into a focused plan with a useful first step.",
  context: "The audience is busy and needs the important signal before the detail. Call out unknowns rather than filling gaps with assumptions.",
  guidelines: "Use plain language, organize the thinking, surface tradeoffs, and make recommendations easy to act on.",
  constraints: "Do not invent facts. Avoid generic advice. Keep the response practical and specific to the context provided.",
  output: "Return an executive summary, recommended approach, risks to watch, and the next three actions.",
};

const modeOptions: Array<{ value: PromptMode; label: string; description: string; icon: React.ElementType }> = [
  { value: "structured", label: "Structured", description: "Build from six useful signals", icon: WandSparkles },
  { value: "conversational", label: "Conversational", description: "Think it through out loud", icon: MessageCircle },
  { value: "meta", label: "Refine a draft", description: "Stress-test what you have", icon: Sparkles },
];

function scoreSections(sections: PromptSections) {
  const filled = Object.values(sections).filter((value) => value.trim()).length;
  const words = Object.values(sections).join(" ").trim().split(/\s+/).filter(Boolean).length;
  return { filled, words, score: Math.min(99, Math.round((filled / 6) * 58 + Math.min(words / 170, 1) * 42)) };
}

export default function PromptBuilder({ compact = false, onSaved }: PromptBuilderProps) {
  const [mode, setMode] = useState<PromptMode>("structured");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sections, setSections] = useState<PromptSections>(starterSections);
  const [roughDraft, setRoughDraft] = useState("");
  const [conversationInput, setConversationInput] = useState("");
  const [conversation, setConversation] = useState<Array<{ from: "you" | "studio"; text: string }>>([
    { from: "studio", text: "Tell me what you want to make. I’ll help you find the role, outcome, and guardrails hiding inside the idea." },
  ]);
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  const { filled, words, score } = useMemo(() => scoreSections(sections), [sections]);
  const prompt = useMemo(() => composePrompt(sections), [sections]);

  const updateSection = (key: SectionKey, value: string) => setSections((current) => ({ ...current, [key]: value }));

  const handleCopy = async () => {
    if (!prompt) {
      toast.error("Add a little more signal before copying.");
      return;
    }
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Prompt copied to clipboard");
    } catch {
      toast.error("Clipboard access is unavailable. Select the preview and copy it manually.");
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Give this prompt a working title first.");
      return;
    }
    if (!sections.objective.trim()) {
      toast.error("Add an objective so the prompt has a clear job to do.");
      return;
    }
    const now = new Date().toISOString();
    const saved: PromptRecord = {
      id: createPromptId(),
      title: title.trim(),
      description: description.trim() || "A prompt system built in Prompt-Gineer.",
      mode,
      sections,
      content: prompt,
      category: "Software & product",
      tags: [mode, "clear prompting"],
      author: "Alex Morgan",
      authorInitials: "AM",
      isPublic: false,
      likes: 0,
      views: 0,
      createdAt: now,
      updatedAt: now,
    };
    savePrompt(saved);
    onSaved?.(saved);
    toast.success("Prompt saved to your library");
  };

  const reset = () => {
    setTitle("");
    setDescription("");
    setSections(emptySections);
    setRoughDraft("");
    setIsAnalyzed(false);
    toast("New blank draft ready");
  };

  const analyzeDraft = () => {
    const input = roughDraft.trim();
    if (!input) {
      toast.error("Paste or write a rough prompt first.");
      return;
    }
    const hasQuestion = /\?|\b(create|write|analyze|design|review|build|summarize)\b/i.test(input);
    const nextSections: PromptSections = {
      ...sections,
      objective: hasQuestion ? input : `Help me turn this into a useful outcome: ${input}`,
      context: sections.context || "The original draft is intentionally rough. Preserve its intent while making assumptions visible.",
      guidelines: sections.guidelines || "Separate what is known from what is inferred. Prefer concrete language over filler.",
      constraints: sections.constraints || "Do not add requirements that are not supported by the draft.",
      output: sections.output || "Return a refined prompt, followed by a short list of assumptions and open questions.",
    };
    setSections(nextSections);
    setIsAnalyzed(true);
    toast.success("Draft mapped into the CLEAR framework");
  };

  const sendConversation = () => {
    const input = conversationInput.trim();
    if (!input) return;
    setConversation((current) => [...current, { from: "you", text: input }]);
    setConversationInput("");
    const next = {
      ...sections,
      objective: sections.objective || input,
      context: sections.context || `The request starts with: “${input}”`,
      output: sections.output || "Return a practical answer with a concise summary and clear next steps.",
    };
    setSections(next);
    window.setTimeout(() => setConversation((current) => [...current, { from: "studio", text: "That gives us a useful center of gravity. I’ve placed it in the draft — add the audience or any boundaries you care about next." }]), 180);
  };

  return (
    <div className={compact ? "" : "page-enter"}>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="eyebrow">Prompt studio / draft {score}% clear</p><h1 className="display-font mt-2 text-4xl font-semibold leading-none tracking-tight sm:text-5xl">Make the ask make sense.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Start with intent. Prompt-Gineer gives it just enough structure to travel well between people, models, and moments.</p></div>
        <div className="flex items-center gap-2"><Button onClick={reset} variant="outline" size="sm"><RotateCcw className="h-3.5 w-3.5" /> Reset</Button><Button onClick={handleSave} size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Save className="h-3.5 w-3.5" /> Save prompt</Button></div>
      </div>

      <div className="mb-5 grid gap-2 rounded-2xl border bg-card p-2 sm:grid-cols-3">
        {modeOptions.map((option) => { const Icon = option.icon; return <button type="button" key={option.value} onClick={() => setMode(option.value)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${mode === option.value ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${mode === option.value ? "bg-white/10" : "bg-secondary"}`}><Icon className="h-4 w-4" /></span><span><span className="block text-sm font-bold">{option.label}</span><span className={`mt-0.5 block text-[0.68rem] ${mode === option.value ? "text-primary-foreground/65" : "text-muted-foreground"}`}>{option.description}</span></span></button>; })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,.92fr)]">
        <section className="surface overflow-hidden rounded-2xl">
          <div className="border-b bg-secondary/30 px-5 py-4 sm:px-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold">The thinking layer</p><p className="mt-1 text-xs text-muted-foreground">Good prompts are designed, not discovered by accident.</p></div><div className="flex items-center gap-2"><Badge variant="outline" className="border-accent/30 bg-accent/5 text-accent"><span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-accent" /> {filled}/6 sections</Badge><span className="text-xs text-muted-foreground">{words} words</span></div></div></div>
          <div className="p-5 sm:p-6">
            <div className="mb-6 grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Working title <span className="text-accent">*</span></span><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Launch brief copilot" className="h-11 rounded-xl bg-background" /></label><label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">One-line intent</span><Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What will this help you do?" className="h-11 rounded-xl bg-background" /></label></div>

            {mode === "structured" && <div className="grid gap-4 sm:grid-cols-2">{sectionMeta.map((section) => { const Icon = section.icon; return <label key={section.key} className="group block rounded-2xl border bg-background/60 p-4 transition-colors focus-within:border-accent/60"><div className="mb-3 flex items-start justify-between"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${section.accent}14`, color: section.accent }}><Icon className="h-4 w-4" /></span><span><span className="block text-sm font-bold">{section.label}</span><span className="block text-[0.65rem] text-muted-foreground">{section.kicker}</span></span></div>{sections[section.key].trim() && <Check className="mt-1 h-4 w-4 text-accent" />}</div><p className="mb-2 text-xs font-medium text-muted-foreground">{section.hint}</p><Textarea value={sections[section.key]} onChange={(event) => updateSection(section.key, event.target.value)} placeholder={section.placeholder} className="min-h-[104px] resize-y rounded-xl border-border/80 bg-card text-sm leading-6 shadow-none focus-visible:ring-accent" /></label>; })}</div>}

            {mode === "meta" && <div className="space-y-5"><div className="rounded-2xl border border-accent/20 bg-accent/5 p-4"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Sparkles className="h-4 w-4" /></div><div><p className="text-sm font-bold">Refine the draft, keep the intent</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Paste the prompt as it exists today. The studio will map its signal into a clearer structure without pretending to know more than you wrote.</p></div></div></div><Textarea value={roughDraft} onChange={(event) => setRoughDraft(event.target.value)} placeholder="I need an AI assistant to help my team..." className="min-h-[180px] rounded-2xl bg-background text-sm leading-6" /><Button onClick={analyzeDraft} className="bg-accent text-accent-foreground hover:bg-accent/90"><Sparkles className="h-4 w-4" /> {isAnalyzed ? "Re-analyze draft" : "Map into CLEAR"}</Button>{isAnalyzed && <div className="grid gap-3 rounded-2xl border bg-secondary/30 p-4 text-sm sm:grid-cols-3"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">Signal found</p><p className="mt-1 font-semibold">{words} words in frame</p></div><div><p className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">Gaps to review</p><p className="mt-1 font-semibold">Audience + evidence</p></div><div><p className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">Next move</p><p className="mt-1 font-semibold">Read the preview</p></div></div>}</div>}

            {mode === "conversational" && <div className="flex min-h-[460px] flex-col rounded-2xl border bg-background/60 p-4"><div className="mb-4 flex items-center gap-2 border-b pb-3"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground"><MessageCircle className="h-4 w-4" /></div><div><p className="text-sm font-bold">Draft assistant</p><p className="text-xs text-muted-foreground">A guided conversation, not a magic black box.</p></div></div><div className="flex-1 space-y-3 overflow-y-auto pr-1">{conversation.map((message, index) => <div key={`${message.from}-${index}`} className={`flex ${message.from === "you" ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.from === "you" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-secondary text-foreground"}`}>{message.text}</div></div>)}</div><div className="mt-4 flex gap-2"><Input value={conversationInput} onChange={(event) => setConversationInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") sendConversation(); }} placeholder="I want to create..." className="h-11 rounded-xl bg-card" /><Button onClick={sendConversation} size="icon" className="h-11 w-11 shrink-0 bg-accent text-accent-foreground hover:bg-accent/90"><ArrowRight className="h-4 w-4" /><span className="sr-only">Send message</span></Button></div></div>}
          </div>
        </section>

        <aside className="min-w-0"><div className="sticky top-[96px] overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-xl"><div className="blueprint-grid relative border-b border-white/10 px-5 py-5 sm:px-6"><div className="absolute right-5 top-4 h-16 w-16 rounded-full bg-accent/20 blur-2xl" /><div className="relative flex items-center justify-between"><div><p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-accent">Live preview</p><h2 className="display-font mt-1 text-2xl font-semibold">Your prompt system</h2></div><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10"><FileText className="h-4 w-4 text-accent" /></div></div><div className="relative mt-4 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${Math.max(score, 4)}%` }} /></div><span className="text-xs font-bold text-accent">{score}%</span></div></div><div className="max-h-[540px] overflow-y-auto p-5 sm:p-6"><div className="min-h-[300px] rounded-2xl border border-white/10 bg-white/[.055] p-4 font-mono text-[0.72rem] leading-6 text-slate-300 sm:p-5">{prompt ? prompt.split("\n\n").map((block, index) => { const [label, ...body] = block.split("\n"); return <div key={`${label}-${index}`} className="mb-5 last:mb-0"><p className="mb-1 text-[0.62rem] font-bold tracking-[0.14em] text-accent">{label}</p><p className="whitespace-pre-wrap">{body.join("\n")}</p></div>; }) : <div className="flex min-h-[280px] flex-col items-center justify-center text-center text-slate-500"><FileText className="mb-3 h-7 w-7" /><p className="font-sans text-sm font-semibold">Your words will land here.</p><p className="mt-1 max-w-[210px] font-sans text-xs leading-5">Fill the thinking layer and watch the prompt take shape.</p></div>}</div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><Button onClick={handleCopy} variant="outline" className="flex-1 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Clipboard className="h-4 w-4" /> Copy prompt</Button><Button onClick={handleSave} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"><Save className="h-4 w-4" /> Save to library</Button></div><div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-slate-400"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#55e0bd]/15 text-[#79edd0]"><Check className="h-3 w-3" /></span> Nothing is sent anywhere in this demo workspace.</div></div></div><div className="mt-4 rounded-2xl border border-dashed bg-card p-4"><div className="flex items-start gap-3"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#c0832c]" /><div><p className="text-sm font-bold">A small prompt heuristic</p><p className="mt-1 text-xs leading-5 text-muted-foreground">If the result could apply to anyone, add one detail about your audience, environment, or definition of done.</p></div></div></div></aside>
      </div>
    </div>
  );
}
