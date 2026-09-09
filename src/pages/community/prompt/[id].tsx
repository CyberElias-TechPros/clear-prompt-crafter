import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Clipboard, Copy, ExternalLink, Heart, Lock, PenLine, Share2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPromptById, composePrompt } from "@/lib/demo-data";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function PromptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const prompt = useMemo(() => id ? getPromptById(id) : undefined, [id]);
  const canViewPrivatePrompt = Boolean(prompt?.isPublic || (user && prompt?.author === (user.user_metadata?.full_name || "Alex Morgan")));
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt.content || composePrompt(prompt.sections));
      setCopied(true);
      toast.success("Prompt copied to clipboard");
      window.setTimeout(() => setCopied(false), 1800);
    } catch { toast.error("Clipboard access is unavailable"); }
  };

  if (!prompt || !canViewPrivatePrompt) return <div className="py-24 text-center"><p className="eyebrow">404 / prompt not found</p><h1 className="display-font mt-3 text-4xl font-semibold">That prompt moved on.</h1><Button asChild className="mt-6"><Link to="/community"><ArrowLeft className="h-4 w-4" /> Back to library</Link></Button></div>;

  const blocks = Object.entries(prompt.sections).filter(([, value]) => value.trim());
  return (
    <div className="page-enter mx-auto max-w-6xl">
      <Link to="/community" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to community library</Link>
      <div className="grid gap-7 lg:grid-cols-[.82fr_1.18fr]">
        <section><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="border-accent/30 bg-accent/5 text-accent">{prompt.category}</Badge>{prompt.isPublic ? <Badge variant="outline">Community prompt</Badge> : <Badge variant="outline"><Lock className="mr-1 h-3 w-3" /> Private</Badge>}</div><h1 className="display-font mt-5 text-5xl font-semibold leading-[.97] tracking-tight sm:text-6xl">{prompt.title}</h1><p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">{prompt.description}</p><div className="mt-8 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground">{prompt.authorInitials}</span><div><p className="text-sm font-bold">{prompt.author}</p><p className="text-xs text-muted-foreground">Published {format(new Date(prompt.createdAt), "MMM d, yyyy")}</p></div></div><div className="mt-8 flex flex-wrap gap-2">{prompt.tags.map((tag) => <span key={tag} className="rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">#{tag}</span>)}</div><div className="mt-9 flex flex-wrap gap-2"><Button onClick={copy} className="bg-accent text-accent-foreground hover:bg-accent/90">{copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />} {copied ? "Copied" : "Copy prompt"}</Button><Button variant="outline" onClick={() => toast("Sharing links are available for published prompts.")}><Share2 className="h-4 w-4" /> Share</Button><span className="flex items-center gap-1.5 px-2 text-xs font-semibold text-muted-foreground"><Heart className="h-4 w-4 text-rose-400" /> {prompt.likes} loves</span></div></section>
        <section className="overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-xl"><div className="blueprint-grid border-b border-white/10 px-5 py-5 sm:px-7"><div className="flex items-center justify-between"><div><p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-accent">The full system</p><p className="mt-1 text-sm text-slate-300">A reusable starting point, not a black box.</p></div><PenLine className="h-5 w-5 text-accent" /></div></div><div className="space-y-6 p-5 sm:p-7">{blocks.map(([label, value], index) => <div key={label} className="relative pl-9"><span className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 font-mono text-[0.62rem] font-bold text-accent">0{index + 1}</span><p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-accent">{label === "output" ? "Output format" : label}</p><p className="mt-2 text-sm leading-6 text-slate-300">{value}</p></div>)}<div className="border-t border-white/10 pt-5"><div className="flex items-center justify-between text-xs text-slate-400"><span>{blocks.length} sections</span><span>{prompt.views.toLocaleString()} reads</span><button type="button" onClick={copy} className="inline-flex items-center gap-1 font-bold text-accent hover:text-[#79edd0]"><Copy className="h-3.5 w-3.5" /> Copy all</button></div></div></div></section>
      </div>
      <div className="mt-12 border-t pt-6 text-xs leading-6 text-muted-foreground"><p>Prompt-Gineer community prompts are shared as starting points. Review outputs, add your own context, and keep sensitive information out of public prompts.</p><Link to="/contact" className="mt-2 inline-flex items-center gap-1 font-semibold text-accent">Something to report? <ExternalLink className="h-3 w-3" /></Link></div>
    </div>
  );
}
