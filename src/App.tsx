import React, { lazy, Suspense, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoaderCircle, PenLine } from "lucide-react";
import { AuthProvider } from "@/contexts/AuthContext";
import PageLayout from "./components/layout/PageLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const LandingPage = lazy(() => import("./pages/landing"));
const AuthPage = lazy(() => import("./pages/auth"));
const Index = lazy(() => import("./pages/Index"));
const AIServicesPage = lazy(() => import("./pages/ai-services"));
const ConnectServicePage = lazy(() => import("./pages/ai-services/connect/[serviceId]"));
const CommunityPage = lazy(() => import("./pages/community"));
const PromptDetailPage = lazy(() => import("./pages/community/prompt/[id]"));
const NewPromptPage = lazy(() => import("./pages/prompts/new"));
const LeaderboardPage = lazy(() => import("./pages/leaderboard"));
const ProfilePage = lazy(() => import("./pages/profile"));
const SettingsPage = lazy(() => import("./pages/settings"));
const TermsPage = lazy(() => import("./pages/terms"));
const PrivacyPage = lazy(() => import("./pages/privacy"));
const ContactPage = lazy(() => import("./pages/contact"));
const NotFound = lazy(() => import("./pages/NotFound"));

function ProtectedWorkspace({ children }: { children: ReactNode }) {
  return <ProtectedRoute><PageLayout>{children}</PageLayout></ProtectedRoute>;
}

function PublicShell({ children }: { children: ReactNode }) {
  return <PageLayout>{children}</PageLayout>;
}

function RouteFallback() {
  return <div className="flex min-h-[50vh] items-center justify-center"><div className="flex flex-col items-center gap-3 text-muted-foreground"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><PenLine className="h-5 w-5" /></div><LoaderCircle className="h-5 w-5 animate-spin text-accent" aria-label="Loading page" /></div></div>;
}

const App = () => (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />

              <Route path="/dashboard" element={<ProtectedWorkspace><Index /></ProtectedWorkspace>} />
              <Route path="/prompts" element={<ProtectedWorkspace><Navigate to="/dashboard" replace /></ProtectedWorkspace>} />
              <Route path="/prompts/new" element={<ProtectedWorkspace><NewPromptPage /></ProtectedWorkspace>} />
              <Route path="/ai-services" element={<ProtectedWorkspace><AIServicesPage /></ProtectedWorkspace>} />
              <Route path="/ai-services/connect/:serviceId" element={<ProtectedWorkspace><ConnectServicePage /></ProtectedWorkspace>} />
              <Route path="/profile" element={<ProtectedWorkspace><ProfilePage /></ProtectedWorkspace>} />
              <Route path="/settings" element={<ProtectedWorkspace><SettingsPage /></ProtectedWorkspace>} />

              <Route path="/community" element={<PublicShell><CommunityPage /></PublicShell>} />
              <Route path="/community/prompt/:id" element={<PublicShell><PromptDetailPage /></PublicShell>} />
              <Route path="/leaderboard" element={<PublicShell><LeaderboardPage /></PublicShell>} />
              <Route path="/contact" element={<PublicShell><ContactPage /></PublicShell>} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
);

export default App;
