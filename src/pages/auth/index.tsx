import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, PenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Seo from "@/components/Seo";

function passwordIsStrong(value: string): boolean {
  return value.length >= 12 && /[A-Za-z]/.test(value) && /\d/.test(value);
}

export default function AuthPage() {
  const { user, signIn, signUp, enterDemo, resetPassword, completePasswordReset } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && !resetToken) navigate("/dashboard", { replace: true });
  }, [user, navigate, resetToken]);

  const goToWorkspace = () => navigate(searchParams.get("next") || "/dashboard");

  const handleDemo = () => {
    enterDemo();
    toast.success("Demo workspace opened");
    goToWorkspace();
  };

  const handleResetRequest = async () => {
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }
    setError("");
    setBusy(true);
    const result = await resetPassword(email.trim());
    setBusy(false);
    if (result.error) setError(result.error.message);
    else toast.success("If that account exists, a reset email is on its way.");
  };

  const handleCompleteReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!resetToken) return;
    if (!passwordIsStrong(password)) return setError("Use at least 12 characters with one letter and one number.");
    if (password !== confirmPassword) return setError("Those passwords do not match.");
    setBusy(true);
    const result = await completePasswordReset(resetToken, password);
    setBusy(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    toast.success("Password updated. Sign in with your new password.");
    navigate("/auth", { replace: true });
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) return setError("Enter your email and password to continue.");
    if (tab === "signup" && password !== confirmPassword) return setError("Those passwords do not match.");
    if (tab === "signup" && !passwordIsStrong(password)) return setError("Use at least 12 characters with one letter and one number.");

    setBusy(true);
    const result = tab === "signin" ? await signIn(email.trim(), password) : await signUp(email.trim(), password, { full_name: name.trim() });
    setBusy(false);
    if (result.error) {
      setError(result.error.message || "That did not work. Check your details and try again.");
      return;
    }
    if (tab === "signup") {
      toast.success("Account created. Check your email to verify it.");
      setTab("signin");
      setPassword("");
      setConfirmPassword("");
    } else {
      toast.success("Welcome back");
      goToWorkspace();
    }
  };

  const resetView = Boolean(resetToken);

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[.9fr_1.1fr]"><Seo title={resetView ? "Reset password — Prompt-Gineer" : "Sign in — Prompt-Gineer"} description="Open your Prompt-Gineer workspace." path="/auth" noindex />
      <section className="relative hidden overflow-hidden bg-[#10192b] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14"><div className="hero-grid absolute inset-0 opacity-60" /><div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#2b7580]/30 blur-[100px]" /><div className="relative"><Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to home</Link><div className="mt-28 max-w-lg"><Badge className="border-[#55e0bd]/30 bg-[#55e0bd]/10 text-[#79edd0] hover:bg-[#55e0bd]/10"><Sparkles className="mr-2 h-3.5 w-3.5" /> Your ideas, with a clearer next step</Badge><h1 className="display-font mt-6 text-6xl font-semibold leading-[.96] tracking-[-.06em]">Make the blank page less intimidating.</h1><p className="mt-6 max-w-md text-base leading-7 text-slate-300">A focused workspace for building prompts that carry your intent — from the first rough thought to the final reusable system.</p><div className="mt-9 space-y-3 text-sm text-slate-300"><p className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#55e0bd]/15 text-[#79edd0]"><Check className="h-3.5 w-3.5" /></span> A six-part structure that stays out of your way</p><p className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#55e0bd]/15 text-[#79edd0]"><Check className="h-3.5 w-3.5" /></span> A private library for the systems worth repeating</p><p className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#55e0bd]/15 text-[#79edd0]"><Check className="h-3.5 w-3.5" /></span> A community full of useful starting points</p></div></div></div><div className="relative flex items-center justify-between border-t border-white/10 pt-5 text-xs text-slate-400"><span className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10"><PenLine className="h-3.5 w-3.5" /></span><span className="brand-wordmark font-bold text-white">Prompt-Gineer</span></span><span>Built for thoughtful work</span></div></section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-8"><div className="w-full max-w-md"><div className="mb-8 flex items-center justify-between lg:hidden"><Link to="/" className="flex items-center gap-2 font-bold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><PenLine className="h-4 w-4" /></span>Prompt-Gineer</Link><Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Back home</Link></div><div className="mb-9"><p className="eyebrow">{resetView ? "Account recovery" : "Welcome to the studio"}</p><h2 className="display-font mt-3 text-4xl font-semibold leading-none tracking-tight">{resetView ? "Choose a new password." : tab === "signin" ? "Pick up your thread." : "Make a little room for better work."}</h2><p className="mt-4 text-sm leading-6 text-muted-foreground">{resetView ? "Use a strong password you have not used elsewhere." : tab === "signin" ? "Sign in to your workspace, or open a local demo to explore the full product." : "Create an account to save your prompt systems and build a library over time."}</p></div>

        {resetView ? <form onSubmit={handleCompleteReset} className="space-y-4"><div><Label htmlFor="reset-password">New password</Label><div className="relative mt-2"><Input id="reset-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 12 characters" className="h-11 rounded-xl pr-11" required /><button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div><div><Label htmlFor="reset-confirm">Confirm password</Label><Input id="reset-confirm" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your password" className="mt-2 h-11 rounded-xl" required /></div>{error && <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm leading-5 text-destructive">{error}</div>}<Button type="submit" disabled={busy} className="h-11 w-full bg-primary font-bold hover:bg-primary/90">{busy ? "Updating..." : "Update password"}<ArrowRight className="h-4 w-4" /></Button><Link to="/auth" className="block text-center text-sm font-semibold text-accent hover:underline">Return to sign in</Link></form> : <><div className="mb-6 flex rounded-xl bg-secondary p-1"><button type="button" onClick={() => { setTab("signin"); setError(""); }} className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${tab === "signin" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>Sign in</button><button type="button" onClick={() => { setTab("signup"); setError(""); }} className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${tab === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>Create account</button></div><form onSubmit={handleSubmit} className="space-y-4">{tab === "signup" && <div><Label htmlFor="name">Your name</Label><Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex Morgan" className="mt-2 h-11 rounded-xl" /></div>}<div><Label htmlFor="email">Email address</Label><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className="mt-2 h-11 rounded-xl" required /></div><div><div className="flex items-center justify-between"><Label htmlFor="password">Password</Label>{tab === "signin" && <button type="button" className="text-xs font-semibold text-accent hover:underline" onClick={() => void handleResetRequest()}>Forgot password?</button>}</div><div className="relative mt-2"><Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 12 characters" className="h-11 rounded-xl pr-11" required /><button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>{tab === "signup" && <div><Label htmlFor="confirm-password">Confirm password</Label><Input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your password" className="mt-2 h-11 rounded-xl" required /></div>}{error && <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm leading-5 text-destructive">{error}</div>}<Button type="submit" disabled={busy} className="h-11 w-full bg-primary font-bold hover:bg-primary/90">{busy ? "Working..." : tab === "signin" ? "Sign in to workspace" : "Create my account"}<ArrowRight className="h-4 w-4" /></Button></form><div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-border" /><span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">or explore first</span><div className="h-px flex-1 bg-border" /></div><Button type="button" onClick={handleDemo} variant="outline" className="h-11 w-full rounded-xl border-accent/30 bg-accent/5 font-bold text-accent hover:bg-accent/10 hover:text-accent"><Sparkles className="h-4 w-4" /> Open the demo workspace</Button><p className="mt-6 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Demo data stays in this browser. Remote authentication and persistence are optional for local development.</p><p className="mt-8 text-center text-xs leading-5 text-muted-foreground">By continuing, you agree to our <Link to="/terms" className="font-semibold text-foreground underline-offset-4 hover:underline">Terms</Link> and <Link to="/privacy" className="font-semibold text-foreground underline-offset-4 hover:underline">Privacy Policy</Link>.</p></>}
        </div></section>
    </div>
  );
}
