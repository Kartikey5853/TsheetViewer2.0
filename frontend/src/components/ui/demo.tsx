import { useEffect, useState } from "react";
import { Particles } from "@/components/ui/particles";

export function ParticlesDemo() {
  const [color, setColor] = useState("#000000");

  useEffect(() => {
    const syncThemeColor = (): void => {
      const isDark = document.documentElement.classList.contains("dark");
      setColor(isDark ? "#ffffff" : "#000000");
    };

    syncThemeColor();
    const observer = new MutationObserver(syncThemeColor);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="relative flex h-[420px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-background md:shadow-xl">
      <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-black to-gray-300/80 bg-clip-text text-center text-7xl font-semibold leading-none text-transparent dark:from-white dark:to-slate-900/10">
        Particles
      </span>
      <Particles className="absolute inset-0" quantity={100} ease={80} color={color} refresh />
    </div>
  );
}
