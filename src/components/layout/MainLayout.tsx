import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { ApiUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/ui/mode-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  BookOpenText,
  ChevronDown,
  FilePlus2,
  LayoutDashboard,
  LogOut,
  Menu,
  PenTool,
  Settings,
  Sparkles,
  Trophy,
  UserRound,
  UsersRound,
} from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

const navSections = [
  {
    label: "WORKSPACE",
    items: [
      { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { title: "New prompt", href: "/prompts/new", icon: FilePlus2 },
    ],
  },
  {
    label: "EXPLORE",
    items: [
      { title: "Community", href: "/community", icon: UsersRound },
      { title: "Leaderboard", href: "/leaderboard", icon: Trophy },
      { title: "AI services", href: "/ai-services", icon: Sparkles },
    ],
  },
];

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, signOut, loading } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = React.useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-primary border-t-transparent" aria-label="Loading workspace" />
      </div>
    );
  }

  const pageTitle =
    navSections.flatMap((section) => section.items).find((item) => item.href === location.pathname)?.title ??
    (location.pathname.startsWith("/templates/") ? "New template" : "Prompt studio");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-white/[0.08] bg-[#1d1e31] text-white lg:flex">
        <SidebarBrand />
        <SidebarNavigation pathname={location.pathname} />
        <SidebarBottom user={user} signOut={signOut} />
      </aside>

      <div className="min-h-screen lg:pl-[252px]">
        <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-xl">
          <div className="mx-auto flex h-[66px] max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-9">
            <div className="flex items-center gap-3">
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border bg-card lg:hidden" aria-label="Open navigation menu">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex w-[290px] flex-col border-[#303147] bg-[#1d1e31] p-0 text-white">
                  <SidebarBrand />
                  <SidebarNavigation pathname={location.pathname} onNavigate={() => setMenuOpen(false)} />
                  <SidebarBottom user={user} signOut={signOut} />
                </SheetContent>
              </Sheet>
              <Link to="/dashboard" className="flex items-center gap-2.5 lg:hidden">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#24223b] text-white"><PenTool className="h-4 w-4" /></span>
                <span className="text-sm font-extrabold tracking-[-0.045em]">Prompt-Gineer</span>
              </Link>
              <div className="hidden items-center gap-2 text-sm lg:flex">
                <span className="font-medium text-muted-foreground">Workspace</span>
                <span className="text-border">/</span>
                <span className="font-semibold text-foreground">{pageTitle}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden items-center gap-1.5 rounded-full border border-[#dcd9f4] bg-[#f3f1ff] px-3 py-1.5 text-[11px] font-semibold text-[#5f50ca] sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7565e3]" />
                Your prompt studio
              </span>
              <ModeToggle />
              <div className="hidden h-7 w-px bg-border sm:block" />
              <UserMenu user={user} signOut={signOut} />
            </div>
          </div>
        </header>

        <main className="mx-auto min-h-[calc(100vh-66px)] max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-9 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarBrand() {
  return (
    <div className="flex h-[84px] shrink-0 items-center border-b border-white/[0.08] px-5">
      <Link to="/dashboard" className="group flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#7770ef] text-white shadow-[0_7px_18px_rgba(102,91,225,0.25)] transition-transform group-hover:-rotate-3">
          <PenTool className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </span>
        <span>
          <span className="block text-[14px] font-extrabold tracking-[-0.045em] text-white">Prompt-Gineer</span>
          <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">Prompt studio</span>
        </span>
      </Link>
    </div>
  );
}

function SidebarNavigation({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-6" aria-label="Workspace navigation">
      {navSections.map((section) => (
        <div key={section.label} className="mb-7">
          <p className="mb-2 px-3 text-[9px] font-bold tracking-[0.17em] text-white/35">{section.label}</p>
          <div className="space-y-1">
            {section.items.map(({ title, href, icon: Icon }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
              return (
                <Link
                  key={href}
                  to={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-all",
                    active
                      ? "bg-white/[0.11] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                      : "text-white/58 hover:bg-white/[0.06] hover:text-white/90"
                  )}
                >
                  {active && <span className="absolute inset-y-2.5 left-0 w-[3px] rounded-r-full bg-[#aaa1ff]" />}
                  <Icon className={cn("h-[17px] w-[17px] transition-colors", active ? "text-[#c0baff]" : "text-white/45 group-hover:text-white/80")} />
                  <span>{title}</span>
                  {title === "New prompt" && <span className="ml-auto rounded-md bg-white/[0.1] px-1.5 py-0.5 text-[9px] font-bold text-white/55">NEW</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mx-2 mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.045] p-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#35334e] text-[#c4bdff]"><BookOpenText className="h-4 w-4" /></div>
        <p className="mt-3 text-xs font-semibold text-white/90">Make every instruction count.</p>
        <p className="mt-1 text-[11px] leading-5 text-white/45">Explore community prompts for practical starting points.</p>
        <Link to="/community" className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#c4bdff] transition-colors hover:text-white" onClick={onNavigate}>
          Browse examples <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </nav>
  );
}

function SidebarBottom({ user, signOut }: { user: ApiUser | null; signOut: () => Promise<void> }) {
  if (!user) return null;
  const initials = (user.full_name || user.email).slice(0, 1).toUpperCase();

  return (
    <div className="shrink-0 border-t border-white/[0.08] p-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9087ff]">
            <Avatar className="h-9 w-9 border border-white/10">
              <AvatarImage src={user.avatar_url || ""} alt={user.full_name || ""} />
              <AvatarFallback className="bg-[#39374f] text-xs font-bold text-[#d8d4ff]">{initials}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-white/90">{user.full_name || "Your account"}</span>
              <span className="mt-0.5 block truncate text-[10px] text-white/42">{user.email}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-white/35" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56">
          <DropdownMenuItem asChild><Link to="/profile"><UserRound className="mr-2 h-4 w-4" />Profile</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link to="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void signOut()} className="text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function UserMenu({ user, signOut }: { user: ApiUser | null; signOut: () => Promise<void> }) {
  if (!user) return null;
  const initials = (user.full_name || user.email).slice(0, 1).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 rounded-xl px-1.5 sm:px-2" aria-label="Open account menu">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={user.avatar_url || ""} alt={user.full_name || ""} />
            <AvatarFallback className="bg-[#eeecff] text-xs font-bold text-[#5548be]">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[130px] truncate text-xs font-semibold sm:block">{user.full_name || user.email}</span>
          <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-semibold">{user.full_name || "Your account"}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to="/profile"><UserRound className="mr-2 h-4 w-4" />Profile</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void signOut()} className="text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
