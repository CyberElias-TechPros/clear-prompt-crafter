
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { PenTool } from "lucide-react";

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
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    
    if (!email || !password) {
      setAuthError("Please enter both email and password");
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        setAuthError(error.message);
        toast.error("Sign in failed: " + error.message);
      } else {
        toast.success("Signed in successfully!");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setAuthError("An unexpected error occurred");
      toast.error("An unexpected error occurred during sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    
    if (!email || !password) {
      setAuthError("Please enter both email and password");
      return;
    }
    
    if (password !== confirmPassword) {
      setAuthError("Passwords don't match");
      return;
    }
    
    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters");
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await signUp(email, password, fullName.trim() || undefined);
      if (error) {
        setAuthError(error.message);
        toast.error("Sign up failed: " + error.message);
      } else {
        toast.success("Account created! You're now signed in.");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Sign up error:", error);
      setAuthError("An unexpected error occurred");
      toast.error("An unexpected error occurred during sign up");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <PenTool className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">Prompt-Gineer</h1>
            <p className="text-muted-foreground mt-2">
              Sign in to access your personalized prompt engineering workspace
            </p>
          </div>

          <Card>
            <CardHeader className="space-y-1">
              <Tabs defaultValue="sign-in" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="sign-in">Sign In</TabsTrigger>
                  <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>

            <CardContent className="p-6">
              {activeTab === "sign-in" ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  {authError && (
                    <div className="p-3 rounded-md bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-sm">
                      {authError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name (optional)</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Ada Lovelace"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  {authError && (
                    <div className="p-3 rounded-md bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-sm">
                      {authError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground mt-4">
            <p>
              By continuing, you agree to our{" "}
              <a href="/terms" className="underline hover:text-primary">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="underline hover:text-primary">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto py-8 px-4 mb-8">
        <h2 className="text-xl font-semibold text-center mb-8">Why Join Prompt-Gineer</h2>
        <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Access to AI Tools</CardTitle>
              <CardDescription>Connect and utilize various AI services</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Seamlessly integrate with popular AI services and optimize your prompts for best results.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Prompt Library</CardTitle>
              <CardDescription>Reuse and share effective prompts</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Build your personal collection of effective prompts or collaborate with the community.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
