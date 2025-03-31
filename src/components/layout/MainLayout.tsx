
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarCollapseToggle,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Settings,
  LogOut,
  User,
  Globe,
  Star,
  MessageSquare,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/ui/mode-toggle";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, signOut, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const menuItems = [
    {
      icon: Home,
      label: "Dashboard",
      href: "/",
    },
    {
      icon: MessageSquare,
      label: "Prompts",
      href: "/prompts",
    },
    {
      icon: Globe,
      label: "Community",
      href: "/community",
    },
    {
      icon: Trophy,
      label: "Leaderboard",
      href: "/leaderboard",
    },
    {
      icon: Star,
      label: "AI Services",
      href: "/ai-services",
    },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar menuItems={menuItems} activePath={location.pathname} />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
            <SidebarTrigger />
            <div className="flex flex-1 items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
                  Prompt-Gineer
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ModeToggle />
                <UserMenu />
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );

  function UserMenu() {
    if (!user) return null;
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.user_metadata?.avatar_url || ""} />
              <AvatarFallback>
                {user.user_metadata?.full_name?.[0] || user.email?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-0.5">
              <p className="text-sm font-medium">
                {user.user_metadata?.full_name || user.email}
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/profile" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut()}
            className="cursor-pointer text-red-500 hover:text-red-500 focus:text-red-500"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
}

interface AppSidebarProps {
  menuItems: {
    icon: React.FC<{ className?: string }>;
    label: string;
    href: string;
  }[];
  activePath: string;
}

function AppSidebar({ menuItems, activePath }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary/10 p-1.5">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <span className="font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
            Prompt-Gineer
          </span>
        </div>
        <SidebarCollapseToggle />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    active={
                      activePath === item.href ||
                      (item.href !== "/" && activePath.startsWith(item.href))
                    }
                    asChild
                  >
                    <Link to={item.href} className="w-full">
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-center p-2">
          <span className="text-xs text-sidebar-foreground/60">
            © 2023 Prompt-Gineer
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
