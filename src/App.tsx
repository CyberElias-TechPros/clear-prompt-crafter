
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import PageLayout from "./components/layout/PageLayout";
import MainLayout from "./components/layout/MainLayout";
import Index from "./pages/Index";
import LandingPage from "./pages/landing";
import AuthPage from "./pages/auth";
import AIServicesPage from "./pages/ai-services";
import ConnectServicePage from "./pages/ai-services/connect/[serviceId]";
import CommunityPage from "./pages/community";
import CommunityDetailPage from "./pages/community/detail";
import NewPromptPage from "./pages/prompts/new";
import NewTemplatePage from "./pages/templates/new";
import LeaderboardPage from "./pages/leaderboard";
import ProfilePage from "./pages/profile";
import SettingsPage from "./pages/settings"; 
import TermsPage from "./pages/terms";
import PrivacyPage from "./pages/privacy";
import ContactPage from "./pages/contact";
import AdManagerPage from "./pages/admin/ads";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public landing page */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Protected application routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/ai-services" element={
              <ProtectedRoute>
                <PageLayout>
                  <AIServicesPage />
                </PageLayout>
              </ProtectedRoute>
            } />
            <Route path="/ai-services/connect/:serviceId" element={
              <ProtectedRoute>
                <PageLayout>
                  <ConnectServicePage />
                </PageLayout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <PageLayout>
                  <ProfilePage />
                </PageLayout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <PageLayout>
                  <SettingsPage />
                </PageLayout>
              </ProtectedRoute>
            } />
            <Route path="/prompts/new" element={
              <ProtectedRoute>
                <MainLayout>
                  <NewPromptPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/templates/new" element={
              <ProtectedRoute>
                <MainLayout>
                  <NewTemplatePage />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/ads" element={
              <ProtectedRoute>
                <PageLayout>
                  <AdManagerPage />
                </PageLayout>
              </ProtectedRoute>
            } />
            
            {/* Public routes with PageLayout */}
            <Route path="/community" element={
              <PageLayout>
                <CommunityPage />
              </PageLayout>
            } />
            <Route path="/community/prompt/:id" element={
              <PageLayout>
                <CommunityDetailPage kind="prompt" />
              </PageLayout>
            } />
            <Route path="/community/template/:id" element={
              <PageLayout>
                <CommunityDetailPage kind="template" />
              </PageLayout>
            } />
            <Route path="/leaderboard" element={
              <PageLayout>
                <LeaderboardPage />
              </PageLayout>
            } />
            <Route path="/contact" element={
              <PageLayout>
                <ContactPage />
              </PageLayout>
            } />
            
            {/* Public standalone routes */}
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
