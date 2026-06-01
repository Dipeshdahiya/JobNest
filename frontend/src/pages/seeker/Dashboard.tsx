import { Link } from "react-router-dom";
import { Briefcase, Bookmark, Send, Eye, BrainCircuit, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import AnimatedCounter from "@/components/AnimatedCounter";
import JobCard from "@/components/JobCard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { profileApi } from "@/lib/api/profileApi";
import { jobApi, Job } from "@/lib/api/jobApi";
import { applicationApi } from "@/lib/api/applicationApi";

// Utility to safely retrieve the first letter
const getInitial = (name?: string) => name ? name.charAt(0).toUpperCase() : 'B';

// Utility to map backend Job to JobCard props
const mapJobToCard = (job: Job, savedJobIds: Set<string>) => ({
  id: job.id,
  title: job.title,
  company: job.company_name,
  companyLogo: getInitial(job.company_name),
  location: job.location || "Location Not Specified",
  type: job.job_type,
  salary: job.salary_min && job.salary_max 
    ? `${job.salary_currency || '$'}${job.salary_min} - ${job.salary_max}`
    : "Salary Not Specified",
  remote: job.is_remote,
  posted: new Date(job.created_at).toLocaleDateString(),
  skills: job.requirements ? job.requirements.split(',').map(s => s.trim()) : [],
  applicants: job.applications_count || 0,
  saved: savedJobIds.has(job.id),
});

const SeekerDashboard = () => {
  const { user } = useAuth();

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['seekerProfile'],
    queryFn: profileApi.getSeekerMe,
    retry: false // If 404, we don't retry continuously
  });

  const { data: recommendations, isLoading: isRecommendationsLoading } = useQuery({
    queryKey: ['jobRecommendations'],
    queryFn: jobApi.getRecommendations,
  });

  const { data: applications, isLoading: isApplicationsLoading } = useQuery({
    queryKey: ['myApplications'],
    queryFn: applicationApi.getMyApplications,
  });

  const { data: savedJobs, isLoading: isSavedJobsLoading } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: jobApi.getSavedJobs,
  });

  const isLoading = isProfileLoading || isRecommendationsLoading || isApplicationsLoading || isSavedJobsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate profile completion (comprehensive heuristic)
  let completion = 0;
  if (profile) {
    if (profile.headline) completion += 15;
    if (profile.about) completion += 20;
    if (profile.resume_url) completion += 20;
    if (profile.location) completion += 10;
    if (profile.experiences && profile.experiences.length > 0) completion += 15;
    if (profile.education_entries && profile.education_entries.length > 0) completion += 10;
    if (profile.languages && profile.languages.length > 0) completion += 10;
  }

  const savedJobIds = new Set((savedJobs || []).map(j => j.id));

  const statCards = [
    // { label: "Job Matches", value: recommendations?.length || 0, icon: Briefcase, color: "text-primary" },
    { label: "Saved Jobs", value: savedJobs?.length || 0, icon: Bookmark, color: "text-primary" },
    { label: "Applications", value: applications?.length || 0, icon: Send, color: "text-primary" },
    { label: "Profile Views", value: profile?.profile_views_count || 0, icon: Eye, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
      <h1 className="text-2xl font-bold text-foreground">Welcome back, {profile?.full_name || user?.email?.split('@')[0] || 'User'}! 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">Here's what's happening with your job search.</p>
      </div>

      {!profile && (
        <GlassCard className="border-warning border bg-warning/10">
          <h3 className="font-semibold text-warning">Profile Missing</h3>
          <p className="text-sm mt-1 text-warning/90">Please complete your profile to unlock all features, recommendations, and allow employers to find you.</p>
          <Link to="/seeker/profile">
             <button className="mt-3 text-sm font-medium bg-warning text-warning-foreground px-4 py-2 rounded-lg hover:opacity-90 transition">
               Create Profile
             </button>
          </Link>
        </GlassCard>
      )}

      {/* Profile completeness */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground text-sm">Profile Completeness</h3>
          <span className="text-sm font-semibold text-primary">{completion}%</span>
        </div>
        <Progress value={completion} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">Complete your profile to get better job matches.</p>
      </GlassCard>

      {/* Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <GlassCard key={s.label} hover>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
            <AnimatedCounter end={s.value} className="text-2xl font-bold text-foreground" />
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* AI Suggestions */}
      <GlassCard className="glow-sm hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Suggestions</h3>
            <p className="text-xs text-muted-foreground">Based on your profile and activity</p>
          </div>
        </div>
        <div className="space-y-3">
          {["Add more details to your profile — 15% more matches", "Update your bio — profiles with bios get 3x more views", "Check out new Remote roles matching your experience"].map((tip) => (
            <div key={tip} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
              <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-sm text-muted-foreground">{tip}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Recent Applications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Applications</h2>
          <Link to="/seeker/applied-jobs" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {applications && applications.length > 0 ? applications.slice(0, 3).map((app) => (
            <GlassCard key={app.id} hover className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-foreground font-bold text-sm">
                  {/* Fallback initials if full job company data isn't loaded with application */}
                  <Briefcase className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Application #{app.id.substring(0, 6)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs border-primary/30 text-primary capitalize">{app.status}</Badge>
            </GlassCard>
          )) : (
            <p className="text-sm text-muted-foreground">You haven't applied to any jobs yet.</p>
          )}
        </div>
      </div>

      {/* Job Matches */}
      <div className="hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recommended Jobs</h2>
          <Link to="/seeker/jobs" className="text-sm text-primary hover:underline flex items-center gap-1">
            Browse all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {recommendations && recommendations.length > 0 ? recommendations.slice(0, 4).map((job) => (
            <JobCard key={job.id} {...mapJobToCard(job, savedJobIds)} />
          )) : (
            <p className="text-sm text-muted-foreground col-span-2">Complete your profile to get job recommendations.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeekerDashboard;
