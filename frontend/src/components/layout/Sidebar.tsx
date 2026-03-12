import { BarChart3, BarChart4, Home, Upload, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const links = [
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/visualizations", label: "Visualizations", icon: BarChart4 },
  { to: "/data-viewer", label: "Class Data", icon: Users },
];

export default function Sidebar() {
  return (
    <aside className="w-full border-b border-sidebar-border bg-sidebar p-3 md:h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="mb-4 flex items-center gap-2 rounded-xl bg-sidebar-accent px-3 py-2">
        <BarChart3 className="text-sidebar-primary" size={18} />
        <span className="text-sm font-semibold text-sidebar-accent-foreground">Teacher Panel</span>
      </div>
      <nav className="grid gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )
            }
          >
            <link.icon size={16} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
