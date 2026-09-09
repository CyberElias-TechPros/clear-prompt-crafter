import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronRight,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Menu,
  PenLine,
  Settings,
  Sparkles,
  Trophy,
  User,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
}

type NavItem = { label: string; path: string; icon: React.ElementType; exact?: boolean };

const workspaceNav: NavItem[] = [
  { label: "Workspace", path: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Community library", path: "/community", icon: Users },
  { label: "AI services", path: "/ai-services", icon: Sparkles },
  { label: "Leaderboard", path: "/leaderboard", icon: Trophy },
];

const resourceNav: NavItem[] = [
  { label: "My profile", path: "/profile", icon: User },
  { label: "Settings", path: "/settings", icon: Settings },
];

function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className={cn("relative flex h-8 w-8 items-center justify-center rounded-[10px]", light ? "bg-white/10 text-white" : "bg-primary text-primary-foreground")}>
        <PenLine className="h-4 w-4" strokeWidth={2.5} />
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-accent ring-2 ring-background" />
      </span>
      <span className={cn("brand-wordmark text-[1.05rem] font-bold tracking-tight", light ? "text-white" : "text-foreground")}>Prompt-Gineer</span>
    </span>
  );
}

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.path : pathname === item.path || pathname.startsWith(`${item.path}/`);
}

function UserBadge() {
  const { user, isDemo } = useAuth();
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Workspace";
  const initials = name.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2">
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarFallback className="rounded-lg bg-accent/15 text-xs font-bold text-accent">{initials || "AM"}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold">{name}</p>
        <p className="truncate text-[0.68rem] text-muted-foreground">{isDemo ? "Demo workspace" : user?.email}</p>
      </div>
    </div>
  );
}

function WorkspaceNav({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const groups = [
    { label: "Build", items: workspaceNav },
    { label: "Account", items: resourceNav },
  ];

  return (
    <nav className="space-y-7" aria-label="Workspace navigation">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/45">{group.label}</p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(location.pathname, item);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "bg-sidebar-accent text-white shadow-sm" : "text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-white",
                  )}
                >
                  <Icon className={cn("h-[17px] w-[17px]", active ? "text-sidebar-primary" : "text-sidebar-foreground/45 group-hover:text-sidebar-primary")} />
                  <span>{item.label}</span>
                  {active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-sidebar-primary" />}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function WorkspaceSidebar({ onClose }: { onClose?: () => void }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = Boolean(onClose);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <aside className={cn("flex h-full w-[258px] shrink-0 flex-col bg-sidebar px-4 py-5 text-sidebar-foreground", isMobile && "w-full")}>
      <div className="mb-8 flex items-center justify-between px-2">
        <Link to="/dashboard" onClick={onClose}><Logo light /></Link>
        {isMobile && <Button onClick={onClose} variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"><X className="h-5 w-5" /></Button>}
      </div>
      <WorkspaceNav onNavigate={onClose} />
      <div className="mt-auto space-y-4">
        <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-4">
          <div className="mb-3 flex items-center gap-2 text-sidebar-primary"><Sparkles className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.13em]">Pro workspace</span></div>
          <p className="mb-3 text-xs leading-5 text-sidebar-foreground/60">Save unlimited prompt systems and keep your team in sync.</p>
          <Link to="/contact" onClick={onClose} className="inline-flex items-center gap-1 text-xs font-semibold text-white hover:text-sidebar-primary">Talk to our team <ArrowUpRight className="h-3 w-3" /></Link>
        </div>
        <UserBadge />
        <button type="button" onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent hover:text-white">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}

function PublicHeader() {
  const { user, enterDemo } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link to="/" aria-label="Prompt-Gineer home"><Logo /></Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex" aria-label="Public navigation">
          <a href="/#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
          <Link to="/community" className="transition-colors hover:text-foreground">Library</Link>
          <a href="/#pricing" className="transition-colors hover:text-foreground">Pricing</a>
        </nav>
        <div className="flex items-center gap-2.5">
          <ModeToggle />
          {user ? <Button asChild size="sm"><Link to="/dashboard">Open workspace</Link></Button> : <><Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to="/auth">Sign in</Link></Button><Button size="sm" onClick={enterDemo}>Try the demo <ArrowUpRight className="h-3.5 w-3.5" /></Button></>}
        </div>
      </div>
    </header>
  );
}

export default function PageLayout({ children }: PageLayoutProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const workspaceRoute = ["/dashboard", "/prompts", "/ai-services", "/profile", "/settings"].some((path) => location.pathname.startsWith(path));

  if (!workspaceRoute) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <main>{children}</main>
        <footer className="border-t bg-card/50">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <Link to="/"><Logo /></Link>
            <p>© {new Date().getFullYear()} Prompt-Gineer. Better inputs, better work.</p>
            <div className="flex gap-4"><Link to="/terms" className="hover:text-foreground">Terms</Link><Link to="/privacy" className="hover:text-foreground">Privacy</Link><Link to="/contact" className="hover:text-foreground">Contact</Link></div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="fixed inset-y-0 left-0 z-50 hidden lg:block"><WorkspaceSidebar /></div>
      {mobileOpen && <div className="fixed inset-0 z-50 bg-sidebar lg:hidden"><WorkspaceSidebar onClose={() => setMobileOpen(false)} /></div>}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-[258px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-3">
            <Button onClick={() => setMobileOpen(true)} variant="outline" size="icon" className="lg:hidden"><Menu className="h-5 w-5" /><span className="sr-only">Open navigation</span></Button>
            <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex"><span>Workspace</span><ChevronRight className="h-3.5 w-3.5" /><span className="font-medium text-foreground">{location.pathname.includes("ai-services") ? "AI services" : location.pathname.includes("profile") ? "Profile" : location.pathname.includes("settings") ? "Settings" : location.pathname.includes("community") ? "Community" : "Prompt studio"}</span></div>
          </div>
          <div className="flex items-center gap-2.5"><Link to="/contact" className="hidden items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground md:flex"><CircleHelp className="h-4 w-4" /> Support</Link><ModeToggle /><Link to="/prompts/new" className="hidden items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-accent-foreground shadow-sm transition-transform hover:-translate-y-0.5 sm:flex"><PenLine className="h-3.5 w-3.5" /> New prompt</Link></div>
        </header>
        <main className="min-w-0 flex-1"><div className="mx-auto w-full max-w-[1480px] px-5 py-7 lg:px-8 lg:py-9">{children}</div></main>
      </div>
    </div>
  );
}
