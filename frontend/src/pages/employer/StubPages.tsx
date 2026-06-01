import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Building2, MapPin, Globe, Users, Mail, Phone, Edit, Briefcase, Eye, Trash2, CheckCircle, XCircle, Clock, ArrowLeft, Send, BarChart3, TrendingUp, UserCheck, Loader2, FileText, Download, BrainCircuit, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi, EmployerProfile } from "@/lib/api/profileApi";
import { jobApi } from "@/lib/api/jobApi";
import { applicationApi } from "@/lib/api/applicationApi";
import { userApi } from "@/lib/api/userApi";
import { aiApi } from "@/lib/api/aiApi";

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function scoreLabel(score: number) {
  if (score >= 85) return "Excellent Match";
  if (score >= 70) return "Great Match";
  if (score >= 50) return "Good Match";
  if (score >= 30) return "Partial Match";
  return "Low Match";
}

const company = {
  name: "TechCorp Inc.",
  logo: "T",
  tagline: "Building the future of technology",
  description: "TechCorp is a leading technology company specializing in cloud computing, AI, and enterprise solutions. We're on a mission to make technology accessible to everyone.",
  industry: "Technology",
  size: "500-1000 employees",
  founded: "2015",
  website: "https://techcorp.example.com",
  location: "San Francisco, CA",
  email: "hr@techcorp.example.com",
  phone: "+1 (555) 123-4567",
  benefits: ["Health Insurance", "401k", "Remote Work", "Unlimited PTO", "Learning Budget", "Stock Options"],
};

const employerJobs = [
  { id: "j1", title: "Senior React Developer", status: "Active", applicantCount: 45 },
  { id: "j2", title: "Backend Python Engineer", status: "Active", applicantCount: 78 },
  { id: "j3", title: "Product Designer", status: "Paused", applicantCount: 12 },
  { id: "j4", title: "DevOps Engineer", status: "Closed", applicantCount: 89 }
];

