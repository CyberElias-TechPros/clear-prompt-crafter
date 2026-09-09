import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BarChart3, Clock3, FileText, Plus, Sparkles, TrendingUp, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PromptBuilder } from "@/components/prompt-generator";
import { getAllPrompts, type PromptRecord } from "@/lib/demo-data";
import { apiGet, apiPromptToRecord, isApiConfigured, type MeResponse, type PromptListResponse } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Seo from "@/components/Seo";

export default function DashboardPage() {
  const { user, isDemo } = useAuth();
  const [recentPrompts, setRecentPrompts] = useState<PromptRecord[]>(() => isApiConfigured ? [] : getAllPrompts().slice(0, 3));
  const [stats, setStats] = useState({ prompts: 12, publicPrompts: 6, points: 248 });
  const displayName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  useEffect(() => {
    if (!isApiConfigured) return;
    let active = true;
    void Promise.all([apiGet<PromptListResponse>("/me/prompts?limit=3"), apiGet<MeResponse>("/me")])
      .then(([promptResponse, meResponse]) => {
        if (!active) return;
        setRecentPrompts(promptResponse.prompts.map(apiPromptToRecord));
        setStats(meResponse.stats);
      })
      .catch(() => { /* The workspace remains usable; the API error is shown by the individual action. */ });
    return () => { active = false; };
  }, []);

  const metrics = useMemo(() => [
    { label: "Prompt systems", value: String(stats.prompts), delta: `${stats.publicPrompts} published`, icon: FileText, tone: "teal" },
    { label: "Clarity points", value: String(stats.points), delta: "Account activity", icon: TrendingUp, tone: "gold" },
    { label: "Public systems", value: String(stats.publicPrompts), delta: "Visible in library", icon: BarChart3, tone: "violet" },
  ], [stats]);

  const handleSaved = (prompt: PromptRecord) => setRecentPrompts((current) => [prompt, ...current.filter((item) => item.id !== prompt.id)].slice(0, 3));

  return (
    <div className="page-enter"><Seo title="Prompt studio — Prompt-Gineer" description="Build clear, reusable prompt systems in your Prompt-Gineer workspace." path="/dashboard" noindex />
      <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div><div className="mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-accent" /><span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{isDemo ? "Demo workspace" : "Your workspace"}</span></div><h1 className="display-font text-4xl font-semibold leading-none tracking-tight sm:text-5xl">Good morning, {displayName}.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">You have a clear runway today. Pick up a saved system or give a new idea somewhere to land.</p></div>
        <div className="flex items-center gap-2"><Button asChild variant="outline" size="sm"><Link to="/community"><Users className="h-4 w-4" /> Browse library</Link></Button><Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/prompts/new"><Plus className="h-4 w-4" /> New prompt</Link></Button></div>
      </div>

      <div className="mb-8 grid gap-3 md:grid-cols-3">{metrics.map((metric) => { const Icon = metric.icon; const tone = metric.tone === "teal" ? "text-accent bg-accent/10" : metric.tone === "gold" ? "text-[#b77b22] bg-[#b77b22]/10" : "text-[#6d62b1] bg-[#6d62b1]/10"; return <div key={metric.label} className="surface flex items-center justify-between rounded-2xl px-5 py-4"><div><p className="text-xs font-medium text-muted-foreground">{metric.label}</p><p className="mt-1 text-2xl font-bold tracking-tight">{metric.value}</p><p className="mt-1 text-[0.68rem] font-semibold text-accent">{metric.delta}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></div></div>; })}</div>

      <div className="mb-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0"><PromptBuilder compact onSaved={handleSaved} /></div>
        <aside className="space-y-4 xl:pt-[72px]">
          <div className="surface rounded-2xl p-5"><div className="mb-4 flex items-center justify-between"><div><p className="eyebrow">Recent drafts</p><h2 className="mt-1 text-lg font-bold">Pick up where you left off</h2></div><Clock3 className="h-4 w-4 text-muted-foreground" /></div><div className="space-y-1">{recentPrompts.map((prompt) => <Link key={prompt.id} to={`/community/prompt/${prompt.id}`} className="group flex items-start gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-secondary"><div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent"><FileText className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{prompt.title}</p><p className="mt-1 text-[0.68rem] text-muted-foreground">{formatDistanceToNow(new Date(prompt.updatedAt), { addSuffix: true })} · {prompt.category}</p></div></Link>)}</div><Link to="/profile" className="mt-3 flex items-center justify-between border-t pt-3 text-xs font-bold text-accent hover:text-accent/80">View your library <ArrowUpRight className="h-3.5 w-3.5" /></Link></div>
          <div className="rounded-2xl bg-[#e8f5f1] p-5 dark:bg-accent/10"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Sparkles className="h-4 w-4" /></div><p className="text-sm font-bold">One useful nudge</p><p className="mt-2 text-xs leading-5 text-slate-600 dark:text-muted-foreground">The best prompt you can write today may be the one that makes an assumption visible.</p><Badge className="mt-4 border-0 bg-white/70 text-[0.64rem] text-accent hover:bg-white/70 dark:bg-white/10">CLEAR / reflective</Badge></div>
        </aside>
      </div>
    </div>
  );
}
