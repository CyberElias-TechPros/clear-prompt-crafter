import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleDashed,
  ClipboardCheck,
  Command,
  FileText,
  Library,
  Menu,
  PenLine,
  Play,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import Seo from "@/components/Seo";

function Brand() {
  return <span className="flex items-center gap-2.5"><span className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/10 text-white"><PenLine className="h-4 w-4" strokeWidth={2.5} /><span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#55e0bd] ring-2 ring-[#111a2d]" /></span><span className="brand-wordmark text-[1.06rem] font-bold text-white">Prompt-Gineer</span></span>;
}

const features = [
  { number: "01", icon: WandSparkles, title: "Build with intent", body: "A focused structure turns a vague ask into the role, context, constraints, and output an AI can actually use." },
  { number: "02", icon: CircleDashed, title: "Refine with signal", body: "See the prompt take shape in real time. Tighten the parts that matter without losing your original idea." },
  { number: "03", icon: Library, title: "Keep what works", body: "Save your best prompt systems, share them with your team, and start from a proven foundation next time." },
];

const plans = [
  { name: "Free", price: "$0", note: "For getting started", features: ["Unlimited prompt drafts", "CLEAR framework builder", "Public community library"], cta: "Start for free" },
  { name: "Pro", price: "$12", note: "For serious makers", features: ["Private prompt library", "Prompt history & versioning", "AI service connections", "Priority support"], cta: "Try Pro", featured: true },
  { name: "Team", price: "$39", note: "For teams with standards", features: ["Shared prompt systems", "Workspace permissions", "Review-ready templates", "Team onboarding"], cta: "Talk to us" },
];

