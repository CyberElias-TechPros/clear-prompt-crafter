import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, Clipboard, FileCode2, Sparkles } from "lucide-react";

interface PromptPreviewProps {
  prompt: string;
  isComplete: boolean;
  onCopy: () => void;
}

const PromptPreview: React.FC<PromptPreviewProps> = ({ prompt, isComplete, onCopy }) => {
  const wordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;

  return (
    <section className="overflow-hidden rounded-[20px] border border-[#282a40] bg-[#202137] text-white shadow-[0_18px_50px_rgba(30,29,54,0.16)]" aria-label="Prompt preview">
      <div className="border-b border-white/[0.08] px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.08] text-[#c4bdff]"><FileCode2 className="h-3.5 w-3.5" /></span>
              <h2 className="text-sm font-semibold tracking-[-0.02em]">Prompt preview</h2>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-white/45">Your brief, assembled as you write.</p>
          </div>
          {isComplete ? (
            <Badge className="h-6 gap-1 rounded-full border border-[#5eaa83]/20 bg-[#244d42] px-2.5 text-[9px] font-semibold text-[#a8ebc2] hover:bg-[#244d42]">
              <Check className="h-3 w-3" /> Ready
            </Badge>
          ) : (
            <Badge variant="outline" className="h-6 gap-1 rounded-full border-white/15 bg-white/[0.04] px-2.5 text-[9px] font-semibold text-white/55">
              <AlertCircle className="h-3 w-3" /> Draft
            </Badge>
          )}
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between rounded-t-xl border border-white/[0.08] bg-[#191a2a] px-3.5 py-2.5">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff817d]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#f1c46d]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#75cf9d]" />
          </div>
          <span className="font-mono text-[9px] tracking-wide text-white/35">PROMPT.TXT</span>
          <span className="text-[9px] text-white/35">{wordCount} words</span>
        </div>
        <div className="min-h-[280px] max-h-[calc(100vh-390px)] overflow-y-auto rounded-b-xl border-x border-b border-white/[0.08] bg-[#171827] p-4 sm:min-h-[340px] sm:p-5">
          {prompt ? (
            <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-[1.85] text-[#d9d9e4] sm:text-xs">{prompt}</pre>
          ) : (
            <div className="flex min-h-[245px] flex-col items-center justify-center px-5 text-center sm:min-h-[300px]">
              <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/[0.06] text-[#aaa3e6]"><Sparkles className="h-5 w-5" /></span>
              <p className="mt-4 text-xs font-semibold text-white/80">Your prompt will take shape here</p>
              <p className="mt-2 max-w-[215px] text-[10px] leading-5 text-white/40">Start with a little context. The preview updates as you fill in each section.</p>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <Button
            type="button"
            onClick={onCopy}
            className="h-11 w-full rounded-xl bg-[#8073f0] text-xs font-semibold text-white shadow-[0_8px_18px_rgba(114,100,225,0.18)] hover:bg-[#7164df]"
            disabled={!isComplete}
          >
            <Clipboard className="mr-1.5 h-4 w-4" />
            Copy finished prompt
          </Button>
          <p className="text-center text-[10px] leading-5 text-white/40">
            {isComplete ? "Ready to copy, refine, or take to your AI tool." : "Complete the four essentials to copy your finished prompt."}
          </p>
        </div>
      </div>
    </section>
  );
};

export default PromptPreview;
