import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bookmark, Check, Clipboard, Filter, Heart, Search, SlidersHorizontal, Sparkles, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getAllPrompts, categoryOptions, type PromptRecord } from "@/lib/demo-data";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Seo from "@/components/Seo";

const filterOptions = ["All topics", "Software & product", "Marketing & content", "Research & analysis", "Operations", "Creative work"];

export default function CommunityPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All topics");
  const [sort, setSort] = useState<"popular" | "recent">("popular");
  const [liked, setLiked] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const prompts = useMemo(() => {
    const filtered = getAllPrompts().filter((prompt) => prompt.isPublic && (category === "All topics" || prompt.category === category) && (!query.trim() || `${prompt.title} ${prompt.description} ${prompt.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())));
    return [...filtered].sort((a, b) => sort === "popular" ? (b.likes + (liked.includes(b.id) ? 1 : 0)) - (a.likes + (liked.includes(a.id) ? 1 : 0)) : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [category, liked, query, sort]);

  const copyPrompt = async (prompt: PromptRecord) => {
    try {
      await navigator.clipboard.writeText(prompt.content || Object.values(prompt.sections).join("\n\n"));
      setCopied(prompt.id);
      toast.success("Prompt copied");
      window.setTimeout(() => setCopied(null), 1800);
    } catch { toast.error("Clipboard access is unavailable"); }
  };

  return (
    <div className="page-enter">
      <Seo title="Prompt library — Prompt-Gineer" description="Explore clear, reusable prompt systems shared by thoughtful builders." path="/community" />
      <section className="relative overflow-hidden rounded-[24px] bg-[#13213a] px-6 py-10 text-white shadow-xl sm:px-10 sm:py-14"><div className="hero-grid absolute inset-0 opacity-50" /><div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-[80px]" /><div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div className="max-w-2xl"><p className="eyebrow text-[#79edd0]">The public prompt library</p><h1 className="display-font mt-4 text-4xl font-semibold leading-[.98] tracking-tight sm:text-6xl">Borrow the structure.<br /><span className="text-[#79edd0]">Make it yours.</span></h1><p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">A curated library of prompt systems shared by people who care about the quality of the work on the other side.</p></div><div className="flex items-center gap-3 text-sm text-slate-300"><div className="flex -space-x-2">{["MC", "SO", "JB", "ER"].map((initials, index) => <span key={initials} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#13213a] bg-white/10 text-[0.65rem] font-bold text-white" style={{ opacity: 1 - index * .1 }}>{initials}</span>)}</div><span><strong className="text-white">2.4k+</strong> thoughtful starts</span></div></div></section>

      <section className="py-8"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="eyebrow">Explore the signal</p><h2 className="display-font mt-2 text-3xl font-semibold">Find a better starting point.</h2></div><Button asChild className="w-fit bg-accent text-accent-foreground hover:bg-accent/90"><Link to={user ? "/prompts/new" : "/auth"}><Sparkles className="h-4 w-4" /> Share a prompt</Link></Button></div><div className="mt-7 flex flex-col gap-3 xl:flex-row xl:items-center"><div className="relative max-w-xl flex-1"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search prompts, tags, or outcomes" className="h-11 rounded-xl bg-card pl-10" /></div><div className="flex flex-wrap items-center gap-2"><div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Filter className="h-3.5 w-3.5" /> Filter</div>{filterOptions.slice(0, 4).map((option) => <button type="button" key={option} onClick={() => setCategory(option)} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${category === option ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:border-accent/50 hover:text-foreground"}`}>{option.replace(" & product", "").replace(" & content", "")}</button>)}</div><div className="flex items-center gap-2 xl:ml-auto"><SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" /><select value={sort} onChange={(event) => setSort(event.target.value as "popular" | "recent")} className="h-10 rounded-xl border bg-card px-3 text-xs font-semibold text-foreground outline-none focus:border-accent"><option value="popular">Most loved</option><option value="recent">Most recent</option></select></div></div></section>

      {prompts.length === 0 ? <div className="surface rounded-2xl py-20 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary"><Search className="h-5 w-5 text-muted-foreground" /></div><h2 className="mt-5 text-lg font-bold">Nothing matches that search</h2><p className="mt-2 text-sm text-muted-foreground">Try another phrase or clear the filters to see the whole library.</p><Button onClick={() => { setQuery(""); setCategory("All topics"); }} variant="outline" className="mt-5">Clear filters</Button></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{prompts.map((prompt, index) => <article key={prompt.id} className={`surface surface-hover group flex h-full flex-col rounded-2xl p-5 ${index === 0 ? "md:col-span-2 xl:col-span-1" : ""}`}><div className="flex items-start justify-between gap-4"><Badge variant="outline" className="border-accent/20 bg-accent/5 text-[0.64rem] font-bold text-accent">{prompt.category}</Badge><button type="button" onClick={() => setLiked((current) => current.includes(prompt.id) ? current.filter((id) => id !== prompt.id) : [...current, prompt.id])} className={`rounded-lg p-1.5 transition ${liked.includes(prompt.id) ? "bg-rose-50 text-rose-500 dark:bg-rose-500/10" : "text-muted-foreground hover:bg-secondary hover:text-rose-500"}`} aria-label={liked.includes(prompt.id) ? "Unlike prompt" : "Like prompt"}><Heart className="h-4 w-4" fill={liked.includes(prompt.id) ? "currentColor" : "none"} /></button></div><Link to={`/community/prompt/${prompt.id}`} className="mt-5 block"><h3 className="text-xl font-bold tracking-tight group-hover:text-accent">{prompt.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{prompt.description}</p></Link><div className="mt-5 flex flex-wrap gap-1.5">{prompt.tags.map((tag) => <span key={tag} className="rounded-md bg-secondary px-2 py-1 text-[0.62rem] font-semibold text-muted-foreground">#{tag}</span>)}</div><div className="mt-auto flex items-center justify-between border-t pt-5"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-[0.62rem] font-bold text-primary-foreground">{prompt.authorInitials}</span><div><p className="text-xs font-bold">{prompt.author}</p><p className="text-[0.65rem] text-muted-foreground">{formatDistanceToNow(new Date(prompt.createdAt), { addSuffix: true })}</p></div></div><div className="flex items-center gap-2"><span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground"><Heart className="h-3.5 w-3.5" fill={liked.includes(prompt.id) ? "currentColor" : "none"} />{prompt.likes + (liked.includes(prompt.id) ? 1 : 0)}</span><button type="button" onClick={() => copyPrompt(prompt)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Copy prompt">{copied === prompt.id ? <Check className="h-3.5 w-3.5 text-accent" /> : <Clipboard className="h-3.5 w-3.5" />}</button></div></div></article>)}</div>}

      <section className="mt-12 rounded-2xl border border-dashed bg-card p-5 sm:flex sm:items-center sm:justify-between sm:p-6"><div className="flex items-start gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground"><Bookmark className="h-4 w-4" /></div><div><p className="font-bold">Have a system worth sharing?</p><p className="mt-1 text-sm text-muted-foreground">Give someone else a head start without giving away your thinking.</p></div></div><Link to={user ? "/prompts/new" : "/auth"} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-accent hover:text-accent/80 sm:mt-0">Share your prompt <ArrowRight className="h-4 w-4" /></Link></section>
    </div>
  );
}
