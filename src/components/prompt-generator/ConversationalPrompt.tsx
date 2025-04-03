
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRightIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

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
    content:
      "Hi there! I'm your prompt engineering assistant. Let's work together to craft an effective prompt for your project. What are you looking to build today?",
    timestamp: new Date(),
  },
];

interface ConversationalPromptProps {
  onPromptDataChange?: (sections: any[]) => void;
}

const ConversationalPrompt: React.FC<ConversationalPromptProps> = ({ onPromptDataChange }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [finalPrompt, setFinalPrompt] = useState<string>("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update parent component with the conversation data
  useEffect(() => {
    if (onPromptDataChange && finalPrompt) {
      onPromptDataChange([
        {
          type: "conversation",
          content: finalPrompt
        }
      ]);
    }
  }, [finalPrompt, onPromptDataChange]);

  const handleSend = () => {
    if (input.trim() === "") return;

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);

    // Simulate AI response
    setTimeout(() => {
      // Add assistant message
      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: getAssistantResponse(input),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsGenerating(false);
      
      // Update the final prompt
      const updatedConversation = [...messages, userMessage, assistantMessage]
        .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n\n");
      
      setFinalPrompt(updatedConversation);
    }, 1000);
  };

  const getAssistantResponse = (userInput: string): string => {
    const userInputLower = userInput.toLowerCase();
    
    if (userInputLower.includes("hello") || userInputLower.includes("hi")) {
      return "Hello! How can I help you craft an effective prompt today?";
    }
    
    if (userInputLower.includes("login") || userInputLower.includes("authentication")) {
      return "I see you're working on authentication! Let's craft a prompt for that. Consider including:\n\n• What framework you're using (React, Vue, etc.)\n• Authentication method (JWT, OAuth, etc.)\n• Specific features (social login, 2FA, etc.)\n• Design requirements\n\nWould you like me to draft a structured prompt based on this information?";
    }
    
    if (userInputLower.includes("help") || userInputLower.includes("confused")) {
      return "I'm here to help! To create an effective prompt, try to include:\n\n1. Context: What are you building and what technologies are you using?\n2. Task: What specific component or feature do you need?\n3. Guidelines: Any particular coding style or libraries to use?\n4. Constraints: Any limitations or things to avoid?\n\nLet's start with what you're trying to build.";
    }
    
    if (userInputLower.includes("example") || userInputLower.includes("sample")) {
      return "Here's a sample structured prompt:\n\n**Context:** You are a front-end developer working on a React e-commerce website using Tailwind CSS.\n\n**Task:** Create a product card component that displays an image, title, price, and 'Add to Cart' button.\n\n**Guidelines:** Use Tailwind for styling, keep the design minimalist and modern, ensure it's fully responsive.\n\n**Constraints:** Don't use any third-party UI libraries, ensure accessibility compliance.\n\nWould you like to use this as a template?";
    }
    
    // Default response for other inputs
    return "I understand you're looking for assistance with prompt engineering. Could you provide more details about your project? What are you trying to build, what technologies are you using, and what specific guidance do you need?";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyConversation = () => {
    const conversationText = messages
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n\n");
    
    navigator.clipboard.writeText(conversationText);
    toast.success("Conversation copied to clipboard");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] p-4 md:p-6 overflow-hidden">
      <div className="flex-1 overflow-hidden relative border rounded-md">
        <ScrollArea className="h-full px-4 py-6">
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col space-y-2 max-w-[80%]",
                  message.role === "user"
                    ? "ml-auto items-end"
                    : "mr-auto items-start"
                )}
              >
                <div className="flex items-center space-x-2">
                  {message.role === "assistant" ? (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-purple-100 text-purple-700">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Badge variant="outline" className="bg-purple-50">
                      You
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div
                  className={cn(
                    "px-4 py-3 rounded-lg ",
                    message.role === "user"
                      ? "bg-purple-600 text-white"
                      : "bg-muted"
                  )}
                >
                  <p className="whitespace-pre-line">{message.content}</p>
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex space-x-2 items-center">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-purple-100 text-purple-700">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="flex space-x-1 items-center">
                  <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse delay-75"></div>
                  <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      <div className="mt-4 flex items-center space-x-2">
        <Input
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
          disabled={isGenerating}
        />
        <Button
          onClick={handleSend}
          disabled={input.trim() === "" || isGenerating}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <ArrowRightIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={copyConversation}
          disabled={messages.length <= 1}
        >
          Save Conversation
        </Button>
      </div>
    </div>
  );
};

export default ConversationalPrompt;
