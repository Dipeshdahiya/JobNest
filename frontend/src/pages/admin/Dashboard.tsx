import { Users, Briefcase, FileText, Flag, TrendingUp, Loader2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import AnimatedCounter from "@/components/AnimatedCounter";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/adminApi";

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminApi.getStats(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform overview and management.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: stats.total_users, icon: Users },
              { label: "Total Jobs", value: stats.total_jobs, icon: Briefcase },
              { label: "Total Posts", value: stats.total_posts, icon: FileText },
              { label: "Applications", value: stats.total_applications, icon: Flag },
            ].map((s) => (
              <GlassCard key={s.label} hover>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <AnimatedCounter end={s.value} className="text-2xl font-bold text-foreground" />
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </GlassCard>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard>
              <h3 className="font-semibold text-foreground mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Employers</span>
                  <span className="text-sm font-semibold text-foreground">{stats.total_employers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Seekers</span>
                  <span className="text-sm font-semibold text-foreground">{stats.total_seekers.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Applications</span>
                  <span className="text-sm font-semibold text-primary">{stats.total_applications}</span>
                </div>
              </div>
            </GlassCard>
            <GlassCard>
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Growth
              </h3>
              <p className="text-sm text-muted-foreground">Platform acts robust based on loaded data. Metric displays are illustrative.</p>
              <div className="mt-4 h-32 bg-secondary/30 rounded-lg flex items-end justify-around px-4 pb-4">
                {[40, 65, 45, 80, 55, 90, Math.min(stats.total_users * 2, 100)].map((h, i) => (
                  <div key={i} className="w-8 gradient-primary rounded-t-md" style={{ height: `${h}%` }} />
                ))}
              </div>
            </GlassCard>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AdminDashboard;
