import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { searchApi } from "@/lib/api/searchApi";
import { jobApi } from "@/lib/api/jobApi";
import GlassCard from "@/components/GlassCard";
import { Loader2, Users, Building2, MessageSquare, Briefcase, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const GlobalSearch = ({ role }: { role: string }) => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"all" | "people" | "companies" | "jobs" | "posts">("all");

  const peopleQuery = useQuery({
    queryKey: ['searchPeople', query],
    queryFn: () => searchApi.searchPeople(query),
    enabled: !!query && (activeTab === "all" || activeTab === "people"),
  });

  const companiesQuery = useQuery({
    queryKey: ['searchCompanies', query],
    queryFn: () => searchApi.searchCompanies(query),
    enabled: !!query && (activeTab === "all" || activeTab === "companies"),
  });

  const postsQuery = useQuery({
    queryKey: ['searchPosts', query],
    queryFn: () => searchApi.searchPosts(query),
    enabled: !!query && (activeTab === "all" || activeTab === "posts"),
  });

  const jobsQuery = useQuery({
    queryKey: ['searchJobs', query],
    queryFn: () => jobApi.getJobs({ keyword: query }),
    enabled: !!query && (activeTab === "all" || activeTab === "jobs"),
  });

  const isLoading = peopleQuery.isLoading || companiesQuery.isLoading || postsQuery.isLoading || jobsQuery.isLoading;

  if (!query) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">Enter a search query to see results.</p>
      </div>
    );
  }

  const tabs = [
    { id: "all", label: "All Results" },
    { id: "people", label: "People" },
    { id: "companies", label: "Companies" },
    { id: "jobs", label: "Jobs" },
    { id: "posts", label: "Posts" },
  ] as const;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground">Search results for "{query}"</h1>

      <div className="flex gap-1 p-1 glass rounded-xl overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && (
        <div className="space-y-8">
          {/* People */}
          {(activeTab === "all" || activeTab === "people") && peopleQuery.data && (
            <div className="space-y-4">
              {activeTab === "all" && <h2 className="text-lg font-semibold flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> People</h2>}
              {peopleQuery.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">No people found.</p>
              ) : (
                <div className="grid gap-4">
                  {peopleQuery.data.map((person) => (
                    <GlassCard key={person.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => navigate(`/${role}/public-profile?user=${person.id}`)}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full gradient-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                          {person.full_name ? person.full_name.substring(0, 2).toUpperCase() : person.email.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{person.full_name || person.email}</p>
                          <p className="text-xs text-muted-foreground">User</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Companies */}
          {(activeTab === "all" || activeTab === "companies") && companiesQuery.data && (
            <div className="space-y-4">
              {activeTab === "all" && <h2 className="text-lg font-semibold flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Companies</h2>}
              {companiesQuery.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">No companies found.</p>
              ) : (
                <div className="grid gap-4">
                  {companiesQuery.data.map((company) => (
                    <GlassCard key={company.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center font-semibold text-sm text-foreground">
                          {company.company_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{company.company_name}</p>
                          <p className="text-xs text-muted-foreground">{company.industry || 'No industry specified'}</p>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Jobs */}
          {(activeTab === "all" || activeTab === "jobs") && jobsQuery.data && (
            <div className="space-y-4">
              {activeTab === "all" && <h2 className="text-lg font-semibold flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" /> Jobs</h2>}
              {jobsQuery.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">No jobs found.</p>
              ) : (
                <div className="grid gap-4">
                  {jobsQuery.data.slice(0, activeTab === "all" ? 3 : undefined).map((job) => (
                    <GlassCard key={job.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => navigate(`/${role}/jobs/${job.id}`)}>
                      <div>
                        <p className="font-medium text-foreground text-base">{job.title}</p>
                        <p className="text-sm text-muted-foreground">{job.company_name} · {job.location}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </GlassCard>
                  ))}
                  {activeTab === "all" && jobsQuery.data.length > 3 && (
                    <Button variant="link" onClick={() => setActiveTab("jobs")} className="w-full">View all {jobsQuery.data.length} jobs</Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Posts */}
          {(activeTab === "all" || activeTab === "posts") && postsQuery.data && (
             <div className="space-y-4">
             {activeTab === "all" && <h2 className="text-lg font-semibold flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /> Posts</h2>}
             {postsQuery.data.length === 0 ? (
               <p className="text-sm text-muted-foreground">No posts found.</p>
             ) : (
               <div className="grid gap-4">
                 {postsQuery.data.slice(0, activeTab === "all" ? 3 : undefined).map((post) => (
                   <GlassCard key={post.id} className="p-4 cursor-pointer hover:bg-secondary/20 transition-colors" onClick={() => navigate(`/${role}/post/${post.id}`)}>
                     <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-medium text-xs">
                          {post.author_name ? post.author_name.charAt(0) : "U"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{post.author_name || "Unknown Author"}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</p>
                        </div>
                     </div>
                     <p className="text-sm text-foreground line-clamp-3">{post.content}</p>
                   </GlassCard>
                 ))}
                 {activeTab === "all" && postsQuery.data.length > 3 && (
                   <Button variant="link" onClick={() => setActiveTab("posts")} className="w-full">View all {postsQuery.data.length} posts</Button>
                 )}
               </div>
             )}
           </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
