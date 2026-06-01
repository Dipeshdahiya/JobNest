import { useRef } from "react";
import GlassCard from "@/components/GlassCard";
import { FileText, Upload, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "@/lib/api/profileApi";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const Resume = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['seekerProfile'],
    queryFn: profileApi.getSeekerMe,
    retry: false,
  });

  const uploadResumeMutation = useMutation({
    mutationFn: profileApi.uploadResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seekerProfile'] });
      toast({ title: "Resume Uploaded & Parsed", description: "Your profile has been automatically updated using AI!" });
    },
    onError: (error: any) => {
      toast({ title: "Upload failed", description: error.response?.data?.detail || "Could not upload resume", variant: "destructive" });
    }
  });

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Resume must be under 10MB.", variant: "destructive" });
      return;
    }
    
    // Provide a toast to let them know parsing can take a moment
    toast({ title: "AI Parsing...", description: "We are extracting data from your resume..." });
    uploadResumeMutation.mutate({ file, prefill_profile: false });
    e.target.value = "";
  };

  const handleDownload = async () => {
    if (!profile?.resume_url) return;
    const url = profile.resume_url;
    
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
    } catch {
       window.open(downloadUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasResume = !!profile?.resume_url;

  return (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-foreground">Resume Management</h1>

    <GlassCard>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-foreground">Current Resume</h2>
        <div className="flex gap-2">
          {hasResume && (
            <Button size="sm" variant="outline" className="border-border" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" /> Download
            </Button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="application/pdf"
            onChange={handleResumeUpload}
          />
          <Button size="sm" className="gradient-primary text-primary-foreground border-0" onClick={() => fileInputRef.current?.click()} disabled={uploadResumeMutation.isPending}>
            {uploadResumeMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {hasResume ? "Upload New" : "Upload Resume"}
          </Button>
        </div>
      </div>
      
      {hasResume ? (
        <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
          <p className="font-medium text-foreground">Resume_{profile.id?.substring(0, 8)}.pdf</p>
          <p className="text-sm text-muted-foreground mt-1">Ready for applications</p>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center bg-secondary/10">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-medium text-foreground">No Resume Uploaded</p>
          <p className="text-sm text-muted-foreground mt-1">Upload a PDF to parse your profile using AI</p>
        </div>
      )}
    </GlassCard>

    {(profile && hasResume && profile.parsed_resume_data) && (() => {
      const parsedData = profile.parsed_resume_data;
      return (
      <GlassCard>
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          Resume Details Extracted 
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">AI Parsed</span>
        </h2>
        <div className="bg-secondary/30 rounded-xl p-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-foreground">{parsedData.full_name || "Name not specified"}</h3>
            <p className="text-sm text-muted-foreground">{parsedData.headline || "Headline not specified"} {parsedData.location && `· ${parsedData.location}`}</p>
          </div>
          
          {parsedData.about && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Summary</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{parsedData.about}</p>
            </div>
          )}
          
          {parsedData.experiences && parsedData.experiences.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Experience</h4>
              <div className="space-y-4">
                {parsedData.experiences.map((exp: any, i: number) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-foreground">{exp.title} at {exp.company_name}</p>
                    <p className="text-xs text-muted-foreground mb-1">
                      {exp.start_date ? new Date(exp.start_date).getFullYear() : "N/A"} - {exp.is_current ? "Present" : exp.end_date ? new Date(exp.end_date).getFullYear() : ""}
                    </p>
                    {exp.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsedData.education_entries && parsedData.education_entries.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Education</h4>
              <div className="space-y-3">
                {parsedData.education_entries.map((edu: any, i: number) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-foreground">{edu.institution}</p>
                    <p className="text-xs text-muted-foreground">
                      {edu.degree} {edu.field_of_study && `in ${edu.field_of_study}`} 
                      {edu.start_year && ` (${edu.start_year} - ${edu.end_year || "Present"})`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsedData.projects && parsedData.projects.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Projects</h4>
              <div className="space-y-3">
                {parsedData.projects.map((proj: any, i: number) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-foreground">{proj.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {proj.start_date ? new Date(proj.start_date).getFullYear() : "N/A"} - {proj.is_current ? "Present" : proj.end_date ? new Date(proj.end_date).getFullYear() : ""}
                    </p>
                    {proj.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{proj.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {parsedData.languages && parsedData.languages.length > 0 && (
             <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Languages</h4>
              <div className="flex gap-2 flex-wrap">
                {parsedData.languages.map((lang: any, i: number) => (
                  <span key={i} className="text-xs bg-secondary px-2 py-1 rounded-md text-foreground">
                    {lang.name} {lang.proficiency && `(${lang.proficiency})`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {parsedData.skills && parsedData.skills.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Skills</h4>
              <div className="flex gap-2 flex-wrap">
                {parsedData.skills.map((skill: string, i: number) => (
                  <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </GlassCard>
      );
    })()}

  </div>
  );
};

export default Resume;
