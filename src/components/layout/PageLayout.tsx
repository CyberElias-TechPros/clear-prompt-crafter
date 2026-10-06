import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { ApiUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/ui/mode-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ChevronDown,
  FilePlus2,
  LayoutDashboard,
  LogOut,
  Menu,
  PenTool,
  Settings,
  Sparkles,
  Trophy,
  UserCog,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout = ({ children }: PageLayoutProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const links = [
    ...(user ? [
      { label: "Workspace", href: "/dashboard", icon: LayoutDashboard },
      { label: "New prompt", href: "/prompts/new", icon: FilePlus2 },
    ] : []),
    { label: "Community", href: "/community", icon: UsersRound },
    { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
    ...(user ? [{ label: "AI services", href: "/ai-services", icon: Sparkles }] : []),
    ...(user?.role === "admin" ? [{ label: "Ad manager", href: "/admin/ads", icon: UserCog }] : []),
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Signed out", description: "You have been signed out of your account." });
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({ title: "Sign out failed", description: "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1320px] items-center justify-between px-4 sm:px-7">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label="Prompt-Gineer home">
            <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#24223b] text-white shadow-sm transition-transform group-hover:-rotate-3">
              <PenTool className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <span className="text-[15px] font-extrabold tracking-[-0.05em]">Prompt-Gineer</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {links.map((link) => {
              const active = location.pathname === link.href || location.pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-[12px] font-semibold transition-colors",
                    active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <link.icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ModeToggle />
            {user && (
              <Button asChild size="sm" className="hidden h-9 rounded-xl px-3.5 sm:inline-flex">
                <Link to="/prompts/new"><FilePlus2 className="mr-1.5 h-3.5 w-3.5" />New prompt</Link>
              </Button>
            )}
            {user ? (
              <AccountMenu user={user} signOut={handleSignOut} />
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Button asChild variant="ghost" size="sm" className="rounded-xl text-muted-foreground">
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="h-9 rounded-xl px-4">
                  <Link to="/auth">Get started <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
                </Button>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl lg:hidden"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-border bg-background px-4 py-3 shadow-lg lg:hidden">
            <nav className="mx-auto grid max-w-[1320px] gap-1" aria-label="Mobile navigation">
              {links.map((link) => {
                const active = location.pathname === link.href || location.pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium", active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
              {!user && (
                <Button asChild className="mt-2 rounded-xl">
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Sign in or create an account <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-auto border-t border-border/80 bg-card/55">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-4 py-6 text-center sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:text-left">
          <Link to="/" className="flex items-center justify-center gap-2 text-xs font-bold tracking-[-0.03em] text-foreground sm:justify-start">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#24223b] text-white"><PenTool className="h-3.5 w-3.5" /></span>
            Prompt-Gineer
          </Link>
          <p className="text-[11px] text-muted-foreground">A clearer way to work with AI, one prompt at a time.</p>
          <nav className="flex justify-center gap-4 text-xs text-muted-foreground sm:justify-end" aria-label="Footer navigation">
            <Link to="/terms" className="transition-colors hover:text-primary">Terms</Link>
            <Link to="/privacy" className="transition-colors hover:text-primary">Privacy</Link>
            <Link to="/contact" className="transition-colors hover:text-primary">Contact</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

function AccountMenu({ user, signOut }: { user: ApiUser; signOut: () => Promise<void> }) {
  const initials = (user.full_name || user.email).slice(0, 1).toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 rounded-xl px-1.5 sm:px-2" aria-label="Open account menu">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={user.avatar_url || ""} alt={user.full_name || ""} />
            <AvatarFallback className="bg-[#eeecff] text-xs font-bold text-[#5548be]">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[120px] truncate text-xs font-semibold sm:block">{user.full_name || "Account"}</span>
          <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate font-semibold text-foreground">{user.full_name || "Your account"}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to="/profile"><UserRound className="mr-2 h-4 w-4" />Profile</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void signOut()} className="text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default PageLayout;
