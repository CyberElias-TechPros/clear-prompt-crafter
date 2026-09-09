import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ExternalLink, KeyRound, LockKeyhole, Plus, RefreshCw, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getConnectedServices, setConnectedService } from "@/lib/demo-data";
import { toast } from "sonner";
import Seo from "@/components/Seo"

const services = [
  { id: "openai", name: "OpenAI", short: "OAI", color: "#6bb89b", description: "GPT models for general reasoning and generation.", docs: "https://platform.openai.com/docs" },
  { id: "anthropic", name: "Anthropic", short: "A", color: "#c58b5c", description: "Claude models for nuanced, careful work.", docs: "https://docs.anthropic.com" },
  { id: "gemini", name: "Google Gemini", short: "G", color: "#668ad6", description: "Fast multimodal models from Google.", docs: "https://ai.google.dev" },
  { id: "perplexity", name: "Perplexity", short: "P", color: "#6d62b1", description: "Research-oriented answers with web context.", docs: "https://docs.perplexity.ai" },
  { id: "mistral", name: "Mistral", short: "M", color: "#d07b66", description: "Efficient open models for focused workflows.", docs: "https://docs.mistral.ai" },
  { id: "groq", name: "Groq", short: "GQ", color: "#ad6b9a", description: "Low-latency inference for fast iteration.", docs: "https://console.groq.com/docs" },
];

export default function AIServicesPage() {
  const [connected, setConnected] = useState<string[]>(() => getConnectedServices());
  const connectedServices = useMemo(() => services.filter((service) => connected.includes(service.id)), [connected]);
  const toggle = (serviceId: string) => {
    const isConnected = connected.includes(serviceId);
    setConnected(setConnectedService(serviceId, !isConnected));
    toast.success(isConnected ? "Service disconnected" : "Demo connection enabled");
  };

  return (
    <div className="page-enter mx-auto max-w-6xl"><Seo title="AI services — Prompt-Gineer" description="Connect model providers to your Prompt-Gineer workflows without putting secrets in the browser." path="/ai-services" noindex />
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="eyebrow">Power your workflow</p><h1 className="display-font mt-2 text-4xl font-semibold leading-none tracking-tight sm:text-5xl">AI services, on your terms.</h1><p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">Connect the models you already trust, keep your keys out of the browser, and choose the right engine for each kind of work.</p></div><Button asChild className="w-fit bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/ai-services/connect/openai"><Plus className="h-4 w-4" /> Connect a service</Link></Button></div>
      <div className="mb-7 grid gap-4 md:grid-cols-[1fr_1fr_.8fr]"><div className="rounded-2xl bg-[#13213a] p-5 text-white"><div className="flex items-center gap-2 text-[#79edd0]"><ShieldCheck className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[.14em]">Key safety</span></div><p className="mt-4 text-lg font-bold">Secrets belong on the server.</p><p className="mt-2 text-xs leading-5 text-slate-300">In production, provider keys are exchanged through an authorized Worker. This demo only stores connection status.</p></div><div className="surface rounded-2xl p-5"><div className="flex items-center gap-2 text-[#b77b22]"><Zap className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[.14em]">Routing tip</span></div><p className="mt-4 text-lg font-bold">Match the model to the moment.</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Use fast models for iteration, reasoning models for tradeoffs, and research models when freshness matters.</p></div><div className="surface rounded-2xl p-5"><p className="text-xs font-medium text-muted-foreground">Connected in this workspace</p><p className="mt-2 text-4xl font-bold">{connectedServices.length}<span className="text-base font-medium text-muted-foreground"> / {services.length}</span></p><p className="mt-2 text-xs font-semibold text-accent">Ready when you are</p></div></div>

      {connectedServices.length > 0 && <section className="mb-9"><div className="mb-3 flex items-center justify-between"><div><p className="eyebrow">Active connections</p><h2 className="mt-1 text-xl font-bold">Your model shelf</h2></div><Badge variant="outline" className="border-accent/30 bg-accent/5 text-accent"><span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-accent" /> {connectedServices.length} active</Badge></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{connectedServices.map((service) => <div key={service.id} className="surface flex items-center gap-3 rounded-2xl p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black text-white" style={{ backgroundColor: service.color }}>{service.short}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold">{service.name}</p><p className="text-xs text-muted-foreground">Connected for this workspace</p></div><button type="button" onClick={() => toggle(service.id)} className="text-xs font-semibold text-muted-foreground hover:text-destructive">Remove</button></div>)}</div></section>}

      <section><div className="mb-3 flex items-center justify-between"><div><p className="eyebrow">Provider directory</p><h2 className="mt-1 text-xl font-bold">Choose your engines</h2></div><span className="text-xs text-muted-foreground">{services.length} supported providers</span></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{services.map((service) => { const isConnected = connected.includes(service.id); return <article key={service.id} className="surface surface-hover rounded-2xl p-5"><div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl text-xs font-black text-white" style={{ backgroundColor: service.color }}>{service.short}</span>{isConnected ? <Badge className="gap-1 border-0 bg-accent/10 text-accent hover:bg-accent/10"><Check className="h-3 w-3" /> Connected</Badge> : <span className="text-[0.68rem] font-semibold text-muted-foreground">Not connected</span>}</div><h3 className="mt-5 text-lg font-bold">{service.name}</h3><p className="mt-2 min-h-[42px] text-sm leading-6 text-muted-foreground">{service.description}</p><div className="mt-5 flex items-center justify-between border-t pt-4"><a href={service.docs} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">Docs <ExternalLink className="h-3 w-3" /></a><Button onClick={() => toggle(service.id)} variant={isConnected ? "outline" : "default"} size="sm" className={!isConnected ? "bg-primary" : ""}>{isConnected ? "Disconnect" : "Connect"}<ArrowRight className="h-3.5 w-3.5" /></Button></div></article>; })}</div></section>
      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-dashed p-4"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><p className="text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Demo mode note:</strong> “Connect” records a local connection status only. A production implementation should proxy model calls through a Cloudflare Worker and keep provider secrets in encrypted server-side bindings.</p></div>
    </div>
  );
}
