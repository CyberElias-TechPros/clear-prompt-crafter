import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Clipboard, Copy, ExternalLink, Heart, Lock, PenLine, Send, Share2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPost, apiPromptToRecord, isApiConfigured, type ApiPrompt } from "@/lib/api";
import { getPromptById, composePrompt, type PromptRecord } from "@/lib/demo-data";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type ApiComment = { id: string; content: string; createdAt: string; user?: { fullName?: string | null; initials?: string } };

export default function PromptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isDemo } = useAuth();
  const [prompt, setPrompt] = useState<PromptRecord | undefined>(() => !isApiConfigured && id ? getPromptById(id) : undefined);
  const [loading, setLoading] = useState(isApiConfigured);
  const [loadError, setLoadError] = useState("");
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);

  useEffect(() => {
    if (!isApiConfigured || !id) return;
    let active = true;
    setLoading(true);
    void Promise.all([
      apiGet<{ prompt: ApiPrompt }>(`/prompts/${encodeURIComponent(id)}`),
      apiGet<{ comments: ApiComment[] }>(`/prompts/${encodeURIComponent(id)}/comments`),
    ]).then(([promptResponse, commentResponse]) => {
      if (!active) return;
      setPrompt(apiPromptToRecord(promptResponse.prompt));
      setLiked(Boolean(promptResponse.prompt.likedByMe));
      setComments(commentResponse.comments);
    }).catch((error) => {
      if (active) setLoadError(error instanceof Error ? error.message : "Unable to load this prompt.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const canViewPrivatePrompt = Boolean(prompt?.isPublic || (!isApiConfigured && user && prompt?.author === (user.user_metadata?.full_name || "Alex Morgan")));

  const copy = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt.content || composePrompt(prompt.sections));
      setCopied(true);
      toast.success("Prompt copied to clipboard");
      window.setTimeout(() => setCopied(false), 1800);
    } catch { toast.error("Clipboard access is unavailable"); }
  };

  const toggleLike = async () => {
    if (!prompt) return;
    if (isApiConfigured && !isDemo) {
      if (!user) { toast.error("Sign in to like prompts."); return; }
      try {
        const response = await apiPost<{ liked: boolean; likes: number }>(`/prompts/${encodeURIComponent(prompt.id)}/like`);
        setLiked(response.liked);
        setPrompt((current) => current ? { ...current, likes: response.likes } : current);
      } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update like."); }
      return;
    }
    setLiked((current) => !current);
  };

  const addComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!prompt || !commentText.trim()) return;
    if (!isApiConfigured || isDemo) { toast("Comments are available when the API is configured."); return; }
    if (!user) { toast.error("Sign in to comment."); return; }
    setCommentBusy(true);
    try {
      const response = await apiPost<{ comment: ApiComment }>(`/prompts/${encodeURIComponent(prompt.id)}/comments`, { content: commentText.trim() });
      setComments((current) => [response.comment, ...current]);
      setCommentText("");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to add comment."); }
    finally { setCommentBusy(false); }
  };

  const blocks = useMemo(() => prompt ? Object.entries(prompt.sections).filter(([, value]) => value.trim()) : [], [prompt]);

  if (loading) return <div className="py-24 text-center text-sm text-muted-foreground">Loading prompt…</div>;
  if (!prompt || !canViewPrivatePrompt) return <div className="py-24 text-center"><p className="eyebrow">404 / prompt not found</p><h1 className="display-font mt-3 text-4xl font-semibold">That prompt moved on.</h1>{loadError && <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">{loadError}</p>}<Button asChild className="mt-6"><Link to="/community"><ArrowLeft className="h-4 w-4" /> Back to library</Link></Button></div>;

  return (
    <div className="page-enter mx-auto max-w-6xl">
      <Link to="/community" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to community library</Link>
      <div className="grid gap-7 lg:grid-cols-[.82fr_1.18fr]">
        <section><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="border-accent/30 bg-accent/5 text-accent">{prompt.category}</Badge>{prompt.isPublic ? <Badge variant="outline">Community prompt</Badge> : <Badge variant="outline"><Lock className="mr-1 h-3 w-3" /> Private</Badge>}</div><h1 className="display-font mt-5 text-5xl font-semibold leading-[.97] tracking-tight sm:text-6xl">{prompt.title}</h1><p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">{prompt.description}</p><div className="mt-8 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground">{prompt.authorInitials}</span><div><p className="text-sm font-bold">{prompt.author}</p><p className="text-xs text-muted-foreground">Published {format(new Date(prompt.createdAt), "MMM d, yyyy")}</p></div></div><div className="mt-8 flex flex-wrap gap-2">{prompt.tags.map((tag) => <span key={tag} className="rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">#{tag}</span>)}</div><div className="mt-9 flex flex-wrap gap-2"><Button onClick={() => void copy()} className="bg-accent text-accent-foreground hover:bg-accent/90">{copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />} {copied ? "Copied" : "Copy prompt"}</Button><Button variant="outline" onClick={() => toast("Sharing links are available for published prompts.")}><Share2 className="h-4 w-4" /> Share</Button><button type="button" onClick={() => void toggleLike()} className="flex items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"><Heart className={liked ? "h-4 w-4 fill-rose-400 text-rose-400" : "h-4 w-4 text-rose-400"} /> {prompt.likes + (!isApiConfigured && liked ? 1 : 0)} loves</button></div></section>
        <section className="overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-xl"><div className="blueprint-grid border-b border-white/10 px-5 py-5 sm:px-7"><div className="flex items-center justify-between"><div><p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-accent">The full system</p><p className="mt-1 text-sm text-slate-300">A reusable starting point, not a black box.</p></div><PenLine className="h-5 w-5 text-accent" /></div></div><div className="space-y-6 p-5 sm:p-7">{blocks.map(([label, value], index) => <div key={label} className="relative pl-9"><span className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 font-mono text-[0.62rem] font-bold text-accent">0{index + 1}</span><p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-accent">{label === "output" ? "Output format" : label}</p><p className="mt-2 text-sm leading-6 text-slate-300">{value}</p></div>)}<div className="border-t border-white/10 pt-5"><div className="flex items-center justify-between text-xs text-slate-400"><span>{blocks.length} sections</span><span>{prompt.views.toLocaleString()} reads</span><button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1 font-bold text-accent hover:text-[#79edd0]"><Copy className="h-3.5 w-3.5" /> Copy all</button></div></div></div></section>
      </div>

      <section className="mt-12 max-w-3xl border-t pt-8"><div className="flex items-end justify-between"><div><p className="eyebrow">Community notes</p><h2 className="mt-1 text-2xl font-bold">Comments</h2></div><span className="text-xs text-muted-foreground">{comments.length} {comments.length === 1 ? "note" : "notes"}</span></div>{isApiConfigured && !isDemo && <form onSubmit={addComment} className="mt-5 flex gap-3"><Textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder={user ? "Add a useful observation…" : "Sign in to add a comment"} disabled={!user || commentBusy} className="min-h-[76px] rounded-xl" /><Button type="submit" disabled={!user || commentBusy || !commentText.trim()} size="icon" className="h-11 w-11 shrink-0 bg-accent text-accent-foreground hover:bg-accent/90" aria-label="Post comment"><Send className="h-4 w-4" /></Button></form>}{comments.length > 0 && <div className="mt-5 space-y-3">{comments.map((comment) => <article key={comment.id} className="rounded-xl border bg-card p-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold">{comment.user?.fullName || "Community member"}</p><time className="text-[0.68rem] text-muted-foreground">{format(new Date(comment.createdAt), "MMM d, yyyy")}</time></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{comment.content}</p></article>)}</div>}{!comments.length && <p className="mt-5 text-sm text-muted-foreground">No comments yet. Be the first to add a useful note.</p>}</section>
      <div className="mt-12 border-t pt-6 text-xs leading-6 text-muted-foreground"><p>Prompt-Gineer community prompts are shared as starting points. Review outputs, add your own context, and keep sensitive information out of public prompts.</p><Link to="/contact" className="mt-2 inline-flex items-center gap-1 font-semibold text-accent">Something to report? <ExternalLink className="h-3 w-3" /></Link></div>
    </div>
  );
}