export const CompanyProfile = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['employerProfile'],
    queryFn: profileApi.getEmployerMe,
    retry: false
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Company Profile</h1>
        <GlassCard className="border-warning border bg-warning/10">
          <h3 className="font-semibold text-warning">Company Profile Missing</h3>
          <p className="text-sm mt-1 text-warning/90">Please create your company profile before you can post jobs.</p>
          <Button className="mt-4" onClick={() => navigate("/employer/edit-company")}>Create Profile</Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Company Profile</h1>
        <Button size="sm" variant="outline" className="border-border" onClick={() => navigate("/employer/edit-company")}>
          <Edit className="w-4 h-4 mr-2" /> Edit Profile
        </Button>
      </div>

      {/* Hero section with cover + logo, mirroring seeker company view */}
      <GlassCard className="relative overflow-hidden p-0 shadow-lg border-border/60">
        <div className="h-32 w-full overflow-hidden">
          {profile.cover_image_url ? (
            <img
              src={profile.cover_image_url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="h-full gradient-primary opacity-30" />
          )}
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 -mt-10">
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center font-bold text-2xl border-4 border-background flex-shrink-0 text-foreground overflow-hidden">
               {profile.logo_url ? (
                 <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover" />
               ) : (
                 profile.company_name.charAt(0).toUpperCase()
               )}
            </div>
            <div className="pt-6 sm:pt-8 flex-1">
              <h2 className="text-xl font-bold text-foreground">{profile.company_name}</h2>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                {profile.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.location}</span>}
                {profile.company_size && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{profile.company_size}</span>}
                {profile.industry && <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{profile.industry}</span>}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="shadow-sm border-border/60">
            <h3 className="font-semibold text-foreground mb-3">About</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{profile.description || "No description provided."}</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
              {profile.headquarters && (
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    Headquarters
                  </p>
                  <p>{profile.headquarters}</p>
                </div>
              )}
              {typeof profile.employees_count === "number" && (
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    Employees
                  </p>
                  <p>{profile.employees_count.toLocaleString()}</p>
                </div>
              )}
              {profile.founded_year && (
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    Founded
                  </p>
                  <p>{profile.founded_year}</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
        <div className="space-y-6">
          <GlassCard className="shadow-sm border-border/60">
            <h3 className="font-semibold text-foreground mb-3">Contact & Links</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><Globe className="w-4 h-4" />{profile.website || "Not provided"}</div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export const EditCompanyProfile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ['employerProfile'],
    queryFn: profileApi.getEmployerMe,
    retry: false
  });

  const [form, setForm] = useState<Partial<EmployerProfile>>({
    company_name: "",
    industry: "",
    location: "",
    website: "",
    company_size: "",
    description: "",
    headquarters: "",
    employees_count: undefined,
    founded_year: undefined,
    logo_url: "",
    cover_image_url: "",
  });

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  const createProfileMutation = useMutation({
    mutationFn: profileApi.createEmployerMe,
    onSuccess: (data) => {
      queryClient.setQueryData(['employerProfile'], data);
      toast({ title: "Profile created", description: "Your profile has been created successfully." });
      navigate("/employer/company-profile");
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map((e: any) => e.msg || JSON.stringify(e)).join('; ') : "An error occurred";
      toast({ title: "Failed to create profile", description: message, variant: "destructive" });
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: profileApi.updateEmployerMe,
    onSuccess: (data) => {
      queryClient.setQueryData(['employerProfile'], data);
      toast({ title: "Profile updated", description: "Your changes have been saved." });
      navigate("/employer/company-profile");
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map((e: any) => e.msg || JSON.stringify(e)).join('; ') : "An error occurred";
      toast({ title: "Failed to update profile", description: message, variant: "destructive" });
    }
  });

  const handleSave = () => {
    if (!form.company_name?.trim()) {
       toast({ title: "Validation error", description: "Company Name is required.", variant: "destructive" });
       return;
    }
    if (profile) {
      updateProfileMutation.mutate(form);
    } else {
      createProfileMutation.mutate(form as EmployerProfile);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{profile ? "Edit Company Profile" : "Create Company Profile"}</h1>
        <Button variant="ghost" size="sm" onClick={() => navigate("/employer/company-profile")} className="text-muted-foreground">Cancel</Button>
      </div>

      <GlassCard className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="text-sm text-muted-foreground mb-1 block">Company Name</label><Input value={form.company_name || ""} onChange={e => setForm({...form, company_name: e.target.value})} maxLength={255}/></div>
          <div><label className="text-sm text-muted-foreground mb-1 block">Industry</label><Input value={form.industry || ""} onChange={e => setForm({...form, industry: e.target.value})} maxLength={100}/></div>
          <div><label className="text-sm text-muted-foreground mb-1 block">Location</label><Input value={form.location || ""} onChange={e => setForm({...form, location: e.target.value})} maxLength={100}/></div>
          <div><label className="text-sm text-muted-foreground mb-1 block">Website</label><Input value={form.website || ""} onChange={e => setForm({...form, website: e.target.value})} maxLength={255}/></div>
          <div><label className="text-sm text-muted-foreground mb-1 block">Company Size</label><Input value={form.company_size || ""} onChange={e => setForm({...form, company_size: e.target.value})} placeholder="e.g. 50-200" maxLength={50}/></div>
          <div><label className="text-sm text-muted-foreground mb-1 block">Headquarters</label><Input value={form.headquarters || ""} onChange={e => setForm({...form, headquarters: e.target.value})} maxLength={255}/></div>
          <div><label className="text-sm text-muted-foreground mb-1 block">Employees (approx.)</label><Input type="number" value={form.employees_count ?? ""} onChange={e => setForm({...form, employees_count: e.target.value ? Number(e.target.value) : undefined})} /></div>
          <div><label className="text-sm text-muted-foreground mb-1 block">Founded Year</label><Input type="number" value={form.founded_year ?? ""} onChange={e => setForm({...form, founded_year: e.target.value ? Number(e.target.value) : undefined})} /></div>
          <div><label className="text-sm text-muted-foreground mb-1 block">Logo URL</label><Input value={form.logo_url || ""} onChange={e => setForm({...form, logo_url: e.target.value})} placeholder="https://..." /></div>
          <div><label className="text-sm text-muted-foreground mb-1 block">Cover Image URL</label><Input value={form.cover_image_url || ""} onChange={e => setForm({...form, cover_image_url: e.target.value})} placeholder="https://..." /></div>
        </div>
        <div><label className="text-sm text-muted-foreground mb-1 block">Description</label><Textarea value={form.description || ""} onChange={e => setForm({...form, description: e.target.value})} rows={6} maxLength={2000}/></div>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => navigate("/employer/company-profile")} disabled={updateProfileMutation.isPending || createProfileMutation.isPending}>Cancel</Button>
          <Button className="gradient-primary text-primary-foreground border-0" onClick={handleSave} disabled={updateProfileMutation.isPending || createProfileMutation.isPending}>
            {updateProfileMutation.isPending || createProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};

export const PostJob = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    location: "",
    type: "full_time",
    salary_min: "",
    salary_max: "",
    description: "",
    requirements: "",
    what_to_expect: "",
    additional_benefits: "",
    openings: "1",
    experience_level: "mid",
    remote: false,
  });

  const createJobMutation = useMutation({
    mutationFn: jobApi.createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employerJobs'] });
      toast({ title: "Job Posted!", description: "Your job listing is now live." });
      navigate("/employer/manage-jobs");
    },
    onError: (error: any) => {
       const detail = error.response?.data?.detail;
       const message = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map((e: any) => e.msg || JSON.stringify(e)).join('; ') : "An error occurred";
       toast({ title: "Failed to post job", description: message, variant: "destructive" });
    }
  });

  const handlePost = () => {
    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.location.trim() ||
      !form.requirements.trim() ||
      !form.what_to_expect.trim()
    ) {
      toast({
        title: "Validation error",
        description: "Title, job description, requirements, what to expect, and location are required.",
        variant: "destructive",
      });
      return;
    }

    const openingsNumber = form.openings ? Number(form.openings) : NaN;
    if (!openingsNumber || openingsNumber <= 0) {
      toast({
        title: "Validation error",
        description: "Number of openings must be at least 1.",
        variant: "destructive",
      });
      return;
    }

    createJobMutation.mutate({
      title: form.title.trim(),
      description: form.description.trim(),
      requirements: form.requirements.trim(),
      what_to_expect: form.what_to_expect.trim(),
      additional_benefits: form.additional_benefits.trim() || undefined,
      openings: openingsNumber,
      location: form.location.trim(),
      job_type: form.type as any,
      experience_level: form.experience_level as any,
      is_remote: form.remote,
      salary_min: form.salary_min ? Number(form.salary_min) : undefined,
      salary_max: form.salary_max ? Number(form.salary_max) : undefined,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Post New Job</h1>
      <GlassCard className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="text-sm text-muted-foreground mb-1 block">Job Title</label><Input placeholder="e.g. Senior Developer" value={form.title} onChange={e => setForm({...form, title: e.target.value})} maxLength={100} /></div>
          <div><label className="text-sm text-muted-foreground mb-1 block">Location</label><Input placeholder="e.g. San Francisco, CA" value={form.location} onChange={e => setForm({...form, location: e.target.value})} maxLength={100} /></div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Job Type</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Experience Level</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" value={form.experience_level} onChange={e => setForm({...form, experience_level: e.target.value})}>
              <option value="junior">Junior</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Number of Openings</label>
            <Input
              type="number"
              min={1}
              value={form.openings}
              onChange={e => setForm({ ...form, openings: e.target.value })}
            />
          </div>
          <div><label className="text-sm text-muted-foreground mb-1 block">Min Salary</label><Input type="number" placeholder="e.g. 100000" value={form.salary_min} onChange={e => setForm({...form, salary_min: e.target.value})} /></div>
          <div><label className="text-sm text-muted-foreground mb-1 block">Max Salary</label><Input type="number" placeholder="e.g. 150000" value={form.salary_max} onChange={e => setForm({...form, salary_max: e.target.value})} /></div>
        </div>
        <div><label className="text-sm text-muted-foreground mb-1 block">Job Description</label><Textarea placeholder="Describe the role, responsibilities, and high-level overview..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={5} maxLength={3000}/></div>
        <div><label className="text-sm text-muted-foreground mb-1 block">Requirements</label><Textarea placeholder="List the must-have skills, experience, and qualifications..." value={form.requirements} onChange={e => setForm({...form, requirements: e.target.value})} rows={4} maxLength={3000}/></div>
        <div><label className="text-sm text-muted-foreground mb-1 block">What to Expect</label><Textarea placeholder="Explain what the day-to-day will look like and what candidates can expect in the role..." value={form.what_to_expect} onChange={e => setForm({...form, what_to_expect: e.target.value})} rows={4} maxLength={3000}/></div>
        <div><label className="text-sm text-muted-foreground mb-1 block">Additional Benefits</label><Textarea placeholder="Share perks, benefits, culture, and anything else that makes your company stand out..." value={form.additional_benefits} onChange={e => setForm({...form, additional_benefits: e.target.value})} rows={3} maxLength={2000}/></div>
        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input type="checkbox" className="rounded border-input" checked={form.remote} onChange={e => setForm({...form, remote: e.target.checked})} />
          Remote position
        </label>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => navigate("/employer/dashboard")} disabled={createJobMutation.isPending}>Cancel</Button>
          <Button className="gradient-primary text-primary-foreground border-0" onClick={handlePost} disabled={createJobMutation.isPending}>
            {createJobMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Job"}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};

export const ManageJobs = () => {
  const navigate = useNavigate();

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['employerJobs'],
    queryFn: () => jobApi.getMyJobs(),
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Manage Jobs</h1>
        <Button className="gradient-primary text-primary-foreground border-0" onClick={() => navigate("/employer/post-job")}>Post New Job</Button>
      </div>
      <div className="space-y-3">
        {jobs && jobs.length > 0 ? jobs.map(job => (
          <GlassCard key={job.id} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                {job.title.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-foreground">{job.title}</p>
                <p className="text-sm text-muted-foreground">{job.location || "Remote"} · {job.job_type} · {job.applications_count || 0} applicants</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`border-0 ${job.status === "open" ? "bg-primary/10 text-primary" : job.status === "closed" ? "bg-yellow-500/10 text-yellow-500" : "bg-muted text-muted-foreground"}`}>
                {job.status}
              </Badge>
              <Button size="sm" variant="ghost" title="View Applicants" onClick={() => navigate(`/employer/job/${job.id}/applicants`)}><Users className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" title="View Analytics" onClick={() => navigate(`/employer/analytics/${job.id}`)}><Eye className="w-4 h-4" /></Button>
            </div>
          </GlassCard>
        )) : (
          <GlassCard>
            <p className="text-center text-muted-foreground py-6">You haven't posted any jobs yet.</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export const JobAnalytics = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const { data: job, isLoading: isJobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobApi.getJob(jobId!),
    enabled: !!jobId,
  });

  const { data: applications, isLoading: isAppsLoading } = useQuery({
    queryKey: ['jobApplicants', jobId],
    queryFn: () => applicationApi.getJobApplicants(jobId!),
    enabled: !!jobId,
  });

  if (isJobLoading || isAppsLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!job) {
    return <div className="text-center py-12"><p className="text-muted-foreground">Job not found.</p></div>;
  }

  const apps = applications || [];
  const interviewingCount = apps.filter(a => a.status === 'interviewing').length;
  const offeredCount = apps.filter(a => a.status === 'offer').length;
  const reviewingCount = apps.filter(a => a.status === 'reviewing').length;
  const appliedCount = apps.filter(a => a.status === 'applied').length;
  const rejectedCount = apps.filter(a => a.status === 'rejected').length;

  const stats = [
    { label: "Total Views", value: job.views_count.toLocaleString(), icon: Eye },
    { label: "Applications", value: (job.applications_count || apps.length).toString(), icon: Send },
    { label: "Interviewing", value: interviewingCount.toString(), icon: UserCheck },
    { label: "Offered", value: offeredCount.toString(), icon: CheckCircle },
  ];

  const statusBreakdown = [
    { label: "Applied", count: appliedCount, color: "bg-blue-500" },
    { label: "Reviewing", count: reviewingCount, color: "bg-yellow-500" },
    { label: "Interviewing", count: interviewingCount, color: "bg-purple-500" },
    { label: "Offered", count: offeredCount, color: "bg-green-500" },
    { label: "Rejected", count: rejectedCount, color: "bg-red-500" },
  ];
  const maxCount = Math.max(...statusBreakdown.map(s => s.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/employer/manage-jobs')} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Analytics: {job.title}</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <GlassCard key={s.label}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><s.icon className="w-5 h-5 text-primary" /></div>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Application Status Breakdown</h3>
          <div className="space-y-4">
            {statusBreakdown.map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-24">{s.label}</span>
                <div className="flex-1 h-6 bg-secondary/30 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${(s.count / maxCount) * 100}%` }} />
                </div>
                <span className="text-sm font-semibold text-foreground w-8 text-right">{s.count}</span>
              </div>
            ))}
          </div>
          {apps.length === 0 && <p className="text-sm text-muted-foreground text-center mt-4">No applications yet.</p>}
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Job Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between p-3 rounded-xl bg-secondary/30">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge className={`border-0 capitalize ${job.status === 'open' ? 'bg-primary/10 text-primary' : job.status === 'closed' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-muted text-muted-foreground'}`}>{job.status}</Badge>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-secondary/30">
              <span className="text-sm text-muted-foreground">Location</span>
              <span className="text-sm font-medium text-foreground">{job.location || 'Remote'}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-secondary/30">
              <span className="text-sm text-muted-foreground">Type</span>
              <span className="text-sm font-medium text-foreground capitalize">{job.job_type?.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-secondary/30">
              <span className="text-sm text-muted-foreground">Posted</span>
              <span className="text-sm font-medium text-foreground">{new Date(job.created_at).toLocaleDateString()}</span>
            </div>
            {(job.salary_min || job.salary_max) && (
              <div className="flex justify-between p-3 rounded-xl bg-secondary/30">
                <span className="text-sm text-muted-foreground">Salary Range</span>
                <span className="text-sm font-medium text-foreground">
                  {job.salary_min ? `$${job.salary_min.toLocaleString()}` : ''}{job.salary_min && job.salary_max ? ' - ' : ''}{job.salary_max ? `$${job.salary_max.toLocaleString()}` : ''}
                </span>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export const Applicants = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const { data: applicants, isLoading } = useQuery({
    queryKey: ['jobApplicants', jobId],
    queryFn: () => applicationApi.getJobApplicants(jobId!),
    enabled: !!jobId,
  });

  if (isLoading) return <div className="flex justify-center h-64 items-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold text-foreground">Applicants</h1>
         <Button variant="ghost" onClick={() => navigate('/employer/manage-jobs')}>Back to Jobs</Button>
      </div>
      <div className="space-y-3">
        {applicants && applicants.length > 0 ? applicants.map((app) => (
          <ApplicantRow key={app.id} application={app} />
        )) : (
          <GlassCard className="text-center py-12">
            <p className="text-muted-foreground">No applicants for this job yet.</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export const AllApplicants = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: jobs, isLoading: isJobsLoading } = useQuery({
    queryKey: ['employerJobs'],
    queryFn: () => jobApi.getMyJobs(),
  });

  // Fetch applicants for all jobs in parallel
  const applicantQueries = useQuery({
    queryKey: ['allApplicants', jobs?.map(j => j.id)],
    queryFn: async () => {
      if (!jobs || jobs.length === 0) return [];
      const results = await Promise.all(
        jobs.map(async (job) => {
          try {
            const applicants = await applicationApi.getJobApplicants(job.id);
            return applicants.map(app => ({ ...app, job_title: job.title, job_id: job.id }));
          } catch {
            return [];
          }
        })
      );
      return results.flat();
    },
    enabled: !!jobs && jobs.length > 0,
  });

  const allApplicants = applicantQueries.data || [];
  const isLoading = isJobsLoading || applicantQueries.isLoading;

  const filteredApplicants = allApplicants.filter(app => {
    if (statusFilter !== "all" && app.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return app.job_title?.toLowerCase().includes(q) || app.status?.toLowerCase().includes(q);
    }
    return true;
  });

  // Group by job
  const groupedByJob = filteredApplicants.reduce((acc, app) => {
    const key = app.job_title || 'Unknown Job';
    if (!acc[key]) acc[key] = [];
    acc[key].push(app);
    return acc;
  }, {} as Record<string, typeof filteredApplicants>);

  const statusCounts = {
    all: allApplicants.length,
    applied: allApplicants.filter(a => a.status === 'applied').length,
    reviewing: allApplicants.filter(a => a.status === 'reviewing').length,
    interviewing: allApplicants.filter(a => a.status === 'interviewing').length,
    offered: allApplicants.filter(a => a.status === 'offer').length,
    rejected: allApplicants.filter(a => a.status === 'rejected').length,
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">All Applicants</h1>
        <p className="text-sm text-muted-foreground">{allApplicants.length} total applicant{allApplicants.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { key: "all", label: "Total", color: "bg-primary/10 text-primary" },
          { key: "applied", label: "Applied", color: "bg-blue-500/10 text-blue-500" },
          { key: "reviewing", label: "Reviewing", color: "bg-yellow-500/10 text-yellow-500" },
          { key: "interviewing", label: "Interviewing", color: "bg-purple-500/10 text-purple-500" },
          { key: "offer", label: "Offered", color: "bg-green-500/10 text-green-500" },
          { key: "rejected", label: "Rejected", color: "bg-red-500/10 text-red-500" },
        ].map(s => (
          <GlassCard
            key={s.key}
            hover
            className={`cursor-pointer text-center transition-all ${statusFilter === s.key ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setStatusFilter(s.key)}
          >
            <p className="text-2xl font-bold text-foreground">{statusCounts[s.key as keyof typeof statusCounts] || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <Input
          placeholder="Search by job title..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Applicant list grouped by job */}
      {Object.keys(groupedByJob).length > 0 ? (
        Object.entries(groupedByJob).map(([jobTitle, apps]) => (
          <div key={jobTitle} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                {jobTitle.charAt(0).toUpperCase()}
              </div>
              <h2 className="font-semibold text-foreground">{jobTitle}</h2>
              <Badge variant="secondary">{apps.length}</Badge>
            </div>
            <div className="space-y-2 pl-11">
              {apps.map(app => (
                <AllApplicantRow key={app.id} application={app} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <GlassCard className="text-center py-12">
          <UserCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {allApplicants.length === 0 ? "No applicants yet. Post jobs to start receiving applications!" : "No applicants match your filters."}
          </p>
        </GlassCard>
      )}
    </div>
  );
};

const AllApplicantRow = ({ application }: { application: any }) => {
  const navigate = useNavigate();
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', application.seeker_id],
    queryFn: () => userApi.getUser(application.seeker_id),
  });

  if (isLoading) {
    return <GlassCard><Loader2 className="w-4 h-4 animate-spin text-primary" /></GlassCard>;
  }

  const name = user?.email?.split('@')[0] || 'Applicant';
  const initial = name.charAt(0).toUpperCase();

  const statusColors: Record<string, string> = {
    applied: "bg-blue-500/10 text-blue-500",
    reviewing: "bg-yellow-500/10 text-yellow-500",
    interviewing: "bg-purple-500/10 text-purple-500",
    offer: "bg-green-500/10 text-green-500",
    rejected: "bg-red-500/10 text-red-500",
    withdrawn: "bg-muted text-muted-foreground",
  };

  return (
    <GlassCard hover className="flex items-center justify-between cursor-pointer" onClick={() => navigate(`/employer/application/${application.id}`)}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
          {initial}
        </div>
        <div>
          <p className="font-medium text-foreground text-sm">{name}</p>
          <p className="text-xs text-muted-foreground">{user?.email} · Applied {new Date(application.created_at).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {application.ai_match_score != null && (
          <Badge className="bg-primary/10 text-primary border-0 text-xs">
            <BrainCircuit className="w-3 h-3 mr-1" />{application.ai_match_score}%
          </Badge>
        )}
        <Badge className={`border-0 capitalize ${statusColors[application.status] || 'bg-muted text-muted-foreground'}`}>
          {application.status}
        </Badge>
      </div>
    </GlassCard>
  );
};

// Internal component to handle fetching the user data for each application row
const ApplicantRow = ({ application }: { application: any }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['user', application.seeker_id],
    queryFn: () => userApi.getUser(application.seeker_id),
  });

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['seekerProfile', application.seeker_id],
    queryFn: () => profileApi.getPublicSeekerProfile(application.seeker_id),
    enabled: !!application.seeker_id,
  });

  const matchMutation = useMutation({
    mutationFn: () => aiApi.scoreResumeMatch(application.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplicants', application.job_id] });
      toast({ title: "AI Evaluated", description: "Applicant match score updated." });
    },
    onError: () => toast({ title: "Error", description: "Failed to evaluate match.", variant: "destructive" })
  });

  if (isUserLoading || isProfileLoading) {
     return <GlassCard><Loader2 className="w-4 h-4 animate-spin text-primary" /></GlassCard>;
  }

  const name = profile?.full_name || user?.email?.split('@')[0] || 'Applicant';
  const initial = name.charAt(0).toUpperCase();

  return (
    <GlassCard hover className="flex items-center justify-between cursor-pointer" onClick={() => navigate(`/employer/application/${application.id}`)}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
          {initial}
        </div>
        <div>
          <p className="font-semibold text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {application.ai_match_score != null ? (
          <Badge className={`border-0 text-xs flex items-center gap-1.5 ${scoreColor(application.ai_match_score)} bg-secondary/30`}>
            {application.ai_match_score >= 70 ? <CheckCircle className="w-3 h-3" /> : <BrainCircuit className="w-3 h-3" />}
            {application.ai_match_score}% {scoreLabel(application.ai_match_score)}
          </Badge>
        ) : (
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-xs text-primary bg-primary/5 hover:bg-primary/10 h-8 px-3"
            onClick={(e) => { e.stopPropagation(); matchMutation.mutate(); }}
            disabled={matchMutation.isPending}
          >
            {matchMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5 mr-1.5" />}
            Evaluate Match
          </Button>
        )}
        <Badge className="bg-primary/10 text-primary border-0 capitalize">{application.status}</Badge>
      </div>
    </GlassCard>
  );
};

export const ApplicationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: app, isLoading: isAppLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationApi.getApplication(id!),
    enabled: !!id,
  });

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['user', app?.seeker_id],
    queryFn: () => userApi.getUser(app!.seeker_id),
    enabled: !!app?.seeker_id,
  });

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['seekerProfile', app?.seeker_id],
    queryFn: () => profileApi.getPublicSeekerProfile(app!.seeker_id),
    enabled: !!app?.seeker_id,
  });

  const { data: job, isLoading: isJobLoading } = useQuery({
    queryKey: ['job', app?.job_id],
    queryFn: () => jobApi.getJob(app!.job_id),
    enabled: !!app?.job_id,
  });

  const updateMutation = useMutation({
    mutationFn: (status: string) => applicationApi.updateStatus(id!, status),
    onSuccess: (data) => {
      queryClient.setQueryData(['application', id], data);
      toast({ title: "Status Updated", description: `Application status changed to ${data.status}.` });
    },
    onError: () => {
      toast({ title: "Update Failed", description: "Failed to update status", variant: "destructive" });
    }
  });

  const handleViewResume = async (url: string) => {
    let downloadUrl = url;
    if (url.includes('/upload/')) {
      downloadUrl = url.replace('/upload/', '/upload/fl_attachment/');
    }

    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
       console.error("Error downloading resume", error);
       window.open(downloadUrl, '_blank');
    }
  };

  if (isAppLoading || isUserLoading || isJobLoading || isProfileLoading) {
     return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!app) {
     return <div className="text-center py-12"><p className="text-muted-foreground">Application not found.</p></div>;
  }

  const name = profile?.full_name || user?.email?.split('@')[0] || 'Applicant';
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.open(`/employer/public-profile?user=${app.seeker_id}`, '_blank')}>
          <User className="w-4 h-4 mr-2" /> View Profile
        </Button>
      </div>

      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
              {initial}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{name}</h1>
              <p className="text-sm text-muted-foreground">Applied for: {job?.title || 'Unknown Job'}</p>
            </div>
          </div>
          <Badge className="bg-primary/10 text-primary border-0 capitalize">{app.status}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-secondary/30"><p className="text-xs text-muted-foreground">Applied Date</p><p className="text-sm font-medium text-foreground mt-1">{new Date(app.created_at).toLocaleDateString()}</p></div>
          <div className="p-4 rounded-xl bg-secondary/30"><p className="text-xs text-muted-foreground">Contact Email</p><p className="text-sm font-medium text-foreground mt-1">{user?.email}</p></div>
        </div>

        {app.cover_letter && (
          <div className="mb-6 space-y-3">
            <h3 className="font-semibold text-foreground">Cover Letter</h3>
            <div className="bg-secondary/20 p-4 rounded-xl">
              <p className="text-sm text-foreground whitespace-pre-wrap">{app.cover_letter}</p>
            </div>
          </div>
        )}

        {app.resume_url && (
          <div className="mb-6">
            <Button variant="outline" className="w-full justify-between" onClick={() => handleViewResume(app.resume_url)}>
              <span className="flex items-center"><FileText className="w-4 h-4 mr-2" /> Resume / CV</span>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        )}

        {app.ai_match_score !== null && app.ai_match_score !== undefined && (
          <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-primary" /> AI Match Analysis</h3>
              <Badge className="bg-primary text-primary-foreground">{app.ai_match_score}% Match</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{app.ai_review_text || 'No detailed analysis provided.'}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button 
            className="gradient-primary text-primary-foreground border-0 flex-1" 
            onClick={() => updateMutation.mutate('interviewing')}
            disabled={updateMutation.isPending || app.status === 'interviewing'}
          >
            <Clock className="w-4 h-4 mr-2" /> Schedule Interview
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => updateMutation.mutate('offer')}
            disabled={updateMutation.isPending || app.status === 'offer'}
          >
            Make Offer
          </Button>
          <Button 
            variant="outline" 
            className="text-destructive border-destructive/30 hover:bg-destructive/10 flex-1" 
            onClick={() => updateMutation.mutate('rejected')}
            disabled={updateMutation.isPending || app.status === 'rejected'}
          >
            <XCircle className="w-4 h-4 mr-2" /> Reject
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};

