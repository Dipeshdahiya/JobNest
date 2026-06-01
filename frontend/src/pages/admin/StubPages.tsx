import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Ban, Eye, Trash2, CheckCircle, XCircle, Flag, BarChart3, TrendingUp, Users, Briefcase, FileText, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/adminApi";

export const ManageUsers = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "seeker" | "employer">("all");
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => adminApi.getUsers(),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => adminApi.deactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast({ title: "User Suspended", description: "The user has been deactivated." });
    }
  });

  const filtered = users.filter((u: any) =>
    (filter === "all" || u.role === filter) &&
    (u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Manage Users</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search users by email..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 p-1 glass rounded-xl w-fit">
          {(["all", "seeker", "employer"] as const).map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${filter === t ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length > 0 ? filtered.map((user: any) => {
          const name = user.email.split('@')[0];
          return (
            <GlassCard key={user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={`border-0 ${user.role === "seeker" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>{user.role}</Badge>
                <Badge className={`${user.is_active ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"} border-0`}>{user.is_active ? "Active" : "Inactive"}</Badge>
                <Button size="sm" variant="ghost" disabled={!user.is_active || deactivateMutation.isPending} onClick={() => deactivateMutation.mutate(user.id)}>
                  <Ban className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </GlassCard>
          );
        }) : (
          <p className="text-center text-muted-foreground py-8">No users found.</p>
        )}
      </div>
    </div>
  );
};

export const ManageJobs = () => {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['adminJobs'],
    queryFn: () => adminApi.getJobs(),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => adminApi.deactivateJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminJobs'] });
      toast({ title: "Job Removed", description: "The job has been archived." });
    }
  });

  const filtered = jobs.filter((j: any) =>
    j.title.toLowerCase().includes(search.toLowerCase()) || j.company_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Manage Jobs</h1>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search jobs..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length > 0 ? filtered.map((job: any) => (
          <GlassCard key={job.id} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                {job.company_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-foreground">{job.title}</p>
                <p className="text-sm text-muted-foreground">{job.company_name} · {job.location} · {job.employment_type}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/10 text-primary border-0">{job.status}</Badge>
              <Button size="sm" variant="ghost" disabled={job.status === "archived" || deactivateMutation.isPending} onClick={() => deactivateMutation.mutate(job.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </GlassCard>
        )) : (
          <p className="text-center text-muted-foreground py-8">No jobs found.</p>
        )}
      </div>
    </div>
  );
};

export const Moderation = () => {
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed" | "dismissed">("all");
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['adminReports'],
    queryFn: () => adminApi.getReports(),
  });

  const reviewMutation = useMutation({
    mutationFn: (id: string) => adminApi.reviewReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
      toast({ title: "Report Reviewed" });
    }
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => adminApi.dismissReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
      toast({ title: "Report Dismissed" });
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: (id: string) => adminApi.deletePost(id),
    onSuccess: () => {
      toast({ title: "Content Hidden", description: "The content was deleted successfully." });
    }
  });

  const filtered = filter === "all" ? reports : reports.filter((r: any) => r.status === filter);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Moderation Panel</h1>

      <div className="flex gap-1 p-1 glass rounded-xl w-fit">
        {(["all", "pending", "reviewed", "dismissed"] as const).map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${filter === t ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length > 0 ? filtered.map((report: any) => (
          <GlassCard key={report.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${report.status === "pending" ? "bg-yellow-500/10" : report.status === "reviewed" ? "bg-blue-500/10" : "bg-green-500/10"}`}>
                  {report.status === "pending" ? <AlertTriangle className="w-5 h-5 text-yellow-500" /> : report.status === "reviewed" ? <Eye className="w-5 h-5 text-blue-500" /> : <CheckCircle className="w-5 h-5 text-green-500" />}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{report.reason}</p>
                  <p className="text-xs text-muted-foreground">Reported by {report.reporter_id.slice(0, 8)}... · {new Date(report.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-secondary/50 border-0 text-xs">{report.target_type}</Badge>
                <Badge className={`border-0 text-xs ${report.status === "pending" ? "bg-yellow-500/10 text-yellow-500" : report.status === "reviewed" ? "bg-blue-500/10 text-blue-500" : "bg-green-500/10 text-green-500"}`}>
                  {report.status}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">Target ID: <span className="text-foreground font-mono">{report.target_id.slice(0, 12)}...</span></p>
              {report.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="text-xs h-7" disabled={dismissMutation.isPending} onClick={() => dismissMutation.mutate(report.id)}>Dismiss</Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7 text-blue-500" disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate(report.id)}>Mark Reviewed</Button>
                  {report.target_type === "post" && (
                     <Button size="sm" variant="ghost" className="text-xs h-7 text-yellow-500" disabled={deletePostMutation.isPending} onClick={() => deletePostMutation.mutate(report.target_id)}>Delete Content</Button>
                  )}
                </div>
              )}
            </div>
          </GlassCard>
        )) : (
          <p className="text-center text-muted-foreground py-8">No reports found.</p>
        )}
      </div>
    </div>
  );
};

export const Reports = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminApi.getStats(),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Platform Reports</h1>

      {isLoading ? (
        <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: stats.total_users, change: "+12%", icon: Users },
            { label: "Total Jobs", value: stats.total_jobs, change: "+8%", icon: Briefcase },
            { label: "Total Posts", value: stats.total_posts, change: "+15%", icon: FileText },
            { label: "Applications", value: stats.total_applications, change: "+5%", icon: Flag },
          ].map(s => (
            <GlassCard key={s.label}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><s.icon className="w-5 h-5 text-primary" /></div>
                <span className={`text-xs font-medium ${s.change.startsWith("+") ? "text-primary" : "text-destructive"}`}>{s.change}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </GlassCard>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> User Growth</h3>
          <div className="h-48 bg-secondary/30 rounded-lg flex items-end justify-around px-4 pb-4">
            {[40, 55, 45, 70, 65, 80, 75, 85, 90, 88, 95, 92].map((h, i) => (
              <div key={i} className="w-6 gradient-primary rounded-t-md" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2 px-2"><span>Jan</span><span>Jun</span><span>Dec</span></div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Job Categories</h3>
          <div className="space-y-4">
            {[
              { name: "IT & Development", pct: 85 },
              { name: "Design & Creative", pct: 70 },
              { name: "Marketing", pct: 55 },
              { name: "Engineering", pct: 45 },
              { name: "Finance", pct: 30 },
            ].map(cat => (
              <div key={cat.name}>
                <div className="flex justify-between text-sm mb-1"><span className="text-foreground">{cat.name}</span><span className="text-muted-foreground">{cat.pct}%</span></div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${cat.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-center p-4"><p className="text-muted-foreground text-sm">Activity feed currently not served by API.</p></div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
