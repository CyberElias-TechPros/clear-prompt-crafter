import React, { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getConnectedServices, setConnectedService } from "@/lib/demo-data";
import { toast } from "sonner";

const providers: Record<string, { name: string; short: string; color: string; description: string; docs: string }> = {
  openai: { name: "OpenAI", short: "OAI", color: "#6bb89b", description: "GPT models for general reasoning and generation.", docs: "https://platform.openai.com/docs" },
  anthropic: { name: "Anthropic", short: "A", color: "#c58b5c", description: "Claude models for nuanced, careful work.", docs: "https://docs.anthropic.com" },
  gemini: { name: "Google Gemini", short: "G", color: "#668ad6", description: "Fast multimodal models from Google.", docs: "https://ai.google.dev" },
  perplexity: { name: "Perplexity", short: "P", color: "#6d62b1", description: "Research-oriented answers with web context.", docs: "https://docs.perplexity.ai" },
  mistral: { name: "Mistral", short: "M", color: "#d07b66", description: "Efficient open models for focused workflows.", docs: "https://docs.mistral.ai" },
  groq: { name: "Groq", short: "GQ", color: "#ad6b9a", description: "Low-latency inference for fast iteration.", docs: "https://console.groq.com/docs" },
};

export default function ConnectServicePage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const service = useMemo(() => serviceId ? providers[serviceId] : undefined, [serviceId]);
  const isConnected = serviceId ? getConnectedServices().includes(serviceId) : false;

  if (!service || !serviceId) return <div className="py-20 text-center"><p className="eyebrow">Provider not found</p><Button asChild className="mt-5"><Link to="/ai-services"><ArrowLeft className="h-4 w-4" /> Back to services</Link></Button></div>;

  const handleConnect = () => {
    setConnectedService(serviceId, !isConnected);
    toast.success(isConnected ? `${service.name} disconnected` : `${service.name} demo connection enabled`);
    navigate("/ai-services");
  };

  return (
    <div className="page-enter mx-auto max-w-3xl"><Link to="/ai-services" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to AI services</Link><div className="overflow-hidden rounded-[24px] bg-[#13213a] text-white shadow-xl"><div className="blueprint-grid border-b border-white/10 px-6 py-8 sm:px-10 sm:py-10"><div className="flex h-14 w-14 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ backgroundColor: service.color }}>{service.short}</div><p className="eyebrow mt-7 text-[#79edd0]">Provider connection</p><h1 className="display-font mt-3 text-4xl font-semibold leading-none sm:text-5xl">Connect {service.name}.</h1><p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">{service.description} Choose how this provider should be available to your prompt workflows.</p></div><div className="grid gap-8 bg-white p-6 text-foreground sm:p-10 lg:grid-cols-[1fr_.75fr]"><div><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent"><KeyRound className="h-4 w-4" /></div><div><h2 className="font-bold">Bring your own key</h2><p className="text-xs text-muted-foreground">Secure setup for production workspaces</p></div></div><div className="mt-6 rounded-2xl border border-accent/20 bg-accent/5 p-4"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><div><p className="text-sm font-bold">No key is collected in this demo.</p><p className="mt-1 text-xs leading-5 text-muted-foreground">When deployed with the Cloudflare Worker architecture, keys should be accepted by an authorized server endpoint and stored in encrypted secret bindings — never in browser storage.</p></div></div></div><div className="mt-6 flex flex-wrap gap-3"><Button onClick={handleConnect} className="bg-accent text-accent-foreground hover:bg-accent/90">{isConnected ? "Disconnect demo status" : "Enable demo connection"}</Button><a href={service.docs} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-secondary">Read provider docs <ExternalLink className="h-3.5 w-3.5" /></a></div></div><aside className="rounded-2xl bg-secondary/60 p-5"><Badge variant="outline" className="border-accent/30 bg-accent/5 text-accent">{isConnected ? "Currently enabled" : "Not connected"}</Badge><h3 className="mt-5 text-lg font-bold">What happens next?</h3><ol className="mt-4 space-y-4 text-sm"><li className="flex gap-3"><span className="font-mono text-xs font-bold text-accent">01</span><span className="text-muted-foreground">Choose a model when you run a prompt.</span></li><li className="flex gap-3"><span className="font-mono text-xs font-bold text-accent">02</span><span className="text-muted-foreground">Keep provider-specific settings next to the workflow.</span></li><li className="flex gap-3"><span className="font-mono text-xs font-bold text-accent">03</span><span className="text-muted-foreground">Review output before it becomes a decision.</span></li></ol><div className="mt-6 flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground"><LockKeyhole className="h-3.5 w-3.5 text-accent" /> Secret-safe by design</div></aside></div></div></div>
  );
}
