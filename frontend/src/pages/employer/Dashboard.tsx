import { Briefcase, Users, Eye, TrendingUp, PlusCircle, ArrowRight, Clock, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import AnimatedCounter from "@/components/AnimatedCounter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { profileApi } from "@/lib/api/profileApi";
import { jobApi } from "@/lib/api/jobApi";

const EmployerDashboard = () => {
  const { user } = useAuth();

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['employerProfile'],
    queryFn: profileApi.getEmployerMe,
    retry: false
  });

  const { data: jobs, isLoading: isJobsLoading } = useQuery({
    queryKey: ['employerJobs'],
    queryFn: () => jobApi.getMyJobs(),
    enabled: !!profile // Only fetch jobs if profile exists
  });

  const isLoading = isProfileLoading || (profile && isJobsLoading);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Derive stats
  const totalJobs = jobs?.length || 0;
  // This is a naive stat since we don't fetch all applicants across all jobs right here 
  // without a unified endpoint, so we aggregate applicants_count from the jobs.
  const totalApplicants = jobs?.reduce((sum, job) => sum + (job.applications_count || 0), 0) || 0;
  const jobViews = jobs?.reduce((sum, job) => sum + (job.views_count || 0), 0) || 0;
  const activeJobs = jobs?.filter(j => j.status === 'open').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.email?.split('@')[0] || 'Employer'}!</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your job postings and applicants.</p>
        </div>
        <Link to="/employer/post-job">
          <Button className="gradient-primary text-primary-foreground border-0 hover:opacity-90" disabled={!profile}>
            <PlusCircle className="w-4 h-4 mr-2" /> Post New Job
          </Button>
        </Link>
      </div>

      {!profile && (
        <GlassCard className="border-warning border bg-warning/10">
          <h3 className="font-semibold text-warning">Company Profile Missing</h3>
          <p className="text-sm mt-1 text-warning/90">Please create your company profile before you can post jobs.</p>
          <Link to="/employer/profile">
             <button className="mt-3 text-sm font-medium bg-warning text-warning-foreground px-4 py-2 rounded-lg hover:opacity-90 transition">
               Create Profile
             </button>
          </Link>
        </GlassCard>
      )}

      {profile && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Jobs", value: totalJobs, icon: Briefcase },
              { label: "Total Applicants", value: totalApplicants, icon: Users },
              { label: "Job Views", value: jobViews, icon: Eye },
              { label: "Active Jobs", value: activeJobs, icon: Clock },
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

          {/* Recent Jobs Overview */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Your Recent Jobs</h2>
              <Link to="/employer/jobs" className="text-sm text-primary hover:underline flex items-center gap-1">
                Manage all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {jobs && jobs.length > 0 ? jobs.slice(0, 3).map((job) => (
                <GlassCard key={job.id} hover className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                      {job.title.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.applications_count || 0} applicants · {new Date(job.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`border-primary/30 text-xs ${job.status === 'open' ? 'text-primary' : 'text-muted-foreground'}`}>{job.status}</Badge>
                </GlassCard>
              )) : (
                <p className="text-sm text-muted-foreground">You haven't posted any jobs yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployerDashboard;
