
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar, SidebarProps } from "@/components/ui/sidebar";
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
  Menu,
  PenTool,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, signOut, loading } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Prompts",
      href: "/prompts",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      title: "Community",
      href: "/community",
      icon: <Globe className="h-5 w-5" />,
    },
    {
      title: "Leaderboard",
      href: "/leaderboard",
      icon: <Trophy className="h-5 w-5" />,
    },
    {
      title: "AI Services",
      href: "/ai-services",
      icon: <Star className="h-5 w-5" />,
    },
  ];

  const navFooter = [
    {
      title: "Profile",
      href: "/profile",
      icon: <User className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  if (isMobile) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <div className="flex h-full flex-col gap-y-4 overflow-hidden bg-background py-4">
                <div className="flex h-14 items-center justify-center border-b px-5">
                  <Link to="/" className="flex items-center gap-2 font-semibold">
                    <PenTool className="h-6 w-6 text-primary" />
                    <span>Prompt-Gineer</span>
                  </Link>
                </div>
                <ScrollArea className="flex-1 overflow-auto py-2">
                  <div className="space-y-6 px-4">
                    {navItems.map((item, index) => (
                      <Link
                        key={index}
                        to={item.href}
                        className={cn(
                          "flex items-center gap-x-2 rounded-md px-3 py-2 text-sm font-medium",
                          location.pathname === item.href
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-transparent text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                        )}
                        onClick={() => setOpen(false)}
                      >
                        <span className="h-5 w-5">{item.icon}</span>
                        <span>{item.title}</span>
                      </Link>
                    ))}
                  </div>
                </ScrollArea>
                <div className="border-t px-4 pt-4">
                  {navFooter.map((item, index) => (
                    <Link
                      key={index}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-x-2 rounded-md px-3 py-2 text-sm font-medium",
                        location.pathname === item.href
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-transparent text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                      )}
                      onClick={() => setOpen(false)}
                    >
                      <span className="h-5 w-5">{item.icon}</span>
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
                Prompt-Gineer
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ModeToggle />
              <UserMenu user={user} signOut={signOut} />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="flex h-screen flex-col gap-y-4 overflow-hidden border-r bg-background py-4 transition-all w-[240px]">
        <div className="flex h-14 items-center border-b px-5">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold"
          >
            <PenTool className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">Prompt-Gineer</span>
          </Link>
        </div>
        <ScrollArea className="flex-1 overflow-auto">
          <div className="space-y-6 px-4">
            <div className="space-y-1">
              <div className="px-3 text-xs font-semibold text-muted-foreground">
                Navigation
              </div>
              <div className="space-y-1 py-1">
                {navItems.map((item, index) => (
                  <Link
                    key={index}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-x-2 rounded-md px-3 py-2 text-sm font-medium",
                      location.pathname === item.href || 
                      (item.href !== "/" && location.pathname.startsWith(item.href))
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-transparent text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                    )}
                  >
                    <span className="h-5 w-5">{item.icon}</span>
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="border-t px-4 pt-4">
          {navFooter.map((item, index) => (
            <Link
              key={index}
              to={item.href}
              className={cn(
                "flex items-center gap-x-2 rounded-md px-3 py-2 text-sm font-medium",
                location.pathname === item.href
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-transparent text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
              )}
            >
              <span className="h-5 w-5">{item.icon}</span>
              <span>{item.title}</span>
            </Link>
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
          <div className="flex flex-1 items-center justify-end">
            <div className="flex items-center gap-2">
              <ModeToggle />
              <UserMenu user={user} signOut={signOut} />
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
  );
}

function UserMenu({ user, signOut }: { user: any; signOut: () => Promise<void> }) {
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
