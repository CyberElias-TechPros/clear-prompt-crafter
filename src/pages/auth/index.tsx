import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  Check,
  FileCode2,
  LockKeyhole,
  PenTool,
  Sparkles,
} from "lucide-react";

const AuthPage = () => {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState("sign-in");

  React.useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError("");
    if (!email || !password) {
      setAuthError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        setAuthError(error.message);
        toast.error(`Sign in failed: ${error.message}`);
      } else {
        toast.success("Signed in successfully!");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setAuthError("An unexpected error occurred. Please try again.");
      toast.error("An unexpected error occurred during sign in.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError("");
    if (!email || !password) {
      setAuthError("Please enter both email and password.");
      return;
    }
    if (password !== confirmPassword) {
      setAuthError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUp(email, password, fullName.trim() || undefined);
      if (error) {
        setAuthError(error.message);
        toast.error(`Sign up failed: ${error.message}`);
      } else {
        toast.success("Account created! You're now signed in.");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Sign up error:", error);
      setAuthError("An unexpected error occurred. Please try again.");
      toast.error("An unexpected error occurred during sign up.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f6] px-4 py-5 text-[#202031] sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#24223b] text-white transition-transform group-hover:-rotate-3"><PenTool className="h-4 w-4" /></span>
          <span className="text-sm font-extrabold tracking-[-0.05em]">Prompt<span className="text-[#6554dc]">-Gineer</span></span>
        </Link>
        <Link to="/" className="text-xs font-medium text-[#777887] transition-colors hover:text-[#5142bf]">Back to home</Link>
      </div>

      <main className="mx-auto grid max-w-[1100px] gap-8 py-10 sm:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:py-16">
        <section className="hidden min-h-[570px] flex-col justify-between overflow-hidden rounded-[28px] bg-[#202137] p-9 text-white shadow-[0_24px_70px_rgba(33,32,55,0.12)] lg:flex xl:p-11">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#c7c1ff]"><Sparkles className="h-3 w-3" /> Your prompt studio</div>
            <h1 className="mt-8 max-w-[390px] text-[42px] font-semibold leading-[1.05] tracking-[-0.065em]">Turn good ideas into <span className="text-[#aaa2ff]">clear instructions.</span></h1>
            <p className="mt-5 max-w-[350px] text-sm leading-7 text-white/60">Build a reusable prompt practice with thoughtful structure, practical feedback, and a library that stays yours.</p>
          </div>

          <div className="relative rounded-[20px] border border-white/10 bg-white/[0.045] p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7770ef] text-white"><FileCode2 className="h-4 w-4" /></span>
                <div><p className="text-xs font-semibold">A clearer brief</p><p className="mt-1 text-[10px] text-white/40">Four useful building blocks</p></div>
              </div>
              <LockKeyhole className="h-4 w-4 text-white/35" />
            </div>
            <div className="mt-4 space-y-3">
              {["Context", "Task", "Guidelines", "Constraints"].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-xl bg-white/[0.045] px-3 py-2.5">
                  <span className="font-mono text-[9px] font-bold text-[#aaa2ff]">0{index + 1}</span>
                  <span className="flex-1 text-[11px] font-medium text-white/80">{item}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8f86f6]" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/45"><Check className="h-3 w-3 text-[#a7e0b6]" />Private by default. Share only when you choose.</div>
        </section>

        <section className="mx-auto w-full max-w-[480px] lg:max-w-none">
          <div className="mb-7 lg:hidden">
            <span className="eyebrow">Prompt engineering, made clearer</span>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">Welcome to your prompt studio.</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Create a free account or sign in to pick up where you left off.</p>
          </div>
          <div className="mb-6 hidden lg:block">
            <p className="eyebrow">Your workspace is waiting</p>
            <h2 className="mt-3 text-[30px] font-semibold tracking-[-0.06em]">{activeTab === "sign-in" ? "Welcome back." : "Create your account."}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{activeTab === "sign-in" ? "Sign in to continue shaping your next prompt." : "A few details and you’re ready to build."}</p>
          </div>

          <Card className="overflow-hidden rounded-[24px] border-[#e8e7ed] bg-white shadow-[0_18px_50px_rgba(31,31,49,0.06)]">
            <CardContent className="p-5 sm:p-7">
              <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setAuthError(""); }} className="w-full">
                <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-[#f1f0f5] p-1">
                  <TabsTrigger value="sign-in" className="rounded-lg text-xs">Sign in</TabsTrigger>
                  <TabsTrigger value="sign-up" className="rounded-lg text-xs">Create account</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="mt-6">
                {activeTab === "sign-in" ? (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-semibold">Email address</Label>
                      <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                      <Input id="password" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                    </div>
                    {authError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">{authError}</div>}
                    <Button type="submit" className="h-11 w-full rounded-xl bg-[#6554dc] text-xs font-semibold text-white hover:bg-[#5142bf]" disabled={isLoading}>
                      {isLoading ? "Signing in…" : <>Sign in to your workspace <ArrowRight className="ml-1 h-4 w-4" /></>}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleSignUp} className="space-y-3.5">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-xs font-semibold">Name <span className="font-normal text-muted-foreground">· optional</span></Label>
                      <Input id="signup-name" type="text" autoComplete="name" placeholder="Ada Lovelace" value={fullName} onChange={(event) => setFullName(event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-xs font-semibold">Email address</Label>
                      <Input id="signup-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-xs font-semibold">Password <span className="font-normal text-muted-foreground">· at least 6 characters</span></Label>
                      <Input id="signup-password" type="password" autoComplete="new-password" placeholder="Create a password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-xs font-semibold">Confirm password</Label>
                      <Input id="confirm-password" type="password" autoComplete="new-password" placeholder="Enter your password again" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={6} />
                    </div>
                    {authError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">{authError}</div>}
                    <Button type="submit" className="h-11 w-full rounded-xl bg-[#6554dc] text-xs font-semibold text-white hover:bg-[#5142bf]" disabled={isLoading}>
                      {isLoading ? "Creating account…" : <>Create your account <ArrowRight className="ml-1 h-4 w-4" /></>}
                    </Button>
                  </form>
                )}
              </div>

              <p className="mt-5 text-center text-[10px] leading-5 text-muted-foreground">
                By continuing, you agree to our <Link to="/terms" className="font-medium text-[#5e50ca] underline-offset-2 hover:underline">Terms</Link> and <Link to="/privacy" className="font-medium text-[#5e50ca] underline-offset-2 hover:underline">Privacy Policy</Link>.
              </p>
            </CardContent>
          </Card>

          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground"><LockKeyhole className="h-3 w-3" />Your prompt drafts stay private unless you share them.</div>
        </section>
      </main>
    </div>
  );
};

export default AuthPage;
