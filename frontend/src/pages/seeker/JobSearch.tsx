import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, MapPin, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import JobCard from "@/components/JobCard";
import GlassCard from "@/components/GlassCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobApi, Job } from "@/lib/api/jobApi";
import { toast } from "@/hooks/use-toast";

const filterOptions = {
  type: ["full_time", "part_time", "contract", "internship"],
  experience: ["junior", "mid", "senior"],
};

const filterLabels: Record<string, string> = {
   "full_time": "Full-time",
   "part_time": "Part-time",
   "contract": "Contract",
   "internship": "Internship",
   "junior": "Junior",
   "mid": "Mid Level",
   "senior": "Senior",
};

const JobSearch = () => {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({
    type: "",
    experience: "",
  });
  const [remoteOnly, setRemoteOnly] = useState(false);

  // Derive parameters for backend
  const queryParams = useMemo(() => {
    const params: any = {};
    if (search) params.keyword = search;
    if (location) params.location = location;
    if (selectedFilters.type) params.job_type = selectedFilters.type;
    if (selectedFilters.experience) params.experience_level = selectedFilters.experience;
    if (remoteOnly) params.is_remote = true;
    return params;
  }, [search, location, selectedFilters, remoteOnly]);

  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs', queryParams],
    queryFn: () => jobApi.getJobs(queryParams),
  });

  const { data: savedJobs = [] } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: jobApi.getSavedJobs,
  });

  const savedJobIds = new Set(savedJobs.map((j: Job) => j.id));

  const saveMutation = useMutation({
    mutationFn: (jobId: string) => jobApi.saveJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
      toast({ title: "Job saved", description: "Added to your Saved Jobs list." });
    },
    onError: () => {
      toast({ title: "Save failed", description: "Could not save the job.", variant: "destructive" });
    }
  });

  const unsaveMutation = useMutation({
    mutationFn: (jobId: string) => jobApi.unsaveJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
      toast({ title: "Job removed", description: "Removed from your Saved Jobs." });
    },
    onError: () => {
      toast({ title: "Unsave failed", description: "Could not unsave the job.", variant: "destructive" });
    }
  });

  const toggleSave = (jobId: string) => {
    if (savedJobIds.has(jobId)) {
      unsaveMutation.mutate(jobId);
    } else {
      saveMutation.mutate(jobId);
    }
  };

  const setFilter = (category: string, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [category]: prev[category] === value ? "" : value,
    }));
  };

  const activeFilters = [
    ...(selectedFilters.type ? [{ category: "type", value: selectedFilters.type, label: (filterLabels as any)[selectedFilters.type] }] : []),
    ...(selectedFilters.experience ? [{ category: "experience", value: selectedFilters.experience, label: (filterLabels as any)[selectedFilters.experience] }] : []),
    ...(remoteOnly ? [{ category: "remote", value: "true", label: "Remote" }] : []),
  ];

  const removeFilter = (category: string) => {
    if (category === "remote") {
      setRemoteOnly(false);
    } else {
      setSelectedFilters(prev => ({ ...prev, [category]: "" }));
    }
  };

  const clearAll = () => {
    setSelectedFilters({ type: "", experience: "" });
    setRemoteOnly(false);
    setSearch("");
    setLocation("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Find Jobs</h1>
        <p className="text-muted-foreground text-sm mt-1">Discover your next career opportunity</p>
      </div>

      {/* Search bar */}
      <GlassCard className="flex flex-col sm:flex-row gap-3 items-center p-4">
        <div className="flex items-center gap-2 flex-1 w-full">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs, companies..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
          {search && (
            <X className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => setSearch("")} />
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 flex-1 sm:flex-none px-3 py-2 rounded-lg bg-secondary/50">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-24"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
          </Button>
        </div>
      </GlassCard>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        {showFilters && (
          <div className="hidden lg:block w-64 flex-shrink-0 space-y-6">
            {Object.entries(filterOptions).map(([key, values]) => (
              <GlassCard key={key}>
                <h3 className="font-semibold text-foreground text-sm capitalize mb-3">{key}</h3>
                <div className="space-y-2">
                  {values.map((v) => (
                    <label key={v} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                      <input
                        type="checkbox"
                        className="rounded border-border"
                        checked={selectedFilters[key] === v}
                        onChange={() => setFilter(key, v)}
                      />
                      {(filterLabels as any)[v]}
                    </label>
                  ))}
                </div>
              </GlassCard>
            ))}
            <GlassCard>
              <h3 className="font-semibold text-foreground text-sm mb-3">Remote</h3>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border"
                  checked={remoteOnly}
                  onChange={() => setRemoteOnly(v => !v)}
                />
                Remote only
              </label>
            </GlassCard>
            {activeFilters.length > 0 && (
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={clearAll}>
                Clear all filters
              </Button>
            )}
          </div>
        )}

        {/* Job grid */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing <strong className="text-foreground">{jobs.length}</strong> jobs
            </p>
            {activeFilters.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {activeFilters.map((f) => (
                  <Badge key={f.value} variant="secondary" className="text-xs bg-primary/10 text-primary border-0 gap-1">
                    {f.label} <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter(f.category)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {isLoading ? (
             <div className="flex justify-center py-12">
               <Loader2 className="w-8 h-8 animate-spin text-primary" />
             </div>
          ) : jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job: Job) => {
                // Map the backend job to what JobCard expects
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
                  applicants: job.applications_count || 0,
                  saved: savedJobIds.has(job.id),
                  onToggleSave: () => toggleSave(job.id),
                };
                return <JobCard key={job.id} {...mappedJob} />;
              })}
            </div>
          ) : (
            <GlassCard className="text-center py-12">
              <p className="text-muted-foreground">No jobs match your criteria.</p>
              <Button variant="link" className="mt-2" onClick={clearAll}>Clear all filters</Button>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobSearch;
