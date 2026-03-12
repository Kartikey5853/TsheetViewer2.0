import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const syncTheme = (): void => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const toggleDark = (): void => {
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">TSheet Viewer</h1>
          <p className="text-xs text-muted-foreground">Academic Analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleDark}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium transition hover:-translate-y-0.5 hover:bg-accent"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {isDark ? "Light" : "Dark"}
          </button>
        </div>
      </div>
    </header>
  );
}
