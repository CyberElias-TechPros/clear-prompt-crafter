
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { UserCircle } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) => {
  const { user, signOut } = useAuth();

  return (
    <header className="flex flex-col md:flex-row justify-between items-center p-4 md:p-6 border-b">
      <div className="flex flex-col space-y-2 mb-4 md:mb-0">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
          Prompt-Gineer
        </h1>
        <p className="text-muted-foreground text-sm">
          Create effective, structured prompts for your AI projects
        </p>
      </div>
      
      <div className="flex items-center space-x-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
          <TabsList className="w-full">
            <TabsTrigger value="structured" className="w-full">
              Structured
            </TabsTrigger>
            <TabsTrigger value="conversational" className="w-full">
              Conversational
            </TabsTrigger>
            <TabsTrigger value="meta" className="w-full">
              Meta Prompting
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full">
              <UserCircle className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {user?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/ai-services">AI Services</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
