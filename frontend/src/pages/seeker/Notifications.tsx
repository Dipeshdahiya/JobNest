import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Bell, Briefcase, MessageSquare, Users, Heart, Loader2, CheckCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi, Notification } from "@/lib/api/notificationApi";
import { toast } from "@/hooks/use-toast";

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

const Notifications = () => {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list(0, 50),
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: "All read", description: `Marked ${data.marked_read} notifications as read.` });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="border-primary text-primary"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <CheckCheck className="w-4 h-4 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n) => {
            const config = typeConfig[n.type] || { icon: Bell, label: n.type };
            const Icon = config.icon;
            return (
              <GlassCard
                key={n.id}
                hover
                className={`flex items-start gap-4 cursor-pointer ${n.is_read ? "" : "border-l-2 border-l-primary"}`}
                onClick={() => { if (!n.is_read) markReadMutation.mutate(n.id); }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${n.is_read ? "text-muted-foreground" : "font-medium text-foreground"}`}>{config.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {n.type === "connection_request" && "Someone sent you a connection request."}
                    {n.type === "message" && "You received a new message."}
                    {n.type === "post_interaction" && "Someone interacted with your post."}
                    {n.type === "application_update" && "Your application status has been updated."}
                    {n.type === "job_recommendation" && "A new job matches your profile."}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">{formatTime(n.created_at)}</span>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <GlassCard className="text-center py-20">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">No notifications</p>
          <p className="text-sm text-muted-foreground mt-1">You're all caught up!</p>
        </GlassCard>
      )}
    </div>
  );
};

export default Notifications;