export default function LandingPage() {
  const { user, enterDemo } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const openWorkspace = () => {
    if (!user) enterDemo();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f8fb] text-[#152039]">
      <Seo title="Prompt-Gineer — Make your ideas legible to AI" description="Build clear, reusable prompt systems with a calmer, more intentional workflow." />
      <header className="absolute left-0 right-0 top-0 z-20 border-b border-white/10 bg-[#10192b]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link to="/" aria-label="Prompt-Gineer home"><Brand /></Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex"><a href="#how-it-works" className="transition hover:text-white">How it works</a><Link to="/community" className="transition hover:text-white">Prompt library</Link><a href="#pricing" className="transition hover:text-white">Pricing</a></nav>
          <div className="flex items-center gap-2.5"><Button asChild variant="ghost" size="sm" className="hidden text-slate-300 hover:bg-white/10 hover:text-white sm:inline-flex"><Link to={user ? "/dashboard" : "/auth"}>{user ? "Workspace" : "Sign in"}</Link></Button><Button size="sm" onClick={openWorkspace} className="bg-[#55e0bd] font-bold text-[#10192b] hover:bg-[#79edd0]">Open studio <ArrowRight className="h-3.5 w-3.5" /></Button><Button onClick={() => setMobileMenuOpen((current) => !current)} variant="ghost" size="icon" className="text-slate-300 hover:bg-white/10 hover:text-white md:hidden" aria-expanded={mobileMenuOpen} aria-controls="mobile-public-nav">{mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}<span className="sr-only">{mobileMenuOpen ? "Close menu" : "Open menu"}</span></Button></div>
        </div>
        {mobileMenuOpen && <div id="mobile-public-nav" className="border-t border-white/10 bg-[#10192b] px-5 py-4 md:hidden"><nav className="mx-auto flex max-w-7xl flex-col gap-1 text-sm font-semibold text-slate-300"><a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-white/10 hover:text-white">How it works</a><Link to="/community" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-white/10 hover:text-white">Prompt library</Link><a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-white/10 hover:text-white">Pricing</a></nav></div>}
      </header>

      <main>
        <section className="relative min-h-[720px] overflow-hidden bg-[#10192b] pt-[72px] text-white lg:min-h-[790px]">
          <div className="hero-grid absolute inset-0 opacity-70" />
          <div className="absolute -left-40 top-32 h-[420px] w-[420px] rounded-full bg-[#226e79]/30 blur-[100px]" />
          <div className="absolute right-[-120px] top-[-80px] h-[520px] w-[520px] rounded-full bg-[#d5a65a]/15 blur-[110px]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-20 lg:grid-cols-[0.88fr_1.12fr] lg:px-8 lg:pb-28 lg:pt-28">
            <div className="max-w-xl">
              <Badge className="mb-7 rounded-full border border-[#55e0bd]/30 bg-[#55e0bd]/10 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#79edd0] hover:bg-[#55e0bd]/10"><Sparkles className="mr-2 h-3.5 w-3.5" /> A calmer way to prompt</Badge>
              <h1 className="display-font text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-6xl lg:text-[5.2rem]">Make your ideas <span className="text-[#55e0bd]">legible</span> to AI.</h1>
              <p className="mt-7 max-w-lg text-lg leading-8 text-slate-300">Prompt-Gineer turns fuzzy requests into clear, reusable prompt systems — so you spend less time re-prompting and more time moving the work forward.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Button onClick={openWorkspace} size="lg" className="h-12 bg-[#55e0bd] px-6 font-bold text-[#10192b] hover:bg-[#79edd0]">Build your first prompt <ArrowRight className="h-4 w-4" /></Button><Button asChild size="lg" variant="outline" className="h-12 border-white/20 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white"><Link to="/community"><Play className="h-4 w-4 fill-current" /> Explore the library</Link></Button></div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-400"><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#55e0bd]" /> Private by default</span><span className="flex items-center gap-2"><Zap className="h-4 w-4 text-[#d5a65a]" /> Built for momentum</span></div>
            </div>

            <div className="relative mx-auto w-full max-w-[670px] lg:ml-auto">
              <div className="absolute -inset-4 rounded-[30px] border border-[#55e0bd]/15 bg-[#55e0bd]/5 blur-sm" />
              <div className="relative overflow-hidden rounded-[22px] border border-white/15 bg-[#f6f8fb] shadow-[0_35px_100px_-25px_rgba(0,0,0,.55)]">
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#ff847c]" /><span className="h-2.5 w-2.5 rounded-full bg-[#f3c969]" /><span className="h-2.5 w-2.5 rounded-full bg-[#55c99b]" /></div><div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-400"><Command className="h-3 w-3" /> Prompt studio</div><div className="w-12" /></div>
                <div className="grid gap-0 lg:grid-cols-[1fr_.9fr]">
                  <div className="border-b border-slate-200 p-5 lg:border-b-0 lg:border-r lg:p-6"><div className="mb-5 flex items-center justify-between"><div><p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#1f9883]">New prompt</p><h2 className="mt-1 text-lg font-bold text-[#172139]">Launch brief copilot</h2></div><span className="rounded-full bg-[#e4f8f3] px-2.5 py-1 text-[0.62rem] font-bold text-[#1f9883]">84% clear</span></div><div className="space-y-4"><div><p className="mb-1.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-slate-400">Role</p><div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs leading-5 text-slate-600">You are a senior product marketer who turns evidence into positioning.</div></div><div><p className="mb-1.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-slate-400">Objective</p><div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs leading-5 text-slate-600">Turn customer notes into a launch brief the team can act on.</div></div><div><p className="mb-1.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-slate-400">Guardrails</p><div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs leading-5 text-slate-600">Label assumptions. Never invent proof points.</div></div></div></div>
                  <div className="bg-[#13213a] p-5 text-white lg:p-6"><div className="mb-5 flex items-center justify-between"><p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#79edd0]">Live preview</p><ClipboardCheck className="h-4 w-4 text-[#79edd0]" /></div><div className="rounded-xl border border-white/10 bg-white/[.06] p-4"><div className="space-y-4 font-mono text-[0.68rem] leading-5 text-slate-300"><p><span className="text-[#79edd0]">ROLE</span><br />You are a senior product marketer...</p><p><span className="text-[#d5a65a]">OBJECTIVE</span><br />Create a focused launch brief...</p><p><span className="text-[#ec9b91]">OUTPUT</span><br />Audience · promise · proof · next steps</p></div></div><div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-[0.68rem] text-slate-400"><span>6 sections • 118 words</span><span className="flex items-center gap-1.5 text-[#79edd0]"><span className="h-1.5 w-1.5 rounded-full bg-[#55e0bd]" /> Ready to copy</span></div></div>
                </div>
              </div>
              <div className="absolute -bottom-7 -left-6 hidden rounded-2xl border border-white/15 bg-[#192840] px-4 py-3 shadow-xl sm:flex sm:items-center sm:gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#d5a65a]/15 text-[#eac879]"><FileText className="h-4 w-4" /></div><div><p className="text-[0.68rem] font-semibold text-white">Your prompt system is ready</p><p className="text-[0.62rem] text-slate-400">Saved to your private library</p></div></div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left lg:px-8"><p className="text-sm font-semibold text-slate-500">The structure behind better outcomes</p><div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 sm:justify-end"><span>Role</span><span className="text-[#b1c2d3]">→</span><span>Context</span><span className="text-[#b1c2d3]">→</span><span>Intent</span><span className="text-[#b1c2d3]">→</span><span>Output</span></div></div></section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32"><div className="grid gap-12 lg:grid-cols-[.78fr_1.22fr] lg:gap-24"><div><p className="eyebrow">Less guesswork. More signal.</p><h2 className="display-font mt-4 max-w-md text-4xl font-semibold leading-[1.03] sm:text-5xl">A prompt workspace with a point of view.</h2><p className="mt-6 max-w-md text-base leading-7 text-slate-500">Good prompting is not about adding more words. It is about making the important words impossible to miss.</p><Link to="/community" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#1f9883] hover:text-[#167562]">See what the community is building <ArrowRight className="h-4 w-4" /></Link></div><div className="grid gap-4 sm:grid-cols-3">{features.map((feature) => { const Icon = feature.icon; return <article key={feature.number} className="surface surface-hover rounded-2xl p-5"><div className="flex items-center justify-between"><span className="font-mono text-xs font-bold text-slate-400">{feature.number}</span><Icon className="h-5 w-5 text-[#1f9883]" /></div><h3 className="mt-16 text-lg font-bold">{feature.title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{feature.body}</p></article>; })}</div></div></section>

        <section className="bg-[#13213a] px-5 py-24 text-white lg:px-8 lg:py-28"><div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_1fr]"><div><p className="eyebrow text-[#79edd0]">The CLEAR framework</p><h2 className="display-font mt-4 max-w-xl text-4xl font-semibold leading-[1.04] sm:text-5xl">Turn a blank page into a point of departure.</h2><p className="mt-6 max-w-lg leading-7 text-slate-300">Prompt-Gineer gives every idea a useful starting shape: concise enough to act on, explicit enough to trust, and flexible enough to evolve.</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[["C","Concise","Remove the fog"],["L","Logical","Order the thinking"],["E","Explicit","Name the outcome"],["A","Adaptive","Leave room to learn"],["R","Reflective","Review the signal"]].map(([letter, word, copy]) => <div key={letter} className="rounded-2xl border border-white/10 bg-white/[.05] p-4"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#55e0bd] text-sm font-black text-[#13213a]">{letter}</div><p className="mt-5 font-bold">{word}</p><p className="mt-1 text-xs leading-5 text-slate-400">{copy}</p></div>)}</div></div></section>

        <section id="pricing" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32"><div className="mx-auto max-w-2xl text-center"><p className="eyebrow">Simple by design</p><h2 className="display-font mt-4 text-4xl font-semibold leading-none sm:text-5xl">Start clear. Grow when you need to.</h2><p className="mt-5 text-slate-500">A generous free workspace for individual builders, with team-grade tools when the work calls for them.</p></div><div className="mx-auto mt-12 grid max-w-5xl gap-4 lg:grid-cols-3">{plans.map((plan) => <article key={plan.name} className={plan.featured ? "relative rounded-2xl border-2 border-[#55c9ab] bg-[#13213a] p-6 text-white shadow-[0_25px_70px_-35px_rgba(20,100,88,.7)]" : "surface rounded-2xl p-6"}>{plan.featured && <span className="absolute -top-3 left-6 rounded-full bg-[#55e0bd] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#13213a]">Most popular</span>}<p className={plan.featured ? "text-sm font-bold text-[#79edd0]" : "text-sm font-bold text-[#1f9883]"}>{plan.name}</p><p className="mt-5 text-4xl font-black tracking-tight">{plan.price}<span className={plan.featured ? "text-sm font-medium text-slate-400" : "text-sm font-medium text-slate-400"}>{plan.name !== "Free" && " / month"}</span></p><p className={plan.featured ? "mt-2 text-sm text-slate-400" : "mt-2 text-sm text-slate-500"}>{plan.note}</p><ul className="mt-7 space-y-3 text-sm">{plan.features.map((item) => <li key={item} className="flex items-center gap-2"><Check className={plan.featured ? "h-4 w-4 text-[#55e0bd]" : "h-4 w-4 text-[#1f9883]"} /> {item}</li>)}</ul><Button onClick={plan.name === "Team" ? undefined : openWorkspace} asChild={plan.name === "Team"}><Link to={plan.name === "Team" ? "/contact" : "/dashboard"} className={plan.featured ? "mt-8 w-full bg-[#55e0bd] font-bold text-[#13213a] hover:bg-[#79edd0]" : "mt-8 w-full"}>{plan.cta} <ArrowRight className="h-4 w-4" /></Link></Button></article>)}</div></section>

        <section className="border-t border-slate-200 bg-[#eaf2f4] px-5 py-20 lg:px-8"><div className="mx-auto flex max-w-4xl flex-col items-center text-center"><p className="eyebrow">Make the next ask count</p><h2 className="display-font mt-4 text-4xl font-semibold leading-[1.05] sm:text-5xl">Your best work deserves a better starting point.</h2><Button onClick={openWorkspace} size="lg" className="mt-8 h-12 bg-[#13213a] px-7 text-white hover:bg-[#243754]">Open the prompt studio <ArrowRight className="h-4 w-4" /></Button></div></section>
      </main>

      <footer className="bg-[#10192b] px-5 py-8 text-slate-400 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm sm:flex-row sm:items-center sm:justify-between"><Brand /><div className="flex flex-wrap gap-5"><Link to="/community" className="hover:text-white">Library</Link><Link to="/contact" className="hover:text-white">Contact</Link><Link to="/privacy" className="hover:text-white">Privacy</Link><Link to="/terms" className="hover:text-white">Terms</Link></div><p className="text-xs">© {new Date().getFullYear()} Prompt-Gineer</p></div></footer>
    </div>
  );
}
