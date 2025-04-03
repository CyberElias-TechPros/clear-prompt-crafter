
import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navigationVariants = cva(
  "group flex w-full items-center gap-x-2 rounded-md px-3 py-2 text-sm font-medium",
  {
    variants: {
      variant: {
        default:
          "bg-transparent text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
        ghost:
          "bg-transparent text-muted-foreground hover:bg-transparent hover:text-primary",
      },
      active: {
        true: "bg-secondary text-secondary-foreground",
        false: "",
      },
      disabled: {
        true: "pointer-events-none opacity-50",
        false: "",
      },
      external: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      active: false,
      disabled: false,
      external: false,
    },
  }
);

export interface NavigationProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost";
  active?: boolean;
  disabled?: boolean;
  external?: boolean;
  href?: string;
}

const Navigation = React.forwardRef<HTMLButtonElement, NavigationProps>(
  (
    {
      variant = "default",
      active = false,
      disabled = false,
      external = false,
      href,
      children,
      className,
      ...props
    },
    ref
  ) => {
    if (!href) {
      return (
        <button
          ref={ref}
          type="button"
          className={cn(
            navigationVariants({
              variant,
              active,
              disabled,
              className,
            })
          )}
          {...props}
        >
          {children}
        </button>
      );
    }

    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            navigationVariants({
              variant,
              active,
              disabled,
              external,
              className,
            })
          )}
        >
          {children}
          {external && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="ml-1 opacity-70"
            >
              <path
                d="M4.5 1V0H0V4.5H1V1.70625L4.64438 5.35063L5.35063 4.64438L1.70625 1H4.5Z"
                fill="currentColor"
              />
            </svg>
          )}
        </a>
      );
    }

    return (
      <Link
        to={href}
        className={cn(
          navigationVariants({
            variant,
            active,
            disabled,
            className,
          })
        )}
      >
        {children}
      </Link>
    );
  }
);

Navigation.displayName = "Navigation";

export interface SidebarNavItem {
  title: string;
  href?: string;
  icon?: React.ReactNode;
  external?: boolean;
  variant?: "default" | "ghost";
  disabled?: boolean;
  items?: SidebarNavItem[];
}

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  navItems: SidebarNavItem[];
  navFooter?: SidebarNavItem[];
  defaultCollapsed?: boolean;
}

