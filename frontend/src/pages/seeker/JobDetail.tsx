import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Clock, Users, Bookmark, Share2, ArrowLeft, Building2, BrainCircuit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GlassCard from "@/components/GlassCard";
import JobCard from "@/components/JobCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobApi, Job } from "@/lib/api/jobApi";
import { applicationApi } from "@/lib/api/applicationApi";
import { toast } from "@/hooks/use-toast";

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

const JobDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobApi.getJob(id!),
    enabled: !!id,
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ['recommendations'],
    queryFn: jobApi.getRecommendations,
  });

  const { data: savedJobs = [] } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: jobApi.getSavedJobs,
  });

  const { data: myApplications = [] } = useQuery({
    queryKey: ['myApplications'],
    queryFn: applicationApi.getMyApplications,
  });

  const isSaved = savedJobs.some(j => j.id === id);
  const hasApplied = myApplications.some((a: any) => a.job_id === id);

  const applyMutation = useMutation({
    mutationFn: () => applicationApi.apply({ job_id: id! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      toast({ title: "Application Submitted!", description: "Your profile and resume were sent successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Application failed", description: error.response?.data?.detail || "Could not submit application.", variant: "destructive" });
    }
  });

  const saveMutation = useMutation({
    mutationFn: () => jobApi.saveJob(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
      toast({ title: "Job target saved", description: "You can find it in your Saved Jobs list." });
    },
    onError: () => {
      toast({ title: "Save failed", description: "Could not save the job.", variant: "destructive" });
    }
  });

  const unsaveMutation = useMutation({
    mutationFn: () => jobApi.unsaveJob(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
      toast({ title: "Job removed", description: "Removed from your Saved Jobs." });
    },
    onError: () => {
      toast({ title: "Unsave failed", description: "Could not unsave the job.", variant: "destructive" });
    }
  });

  const toggleSave = () => {
     if (isSaved) {
        unsaveMutation.mutate();
     } else {
        saveMutation.mutate();
     }
  };

  const copyToClipboard = () => {
     navigator.clipboard.writeText(window.location.href);
     toast({ title: "Link Copied", description: "Job link copied to clipboard!" });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!job) {
    return <div className="text-center py-12"><p className="text-muted-foreground">Job not found.</p></div>;
  }

  const companyLogo = job.company_name ? job.company_name.charAt(0).toUpperCase() : 'B';
  const displaySalary = job.salary_min ? `$${Math.round(job.salary_min/1000)}k${job.salary_max ? ` - $${Math.round(job.salary_max/1000)}k` : '+'}` : 'Negotiable';

  return (
    <div className="space-y-6">
      <Link to="/seeker/jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <GlassCard>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                  {companyLogo}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Building2 className="w-4 h-4" /> {job.company_name || 'Employer'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={toggleSave}
                  disabled={saveMutation.isPending || unsaveMutation.isPending}
                  className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center transition-colors ${isSaved ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                >
                  <Bookmark className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} />
                </button>
                <button onClick={copyToClipboard} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <span className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="w-4 h-4" /> {job.location || 'Remote'}</span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="w-4 h-4" /> {new Date(job.created_at).toLocaleDateString()}</span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground"><Users className="w-4 h-4" /> {job.applications_count || 0} applicants</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {job.is_remote && <Badge className="gradient-primary text-primary-foreground border-0">Remote</Badge>}
              <Badge variant="outline" className="border-border text-muted-foreground">{(filterLabels as any)[job.job_type] || job.job_type}</Badge>
              <Badge variant="outline" className="border-border text-muted-foreground">{(filterLabels as any)[job.experience_level] || job.experience_level}</Badge>
              <Badge variant="outline" className="border-border text-foreground font-semibold">{displaySalary}</Badge>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => applyMutation.mutate()} 
                disabled={applyMutation.isPending || hasApplied}
                className="gradient-primary text-primary-foreground border-0 flex-1 h-12 hover:opacity-90"
              >
                {applyMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : hasApplied ? "Applied" : "Apply Now"}
              </Button>
              <Link to="/seeker/ai-match">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 h-12">
                  <BrainCircuit className="w-4 h-4 mr-2" /> Check Match
                </Button>
              </Link>
            </div>
          </GlassCard>

          {/* Description */}
          <GlassCard>
            <h2 className="text-lg font-semibold text-foreground mb-4">Job Description</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 whitespace-pre-wrap">{job.description}</p>
            {job.requirements && (
              <>
                <h3 className="text-md font-semibold text-foreground mb-2">Requirements</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 whitespace-pre-wrap">
                  {job.requirements}
                </p>
              </>
            )}
            {job.what_to_expect && (
              <>
                <h3 className="text-md font-semibold text-foreground mb-2">What to Expect</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 whitespace-pre-wrap">
                  {job.what_to_expect}
                </p>
              </>
            )}
            {job.additional_benefits && (
              <>
                <h3 className="text-md font-semibold text-foreground mb-2">Additional Benefits</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {job.additional_benefits}
                </p>
              </>
            )}
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <GlassCard>
            <h3 className="font-semibold text-foreground mb-4">About {job.company_name || 'Employer'}</h3>
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg mb-3">
              {companyLogo}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              This employer is actively hiring for this position on JobNest. Reach out and apply early to improve your chances.
            </p>
            <Button asChild variant="outline" className="w-full text-sm mt-1">
              <Link
                to={
                  job.employer_user_id
                    ? `/seeker/company/${job.employer_user_id}`
                    : "/seeker/jobs"
                }
              >
                View company profile
              </Link>
            </Button>
          </GlassCard>

          {recommendations && recommendations.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-4">Similar Jobs</h3>
              <div className="space-y-4">
                {recommendations.filter((j: Job) => j.id !== id).slice(0, 2).map((j: Job) => {
                  const rmapped = {
                    id: j.id,
                    title: j.title,
                    company: j.company_name || 'Employer',
                    location: j.location || 'Remote',
                    type: (filterLabels as any)[j.job_type] || j.job_type,
                    salary: j.salary_min ? `$${Math.round(j.salary_min/1000)}k${j.salary_max ? ` - $${Math.round(j.salary_max/1000)}k` : '+'}` : 'Negotiable',
                    posted: new Date(j.created_at).toLocaleDateString(),
                    remote: j.is_remote,
                    experience: (filterLabels as any)[j.experience_level] || j.experience_level,
                    skills: [],
                    companyLogo: j.company_name ? j.company_name.charAt(0).toUpperCase() : 'B',
                    description: j.description,
                    applicants: j.applications_count || 0,
                    saved: false
                  };
                  return <JobCard key={j.id} {...rmapped} />;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
