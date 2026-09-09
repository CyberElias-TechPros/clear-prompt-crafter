import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { LoaderCircle, PenLine } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><PenLine className="h-5 w-5" /></div>
          <LoaderCircle className="h-5 w-5 animate-spin text-accent" aria-label="Loading workspace" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to={`/auth?next=${encodeURIComponent(location.pathname)}`} replace />;
  return <>{children}</>;
}
