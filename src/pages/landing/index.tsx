import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  FileText,
  Layers3,
  MessageSquareText,
  PenTool,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";

const LandingPage = () => {
  const { user } = useAuth();
  const startHref = user ? "/dashboard" : "/auth";

  return (
    <div className="min-h-screen overflow-hidden bg-[#f8f8f6] text-[#171827]">
      <header className="sticky top-0 z-40 border-b border-[#e9e9e7] bg-[#f8f8f6]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-5 sm:px-8">
          <Link to="/" className="group flex items-center gap-3" aria-label="Prompt-Gineer home">
            <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#24223b] text-white shadow-[0_5px_15px_rgba(36,34,59,0.18)] transition-transform group-hover:-rotate-3">
              <PenTool className="h-[18px] w-[18px]" strokeWidth={2.2} />
            </span>
            <span className="text-[17px] font-extrabold tracking-[-0.055em]">
              Prompt<span className="text-[#6554dc]">-Gineer</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            <a href="#method" className="text-sm font-medium text-[#656676] transition-colors hover:text-[#171827]">How it works</a>
            <a href="#features" className="text-sm font-medium text-[#656676] transition-colors hover:text-[#171827]">The toolkit</a>
            <Link to="/community" className="text-sm font-medium text-[#656676] transition-colors hover:text-[#171827]">Community</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {!user && (
              <Button asChild variant="ghost" className="hidden text-[#4e5060] sm:inline-flex">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
            <Button asChild className="h-10 rounded-xl bg-[#6554dc] px-4 text-white shadow-[0_5px_14px_rgba(101,84,220,0.2)] hover:bg-[#5142bf] sm:px-5">
              <Link to={startHref}>
                {user ? "Open workspace" : "Start building"}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate border-b border-[#ececea]">
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-80"
            style={{ backgroundImage: "radial-gradient(circle at 77% 44%, rgba(200,193,255,.42), transparent 31%), radial-gradient(circle at 9% 20%, rgba(231,226,255,.62), transparent 27%)" }}
          />
          <div className="mx-auto grid max-w-[1280px] items-center gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-24 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 lg:py-24">
            <div className="max-w-[590px]">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#dedaf9] bg-white/80 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5b4bc1] shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                A more thoughtful AI workflow
              </div>
              <h1 className="max-w-[640px] text-[clamp(3.1rem,6vw,5.4rem)] font-semibold leading-[0.99] tracking-[-0.075em] text-[#171827]">
                Better prompts.
                <br />
                <span className="relative inline-block text-[#6554dc]">
                  Brighter ideas.
                  <span className="absolute -bottom-1 left-1 h-[9px] w-[83%] -rotate-1 rounded-full bg-[#d8d2ff] opacity-70" />
                </span>
              </h1>
              <p className="mt-7 max-w-[490px] text-base leading-7 text-[#666777] sm:text-lg sm:leading-8">
                Turn a half-formed thought into a clear, useful prompt. Structure the brief, refine the details, then take it to the AI tool you already use.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="h-12 rounded-xl bg-[#6554dc] px-6 text-white shadow-[0_8px_22px_rgba(101,84,220,0.22)] hover:bg-[#5142bf]">
                  <Link to={startHref}>
                    {user ? "Go to your workspace" : "Build your first prompt"}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 rounded-xl border-[#e2e1e9] bg-white/70 px-5 text-[#3e3f50] hover:bg-white">
                  <Link to="/community">
                    Explore prompt examples
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-[#777887]">
                <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#6554dc]" /> Guided, not guesswork</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#6554dc]" /> Your prompts stay yours</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#6554dc]" /> Export and use anywhere</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[620px] lg:ml-auto">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full border border-[#d9d2ff] sm:-right-10 sm:-top-10 sm:h-36 sm:w-36" />
              <div className="absolute -bottom-6 -left-7 h-24 w-24 rounded-full bg-[#ebe8ff] blur-2xl sm:-bottom-9 sm:-left-10 sm:h-36 sm:w-36" />
              <div className="relative overflow-hidden rounded-[22px] border border-[#2f3045] bg-[#1e2031] p-2.5 shadow-[0_34px_90px_rgba(32,30,59,0.23)] sm:rounded-[28px] sm:p-3">
                <div className="rounded-[16px] border border-white/10 bg-[#fdfdff] p-4 sm:rounded-[20px] sm:p-5">
                  <div className="flex items-center justify-between border-b border-[#eeeeF2] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eeeaff] text-[#6554dc]"><Wand2 className="h-4 w-4" /></div>
                      <div>
                        <p className="text-[13px] font-bold text-[#292a3a]">Prompt workspace</p>
                        <p className="mt-0.5 text-[10px] font-medium text-[#8b8c99]">A guided first draft</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-[#f0efff] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#6554dc]">Example</span>
                  </div>

                  <div className="mt-4 grid grid-cols-[1fr_0.82fr] gap-3">
                    <div className="space-y-3">
                      <PreviewField number="01" label="Context" value="A product designer working on a calm, accessible habit-tracking app." />
                      <PreviewField number="02" label="Task" value="Design a welcome screen that helps new users set their first small goal." />
                      <PreviewField number="03" label="Guidelines" value="Keep the copy warm and direct. Make the next step feel easy." />
                    </div>
                    <div className="flex min-h-[235px] flex-col rounded-[14px] bg-[#22243a] p-3.5 text-white sm:p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold tracking-wide text-white/70">PROMPT PREVIEW</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-[#9de2b0]" />
                      </div>
                      <div className="mt-4 space-y-3 font-mono text-[9px] leading-[1.65] text-white/70 sm:text-[10px]">
                        <p><span className="text-[#c2baff]">Context:</span> Create a gentle first-run experience for a habit app.</p>
                        <p><span className="text-[#c2baff]">Task:</span> Help a new user choose one achievable goal.</p>
                        <p><span className="text-[#c2baff]">Guidelines:</span> Keep it warm, accessible, and focused.</p>
                      </div>
                      <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3 text-[9px] text-white/45">
                        <span>Ready to refine</span>
                        <span className="inline-flex items-center gap-1 text-white/80"><FileText className="h-3 w-3" /> Copy</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#e8e6f6] bg-[#f7f6ff] px-3 py-2.5">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#6554dc]" />
                    <span className="text-[10px] font-medium text-[#686879] sm:text-[11px]">Clear context. Specific task. A prompt ready to travel.</span>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 right-5 hidden items-center gap-2 rounded-xl border border-[#e8e7ed] bg-white px-3 py-2.5 shadow-[0_10px_30px_rgba(27,27,44,0.1)] sm:flex">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0efff] text-[#6554dc]"><Layers3 className="h-3.5 w-3.5" /></span>
                <span className="text-[11px] font-semibold text-[#4c4c5a]">A clearer way to think</span>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 sm:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="eyebrow">The toolkit</p>
              <h2 className="mt-4 max-w-[470px] text-3xl font-semibold leading-tight tracking-[-0.055em] text-[#202031] sm:text-4xl">
                Less prompt wrangling. More meaningful work.
              </h2>
            </div>
            <p className="max-w-[540px] text-base leading-7 text-[#707180] lg:justify-self-end">
              A small set of thoughtful tools helps you shape the request, spot what is missing, and keep the useful parts close at hand.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <FeatureCard
              icon={<Layers3 className="h-5 w-5" />}
              index="01"
              title="Build with structure"
              description="Work through context, task, guidelines, and constraints without starting from a blank page."
            />
            <FeatureCard
              icon={<MessageSquareText className="h-5 w-5" />}
              index="02"
              title="Find your words"
              description="Shape an idea conversationally, then turn the discussion into a prompt you can reuse."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-5 w-5" />}
              index="03"
              title="Refine with intent"
              description="Review a draft through the CLEAR framework and make every instruction earn its place."
            />
          </div>
        </section>

        <section id="method" className="px-5 pb-20 sm:px-8 sm:pb-28">
          <div className="relative mx-auto max-w-[1280px] overflow-hidden rounded-[28px] bg-[#202137] px-6 py-10 text-white shadow-[0_24px_70px_rgba(33,32,55,0.12)] sm:px-12 sm:py-14 lg:px-16 lg:py-16">
            <div className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full border border-white/[0.08]" />
            <div className="pointer-events-none absolute -right-2 -top-12 h-52 w-52 rounded-full border border-white/[0.08]" />
            <div className="relative grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#bbb4ff]">A simple, repeatable method</p>
                <h2 className="mt-4 max-w-[430px] text-3xl font-semibold leading-tight tracking-[-0.06em] sm:text-4xl">
                  Make the thinking visible.
                </h2>
                <p className="mt-5 max-w-[390px] text-sm leading-7 text-white/65 sm:text-base">
                  Strong prompts are built from the same ingredients. Prompt-Gineer gives each one room to breathe, so the final request is easier to trust and iterate on.
                </p>
                <Button asChild className="mt-7 h-11 rounded-xl bg-white px-5 text-[#292743] hover:bg-[#f0efff]">
                  <Link to={startHref}>Explore the workspace <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <MethodStep number="01" title="Set the scene" text="Add role, background, and anything the model should know first." />
                <MethodStep number="02" title="Name the outcome" text="Say exactly what a useful answer should do or deliver." />
                <MethodStep number="03" title="Guide the approach" text="Include preferred formats, tone, tools, or examples." />
                <MethodStep number="04" title="Add guardrails" text="Capture constraints, edge cases, and how to check the result." />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-5 pb-20 sm:px-8 sm:pb-28">
          <div className="flex flex-col items-start justify-between gap-7 rounded-[24px] border border-[#e8e7ed] bg-white px-6 py-8 shadow-[0_10px_40px_rgba(31,31,49,0.035)] sm:flex-row sm:items-center sm:px-10 sm:py-9">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#f0efff] text-[#6554dc]"><Wand2 className="h-5 w-5" /></div>
              <div>
                <p className="eyebrow">Start with an idea</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-[#202031]">Give your next prompt a little more purpose.</h2>
                <p className="mt-2 max-w-[570px] text-sm leading-6 text-[#707180]">Create a private draft, refine it at your own pace, and share only when it is ready.</p>
              </div>
            </div>
            <Button asChild size="lg" className="h-12 shrink-0 rounded-xl bg-[#6554dc] px-6 text-white hover:bg-[#5142bf]">
              <Link to={startHref}>{user ? "Open workspace" : "Get started"}<ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e9e9e7] bg-white/65">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-5 py-7 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 font-bold tracking-[-0.04em] text-[#303143]">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#24223b] text-white"><PenTool className="h-4 w-4" /></span>
            Prompt<span className="text-[#6554dc]">-Gineer</span>
          </Link>
          <p className="text-xs text-[#858593]">A clearer way to work with AI, one prompt at a time.</p>
          <nav className="flex gap-5 text-xs font-medium text-[#777887]" aria-label="Footer navigation">
            <Link to="/community" className="transition-colors hover:text-[#6554dc]">Community</Link>
            <Link to="/privacy" className="transition-colors hover:text-[#6554dc]">Privacy</Link>
            <Link to="/terms" className="transition-colors hover:text-[#6554dc]">Terms</Link>
            <Link to="/contact" className="transition-colors hover:text-[#6554dc]">Contact</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

function PreviewField({ number, label, value }: { number: string; label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-[#e9e9ef] bg-white p-3 sm:p-3.5">
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold tracking-[0.1em] text-[#9a9ba8]">{number}</span>
        <span className="text-[10px] font-bold text-[#3d3e50] sm:text-[11px]">{label}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-[9px] leading-[1.55] text-[#81828f] sm:text-[10px]">{value}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  index,
  title,
  description,
}: {
  icon: React.ReactNode;
  index: string;
  title: string;
  description: string;
}) {
  return (
    <article className="group min-h-[245px] rounded-[20px] border border-[#e8e7ed] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#d8d2ff] hover:shadow-[0_18px_45px_rgba(38,34,70,0.08)] sm:p-7">
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#f0efff] text-[#6554dc] transition-transform duration-300 group-hover:scale-105">{icon}</span>
        <span className="font-mono text-xs font-medium text-[#b5b5c0]">{index}</span>
      </div>
      <h3 className="mt-8 text-lg font-semibold tracking-[-0.04em] text-[#262737]">{title}</h3>
      <p className="mt-2.5 max-w-[330px] text-sm leading-6 text-[#777887]">{description}</p>
    </article>
  );
}

function MethodStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-[17px] border border-white/[0.11] bg-white/[0.045] p-5 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] font-bold text-[#b9b2ff]">{number}</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>
      <h3 className="mt-5 text-base font-semibold tracking-[-0.025em] text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/55">{text}</p>
    </div>
  );
}

export default LandingPage;
