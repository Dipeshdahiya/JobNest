import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { profileApi } from "@/lib/api/profileApi";
import {
  LayoutDashboard, User, FileText, Search, Bookmark, Send, BrainCircuit,
  Bell, MessageSquare, Rss, Users, Hash, ChevronLeft, ChevronRight,
  Building2, PlusCircle, ClipboardList, BarChart3, UserCheck,
  Shield, Flag, LogOut
} from "lucide-react";

interface SidebarItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const seekerLinks: SidebarItem[] = [
  { to: "/seeker/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/seeker/profile", icon: User, label: "Profile" },
  { to: "/seeker/resume", icon: FileText, label: "Resume" },
  { to: "/seeker/jobs", icon: Search, label: "Find Jobs" },
  { to: "/seeker/saved-jobs", icon: Bookmark, label: "Saved Jobs" },
  { to: "/seeker/applied-jobs", icon: Send, label: "Applied Jobs" },
  { to: "/seeker/ai-match", icon: BrainCircuit, label: "AI Match" },
  { to: "/seeker/notifications", icon: Bell, label: "Notifications" },
  { to: "/seeker/messages", icon: MessageSquare, label: "Messages" },
  { to: "/seeker/social", icon: Rss, label: "Social Feed" },
  { to: "/seeker/connections", icon: Users, label: "Connections" },
  { to: "/seeker/trending", icon: Hash, label: "Trending" },
];

const employerLinks: SidebarItem[] = [
  { to: "/employer/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/employer/company-profile", icon: Building2, label: "Company Profile" },
  { to: "/employer/post-job", icon: PlusCircle, label: "Post Job" },
  { to: "/employer/manage-jobs", icon: ClipboardList, label: "Manage Jobs" },
  { to: "/employer/applicants", icon: UserCheck, label: "Applicants" },
];

const adminLinks: SidebarItem[] = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/users", icon: Users, label: "Manage Users" },
  { to: "/admin/jobs", icon: ClipboardList, label: "Manage Jobs" },
  { to: "/admin/moderation", icon: Shield, label: "Moderation" },
  { to: "/admin/reports", icon: Flag, label: "Reports" },
];

// Utility: get initials from a name or email
const getInitials = (name?: string, email?: string): string => {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (email) return email.substring(0, 2).toUpperCase();
  return "U";
};

interface AppSidebarProps {
  role: "seeker" | "employer" | "admin";
}

const AppSidebar = ({ role }: AppSidebarProps) => {
  const { sidebarOpen, toggleSidebar } = useStore();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Fetch profile for display name (seeker only)
  const { data: seekerProfile } = useQuery({
    queryKey: ['seekerProfile'],
    queryFn: profileApi.getSeekerMe,
    enabled: role === "seeker",
    retry: false,
  });

  const displayName = role === "seeker"
    ? (seekerProfile?.full_name || user?.email?.split('@')[0] || "User")
    : (user?.email?.split('@')[0] || "User");
  const initials = getInitials(
    role === "seeker" ? seekerProfile?.full_name : undefined,
    user?.email
  );

  const links = role === "seeker" ? seekerLinks : role === "employer" ? employerLinks : adminLinks;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full z-40 bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        sidebarOpen ? "w-64" : "w-20"
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {sidebarOpen && (
          <span className="text-lg font-bold text-foreground">
            Job<span className="text-primary">Nest</span>
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-sidebar-foreground hover:text-primary transition-colors ml-auto"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide">
        <ul className="space-y-1 px-3">
          {links.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  location.pathname === item.to
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm flex-shrink-0 overflow-hidden">
            {role === "seeker" && seekerProfile?.profile_photo_url ? (
              <img src={seekerProfile.profile_photo_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{role}</p>
            </div>
          )}
          {sidebarOpen && (
            <button
              onClick={logout}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
