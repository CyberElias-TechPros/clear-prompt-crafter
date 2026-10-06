import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAIService } from "@/hooks/use-ai-service";
import type { PromptSectionDraft } from "./types";
import { ArrowRight, Bot, Copy, LockKeyhole, Sparkles, UserRound } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hi! Tell me what you are working on, who it is for, and what a useful result would look like. We can shape the details together.",
    timestamp: new Date(),
  },
];

interface ConversationalPromptProps {
  onPromptDataChange?: (sections: PromptSectionDraft[]) => void;
}

const suggestions = [
  "Plan an accessible onboarding flow",
  "Write a clear API documentation prompt",
  "Improve a prompt for code review",
];

const ConversationalPrompt: React.FC<ConversationalPromptProps> = ({ onPromptDataChange }) => {
  const { user } = useAuth();
  const { generateWithAI, platformAvailable } = useAIService();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [finalPrompt, setFinalPrompt] = useState("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (onPromptDataChange && finalPrompt) {
      onPromptDataChange([{ type: "conversation", content: finalPrompt }]);
    }
  }, [finalPrompt, onPromptDataChange]);

  const getLocalResponse = (userInput: string): string => {
    const lower = userInput.toLowerCase();
    if (lower.includes("login") || lower.includes("authentication")) {
      return "Let's shape an authentication prompt. Add the framework and sign-in method, the experience you want people to have, and any security or accessibility requirements. What should the finished flow include?";
    }
    if (lower.includes("help") || lower.includes("confused")) {
      return "No problem. Start with three things: what you are making, what you need the AI to produce, and any limits it should respect. We can add examples, edge cases, and formatting after that.";
    }
    if (lower.includes("example") || lower.includes("sample")) {
      return "Here is a useful starting structure:\n\nContext: You are a front-end engineer working on a React product.\n\nTask: Build a reusable, accessible product card with an image, title, price, and action.\n\nGuidelines: Use the project's existing styles and keep the layout responsive.\n\nConstraints: Do not add dependencies or change unrelated components.\n\nTell me what you would change for your project and we can refine it.";
    }
    return "I have the starting point. What should the AI know about the project, which technologies or audience matter, and what would a successful answer include?";
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;

    const userMessage: Message = { id: uuidv4(), role: "user", content: trimmed, timestamp: new Date() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsGenerating(true);

    let assistantContent = "";
    let usingAI = false;

    if (user) {
      try {
        const history = nextMessages.slice(-12).map(({ role, content }) => ({ role, content }));
        const result = await generateWithAI({ messages: history, max_tokens: 800 });
        if (result.content) {
          assistantContent = result.content;
          usingAI = true;
        }
      } catch {
        // An offline response keeps the interaction useful if the service is unavailable.
      }
    }

    if (!assistantContent) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      assistantContent = getLocalResponse(trimmed);
    }

    const assistantMessage: Message = { id: uuidv4(), role: "assistant", content: assistantContent, timestamp: new Date() };
    const nextConversation = [...nextMessages, assistantMessage];
    setMessages(nextConversation);
    setIsGenerating(false);
    setFinalPrompt(nextConversation.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join("\n\n"));

    if (!usingAI && user && !platformAvailable) {
      toast.info("Using the offline prompt coach. Connect an AI service for AI-powered suggestions.");
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const copyConversation = () => {
    const conversationText = messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join("\n\n");
    void navigator.clipboard
      .writeText(conversationText)
      .then(() => toast.success("Conversation copied to clipboard"))
      .catch(() => toast.error("Couldn't access the clipboard. Please copy the conversation manually."));
  };

  return (
    <section className="mx-auto max-w-[980px] overflow-hidden rounded-[20px] border border-border/80 bg-card shadow-[0_8px_30px_rgba(30,30,48,0.045)]">
      <header className="flex flex-col gap-3 border-b border-border/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#efedff] text-[#6554dc]"><Bot className="h-5 w-5" /></span>
          <div>
            <h2 className="text-sm font-semibold tracking-[-0.02em]">Prompt coach</h2>
            <p className="mt-1 text-[10px] text-muted-foreground">A guided conversation for your first draft</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground"><LockKeyhole className="h-3 w-3" />Private draft</span>
          <Button variant="outline" size="sm" onClick={copyConversation} disabled={messages.length <= 1} className="h-8 rounded-lg px-2.5 text-[10px]">
            <Copy className="mr-1.5 h-3 w-3" />Copy chat
          </Button>
        </div>
      </header>

      <ScrollArea className="h-[min(58vh,620px)] min-h-[350px] bg-[#fbfbfd] px-4 py-5 dark:bg-[#191a2a] sm:px-7 sm:py-7">
        <div className="mx-auto max-w-[700px] space-y-6">
          {messages.map((message, index) => (
            <div key={message.id} className={cn("flex gap-3", message.role === "user" && "flex-row-reverse")}>
              <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                <AvatarFallback className={message.role === "assistant" ? "bg-[#e9e6ff] text-[#5546c4]" : "bg-[#e9ecf3] text-[#545b6d]"}>
                  {message.role === "assistant" ? <Sparkles className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}
                </AvatarFallback>
              </Avatar>
              <div className={cn("flex max-w-[85%] flex-col", message.role === "user" && "items-end")}>
                <div className="mb-1.5 flex items-center gap-2 px-1">
                  <span className="text-[10px] font-semibold text-[#515262]">{message.role === "assistant" ? "Prompt coach" : "You"}</span>
                  <time className="text-[9px] text-[#a0a1ad]" dateTime={message.timestamp.toISOString()}>{message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
                </div>
                <div className={cn("rounded-2xl px-4 py-3 text-[12px] leading-[1.75] shadow-[0_2px_8px_rgba(25,27,49,0.035)] sm:text-[13px]", message.role === "user" ? "rounded-tr-md bg-[#6554dc] text-white" : "rounded-tl-md border border-[#e9e8ef] bg-white text-[#454655] dark:border-border dark:bg-[#25263a] dark:text-[#e0deed]")}>
                  <p className="whitespace-pre-line">{message.content}</p>
                </div>
                {index === 0 && messages.length === 1 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {suggestions.map((suggestion) => (
                      <button key={suggestion} type="button" onClick={() => setInput(suggestion)} className="rounded-full border border-[#e1dfef] bg-white px-3 py-1.5 text-[10px] dark:border-border dark:bg-[#242538] dark:text-[#d4d1e7] font-medium text-[#656575] transition-colors hover:border-[#c8c1f3] hover:bg-[#f5f3ff] hover:text-[#5546c4]">
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8"><AvatarFallback className="bg-[#e9e6ff] text-[#5546c4]"><Sparkles className="h-3.5 w-3.5 animate-pulse" /></AvatarFallback></Avatar>
              <div className="flex items-center gap-1 rounded-2xl border border-[#e9e8ef] bg-white px-4 py-3">
                {[0, 1, 2].map((dot) => <span key={dot} className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8b80e8]" style={{ animationDelay: `${dot * 120}ms` }} />)}
                <span className="ml-2 text-[10px] text-muted-foreground">Thinking through the brief</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border/80 bg-card p-3 sm:p-4">
        <div className="mx-auto flex max-w-[700px] items-center gap-2 rounded-2xl border border-[#e4e3eb] bg-white p-1.5 dark:border-border dark:bg-[#242538] pl-3 shadow-[0_3px_12px_rgba(30,30,48,0.04)] focus-within:border-[#c9c2f4]">
          <Input
            placeholder={user ? "Share what you are trying to make…" : "Type an idea to get started…"}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            className="h-10 min-w-0 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
            disabled={isGenerating}
            aria-label="Message the prompt coach"
          />
          <Button onClick={() => void handleSend()} disabled={!input.trim() || isGenerating} size="icon" className="h-10 w-10 shrink-0 rounded-xl bg-[#6554dc] text-white hover:bg-[#5142bf]" aria-label="Send message">
            {isGenerating ? <Sparkles className="h-4 w-4 animate-pulse" /> : <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mx-auto mt-2 max-w-[700px] text-center text-[9px] leading-4 text-muted-foreground">Press Enter to send. The conversation becomes your draft once you start.</p>
      </div>
    </section>
  );
};

export default ConversationalPrompt;
