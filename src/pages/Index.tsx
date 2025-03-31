
import React, { useState } from "react";
import Header from "@/components/prompt-generator/Header";
import StructuredPrompt from "@/components/prompt-generator/StructuredPrompt";
import ConversationalPrompt from "@/components/prompt-generator/ConversationalPrompt";
import MetaPrompt from "@/components/prompt-generator/MetaPrompt";

const Index = () => {
  const [activeTab, setActiveTab] = useState("structured");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1">
        {activeTab === "structured" && <StructuredPrompt />}
        {activeTab === "conversational" && <ConversationalPrompt />}
        {activeTab === "meta" && <MetaPrompt />}
      </main>
      <footer className="p-4 border-t text-center text-sm text-muted-foreground">
        <p>Prompt Engineering Assistant — Craft effective AI prompts with structured templates and guidance</p>
      </footer>
    </div>
  );
};

export default Index;
