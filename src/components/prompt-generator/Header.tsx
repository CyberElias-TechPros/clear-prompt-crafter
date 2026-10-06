import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, MessageSquare, Sparkles } from "lucide-react";

const modes = [
  { value: "structured", label: "Structured", hint: "Build section by section", icon: FileText },
  { value: "conversational", label: "Conversational", hint: "Think it through together", icon: MessageSquare },
  { value: "meta", label: "Refine a prompt", hint: "Review with CLEAR", icon: Sparkles },
];

const Header = ({
  activeTab,
  setActiveTab,
  actions,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  actions?: React.ReactNode;
}) => (
  <section className="workspace-heading">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className="eyebrow">Your workspace</span>
          <span className="h-1 w-1 rounded-full bg-[#aaa6c9]" />
          <span className="text-[11px] font-medium text-muted-foreground">Prompt studio</span>
        </div>
        <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.055em] text-foreground sm:text-[36px]">Prompt workspace</h1>
        <p className="mt-2 max-w-[580px] text-sm leading-6 text-muted-foreground sm:text-[15px]">
          Shape an idea into a clear brief your AI can actually work with.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
        {actions}
        <Badge variant="outline" className="hidden h-8 gap-1.5 rounded-full border-[#e4e1f5] bg-white/70 px-3 text-[10px] font-semibold text-[#5f50ca] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#c5beff] sm:inline-flex">
          <Sparkles className="h-3 w-3" /> Built for clarity
        </Badge>
      </div>
    </div>

    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-7 w-full">
      <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-2xl border border-border/80 bg-[#f0f0f4] p-1.5 dark:bg-[#191a2a] sm:max-w-[690px]">
        {modes.map(({ value, label, hint, icon: Icon }) => (
          <TabsTrigger
            key={value}
            value={value}
            className="group h-auto min-h-[62px] justify-start gap-2.5 rounded-xl px-2.5 py-2 text-left text-muted-foreground shadow-none transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-[0_2px_7px_rgba(28,28,44,0.08)] dark:data-[state=active]:bg-[#2a293e] sm:gap-3 sm:px-4"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/80 text-[#777887] transition-colors group-data-[state=active]:bg-[#f0efff] group-data-[state=active]:text-[#6554dc] dark:bg-white/[0.05] dark:text-white/55 group-data-[state=active]:dark:bg-[#34304f] group-data-[state=active]:dark:text-[#c7c1ff]">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[11px] font-semibold sm:text-xs">{label}</span>
              <span className="mt-0.5 hidden text-[10px] font-normal text-muted-foreground sm:block">{hint}</span>
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  </section>
);

export default Header;
