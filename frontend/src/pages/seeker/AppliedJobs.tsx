import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { applicationApi } from "@/lib/api/applicationApi";
import { jobApi, Job } from "@/lib/api/jobApi";
import { Loader2 } from "lucide-react";

const AppliedJobs = () => {
  const navigate = useNavigate();

  const { data: applications = [], isLoading: isLoadingApps } = useQuery({
    queryKey: ['myApplications'],
    queryFn: applicationApi.getMyApplications,
  });

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobApi.getJobs(), // fetch latest jobs to map details
  });

  if (isLoadingApps || isLoadingJobs) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Applied Jobs</h1>
      <div className="space-y-3">
        {applications.length > 0 ? applications.map((app) => {
          const jobData = jobs.find((j: Job) => j.id === app.job_id);
          const title = jobData?.title || `Job (ID: ${app.job_id.substring(0, 8)})`;
          const company = jobData?.company_name || 'Employer';
          const companyLogo = company.charAt(0).toUpperCase();

          return (
            <GlassCard key={app.id} hover className="flex items-center justify-between cursor-pointer" onClick={() => navigate(`/seeker/application/${app.id}`)}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                  {companyLogo}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground">{company} · Applied {new Date(app.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <Badge variant="outline" className="border-primary/30 text-primary capitalize">{app.status}</Badge>
            </GlassCard>
          );
        }) : (
          <GlassCard className="text-center py-12">
            <p className="text-muted-foreground">You haven't applied to any jobs yet.</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default AppliedJobs;
