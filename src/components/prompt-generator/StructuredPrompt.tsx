
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PlusIcon, ArrowRightIcon } from "lucide-react";
import { toast } from "sonner";
import PromptPreview from "./PromptPreview";

interface StructuredPromptProps {
  onPromptDataChange?: (sections: any[]) => void;
}

const sections = [
  {
    id: "context",
    title: "Context",
    description:
      "Define the background, role of the AI, and project-specific information",
    placeholder:
      "You are a full-stack developer building a secure login page using React and Supabase..."
  },
  {
    id: "task",
    title: "Task",
    description: "Specify what the project or component should do",
    placeholder:
      "Create a login component that includes email/password authentication..."
  },
  {
    id: "guidelines",
    title: "Guidelines",
    description:
      "Offer stylistic directions, preferred libraries, formatting, and coding standards",
    placeholder:
      "Use Tailwind CSS for styling, add inline code comments, and maintain a minimalistic design..."
  },
  {
    id: "constraints",
    title: "Constraints",
    description: "List any limits or must-avoid conditions",
    placeholder:
      "Do not modify other components or add any extra features beyond what is required..."
  }
];

const optionalSections = [
  {
    id: "errorHandling",
    title: "Error Handling",
    description: "Instructions for handling errors or edge cases",
    placeholder:
      "Handle network errors gracefully with user-friendly messages..."
  },
  {
    id: "security",
    title: "Security Constraints",
    description: "Security requirements or considerations",
    placeholder:
      "Ensure proper input validation and sanitization to prevent XSS attacks..."
  },
  {
    id: "performance",
    title: "Performance Requirements",
    description: "Performance expectations or optimization instructions",
    placeholder:
      "Optimize the component for fast loading times and responsive interactions..."
  }
];

const StructuredPrompt: React.FC<StructuredPromptProps> = ({ onPromptDataChange }) => {
  const [promptSections, setPromptSections] = useState<Record<string, string>>(
    Object.fromEntries(sections.map((section) => [section.id, ""]))
  );
  const [additionalSections, setAdditionalSections] = useState<string[]>([]);

  const handleSectionChange = (sectionId: string, content: string) => {
    setPromptSections((prev) => ({
      ...prev,
      [sectionId]: content
    }));
  };

  const addSection = (sectionId: string) => {
    if (!additionalSections.includes(sectionId)) {
      setAdditionalSections((prev) => [...prev, sectionId]);
      setPromptSections((prev) => ({
        ...prev,
        [sectionId]: ""
      }));
    }
  };

  const copyToClipboard = () => {
    const fullPrompt = generateFullPrompt();
    navigator.clipboard.writeText(fullPrompt);
    toast.success("Prompt copied to clipboard");
  };

  const generateFullPrompt = () => {
    let prompt = "";
    
    // Add core sections
    sections.forEach((section) => {
      if (promptSections[section.id]) {
        prompt += `**${section.title}:** ${promptSections[section.id]}\n\n`;
      }
    });
    
    // Add optional sections
    additionalSections.forEach((sectionId) => {
      const section = optionalSections.find((s) => s.id === sectionId);
      if (section && promptSections[sectionId]) {
        prompt += `**${section.title}:** ${promptSections[sectionId]}\n\n`;
      }
    });
    
    return prompt.trim();
  };

  // Prepare sections data for parent component
  useEffect(() => {
    if (onPromptDataChange) {
      const sectionsData = [
        ...sections
          .filter(section => promptSections[section.id]?.trim())
          .map(section => ({
            type: section.id,
            content: promptSections[section.id]
          })),
        ...additionalSections
          .filter(sectionId => promptSections[sectionId]?.trim())
          .map(sectionId => {
            const section = optionalSections.find(s => s.id === sectionId);
            return {
              type: sectionId,
              content: promptSections[sectionId]
            };
          })
      ];
      
      onPromptDataChange(sectionsData);
    }
  }, [promptSections, additionalSections, onPromptDataChange]);

  const allSectionsWithContent = sections.filter(
    (section) => promptSections[section.id].trim().length > 0
  );

  const isPromptComplete = allSectionsWithContent.length === sections.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 md:p-6">
      <div className="space-y-6">
        <div className="space-y-6">
          {sections.map((section) => (
            <Card key={section.id} className="animate-fade-in">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-purple-700">
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                  <div className="grid gap-2">
                    <Textarea
                      placeholder={section.placeholder}
                      className="min-h-[100px]"
                      value={promptSections[section.id]}
                      onChange={(e) =>
                        handleSectionChange(section.id, e.target.value)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Optional Sections */}
        <div className="space-y-4">
          <div className="flex items-center">
            <hr className="flex-grow border-t border-gray-200" />
            <span className="px-3 text-sm text-muted-foreground">
              Optional Sections
            </span>
            <hr className="flex-grow border-t border-gray-200" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {optionalSections
              .filter((section) => !additionalSections.includes(section.id))
              .map((section) => (
                <Button
                  key={section.id}
                  variant="outline"
                  className="border-dashed justify-start text-left font-normal"
                  onClick={() => addSection(section.id)}
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  {section.title}
                </Button>
              ))}
          </div>
        </div>

        {/* Added optional sections */}
        {additionalSections.length > 0 && (
          <div className="space-y-6 pt-4">
            {additionalSections.map((sectionId) => {
              const section = optionalSections.find((s) => s.id === sectionId);
              return (
                section && (
                  <Card key={sectionId} className="animate-fade-in">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-purple-700">
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {section.description}
                        </p>
                        <div className="grid gap-2">
                          <Textarea
                            placeholder={section.placeholder}
                            className="min-h-[100px]"
                            value={promptSections[sectionId]}
                            onChange={(e) =>
                              handleSectionChange(sectionId, e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Panel */}
      <div className="space-y-6">
        <PromptPreview 
          prompt={generateFullPrompt()} 
          isComplete={isPromptComplete}
          onCopy={copyToClipboard}
        />
      </div>
    </div>
  );
};

export default StructuredPrompt;
