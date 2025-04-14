
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PromptGuidelineCard from "@/components/prompt-guidelines/PromptGuidelineCard";

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

const AuthPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user) {
      navigate("/");
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
            />
            
            <PromptGuidelineCard
              title="Prompt Engineering Guidelines"
              description="Best practices for writing effective prompts"
              content={bestPractices}
            />
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg mt-8">
            <h2 className="text-xl font-semibold mb-4 text-purple-700">
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
