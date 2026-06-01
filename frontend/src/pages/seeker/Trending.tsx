import GlassCard from "@/components/GlassCard";
import { Hash, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { socialApi } from "@/lib/api/socialApi";

const Trending = () => {
  const navigate = useNavigate();

  const { data: trendingHashtags = [], isLoading } = useQuery({
    queryKey: ['trendingHashtags'],
    queryFn: () => socialApi.getTrendingHashtags(),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Trending Hashtags</h1>
      
      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : trendingHashtags.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingHashtags.map((h, i) => (
            <GlassCard key={h.name} hover className="flex items-center justify-between cursor-pointer" onClick={() => navigate(`/seeker/social?tag=${h.name}`)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Hash className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">#{h.name}</p>
                  <p className="text-xs text-muted-foreground">{h.usage_count} posts</p>
                </div>
              </div>
              <span className="text-sm font-bold text-muted-foreground">#{i + 1}</span>
            </GlassCard>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 opacity-50">
          <p>No trending hashtags yet.</p>
        </div>
      )}
    </div>
  );
};

export default Trending;
