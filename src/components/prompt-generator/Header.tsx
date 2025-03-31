
import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Header = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) => {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center p-4 md:p-6 border-b">
      <div className="flex flex-col space-y-2 mb-4 md:mb-0">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
          Prompt Engineering Assistant
        </h1>
        <p className="text-muted-foreground text-sm">
          Create effective, structured prompts for your AI projects
        </p>
      </div>
      
      <Tabs defaultValue={activeTab} className="w-full max-w-md">
        <TabsList className="w-full">
          <TabsTrigger
            value="structured"
            onClick={() => setActiveTab("structured")}
            className="w-full"
          >
            Structured
          </TabsTrigger>
          <TabsTrigger
            value="conversational"
            onClick={() => setActiveTab("conversational")}
            className="w-full"
          >
            Conversational
          </TabsTrigger>
          <TabsTrigger
            value="meta"
            onClick={() => setActiveTab("meta")}
            className="w-full"
          >
            Meta Prompting
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </header>
  );
};

export default Header;
