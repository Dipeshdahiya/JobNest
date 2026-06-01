import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { Bell, Briefcase, MessageSquare, Search, Users, Check, Heart, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "@/lib/api/profileApi";
import { notificationApi } from "@/lib/api/notificationApi";

const typeConfig: Record<string, { icon: any; label: string }> = {
  connection_request: { icon: Users, label: "Connection Request" },
  message: { icon: MessageSquare, label: "New Message" },
  post_interaction: { icon: Heart, label: "Post Interaction" },
  application_update: { icon: Briefcase, label: "Application Update" },
  job_recommendation: { icon: Briefcase, label: "Job Recommendation" },
};

const formatTime = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

interface DashboardLayoutProps {
  role: "seeker" | "employer" | "admin";
}

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

const DashboardLayout = ({ role }: DashboardLayoutProps) => {
  const { sidebarOpen } = useStore();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Fetch profile for initials (seeker only; employer/admin will fallback to email)
  const { data: seekerProfile } = useQuery({
    queryKey: ['seekerProfile'],
    queryFn: profileApi.getSeekerMe,
    enabled: role === "seeker",
    retry: false,
  });

  const { data: notifications = [], isLoading: isNotificationsLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list(0, 50),
    refetchInterval: 15000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const displayName = role === "seeker" ? seekerProfile?.full_name : undefined;
  const initials = getInitials(displayName, user?.email);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const topNotifications = notifications.slice(0, 3);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/${role}/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar role={role} />
      <div className={cn("transition-all duration-300", sidebarOpen ? "ml-64" : "ml-20")}>
        <header className="h-16 glass-strong sticky top-0 z-30 flex items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search people, companies, or posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="relative" ref={ref}>
              <button
                onClick={() => setShowNotifs(v => !v)}
                className="relative w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full gradient-primary text-[10px] text-primary-foreground flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute right-0 top-11 w-80 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="text-sm font-semibold text-foreground">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllReadMutation.mutate()}
                        disabled={markAllReadMutation.isPending}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Check className="w-3 h-3" /> Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-border">
                    {topNotifications.length > 0 ? topNotifications.map((n) => {
                      const config = typeConfig[n.type] || { icon: Bell, label: n.type };
                      const Icon = config.icon;
                      let desc = "You have a new notification";
                      if (n.type === "connection_request") desc = "Someone sent you a connection request.";
                      if (n.type === "message") desc = "You received a new message.";
                      if (n.type === "post_interaction") desc = "Someone interacted with your post.";
                      if (n.type === "application_update") desc = "Your application status has been updated.";
                      if (n.type === "job_recommendation") desc = "A new job matches your profile.";
                      
                      return (
                        <div 
                           key={n.id} 
                           onClick={() => { if (!n.is_read) markReadMutation.mutate(n.id); }}
                           className={cn("flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 cursor-pointer transition-colors", !n.is_read && "bg-primary/5")}
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{config.label}</p>
                            <p className="text-xs text-muted-foreground truncate">{desc}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatTime(n.created_at)}</span>
                        </div>
                      );
                    }) : (
                      <div className="p-4 flex flex-col items-center text-center opacity-50">
                         <Bell className="w-6 h-6 mb-2" />
                         <span className="text-xs">No notifications</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => { setShowNotifs(false); navigate(`/${role}/notifications`); }}
                    className="w-full text-center text-xs text-primary py-2.5 hover:bg-secondary/50 transition-colors border-t border-border"
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm overflow-hidden">
              {seekerProfile?.profile_photo_url ? (
                <img src={seekerProfile.profile_photo_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