export function Sidebar({
  defaultCollapsed = false,
  navItems,
  navFooter,
  className,
  ...props
}: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const isMobile = useIsMobile();
  const location = useLocation();
  const [open, setOpen] = React.useState(false);

  const renderNavItems = React.useCallback(
    (items: SidebarNavItem[]) => {
      return items.map((item, index) => {
        const active = item.href && location.pathname === item.href;

        if (item.items) {
          return (
            <div key={index} className="space-y-1">
              <div
                className={cn(
                  "text-xs font-semibold text-muted-foreground",
                  collapsed ? "text-center" : "px-3"
                )}
              >
                {!collapsed && item.title}
              </div>
              <div className="space-y-1">
                {renderNavItems(item.items)}
              </div>
            </div>
          );
        }

        return (
          <Navigation
            key={index}
            variant={item.variant}
            active={active}
            disabled={item.disabled}
            external={item.external}
            href={item.href}
            onClick={() => {
              if (isMobile) {
                setOpen(false);
              }
            }}
          >
            {item.icon && (
              <span
                className={cn("h-5 w-5", collapsed && "mx-auto", !item.title && "mx-auto")}
              >
                {item.icon}
              </span>
            )}
            {!collapsed && <span>{item.title}</span>}
          </Navigation>
        );
      });
    },
    [collapsed, location.pathname, isMobile]
  );

  if (isMobile) {
    return (
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
          <div
            className={cn(
              "flex h-full flex-col gap-y-4 overflow-hidden bg-background py-4",
              className
            )}
            {...props}
          >
            <div className="flex h-14 items-center justify-center border-b px-5">
              <Link to="/" className="flex items-center gap-2 font-semibold">
                <span className="font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
                  Prompt-Gineer
                </span>
              </Link>
            </div>
            <ScrollArea className="flex-1 overflow-auto py-2">
              <div className="space-y-6 px-4">
                {navItems.map((section, index) => {
                  if (section.items) {
                    return (
                      <div key={index} className="space-y-1">
                        <div className="px-2 text-xs font-semibold text-muted-foreground">
                          {section.title}
                        </div>
                        {renderNavItems(section.items)}
                      </div>
                    );
                  }

                  return renderNavItems([section]);
                })}
              </div>
            </ScrollArea>
            {navFooter && (
              <div className="border-t px-4 pt-4">
                {renderNavItems(navFooter)}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className={cn(
        "flex h-screen flex-col gap-y-4 overflow-hidden border-r bg-background py-4 transition-all",
        collapsed ? "w-[70px]" : "w-[240px]",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b px-5",
          collapsed && "justify-center px-0"
        )}
      >
        <Link
          to="/"
          className={cn("flex items-center gap-2 font-semibold", collapsed && "justify-center")}
        >
          <span className={cn("font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500", collapsed && "hidden")}>
            Prompt-Gineer
          </span>
        </Link>
      </div>
      <ScrollArea className="flex-1 overflow-auto">
        <div className={cn("space-y-6", collapsed && "px-2")}>
          {navItems.map((section, index) => {
            if (section.items) {
              return (
                <div key={index} className="space-y-2">
                  {renderNavItems([section])}
                </div>
              );
            }

            return renderNavItems([section]);
          })}
        </div>
      </ScrollArea>
      {navFooter && (
        <div className="border-t px-4 pt-4">
          {renderNavItems(navFooter)}
        </div>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="absolute bottom-4 right-4 h-8 w-8 rounded-full"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 rotate-180 transform"
          >
            <path
              d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z"
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
            ></path>
          </svg>
        ) : (
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
          >
            <path
              d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z"
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
            ></path>
          </svg>
        )}
      </Button>
    </div>
  );
}

// Export additional components for sidebar
export const SidebarHeader = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="flex h-14 items-center border-b px-5" {...props}>
    {children}
  </div>
);

export const SidebarContent = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <ScrollArea className="flex-1 overflow-auto">
    <div className="space-y-6 px-4" {...props}>
      {children}
    </div>
  </ScrollArea>
);

export const SidebarFooter = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="border-t px-4 pt-4" {...props}>
    {children}
  </div>
);

export const SidebarGroup = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="space-y-1" {...props}>
    {children}
  </div>
);

export const SidebarGroupLabel = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="px-3 text-xs font-semibold text-muted-foreground" {...props}>
    {children}
  </div>
);

export const SidebarGroupContent = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="space-y-1" {...props}>
    {children}
  </div>
);

export const SidebarMenu = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="space-y-1 py-1" {...props}>
    {children}
  </div>
);

export const SidebarMenuItem = ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
  <li className="list-none" {...props}>
    {children}
  </li>
);

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  NavigationProps
>(({ children, ...props }, ref) => (
  <Navigation ref={ref} {...props}>
    {children}
  </Navigation>
));
SidebarMenuButton.displayName = "SidebarMenuButton";

export const SidebarCollapseToggle = ({ onClick, collapsed, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { collapsed?: boolean }) => (
  <Button
    variant="ghost"
    size="icon"
    className="absolute bottom-4 right-4 h-8 w-8 rounded-full"
    onClick={onClick}
    {...props}
  >
    {collapsed ? (
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 rotate-180 transform"
      >
        <path
          d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z"
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
        ></path>
      </svg>
    ) : (
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
      >
        <path
          d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z"
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
        ></path>
      </svg>
    )}
  </Button>
);

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const SidebarTrigger = () => {
  const isMobile = useIsMobile();
  
  if (!isMobile) return null;
  
  return (
    <Button variant="outline" size="icon" className="h-10 w-10 md:hidden">
      <Menu className="h-5 w-5" />
      <span className="sr-only">Toggle Menu</span>
    </Button>
  );
};
