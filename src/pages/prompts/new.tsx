import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";
import { PromptBuilder } from "@/components/prompt-generator";
import { type PromptRecord } from "@/lib/demo-data";

export default function NewPromptPage() {
  const navigate = useNavigate();
  const handleSaved = (_prompt: PromptRecord) => navigate("/profile");

  return (
    <div className="page-enter">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3"><Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to workspace</Link><div className="flex items-center gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5 text-accent" /> Private by default</span><Link to="/community" className="flex items-center gap-1.5 font-semibold text-accent hover:text-accent/80"><BookOpen className="h-3.5 w-3.5" /> Browse examples</Link></div></div>
      <PromptBuilder onSaved={handleSaved} />
    </div>
  );
}
