import GlassCard from "@/components/GlassCard";
import JobCard from "@/components/JobCard";
import { useQuery } from "@tanstack/react-query";
import { jobApi, Job } from "@/lib/api/jobApi";
import { Loader2 } from "lucide-react";

const filterLabels = {
   "full-time": "Full-time",
   "part-time": "Part-time",
   "contract": "Contract",
   "freelance": "Freelance",
   "entry": "Entry Level",
   "mid": "Mid Level",
   "senior": "Senior Level",
   "director": "Director",
   "executive": "Executive"
};

const SavedJobs = () => {
  const { data: savedJobs, isLoading } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: jobApi.getSavedJobs,
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Saved Jobs</h1>
      
      {savedJobs && savedJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedJobs.map((job: Job) => {
            const mappedJob = {
              id: job.id,
              title: job.title,
              company: job.company_name || 'Employer',
              location: job.location || 'Remote',
              type: (filterLabels as any)[job.job_type] || job.job_type,
              salary: job.salary_min ? `$${Math.round(job.salary_min/1000)}k${job.salary_max ? ` - $${Math.round(job.salary_max/1000)}k` : '+'}` : 'Negotiable',
              posted: new Date(job.created_at).toLocaleDateString(),
              remote: job.is_remote,
              experience: (filterLabels as any)[job.experience_level] || job.experience_level,
              skills: [],
              companyLogo: job.company_name ? job.company_name.charAt(0).toUpperCase() : 'B',
              description: job.description,
              applicants: job.applicants_count || 0,
              saved: true
            };
            return <JobCard key={job.id} {...mappedJob} />;
          })}
        </div>
      ) : (
        <GlassCard className="text-center py-12">
          <p className="text-muted-foreground">No saved jobs yet.</p>
        </GlassCard>
      )}
    </div>
  );
};

export default SavedJobs;
