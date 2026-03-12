import { Grid2x2PlusIcon, MenuIcon, Moon, Sun } from "lucide-react";
import React from "react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet";

const links = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Visualizations", href: "/visualizations" },
  { label: "Data Viewer", href: "/data-viewer" },
  { label: "Compare", href: "/compare" },
];

export function FloatingHeader() {
  const [open, setOpen] = React.useState(false);
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const syncTheme = (): void => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-4 z-50",
        "mx-auto w-full max-w-6xl rounded-xl border border-border shadow-lg",
        "bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur-lg",
      )}
    >
      <nav className="mx-auto flex items-center justify-between p-2">
        <NavLink to="/dashboard" className="hover:bg-accent flex items-center gap-2 rounded-md px-2 py-1 duration-100">
          <Grid2x2PlusIcon className="size-5" />
          <p className="font-mono text-base font-bold">
            <span className="logo-gradient">TSheet</span> Viewer
          </p>
        </NavLink>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) =>
                cn(buttonVariants({ variant: "ghost", size: "sm" }), isActive ? "bg-accent text-accent-foreground" : "")
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              document.documentElement.classList.toggle("dark");
            }}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {isDark ? "Light" : "Dark"}
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <Button size="icon" variant="outline" onClick={() => setOpen(!open)} className="lg:hidden">
              <MenuIcon className="size-4" />
            </Button>
            <SheetContent
              className="bg-background/95 supports-[backdrop-filter]:bg-background/80 gap-0 backdrop-blur-lg"
              showClose={false}
              side="left"
            >
              <div className="grid gap-y-2 overflow-y-auto px-4 pt-12 pb-5">
                {links.map((link) => (
                  <NavLink
                    key={link.href}
                    to={link.href}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      buttonVariants({
                        variant: "ghost",
                        className: cn("justify-start", isActive ? "bg-accent text-accent-foreground" : ""),
                      })
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
              <SheetFooter>
                <Button asChild variant="outline">
                  <NavLink to="/">Upload New Sheet</NavLink>
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
