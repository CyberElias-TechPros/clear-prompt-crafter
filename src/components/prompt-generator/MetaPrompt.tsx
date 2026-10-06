
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckIcon,
  RotateCcwIcon,
  ClipboardIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useAIService } from "@/hooks/use-ai-service";
import type { PromptSectionDraft } from "./types";

interface MetaPromptProps {
  onPromptDataChange?: (sections: PromptSectionDraft[]) => void;
}

const clearFrameworkCriteria = [
  {
    title: "Concise",
    description: "Direct and to the point without unnecessary details",
    icon: "C",
    color: "text-blue-500 bg-blue-50",
  },
  {
    title: "Logical",
    description: "Well-structured with clear reasoning and flow",
    icon: "L",
    color: "text-green-500 bg-green-50",
  },
  {
    title: "Explicit",
    description: "Clear and unambiguous instructions with specific details",
    icon: "E",
    color: "text-purple-500 bg-purple-50",
  },
  {
    title: "Adaptive",
    description: "Flexible for different use cases and scenarios",
    icon: "A",
    color: "text-orange-500 bg-orange-50",
  },
  {
    title: "Reflective",
    description: "Encourages verification and consideration of output",
    icon: "R",
    color: "text-red-500 bg-red-50",
  },
];

const MetaPrompt: React.FC<MetaPromptProps> = ({ onPromptDataChange }) => {
  const { user } = useAuth();
  const { generateWithAI } = useAIService();
  const [promptDraft, setPromptDraft] = useState("");
  const [analysis, setAnalysis] = useState<string>("");
  const [improvedPrompt, setImprovedPrompt] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("prompt");

  // Update parent component with the meta prompt data
  useEffect(() => {
    if (onPromptDataChange && improvedPrompt) {
      onPromptDataChange([
        {
          type: "meta_prompt",
          content: improvedPrompt
        },
        {
          type: "analysis",
          content: analysis
        }
      ]);
    }
  }, [improvedPrompt, analysis, onPromptDataChange]);

  const analyzePrompt = async () => {
    if (promptDraft.trim() === "") return;

    setIsAnalyzing(true);
    setAnalysis("");
    setImprovedPrompt("");

    // Try an AI-powered analysis first; fall back to the local heuristic when
    // signed out or when generation fails.
    if (user) {
      const aiPrompt =
        `Analyze the following prompt draft using the CLEAR framework (Concise, Logical, Explicit, Adaptive, Reflective). ` +
        `First, give a Markdown section "# CLEAR Framework Analysis" with one "### <Letter>:" subsection per criterion ` +
        `(use ✅ Good, ⚠️ Improvement needed, etc.), each with 1-2 bullet points. ` +
        `Then output a second part starting with "# Improved Prompt" containing a rewritten, improved version of the prompt.\n\n` +
        `PROMPT DRAFT:\n${promptDraft}`;

      const result = await generateWithAI({ prompt: aiPrompt, max_tokens: 1200 });
      if (result.content) {
        const improvedIdx = result.content.search(/#\s*Improved Prompt/i);
        let analysisPart = result.content;
        let improvedPart = "";
        if (improvedIdx >= 0) {
          analysisPart = result.content.slice(0, improvedIdx);
          improvedPart = result.content.slice(improvedIdx).replace(/#\s*Improved Prompt\s*/i, "");
        }
        setAnalysis(analysisPart.trim());
        setImprovedPrompt(improvedPart.trim() || promptDraft);
        setIsAnalyzing(false);
        setActiveTab("analysis");
        toast.success("AI analysis complete!");
        return;
      }
    }

    // Heuristic fallback (offline).
    await new Promise((r) => setTimeout(r, 600));
    const analysisResult = generateAnalysis(promptDraft);
    setAnalysis(analysisResult.analysis);
    setImprovedPrompt(analysisResult.improved);
    setIsAnalyzing(false);
    setActiveTab("analysis");
    toast.success(user ? "Analysis complete (offline mode)." : "Analysis complete!");
  };

  const generateAnalysis = (prompt: string) => {
    // This is a simplified mock of what would normally be an AI-powered analysis
    const wordCount = prompt.split(/\s+/).filter(word => word.length > 0).length;
    const hasContext = prompt.toLowerCase().includes("context") || prompt.toLowerCase().includes("background");
    const hasTask = prompt.toLowerCase().includes("task") || prompt.toLowerCase().includes("create");
    const hasGuidelines = prompt.toLowerCase().includes("guidelines") || prompt.toLowerCase().includes("use");
    const hasConstraints = prompt.toLowerCase().includes("constraints") || prompt.toLowerCase().includes("don't");
    
    let analysis = "# CLEAR Framework Analysis\n\n";
    
    // Concise
    if (wordCount > 300) {
      analysis += "### Concise: ⚠️ Improvement needed\n";
      analysis += "- Your prompt is quite lengthy at " + wordCount + " words.\n";
      analysis += "- Consider removing redundant information or making explanations more direct.\n\n";
    } else if (wordCount < 50) {
      analysis += "### Concise: ⚠️ Too brief\n";
      analysis += "- Your prompt may be too short at " + wordCount + " words to provide sufficient detail.\n";
      analysis += "- While conciseness is good, ensure all necessary context is included.\n\n";
    } else {
      analysis += "### Concise: ✅ Good\n";
      analysis += "- Your prompt is appropriately sized at " + wordCount + " words.\n";
      analysis += "- It provides information without excessive verbosity.\n\n";
    }
    
    // Logical
    analysis += "### Logical: ";
    if (!hasContext || !hasTask) {
      analysis += "⚠️ Structure needs improvement\n";
      analysis += "- Your prompt ";
      if (!hasContext) analysis += "lacks clear context ";
      if (!hasContext && !hasTask) analysis += "and ";
      if (!hasTask) analysis += "doesn't clearly define the task";
      analysis += ".\n";
      analysis += "- Consider organizing into labeled sections (Context, Task, etc.).\n\n";
    } else {
      analysis += "✅ Well structured\n";
      analysis += "- Your prompt has a logical flow with context and clear tasks.\n\n";
    }
    
    // Explicit
    analysis += "### Explicit: ";
    if (!hasGuidelines) {
      analysis += "⚠️ Needs more specific details\n";
      analysis += "- Your prompt could benefit from clearer guidelines on implementation.\n";
      analysis += "- Add specific requirements, technologies, or approaches to use.\n\n";
    } else {
      analysis += "✅ Sufficiently detailed\n";
      analysis += "- Your prompt includes specific guidelines for implementation.\n\n";
    }
    
    // Adaptive
    analysis += "### Adaptive: ";
    if (prompt.includes("only") || prompt.includes("must") || prompt.includes("always")) {
      analysis += "⚠️ Could be more flexible\n";
      analysis += "- Your prompt contains rigid language that might limit creative solutions.\n";
      analysis += "- Consider allowing for alternatives where appropriate.\n\n";
    } else {
      analysis += "✅ Appropriately flexible\n";
      analysis += "- Your prompt allows room for different approaches to the problem.\n\n";
    }
    
    // Reflective
    analysis += "### Reflective: ";
    if (!hasConstraints) {
      analysis += "⚠️ Missing verification elements\n";
      analysis += "- Add constraints or verification steps to ensure quality output.\n";
      analysis += "- Consider requesting explanations or reasoning for key decisions.\n\n";
    } else {
      analysis += "✅ Includes verification\n";
      analysis += "- Your prompt includes constraints that help verify the quality of responses.\n\n";
    }
    
    // Generate improved prompt
    let improved = prompt;
    
    // If missing context
    if (!hasContext) {
      improved = "**Context:** [Add background information about the project, technologies used, and relevant details]\n\n" + improved;
    }
    
    // If missing task
    if (!hasTask) {
      improved += "\n\n**Task:** [Clearly define what needs to be done]";
    }
    
    // If missing guidelines
    if (!hasGuidelines) {
      improved += "\n\n**Guidelines:** [Add specific implementation details, coding styles, or approaches to use]";
    }
    
    // If missing constraints
    if (!hasConstraints) {
      improved += "\n\n**Constraints:** [Add limitations, requirements, or things to avoid]";
    }
    
    return {
      analysis,
      improved
    };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="grid grid-cols-1 gap-6 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-purple-700">
            Meta Prompting Analysis
          </CardTitle>
          <CardDescription>
            Submit your prompt draft for analysis using the CLEAR framework
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full mb-4">
                <TabsTrigger value="prompt" className="w-full">
                  Your Prompt
                </TabsTrigger>
                <TabsTrigger
                  value="analysis"
                  className="w-full"
                  disabled={!analysis}
                >
                  Analysis
                </TabsTrigger>
                <TabsTrigger
                  value="improved"
                  className="w-full"
                  disabled={!improvedPrompt}
                >
                  Improved Prompt
                </TabsTrigger>
              </TabsList>

              <TabsContent value="prompt" className="mt-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {clearFrameworkCriteria.map((criteria) => (
                      <div
                        key={criteria.title}
                        className="flex flex-col items-center p-3 border rounded-lg"
                      >
                        <div
                          className={`w-8 h-8 rounded-full ${criteria.color} flex items-center justify-center font-bold mb-2`}
                        >
                          {criteria.icon}
                        </div>
                        <h3 className="font-medium text-sm">{criteria.title}</h3>
                        <p className="text-xs text-center text-muted-foreground mt-1">
                          {criteria.description}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Textarea
                    placeholder="Paste your prompt draft here for analysis..."
                    className="min-h-[250px]"
                    value={promptDraft}
                    onChange={(e) => setPromptDraft(e.target.value)}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setPromptDraft("")}
                      disabled={promptDraft === ""}
                    >
                      <RotateCcwIcon className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                    <Button
                      onClick={analyzePrompt}
                      disabled={promptDraft.trim() === "" || isAnalyzing}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <ArrowRightIcon className="mr-2 h-4 w-4" />
                          Analyze Prompt
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="mt-0">
                <div className="prose max-w-none">
                  <div className="whitespace-pre-line bg-muted p-4 rounded-lg overflow-auto max-h-[500px]">
                    {analysis.split('\n').map((line, index) => {
                      if (line.startsWith('# ')) {
                        return <h2 key={index} className="text-xl font-bold mt-2 mb-4">{line.substring(2)}</h2>;
                      } else if (line.startsWith('### ')) {
                        const parts = line.substring(4).split(':');
                        return (
                          <div key={index} className="flex items-center mt-6 mb-2">
                            <Badge 
                              className={
                                parts[1]?.includes('✅') 
                                  ? "bg-green-100 text-green-800 mr-2" 
                                  : "bg-yellow-100 text-yellow-800 mr-2"
                              }
                            >
                              {parts[0]}
                            </Badge>
                            <span className="font-medium">{parts[1] || ""}</span>
                          </div>
                        );
                      } else if (line.startsWith('- ')) {
                        return <p key={index} className="ml-4 text-sm my-1">• {line.substring(2)}</p>;
                      } else {
                        return <p key={index} className="my-1">{line}</p>;
                      }
                    })}
                  </div>
                  
                  <div className="flex justify-between mt-4">
                    <Button variant="outline" onClick={() => setActiveTab("prompt")}>
                      Back to Prompt
                    </Button>
                    <Button 
                      onClick={() => setActiveTab("improved")}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      View Improved Prompt
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="improved" className="mt-0">
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg overflow-auto max-h-[500px] whitespace-pre-line">
                    {improvedPrompt}
                  </div>
                  
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveTab("analysis")}>
                      Back to Analysis
                    </Button>
                    <Button 
                      onClick={() => copyToClipboard(improvedPrompt)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <ClipboardIcon className="mr-2 h-4 w-4" />
                      Copy Improved Prompt
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetaPrompt;
