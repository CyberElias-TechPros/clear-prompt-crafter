import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PromptGuidelineCard from "@/components/prompt-guidelines/PromptGuidelineCard";
import { AdBanner } from "@/components/ads";

const debuggingTips = [
  "Always provide specific, detailed descriptions of what you want to achieve",
  "Break down complex problems into smaller, manageable steps",
  "Use clear, unambiguous language in your prompts",
  "Include relevant context and constraints",
  "Specify the desired outcome explicitly",
];

const bestPractices = [
  "Start with a clear context setting",
  "Define tasks with measurable outcomes",
  "Include specific guidelines and constraints",
  "Consider error handling and edge cases",
  "Review and iterate on your prompts",
];

const debugWorkflows = [
  "When something doesn't work, add more specificity to your request",
  "Use the console logs to understand how data is flowing through your application",
  "Isolate the problem area before attempting fixes",
  "For complex bugs, create a minimal reproducible example",
  "Add 'console.log' statements strategically to track the execution flow",
];

const promptRefinement = [
  "After initial results, refine prompts by adding more specific constraints",
  "Use the CLEAR framework: Concise, Logical, Explicit, Adaptive, Reflective",
  "For code generation, specify exact function signatures and return types",
  "Include examples of expected inputs and outputs for better understanding",
  "When refactoring, explicitly mention what should NOT change",
];

const AuthPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold text-center mb-8">Welcome to Prompt-Gineer</h1>
        
        <div className="max-w-4xl mx-auto space-y-8">
          <p className="text-center text-muted-foreground mb-8">
            Before you begin, here are some guidelines for effective prompt engineering
          </p>
          
          <div className="grid gap-6 md:grid-cols-2">
            <PromptGuidelineCard
              title="Debugging Best Practices"
              description="Tips for effective debugging with AI"
              content={debuggingTips}
              variant="debug"
            />
            
            <PromptGuidelineCard
              title="Prompt Engineering Guidelines"
              description="Best practices for writing effective prompts"
              content={bestPractices}
              variant="tip"
            />
          </div>

          <AdBanner size="medium" position="inline" className="my-8" />
          
          <div className="grid gap-6 md:grid-cols-2">
            <PromptGuidelineCard
              title="Debugging Workflows"
              description="Step-by-step approaches to solve problems"
              content={debugWorkflows}
              variant="warning"
            />
            
            <PromptGuidelineCard
              title="Prompt Refinement Techniques"
              description="How to iterate and improve your prompts"
              content={promptRefinement}
              variant="success"
            />
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg mt-8">
            <h2 className="text-xl font-semibold mb-4 text-purple-700 dark:text-purple-300">
              Why Good Prompts Matter
            </h2>
            <p className="text-muted-foreground">
              Clear, well-structured prompts lead to better results. They help the AI understand
              your needs and provide more accurate solutions. Remember to be specific,
              provide context, and break down complex requests into manageable steps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
