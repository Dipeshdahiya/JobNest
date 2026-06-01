import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Briefcase, GraduationCap, X, Plus, Loader2, Upload, Trash2, Globe, Edit2, Code2, Camera } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi, SeekerProfile } from "@/lib/api/profileApi";
import { useAuth } from "@/context/AuthContext";

const tabs = ["About", "Skills", "Experience", "Education", "Languages", "Projects"];

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("About");
  const [editOpen, setEditOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<SeekerProfile>>({});
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const [expForm, setExpForm] = useState({ title: "", company_name: "", start_date: "", end_date: "", description: "", is_current: false });
  const [eduForm, setEduForm] = useState({ institution: "", degree: "", field_of_study: "", start_year: "", end_year: "" });
  const [langForm, setLangForm] = useState({ name: "", proficiency: "Intermediate" });
  const [projectForm, setProjectForm] = useState({ name: "", role: "", description: "", url: "", start_date: "", end_date: "", is_current: false });
  
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  const [editingLangId, setEditingLangId] = useState<string | null>(null);
  const [editingProjId, setEditingProjId] = useState<string | null>(null);

  const [skillsText, setSkillsText] = useState("");
  const [prefillProfile, setPrefillProfile] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['seekerProfile'],
    queryFn: profileApi.getSeekerMe,
    retry: false,
  });

  const createProfileMutation = useMutation({
    mutationFn: profileApi.createSeekerMe,
    onSuccess: (data) => {
      queryClient.setQueryData(['seekerProfile'], data);
      toast({ title: "Profile created", description: "Your profile has been created successfully." });
      setEditOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to create profile", description: error.response?.data?.detail || "An error occurred", variant: "destructive" });
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: profileApi.updateSeekerMe,
    onSuccess: (data) => {
      queryClient.setQueryData(['seekerProfile'], data);
      toast({ title: "Profile updated", description: "Your changes have been saved." });
      setEditOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update profile", description: error.response?.data?.detail || "An error occurred", variant: "destructive" });
    }
  });

  const uploadResumeMutation = useMutation({
    mutationFn: profileApi.uploadResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seekerProfile'] });
      toast({ title: "Resume Uploaded", description: "Your resume has been saved successfully." });
      setResumeOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Upload failed", description: error.response?.data?.detail || "Could not upload resume", variant: "destructive" });
    }
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: profileApi.uploadPhoto,
    onSuccess: (data) => {
      queryClient.setQueryData(['seekerProfile'], data);
      toast({ title: "Photo Updated", description: "Your profile photo has been changed." });
    },
    onError: (error: any) => {
      toast({ title: "Upload failed", description: error.response?.data?.detail || "Could not upload photo", variant: "destructive" });
    }
  });

  const syncSkillsMutation = useMutation({
    mutationFn: profileApi.syncSkills,
    onSuccess: (data) => {
      queryClient.setQueryData(['seekerProfile'], data);
      toast({ title: "Skills updated" });
      setSkillsText("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to update skills", description: error.response?.data?.detail || "An error occurred", variant: "destructive" });
    }
  });

  const addExperienceMutation = useMutation({
    mutationFn: profileApi.addExperience,
    onSuccess: (data) => {
      queryClient.setQueryData(['seekerProfile'], data);
      toast({ title: "Experience added" });
      setExpForm({ title: "", company_name: "", start_date: "", end_date: "", description: "", is_current: false });
      setEditingExpId(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to add experience", description: error.response?.data?.detail || "An error occurred", variant: "destructive" });
    }
  });

  const updateExperienceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof profileApi.updateExperience>[1] }) => profileApi.updateExperience(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(['seekerProfile'], data);
      toast({ title: "Experience updated" });
      setExpForm({ title: "", company_name: "", start_date: "", end_date: "", description: "", is_current: false });
      setEditingExpId(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update experience", description: error.response?.data?.detail || "An error occurred", variant: "destructive" });
    }
  });

  const deleteExperienceMutation = useMutation({
    mutationFn: profileApi.deleteExperience,
    onSuccess: (data) => {
      queryClient.setQueryData(['seekerProfile'], data);
      toast({ title: "Experience removed" });
    },
  });

  // Education mutations
  const addEducationMutation = useMutation({
    mutationFn: profileApi.addEducation,
    onSuccess: (data) => {
      queryClient.setQueryData(['seekerProfile'], data);
      toast({ title: "Education added" });
      setEduForm({ institution: "", degree: "", field_of_study: "", start_year: "", end_year: "" });
      setEditingEduId(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to add education", description: error.response?.data?.detail || "An error occurred", variant: "destructive" });
    }
  });

  const updateEducationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof profileApi.updateEducation>[1] }) => profileApi.updateEducation(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(['seekerProfile'], data);
      toast({ title: "Education updated" });
      setEduForm({ institution: "", degree: "", field_of_study: "", start_year: "", end_year: "" });
      setEditingEduId(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update education", description: error.response?.data?.detail || "An error occurred", variant: "destructive" });
    }
  });

  const deleteEducationMutation = useMutation({
    mutationFn: profileApi.deleteEducation,
    onSuccess: (data) => {
      queryClient.setQueryData(['seekerProfile'], data);
      toast({ title: "Education removed" });
    },
  });

  // Language mutations
  const addLanguageMutation = useMutation({
    mutationFn: profileApi.addLanguage,
    onSuccess: (data) => {
      queryClient.setQueryData(['seekerProfile'], data);
      toast({ title: "Language added" });
      setLangForm({ name: "", proficiency: "Intermediate" });
      setEditingLangId(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to add language", description: error.response?.data?.detail || "An error occurred", variant: "destructive" });
    }
  });

  const updateLanguageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof profileApi.updateLanguage>[1] }) => profileApi.updateLanguage(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(['seekerProfile'], data);
      toast({ title: "Language updated" });
      setLangForm({ name: "", proficiency: "Intermediate" });
      setEditingLangId(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update language", description: error.response?.data?.detail || "An error occurred", variant: "destructive" });
    }
  });

  const deleteLanguageMutation = useMutation({
    mutationFn: profileApi.deleteLanguage,
    onSuccess: (data) => {
      queryClient.setQueryData(['seekerProfile'], data);
      toast({ title: "Language removed" });
    },
  });

  // Project mutations
  const addProjectMutation = useMutation({
    mutationFn: profileApi.addProject,
    onSuccess: (data) => {
      queryClient.setQueryData(['seekerProfile'], data);
      toast({ title: "Project added" });
      setProjectForm({ name: "", role: "", description: "", url: "", start_date: "", end_date: "", is_current: false });
      setEditingProjId(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to add project", description: error.response?.data?.detail || "An error occurred", variant: "destructive" });
    }
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof profileApi.updateProject>[1] }) => profileApi.updateProject(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(['seekerProfile'], data);
      toast({ title: "Project updated" });
      setProjectForm({ name: "", role: "", description: "", url: "", start_date: "", end_date: "", is_current: false });
      setEditingProjId(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update project", description: error.response?.data?.detail || "An error occurred", variant: "destructive" });
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: profileApi.deleteProject,
    onSuccess: (data) => {
      queryClient.setQueryData(['seekerProfile'], data);
      toast({ title: "Project removed" });
    },
  });

  const openEdit = () => {
    if (profile) {
      setDraft({ full_name: profile.full_name, headline: profile.headline, location: profile.location, about: profile.about, profile_visibility: profile.profile_visibility });
    } else {
      setDraft({ full_name: user?.email?.split('@')[0] || "", profile_visibility: "public" });
    }
    setEditOpen(true);
  };

  const handleSave = () => {
    if (!draft.full_name?.trim()) {
      toast({ title: "Validation error", description: "Full Name is required.", variant: "destructive" });
      return;
    }
    if (profile) {
      updateProfileMutation.mutate(draft);
    } else {
      createProfileMutation.mutate(draft as SeekerProfile);
    }
  };

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
    toast({ title: "AI Parsing...", description: "We are extracting data from your resume..." });
    toast({ title: "AI Parsing...", description: "We are extracting data from your resume..." });
    uploadResumeMutation.mutate({ file, prefill_profile: prefillProfile });
    e.target.value = "";
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Photo must be under 2MB.", variant: "destructive" });
      return;
    }
    uploadPhotoMutation.mutate(file);
    e.target.value = "";
  };

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
       window.open(downloadUrl, '_blank'); // fallback
    }
  };

  const handleAddExperience = () => {
    if (!expForm.title.trim() || !expForm.company_name.trim() || !expForm.start_date) {
      toast({ title: "Validation error", description: "Title, company, and start date are required.", variant: "destructive" });
      return;
    }
    const payload = {
      title: expForm.title,
      company_name: expForm.company_name,
      start_date: expForm.start_date,
      end_date: expForm.end_date || undefined,
      description: expForm.description || undefined,
      is_current: expForm.is_current,
    };
    if (editingExpId) {
      updateExperienceMutation.mutate({ id: editingExpId, data: payload });
    } else {
      addExperienceMutation.mutate(payload);
    }
  };

  const handleAddEducation = () => {
    if (!eduForm.institution.trim()) {
      toast({ title: "Validation error", description: "Institution is required.", variant: "destructive" });
      return;
    }
    const payload = {
      institution: eduForm.institution,
      degree: eduForm.degree || undefined,
      field_of_study: eduForm.field_of_study || undefined,
      start_year: eduForm.start_year ? parseInt(eduForm.start_year.toString()) : undefined,
      end_year: eduForm.end_year ? parseInt(eduForm.end_year.toString()) : undefined,
    };
    if (editingEduId) {
      updateEducationMutation.mutate({ id: editingEduId, data: payload });
    } else {
      addEducationMutation.mutate(payload);
    }
  };

  const handleAddLanguage = () => {
    if (!langForm.name.trim()) {
      toast({ title: "Validation error", description: "Language name is required.", variant: "destructive" });
      return;
    }
    const payload = { name: langForm.name, proficiency: langForm.proficiency || undefined };
    if (editingLangId) {
      updateLanguageMutation.mutate({ id: editingLangId, data: payload });
    } else {
      addLanguageMutation.mutate(payload);
    }
  };

  const handleAddProject = () => {
    if (!projectForm.name.trim()) {
      toast({ title: "Validation error", description: "Project name is required.", variant: "destructive" });
      return;
    }
    const payload = {
      name: projectForm.name,
      role: projectForm.role || undefined,
      description: projectForm.description || undefined,
      url: projectForm.url || undefined,
      start_date: projectForm.start_date || undefined,
      end_date: projectForm.end_date || undefined,
      is_current: projectForm.is_current,
    };
    if (editingProjId) {
      updateProjectMutation.mutate({ id: editingProjId, data: payload });
    } else {
      addProjectMutation.mutate(payload);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const nameToUse = profile?.full_name || user?.email || "User";
  const initials = (() => {
    const parts = nameToUse.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  })();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">My Profile</h1>

      {!profile && (
        <GlassCard className="border-warning border bg-warning/10">
          <h3 className="font-semibold text-warning">No Profile Yet</h3>
          <p className="text-sm mt-1 text-warning/90">Please create your profile to get started.</p>
          <Button className="mt-4" onClick={openEdit}>Create Profile</Button>
        </GlassCard>
      )}

      {profile && (
        <>
          {/* Profile header */}
          <GlassCard>
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-24 h-24 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-2xl flex-shrink-0 overflow-hidden relative group">
                {profile.profile_photo_url ? (
                  <img src={profile.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
                {/* Upload overlay */}
                <div onClick={() => photoInputRef.current?.click()} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <input
                  type="file"
                  ref={photoInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">{profile.full_name}</h2>
                </div>
                <p className="text-muted-foreground">{profile.headline || "Add a headline"}</p>
                <p className="text-sm text-muted-foreground mt-1">{profile.location || "Add a location"}</p>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" className="gradient-primary text-primary-foreground border-0" onClick={openEdit}>Edit Profile</Button>
                  <Button size="sm" variant="outline" className="border-border" onClick={() => setResumeOpen(true)}>Manage Resume</Button>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/seeker/public-profile?user=${profile.user_id}`)}>View Public Profile</Button>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Tabs */}
          <div className="flex gap-1 p-1 glass rounded-xl overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <GlassCard>
            {activeTab === "About" && (
              <div>
                <h3 className="font-semibold text-foreground mb-3">About Me</h3>
                {profile.about ? (
                   <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{profile.about}</p>
                ) : (
                   <p className="text-sm text-muted-foreground italic">No bio added yet.</p>
                )}
              </div>
            )}

            {activeTab === "Skills" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Skills</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill: any) => (
                      <Badge key={skill.id} variant="secondary" className="bg-primary/10 text-primary border-0 px-3 py-1 text-sm font-medium">
                        {skill.name}
                        <button
                          onClick={() => {
                            const newSkills = profile.skills.filter((s: any) => s.id !== skill.id).map((s: any) => s.name);
                            syncSkillsMutation.mutate(newSkills);
                          }}
                          className="ml-2 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No skills added yet.</p>
                  )}
                </div>

                <div className="border border-border rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Skills
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input 
                      value={skillsText} 
                      onChange={e => setSkillsText(e.target.value)} 
                      placeholder="e.g. React, Python, Cloud Architecture (comma separated)" 
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && skillsText.trim()) {
                          e.preventDefault();
                          const newSkillsArray = skillsText.split(",").map(s => s.trim()).filter(Boolean);
                          const currentSkillNames = profile.skills?.map((s: any) => s.name) || [];
                          syncSkillsMutation.mutate([...currentSkillNames, ...newSkillsArray]);
                        }
                      }}
                    />
                    <Button 
                      onClick={() => {
                        if (!skillsText.trim()) return;
                        const newSkillsArray = skillsText.split(",").map(s => s.trim()).filter(Boolean);
                        const currentSkillNames = profile.skills?.map((s: any) => s.name) || [];
                        syncSkillsMutation.mutate([...currentSkillNames, ...newSkillsArray]);
                      }}
                      disabled={syncSkillsMutation.isPending || !skillsText.trim()}
                    >
                      {syncSkillsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />} Add
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === "Experience" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Experience</h3>
                </div>
                {profile.experiences && profile.experiences.length > 0 ? (
                  profile.experiences.map((exp: any) => (
                    <div key={exp.id} className="flex gap-4 p-4 rounded-xl bg-secondary/30 group">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{exp.title}</p>
                        <p className="text-xs text-muted-foreground">{exp.company_name} · {new Date(exp.start_date).getFullYear()}{exp.is_current ? " - Present" : exp.end_date ? ` - ${new Date(exp.end_date).getFullYear()}` : ""}</p>
                        {exp.description && <p className="text-xs text-muted-foreground mt-2">{exp.description}</p>}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setExpForm({
                              title: exp.title,
                              company_name: exp.company_name,
                              start_date: typeof exp.start_date === "string" ? exp.start_date.split("T")[0] : exp.start_date,
                              end_date: exp.end_date ? (typeof exp.end_date === "string" ? exp.end_date.split("T")[0] : exp.end_date) : "",
                              description: exp.description || "",
                              is_current: exp.is_current
                            });
                            setEditingExpId(exp.id);
                          }}
                          className="text-muted-foreground hover:text-primary flex-shrink-0"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteExperienceMutation.mutate(exp.id)}
                          className="text-muted-foreground hover:text-destructive flex-shrink-0"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                   <p className="text-sm text-muted-foreground italic">No experience added yet.</p>
                )}

                {/* Add/Edit Experience Form */}
                <div className="border border-border rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    {editingExpId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />} 
                    {editingExpId ? "Edit Experience" : "Add Experience"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Job Title *</Label>
                      <Input value={expForm.title} onChange={e => setExpForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Software Engineer" />
                    </div>
                    <div>
                      <Label className="text-xs">Company *</Label>
                      <Input value={expForm.company_name} onChange={e => setExpForm(f => ({ ...f, company_name: e.target.value }))} placeholder="e.g. Google" />
                    </div>
                    <div>
                      <Label className="text-xs">Start Date *</Label>
                      <Input type="date" value={expForm.start_date} onChange={e => setExpForm(f => ({ ...f, start_date: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs">End Date</Label>
                      <Input type="date" value={expForm.end_date} onChange={e => setExpForm(f => ({ ...f, end_date: e.target.value }))} disabled={expForm.is_current} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Describe your role..." />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="is_current" checked={expForm.is_current} onChange={e => setExpForm(f => ({ ...f, is_current: e.target.checked, end_date: e.target.checked ? "" : f.end_date }))} className="rounded" />
                    <Label htmlFor="is_current" className="text-xs cursor-pointer">Currently working here</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddExperience} disabled={addExperienceMutation.isPending || updateExperienceMutation.isPending}>
                      {(addExperienceMutation.isPending || updateExperienceMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : (editingExpId ? <Edit2 className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />)}
                      {editingExpId ? "Save" : "Add"}
                    </Button>
                    {editingExpId && (
                      <Button size="sm" variant="ghost" onClick={() => {
                        setExpForm({ title: "", company_name: "", start_date: "", end_date: "", description: "", is_current: false });
                        setEditingExpId(null);
                      }}>Cancel</Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === "Education" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Education</h3>
                </div>
                {profile.education_entries && profile.education_entries.length > 0 ? (
                  profile.education_entries.map((edu: any) => (
                    <div key={edu.id} className="flex gap-4 p-4 rounded-xl bg-secondary/30 group">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{edu.degree || edu.institution}</p>
                        <p className="text-xs text-muted-foreground">{edu.institution}{edu.start_year ? ` · ${edu.start_year}` : ""}{edu.end_year ? ` - ${edu.end_year}` : ""}</p>
                        {edu.field_of_study && <p className="text-xs text-muted-foreground mt-1">{edu.field_of_study}</p>}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEduForm({
                              institution: edu.institution,
                              degree: edu.degree || "",
                              field_of_study: edu.field_of_study || "",
                              start_year: edu.start_year || "",
                              end_year: edu.end_year || ""
                            });
                            setEditingEduId(edu.id);
                          }}
                          className="text-muted-foreground hover:text-primary flex-shrink-0"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteEducationMutation.mutate(edu.id)}
                          className="text-muted-foreground hover:text-destructive flex-shrink-0"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No education added yet.</p>
                )}

                {/* Add/Edit Education Form */}
                <div className="border border-border rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    {editingEduId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />} 
                    {editingEduId ? "Edit Education" : "Add Education"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Institution *</Label>
                      <Input value={eduForm.institution} onChange={e => setEduForm(f => ({ ...f, institution: e.target.value }))} placeholder="e.g. MIT" />
                    </div>
                    <div>
                      <Label className="text-xs">Degree</Label>
                      <Input value={eduForm.degree} onChange={e => setEduForm(f => ({ ...f, degree: e.target.value }))} placeholder="e.g. B.S. Computer Science" />
                    </div>
                    <div>
                      <Label className="text-xs">Field of Study</Label>
                      <Input value={eduForm.field_of_study} onChange={e => setEduForm(f => ({ ...f, field_of_study: e.target.value }))} placeholder="e.g. Computer Science" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Start Year</Label>
                        <Input type="number" value={eduForm.start_year} onChange={e => setEduForm(f => ({ ...f, start_year: e.target.value }))} placeholder="2018" />
                      </div>
                      <div>
                        <Label className="text-xs">End Year</Label>
                        <Input type="number" value={eduForm.end_year} onChange={e => setEduForm(f => ({ ...f, end_year: e.target.value }))} placeholder="2022" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddEducation} disabled={addEducationMutation.isPending || updateEducationMutation.isPending}>
                      {(addEducationMutation.isPending || updateEducationMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : (editingEduId ? <Edit2 className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />)}
                      {editingEduId ? "Save" : "Add"}
                    </Button>
                    {editingEduId && (
                      <Button size="sm" variant="ghost" onClick={() => {
                        setEduForm({ institution: "", degree: "", field_of_study: "", start_year: "", end_year: "" });
                        setEditingEduId(null);
                      }}>Cancel</Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Languages" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Languages</h3>
                <div className="flex flex-col gap-2">
                  {profile.languages && profile.languages.length > 0 ? (
                    profile.languages.map((lang: any) => (
                      <div key={lang.id} className="flex gap-4 p-3 rounded-xl bg-secondary/30 group items-center justify-between border border-transparent">
                        <div className="flex items-center gap-3">
                           <Globe className="w-4 h-4 text-primary" />
                           <div>
                             <span className="font-medium text-sm text-foreground">{lang.name}</span>
                             {lang.proficiency ? <span className="text-xs text-muted-foreground ml-2">({lang.proficiency})</span> : null}
                           </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setLangForm({ name: lang.name, proficiency: lang.proficiency || "Intermediate" });
                              setEditingLangId(lang.id);
                            }}
                            className="text-muted-foreground hover:text-primary transition-colors p-1 opacity-0 group-hover:opacity-100"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteLanguageMutation.mutate(lang.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1 opacity-0 group-hover:opacity-100"
                            title="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                     <p className="text-sm text-muted-foreground italic">No languages added yet.</p>
                  )}
                </div>

                {/* Add/Edit Language Form */}
                <div className="border border-border rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    {editingLangId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />} 
                    {editingLangId ? "Edit Language" : "Add Language"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Language *</Label>
                      <Input value={langForm.name} onChange={e => setLangForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. English" />
                    </div>
                    <div>
                      <Label className="text-xs">Proficiency</Label>
                      <select
                        value={langForm.proficiency}
                        onChange={e => setLangForm(f => ({ ...f, proficiency: e.target.value }))}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      >
                        <option value="Native">Native</option>
                        <option value="Fluent">Fluent</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Beginner">Beginner</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddLanguage} disabled={addLanguageMutation.isPending || updateLanguageMutation.isPending}>
                      {(addLanguageMutation.isPending || updateLanguageMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : (editingLangId ? <Edit2 className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />)}
                      {editingLangId ? "Save" : "Add"}
                    </Button>
                    {editingLangId && (
                      <Button size="sm" variant="ghost" onClick={() => {
                        setLangForm({ name: "", proficiency: "Intermediate" });
                        setEditingLangId(null);
                      }}>Cancel</Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Projects" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Projects</h3>
                </div>
                {profile.projects && profile.projects.length > 0 ? (
                  profile.projects.map((proj: any) => (
                    <div key={proj.id} className="flex gap-4 p-4 rounded-xl bg-secondary/30 group">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Code2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{proj.name}</p>
                        <p className="text-xs text-muted-foreground">{proj.role ? `${proj.role} · ` : ""}{proj.start_date ? new Date(proj.start_date).getFullYear() : "N/A"}{proj.is_current ? " - Present" : proj.end_date ? ` - ${new Date(proj.end_date).getFullYear()}` : ""}</p>
                        {proj.description && <p className="text-xs text-muted-foreground mt-2">{proj.description}</p>}
                        {proj.url && <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary mt-1 inline-block hover:underline">{proj.url}</a>}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setProjectForm({
                              name: proj.name,
                              role: proj.role || "",
                              description: proj.description || "",
                              url: proj.url || "",
                              start_date: proj.start_date ? (typeof proj.start_date === "string" ? proj.start_date.split("T")[0] : proj.start_date) : "",
                              end_date: proj.end_date ? (typeof proj.end_date === "string" ? proj.end_date.split("T")[0] : proj.end_date) : "",
                              is_current: proj.is_current
                            });
                            setEditingProjId(proj.id);
                          }}
                          className="text-muted-foreground hover:text-primary flex-shrink-0"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProjectMutation.mutate(proj.id)}
                          className="text-muted-foreground hover:text-destructive flex-shrink-0"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No projects added yet.</p>
                )}

                {/* Add/Edit Project Form */}
                <div className="border border-border rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    {editingProjId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />} 
                    {editingProjId ? "Edit Project" : "Add Project"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Project Name *</Label>
                      <Input value={projectForm.name} onChange={e => setProjectForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Portfolio Website" />
                    </div>
                    <div>
                      <Label className="text-xs">Role</Label>
                      <Input value={projectForm.role} onChange={e => setProjectForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Lead Developer" />
                    </div>
                    <div>
                      <Label className="text-xs">Project URL</Label>
                      <Input value={projectForm.url} onChange={e => setProjectForm(f => ({ ...f, url: e.target.value }))} placeholder="https://github.com/..." />
                    </div>
                    <div></div>
                    <div>
                      <Label className="text-xs">Start Date</Label>
                      <Input type="date" value={projectForm.start_date} onChange={e => setProjectForm(f => ({ ...f, start_date: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs">End Date</Label>
                      <Input type="date" value={projectForm.end_date} onChange={e => setProjectForm(f => ({ ...f, end_date: e.target.value }))} disabled={projectForm.is_current} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea value={projectForm.description} onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Describe the project and technologies used..." />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="proj_is_current" checked={projectForm.is_current} onChange={e => setProjectForm(f => ({ ...f, is_current: e.target.checked, end_date: e.target.checked ? "" : f.end_date }))} className="rounded" />
                    <Label htmlFor="proj_is_current" className="text-xs cursor-pointer">Currently working on this</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddProject} disabled={addProjectMutation.isPending || updateProjectMutation.isPending}>
                      {(addProjectMutation.isPending || updateProjectMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : (editingProjId ? <Edit2 className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />)}
                      {editingProjId ? "Save" : "Add"}
                    </Button>
                    {editingProjId && (
                      <Button size="sm" variant="ghost" onClick={() => {
                        setProjectForm({ name: "", role: "", description: "", url: "", start_date: "", end_date: "", is_current: false });
                        setEditingProjId(null);
                      }}>Cancel</Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        </>
      )}

      {/* Edit Profile Dialog (basic info only) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{profile ? "Edit Profile" : "Create Profile"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-3">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" maxLength={255} value={draft.full_name || ""} onChange={e => setDraft(d => ({ ...d, full_name: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="headline">Headline</Label>
                <Input id="headline" maxLength={100} value={draft.headline || ""} onChange={e => setDraft(d => ({ ...d, headline: e.target.value }))} placeholder="e.g. Senior Frontend Engineer" />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" maxLength={100} value={draft.location || ""} onChange={e => setDraft(d => ({ ...d, location: e.target.value }))} placeholder="e.g. Remote, or New York, NY"/>
              </div>
              <div>
                <Label htmlFor="about">About (Bio)</Label>
                <Textarea id="about" maxLength={1000} rows={4} value={draft.about || ""} onChange={e => setDraft(d => ({ ...d, about: e.target.value }))} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Use the tabs on the Profile page to manage Experience, Education, and Languages.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={createProfileMutation.isPending || updateProfileMutation.isPending}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground border-0" onClick={handleSave} disabled={createProfileMutation.isPending || updateProfileMutation.isPending}>
              {createProfileMutation.isPending || updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resume Management Dialog */}
      <Dialog open={resumeOpen} onOpenChange={setResumeOpen}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle>Manage Resume</DialogTitle>
           </DialogHeader>
           <div className="py-6 flex flex-col items-center justify-center space-y-4 border-2 border-dashed border-border rounded-xl">
             <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
               <Upload className="w-8 h-8" />
             </div>
             <div className="text-center">
               <h3 className="font-medium text-foreground">Upload a new resume</h3>
               <p className="text-xs text-muted-foreground mt-1">PDF format only. Max 10MB.</p>
             </div>
             <input
                ref={resumeInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleResumeUpload}
              />
              <div className="flex items-center space-x-2 bg-secondary/20 p-3 rounded-lg w-full mt-2">
                <input
                  type="checkbox"
                  id="prefill_profile"
                  checked={prefillProfile}
                  onChange={(e) => setPrefillProfile(e.target.checked)}
                  className="rounded border-input text-primary"
                />
                <Label htmlFor="prefill_profile" className="text-sm font-medium cursor-pointer">
                  Auto-fill my profile using AI
                </Label>
              </div>
             <Button onClick={() => resumeInputRef.current?.click()} disabled={uploadResumeMutation.isPending} className="mt-2 w-full">
               {uploadResumeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
               Select PDF File
             </Button>

             {profile?.resume_url && (
               <div className="mt-4 pt-4 border-t border-border w-full text-center">
                 <p className="text-sm font-medium text-foreground mb-2">Current Resume Options:</p>
                 <Button variant="outline" size="sm" onClick={() => handleViewResume(profile.resume_url!)}>
                    View Current Resume
                 </Button>
               </div>
             )}
           </div>
         </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
