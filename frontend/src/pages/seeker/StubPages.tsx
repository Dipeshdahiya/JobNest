import { useState } from "react";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, GraduationCap, Calendar, Globe, CheckCircle, Clock, FileText, Send, XCircle, Loader2, Code2, UserPlus, UserCheck, MessageSquare } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationApi } from "@/lib/api/applicationApi";
import { jobApi } from "@/lib/api/jobApi";
import { profileApi, SeekerProfile } from "@/lib/api/profileApi";
import { connectionApi, Connection } from "@/lib/api/connectionApi";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

const getInitials = (name?: string): string => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
};

export const PublicProfile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const profileId = searchParams.get("user");
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // If profileId is provided, fetch public profile; otherwise fetch own
  const { data: profile, isLoading } = useQuery({
    queryKey: ['publicProfile', profileId || 'me'],
    queryFn: () => profileId
      ? profileApi.getPublicSeekerProfile(profileId)
      : profileApi.getSeekerMe(),
    retry: false,
  });

  // Fetch existing connections to determine button state
  const { data: connections = [] } = useQuery({
    queryKey: ['connections'],
    queryFn: () => connectionApi.listConnections(),
    enabled: !!profileId,
  });

  const { data: pendingConnections = [] } = useQuery({
    queryKey: ['pendingConnections'],
    queryFn: () => connectionApi.listPending(),
    enabled: !!profileId,
  });

  // Check connection status with this user
  const isConnected = connections.some(
    (c) => c.requester_id === profileId || c.receiver_id === profileId
  );

  // Check if there's a pending request (sent by me or received from them)
  const isPendingReceived = pendingConnections.some(
    (c) => c.requester_id === profileId
  );

  // For sent requests, we track locally after sending
  const [sentRequest, setSentRequest] = useState(false);

  const connectMutation = useMutation({
    mutationFn: () => connectionApi.sendRequest(profileId!),
    onSuccess: () => {
      setSentRequest(true);
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['pendingConnections'] });
      toast({ title: "Request Sent", description: "Connection request sent successfully!" });
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail || "Failed to send request";
      if (detail.includes("already exists")) {
        setSentRequest(true);
        toast({ title: "Already Sent", description: "A connection request already exists." });
      } else {
        toast({ title: "Error", description: detail, variant: "destructive" });
      }
    },
  });

  const getConnectButton = () => {
    if (isConnected) {
      return (
        <Button size="sm" variant="outline" className="border-green-500 text-green-500" disabled>
          <UserCheck className="w-3.5 h-3.5 mr-1" /> Connected
        </Button>
      );
    }
    if (isPendingReceived) {
      return (
        <Button size="sm" className="gradient-primary text-primary-foreground border-0" disabled>
          <Clock className="w-3.5 h-3.5 mr-1" /> Pending
        </Button>
      );
    }
    if (sentRequest) {
      return (
        <Button size="sm" variant="outline" className="border-primary text-primary" disabled>
          <Clock className="w-3.5 h-3.5 mr-1" /> Request Sent
        </Button>
      );
    }
    return (
      <Button
        size="sm"
        className="gradient-primary text-primary-foreground border-0"
        onClick={() => connectMutation.mutate()}
        disabled={connectMutation.isPending}
      >
        {connectMutation.isPending ? (
          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
        ) : (
          <UserPlus className="w-3.5 h-3.5 mr-1" />
        )}
        Connect
      </Button>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <GlassCard className="text-center py-12 max-w-md">
          <p className="text-muted-foreground">Profile not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
        </GlassCard>
      </div>
    );
  }

  const initials = getInitials(profile.full_name);

  return (
    <div className="space-y-6">
      <GlassCard className="relative overflow-hidden p-0">
        <div className="h-36 gradient-primary opacity-40" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 -mt-14">
            <div className="w-24 h-24 rounded-2xl gradient-primary flex items-center justify-center font-bold text-2xl border-4 border-background flex-shrink-0 text-primary-foreground overflow-hidden z-1 relative">
              {profile.profile_photo_url ? (
                <img src={profile.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="flex-1 pt-8 sm:pt-10">
              <h1 className="text-xl font-bold text-foreground drop-shadow-sm">{profile.full_name}</h1>
              <p className="text-muted-foreground text-sm">{profile.headline || "No headline"}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                {profile.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.location}</span>}
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
            {profileId && (
              <div className="flex gap-2 pt-8 sm:pt-10 z-2 relative">
                {getConnectButton()}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border"
                  onClick={() => navigate(`/seeker/messages?user=${profileId}`)}
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1" /> Message
                </Button>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <GlassCard>
            <h3 className="font-semibold text-foreground mb-3">About</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{profile.about || "No bio provided."}</p>
          </GlassCard>

          {/* Experience */}
          {profile.experiences && profile.experiences.length > 0 && (
            <GlassCard>
              <h3 className="font-semibold text-foreground mb-4">Experience</h3>
              <div className="space-y-4">
                {profile.experiences.map((exp) => (
                  <div key={exp.id} className="flex gap-4 p-4 rounded-xl bg-secondary/30">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{exp.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {exp.company_name} · {new Date(exp.start_date).getFullYear()}
                        {exp.is_current ? " - Present" : exp.end_date ? ` - ${new Date(exp.end_date).getFullYear()}` : ""}
                      </p>
                      {exp.description && <p className="text-xs text-muted-foreground mt-1">{exp.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Education */}
          {profile.education_entries && profile.education_entries.length > 0 && (
            <GlassCard>
              <h3 className="font-semibold text-foreground mb-4">Education</h3>
              <div className="space-y-4">
                {profile.education_entries.map((edu) => (
                  <div key={edu.id} className="flex gap-4 p-4 rounded-xl bg-secondary/30">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{edu.degree || edu.institution}</p>
                      <p className="text-xs text-muted-foreground">{edu.institution}{edu.start_year ? ` · ${edu.start_year}` : ""}{edu.end_year ? ` - ${edu.end_year}` : ""}</p>
                      {edu.field_of_study && <p className="text-xs text-muted-foreground mt-1">{edu.field_of_study}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>

        <div className="space-y-6">
          {/* Projects */}
          {profile.projects && profile.projects.length > 0 && (
            <GlassCard>
              <h3 className="font-semibold text-foreground mb-4">Projects</h3>
              <div className="space-y-4">
                {profile.projects.map((proj) => (
                  <div key={proj.id} className="flex gap-4 p-4 rounded-xl bg-secondary/30">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Code2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{proj.name}</p>
                      <p className="text-xs text-muted-foreground">{proj.role ? `${proj.role} · ` : ""}{proj.start_date ? new Date(proj.start_date).getFullYear() : "N/A"}{proj.is_current ? " - Present" : proj.end_date ? ` - ${new Date(proj.end_date).getFullYear()}` : ""}</p>
                      {proj.description && <p className="text-xs text-muted-foreground mt-1">{proj.description}</p>}
                      {proj.url && <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary mt-1 inline-block hover:underline">{proj.url}</a>}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <GlassCard>
              <h3 className="font-semibold text-foreground mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <Badge key={skill.id} className="bg-primary/10 text-primary border-0">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </GlassCard>
          )}
          {/* Languages */}
          {profile.languages && profile.languages.length > 0 && (
            <GlassCard>
              <h3 className="font-semibold text-foreground mb-3">Languages</h3>
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((lang) => (
                  <Badge key={lang.id} className="bg-primary/10 text-primary border-0 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {lang.name}{lang.proficiency ? ` - ${lang.proficiency}` : ""}
                  </Badge>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Info */}
          <GlassCard>
            <h3 className="font-semibold text-foreground mb-3">Info</h3>
            <div className="space-y-3 text-sm">
              {profile.location && (
                <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4" /><span>{profile.location}</span></div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

const statusSteps = [
  { key: "applied", icon: Send, label: "Applied" },
  { key: "reviewing", icon: FileText, label: "Under Review" },
  { key: "interviewing", icon: Clock, label: "Interviewing" },
  { key: "offered", icon: CheckCircle, label: "Offered" },
];

const getStepIndex = (status: string) => {
  if (status === "rejected" || status === "withdrawn") return -1;
  return statusSteps.findIndex(s => s.key === status);
};

export const ApplicationView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: app, isLoading: appLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationApi.getApplication(id!),
    enabled: !!id,
  });

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', app?.job_id],
    queryFn: () => jobApi.getJob(app!.job_id),
    enabled: !!app?.job_id,
  });

  if (appLoading || jobLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!app || !job) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/seeker/applied-jobs")} className="text-muted-foreground">
          ← Back to Applied Jobs
        </Button>
        <GlassCard className="text-center py-12"><p className="text-muted-foreground">Application not found.</p></GlassCard>
      </div>
    );
  }

  const currentStep = getStepIndex(app.status);
  const isRejected = app.status === "rejected";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/seeker/applied-jobs")} className="text-muted-foreground">
        ← Back to Applied Jobs
      </Button>

      <GlassCard>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
            {(job.company_name || "C").charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{job.title}</h1>
            <p className="text-sm text-muted-foreground">{job.company_name || "Company"} · {job.location}</p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="font-semibold text-foreground mb-6">Application Progress</h3>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
            <div className="absolute top-5 left-0 h-0.5 gradient-primary transition-all" style={{ width: isRejected ? "0%" : `${Math.max(0, (currentStep / (statusSteps.length - 1)) * 100)}%` }} />
            {statusSteps.map((step, i) => {
              const isActive = !isRejected && i <= currentStep;
              const isCurrent = !isRejected && i === currentStep;
              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"} ${isCurrent ? "ring-4 ring-primary/20" : ""}`}>
                    <step.icon className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>{step.label}</span>
                </div>
              );
            })}
          </div>
          {isRejected && (
            <div className="mt-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3">
              <XCircle className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">Application Not Selected</p>
                <p className="text-xs text-muted-foreground mt-1">Unfortunately, the employer has decided to move forward with other candidates.</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-secondary/30">
            <p className="text-xs text-muted-foreground">Applied Date</p>
            <p className="text-sm font-medium text-foreground mt-1">{new Date(app.created_at).toLocaleDateString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary/30">
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge className={`mt-1 capitalize ${isRejected ? "bg-destructive/10 text-destructive border-0" : "bg-primary/10 text-primary border-0"}`}>{app.status}</Badge>
          </div>
          <div className="p-4 rounded-xl bg-secondary/30">
            <p className="text-xs text-muted-foreground">Job Type</p>
            <p className="text-sm font-medium text-foreground mt-1 capitalize">{job.job_type}</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary/30">
            <p className="text-xs text-muted-foreground">Salary Range</p>
            <p className="text-sm font-medium text-foreground mt-1">{job.salary_min ? `$${job.salary_min.toLocaleString()}` : ''} {job.salary_max ? `- $${job.salary_max.toLocaleString()}` : ''}</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-foreground mb-3">Job Description</h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.description}</p>
        </div>
      </GlassCard>
    </div>
  );
};

export default PublicProfile;
