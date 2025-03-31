
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import PageLayout from "./components/layout/PageLayout";
import Index from "./pages/Index";
import AuthPage from "./pages/auth";
import AIServicesPage from "./pages/ai-services";
import ConnectServicePage from "./pages/ai-services/connect/[serviceId]";
import CommunityPage from "./pages/community";
import PromptDetailPage from "./pages/community/prompt/[id]";
import LeaderboardPage from "./pages/leaderboard";
import ProfilePage from "./pages/profile";
import SettingsPage from "./pages/settings";
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
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Protected routes with PageLayout */}
            <Route path="/" element={
              <ProtectedRoute>
                <PageLayout>
                  <Index />
                </PageLayout>
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
            
            {/* Public routes with PageLayout */}
            <Route path="/community" element={
              <PageLayout>
                <CommunityPage />
              </PageLayout>
            } />
            <Route path="/community/prompt/:id" element={
              <PageLayout>
                <PromptDetailPage />
              </PageLayout>
            } />
            <Route path="/leaderboard" element={
              <PageLayout>
                <LeaderboardPage />
              </PageLayout>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
