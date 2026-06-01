import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  XCircle,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Building2,
  ExternalLink,
  AlertTriangle,
  FileUp,
} from "lucide-react";
import { aiApi, type AIJobRecommendation } from "@/lib/api/aiApi";

/* ── Score colour helper ─────────────────────────────────────────── */

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function scoreBorderColor(score: number) {
  if (score >= 75) return "border-emerald-400";
  if (score >= 50) return "border-amber-400";
  return "border-red-400";
}

function scoreLabel(score: number) {
  if (score >= 85) return "Excellent Match";
  if (score >= 70) return "Great Match";
  if (score >= 50) return "Good Match";
  if (score >= 30) return "Partial Match";
  return "Low Match";
}

/* ── Single recommendation card ──────────────────────────────────── */

function RecommendationCard({
  rec,
  rank,
}: {
  rec: AIJobRecommendation;
  rank: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  return (
    <GlassCard className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Score circle */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <div
            className={`w-20 h-20 rounded-full border-[3px] ${scoreBorderColor(
              rec.match_score
            )} flex items-center justify-center`}
          >
            <span className={`text-2xl font-bold ${scoreColor(rec.match_score)}`}>
              {rec.match_score}%
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">
            {scoreLabel(rec.match_score)}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground text-lg leading-tight flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary flex-shrink-0" />
                {rec.job_title}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5" />
                {rec.company_name}
              </p>
            </div>
            <Badge variant="outline" className="text-xs flex-shrink-0">
              #{rank}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {rec.summary}
          </p>

          {/* Quick chips */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {rec.strengths.slice(0, 3).map((s) => (
              <Badge
                key={s}
                variant="secondary"
                className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                {s}
              </Badge>
            ))}
            {rec.gaps.slice(0, 2).map((g) => (
              <Badge
                key={g}
                variant="secondary"
                className="text-[11px] bg-red-500/10 text-red-400 border-red-500/20"
              >
                <XCircle className="w-3 h-3 mr-1" />
                {g}
              </Badge>
            ))}
          </div>

          {/* Expandable detail */}
          {expanded && (
            <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
              {rec.strengths.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-1">
                    Strengths
                  </h4>
                  <ul className="space-y-1">
                    {rec.strengths.map((s) => (
                      <li
                        key={s}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {rec.gaps.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">
                    Gaps
                  </h4>
                  <ul className="space-y-1">
                    {rec.gaps.map((g) => (
                      <li
                        key={g}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions row */}
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/40">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 mr-1" /> Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 mr-1" /> Details
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs ml-auto"
              onClick={() => navigate(`/seeker/jobs/${rec.job_id}`)}
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Job
            </Button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

/* ── Loading skeleton ────────────────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <GlassCard key={i}>
          <div className="flex gap-4">
            <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */

const AIMatch = () => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["ai-job-recommendations"],
    queryFn: aiApi.getJobRecommendations,
    staleTime: 5 * 60 * 1000, // cache for 5 min
    retry: 1,
  });

  const recommendations = data?.recommendations ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            AI Job Recommendations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Powered by Gemini — your resume scored against every open position
          </p>
        </div>
        {!isLoading && (
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <TrendingUp className="w-4 h-4 mr-1" /> Refresh
          </Button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <>
          <GlassCard className="text-center glow-sm">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              <div>
                <p className="font-semibold text-foreground">Analyzing your resume…</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  AI is comparing your profile against all open jobs. This may take
                  15-30 seconds.
                </p>
              </div>
            </div>
          </GlassCard>
          <LoadingSkeleton />
        </>
      )}

      {/* Error */}
      {isError && (
        <GlassCard className="text-center">
          <div className="flex flex-col items-center gap-3 py-4">
            {(error as any)?.response?.status === 400 ? (
              <>
                <FileUp className="w-10 h-10 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-foreground">Resume Required</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please upload your resume on the{" "}
                    <a href="/seeker/resume" className="text-primary underline">
                      Resume page
                    </a>{" "}
                    before using AI recommendations.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="w-10 h-10 text-destructive" />
                <div>
                  <p className="font-semibold text-foreground">
                    Something went wrong
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(error as any)?.response?.data?.detail ||
                      "Failed to load AI recommendations. Please try again."}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Try Again
                </Button>
              </>
            )}
          </div>
        </GlassCard>
      )}

      {/* Empty */}
      {!isLoading && !isError && recommendations.length === 0 && (
        <GlassCard className="text-center py-8">
          <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-foreground">No Recommendations Yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            There are no open jobs to match against right now. Check back later!
          </p>
        </GlassCard>
      )}

      {/* Results */}
      {!isLoading && !isError && recommendations.length > 0 && (
        <>
          {/* Summary card */}
          <GlassCard className="glow-sm">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-full border-[3px] ${scoreBorderColor(
                  recommendations[0].match_score
                )} flex items-center justify-center`}
              >
                <span
                  className={`text-xl font-bold ${scoreColor(
                    recommendations[0].match_score
                  )}`}
                >
                  {recommendations[0].match_score}%
                </span>
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Best Match: {recommendations[0].job_title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {recommendations.length} job{recommendations.length > 1 ? "s" : ""}{" "}
                  matched &middot; Top score{" "}
                  {recommendations[0].match_score}%
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Job cards */}
          <div className="space-y-4">
            {recommendations.map((rec, i) => (
              <RecommendationCard key={rec.job_id} rec={rec} rank={i + 1} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AIMatch;
