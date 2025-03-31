
"use client"

import * as React from "react"
import { ChevronLeft, Menu } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

const sidebarVariants = cva(
  "sidebar fixed inset-0 z-30 h-screen w-64 border-r border-sidebar-border bg-sidebar shadow-sm transition-transform",
  {
    variants: {
      collapsed: {
        true: "w-[72px]",
        false: "w-64",
      },
      expanded: {
        true: "translate-x-0",
        false: "-translate-x-full sm:translate-x-0",
      },
    },
    defaultVariants: {
      collapsed: false,
      expanded: false,
    },
  }
)

interface SidebarContext {
  expanded: boolean
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>
  collapsed: boolean
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}

const SidebarContext = React.createContext<SidebarContext>({
  expanded: false,
  setExpanded: () => undefined,
  collapsed: false,
  setCollapsed: () => undefined,
})

interface SidebarProviderProps {
  defaultExpanded?: boolean
  defaultCollapsed?: boolean
  children: React.ReactNode
}

export function SidebarProvider({
  defaultExpanded = false,
  defaultCollapsed = false,
  children,
}: SidebarProviderProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded)
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed)

  return (
    <SidebarContext.Provider
      value={{
        expanded,
        setExpanded,
        collapsed,
        setCollapsed,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebarContext() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider")
  }
  return context
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const { expanded, setExpanded, collapsed } = useSidebarContext()
  const isMobile = useMobile()

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setExpanded(false)
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [setExpanded])

  return (
    <>
      <div
        className={cn(sidebarVariants({ collapsed, expanded }), className)}
        {...props}
      />
      {expanded && isMobile && (
        <div
          className="fixed inset-0 z-20 bg-black/50"
          onClick={() => setExpanded(false)}
        />
      )}
    </>
  )
}

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarHeader({ className, ...props }: SidebarHeaderProps) {
  const { collapsed } = useSidebarContext()

  return (
    <div
      className={cn(
        "flex h-14 items-center px-4",
        collapsed ? "justify-center" : "justify-between",
        className
      )}
      {...props}
    />
  )
}

interface SidebarCollapseToggleProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function SidebarCollapseToggle({
  className,
  ...props
}: SidebarCollapseToggleProps) {
  const { collapsed, setCollapsed } = useSidebarContext()

  return (
    <button
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        className
      )}
      onClick={() => setCollapsed(!collapsed)}
      {...props}
    >
      <ChevronLeft
        className={cn(
          "h-4 w-4 transition-transform",
          collapsed && "rotate-180"
        )}
      />
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  )
}

interface SidebarTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function SidebarTrigger({ className, ...props }: SidebarTriggerProps) {
  const { expanded, setExpanded } = useSidebarContext()

  return (
    <button
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-accent hover:text-accent-foreground",
        className
      )}
      onClick={() => setExpanded(!expanded)}
      {...props}
    >
      <Menu className="h-4 w-4" />
      <span className="sr-only">Toggle Menu</span>
    </button>
  )
}

interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarContent({ className, ...props }: SidebarContentProps) {
  return (
    <div
      className={cn("flex-1 overflow-auto px-3 py-2", className)}
      {...props}
    />
  )
}

interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarFooter({ className, ...props }: SidebarFooterProps) {
  return <div className={cn("px-3 py-2", className)} {...props} />
}

interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarGroup({ className, ...props }: SidebarGroupProps) {
  return (
    <div className={cn("pb-4", className)} {...props} />
  )
}

interface SidebarGroupLabelProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarGroupLabel({
  className,
  ...props
}: SidebarGroupLabelProps) {
  const { collapsed } = useSidebarContext()

  if (collapsed) {
    return null
  }

  return (
    <div
      className={cn(
        "px-2 py-1 text-xs font-medium text-sidebar-foreground/60",
        className
      )}
      {...props}
    />
  )
}

interface SidebarGroupContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarGroupContent({
  className,
  ...props
}: SidebarGroupContentProps) {
  const { collapsed } = useSidebarContext()

  return (
    <div
      className={cn(
        "space-y-1",
        collapsed && "items-center justify-center",
        className
      )}
      {...props}
    />
  )
}

interface SidebarMenuProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarMenu({ className, ...props }: SidebarMenuProps) {
  return <div className={cn("space-y-1", className)} {...props} />
}

interface SidebarMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarMenuItem({
  className,
  ...props
}: SidebarMenuItemProps) {
  return <div className={cn(className)} {...props} />
}

const sidebarMenuButtonVariants = cva(
  "flex cursor-pointer items-center rounded-md px-2 py-1.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring",
  {
    variants: {
      active: {
        true: "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
        false: "",
      },
      collapsed: {
        true: "justify-center px-0",
        false: "",
      },
    },
    defaultVariants: {
      active: false,
      collapsed: false,
    },
  }
)

interface SidebarMenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof sidebarMenuButtonVariants> {
  asChild?: boolean
}

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuButtonProps
>(
  (
    { className, active, asChild = false, children, type = "button", ...props },
    ref
  ) => {
    const { collapsed } = useSidebarContext()
    const Comp = asChild ? "div" : "button"

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        className={cn(
          sidebarMenuButtonVariants({ active, collapsed }),
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"
