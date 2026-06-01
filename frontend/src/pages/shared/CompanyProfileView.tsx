import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { profileApi, EmployerProfile, EmployerStats } from "@/lib/api/profileApi";
import { MapPin, Users, Globe, ArrowLeft, Loader2, Briefcase } from "lucide-react";

const CompanyProfileView = () => {
  const { userId } = useParams();

  const { data: profile, isLoading, error } = useQuery<EmployerProfile>({
    queryKey: ["publicEmployerProfile", userId],
    queryFn: () => profileApi.getPublicEmployer(userId!),
    enabled: !!userId,
  });

  const { data: stats } = useQuery<EmployerStats>({
    queryKey: ["publicEmployerStats", userId],
    queryFn: () => profileApi.getPublicEmployerStats(userId!),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="space-y-4">
        <Link
          to="/seeker/jobs"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to jobs
        </Link>
        <GlassCard>
          <p className="text-sm text-muted-foreground">
            Company profile not found.
          </p>
        </GlassCard>
      </div>
    );
  }

  const logoInitial = profile.company_name
    ? profile.company_name.charAt(0).toUpperCase()
    : "C";

  const jobsPerMonth = stats?.jobs_per_month || [];
  const hiresPerMonth = stats?.hires_per_month || [];
  const maxJobs = Math.max(...jobsPerMonth.map((b) => b.count), 1);
  const maxHires = Math.max(...hiresPerMonth.map((b) => b.count), 1);

  return (
    <div className="min-h-screen bg-background -mt-10">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10 space-y-6 md:space-y-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/seeker/jobs"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to jobs
          </Link>
        </div>

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
                <img
                  src={profile.logo_url}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                logoInitial
              )}
            </div>
            <div className="pt-6 sm:pt-8 flex-1">
              <h1 className="text-2xl font-bold text-foreground">
                {profile.company_name}
              </h1>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {profile.location}
                  </span>
                )}
                {profile.company_size && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {profile.company_size}
                  </span>
                )}
                {profile.industry && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    {profile.industry}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <GlassCard className="shadow-sm border-border/60">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              About
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {profile.description || "No description provided."}
            </p>
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

          <GlassCard className="space-y-4 shadow-sm border-border/60">
            <h2 className="text-lg font-semibold text-foreground">
              Company analytics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Jobs posted</p>
                <p className="text-xl font-semibold text-foreground">
                  {stats?.total_jobs ?? 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total hires</p>
                <p className="text-xl font-semibold text-foreground">
                  {stats?.total_hires ?? 0}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">
                  Jobs posted per month
                </p>
                <div className="space-y-2">
                  {jobsPerMonth.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No job posting data yet.
                    </p>
                  )}
                  {jobsPerMonth.map((b) => {
                    const label = new Date(b.period).toLocaleDateString(
                      undefined,
                      { month: "short", year: "2-digit" }
                    );
                    const width = `${(b.count / maxJobs) * 100}%`;
                    return (
                      <div key={b.period} className="flex items-center gap-2">
                        <span className="w-16 text-[11px] text-muted-foreground">
                          {label}
                        </span>
                        <div className="flex-1 h-3 bg-secondary/40 rounded-full overflow-hidden">
                          <div
                            className="h-full gradient-primary rounded-full"
                            style={{ width }}
                          />
                        </div>
                        <span className="w-6 text-xs text-foreground text-right">
                          {b.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">
                  Hires per month
                </p>
                <div className="space-y-2">
                  {hiresPerMonth.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No hiring data yet.
                    </p>
                  )}
                  {hiresPerMonth.map((b) => {
                    const label = new Date(b.period).toLocaleDateString(
                      undefined,
                      { month: "short", year: "2-digit" }
                    );
                    const width = `${(b.count / maxHires) * 100}%`;
                    return (
                      <div key={b.period} className="flex items-center gap-2">
                        <span className="w-16 text-[11px] text-muted-foreground">
                          {label}
                        </span>
                        <div className="flex-1 h-3 bg-secondary/40 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width }}
                          />
                        </div>
                        <span className="w-6 text-xs text-foreground text-right">
                          {b.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6 md:space-y-8">
          <GlassCard className="shadow-sm border-border/60">
            <h3 className="font-semibold text-foreground mb-3">
              Contact & Links
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="w-4 h-4" />
                {profile.website || "Website not provided"}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="shadow-sm border-border/60">
            <h3 className="font-semibold text-foreground mb-3">
              Opportunities
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Explore open roles from this company on the platform.
            </p>
            <Button
              asChild
              variant="outline"
              className="w-full text-sm flex items-center justify-center gap-2"
            >
              <Link to="/seeker/jobs">
                <Briefcase className="w-4 h-4" />
                View jobs
              </Link>
            </Button>
          </GlassCard>
        </div>
      </div>
      </div>
    </div>
  );
};

export default CompanyProfileView;


