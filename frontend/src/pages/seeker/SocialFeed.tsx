import { useState } from "react";
import { Heart, MessageCircle, Share2, Send, Hash, TrendingUp, X, Loader2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { socialApi, Post } from "@/lib/api/socialApi";

const SocialFeed = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTag = searchParams.get("tag") || "";
  const [newPost, setNewPost] = useState("");
  const queryClient = useQueryClient();

  const { data: trendingHashtags = [], isLoading: isLoadingTags } = useQuery({
    queryKey: ['trendingHashtags'],
    queryFn: () => socialApi.getTrendingHashtags(),
  });

  const { data: posts = [], isLoading: isLoadingPosts } = useQuery({
    queryKey: ['feed', activeTag],
    queryFn: () => activeTag ? socialApi.getPostsByHashtag(activeTag) : socialApi.getFeed(),
  });

  const createPostMutation = useMutation({
    mutationFn: (content: string) => {
      const hashtags = content.match(/#(\w+)/g)?.map(t => t.slice(1)) || [];
      return socialApi.createPost({ content, hashtag_names: hashtags });
    },
    onSuccess: () => {
      setNewPost("");
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['trendingHashtags'] });
      toast({ title: "Posted!", description: "Your post has been published." });
    },
    onError: () => {
      toast({ title: "Failed to post", description: "Something went wrong.", variant: "destructive" });
    }
  });

  const likeMutation = useMutation({
    mutationFn: ({ id, liked }: { id: string, liked: boolean }) => 
       liked ? socialApi.unlikePost(id) : socialApi.likePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: () => {
      toast({ title: "Action failed", variant: "destructive" });
    }
  });

  const handleLike = (post: Post) => {
    // Basic optimistically assuming user hasn't liked it since we don't have boolean mapped
    // Actually we will just trigger like for now. If it errors because already liked, handle silently.
    // In a real app we'd track user's specific like status.
    likeMutation.mutate({ id: post.id, liked: false }); 
  };

  const handleShare = (postId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/seeker/post/${postId}`);
    toast({ title: "Link copied!", description: "Post link copied to clipboard." });
  };

  const handlePost = () => {
    if (!newPost.trim()) return;
    createPostMutation.mutate(newPost);
  };

  const handleTagClick = (tag: string) => {
    if (activeTag === tag) {
      setSearchParams({});
    } else {
      setSearchParams({ tag });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Social Feed</h1>

      {activeTag && (
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/10 text-primary border-0 text-sm px-3 py-1">
            <Hash className="w-3 h-3 mr-1" />Filtering: #{activeTag}
          </Badge>
          <button onClick={() => setSearchParams({})} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">Me</div>
              <textarea
                placeholder="What's on your mind? Use #hashtags to tag topics"
                className="flex-1 bg-secondary/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:bg-secondary/80 transition-colors resize-none min-h-[44px]"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                rows={2}
                disabled={createPostMutation.isPending}
              />
            </div>
            <div className="flex justify-end">
              <Button size="sm" className="gradient-primary text-primary-foreground border-0" onClick={handlePost} disabled={!newPost.trim() || createPostMutation.isPending}>
                {createPostMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />} Post
              </Button>
            </div>
          </GlassCard>

          {isLoadingPosts ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : posts.length > 0 ? posts.map((post) => {
            const authorInitial = post.author_name ? post.author_name.charAt(0).toUpperCase() : '?';
            return (
              <GlassCard key={post.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    {authorInitial}
                  </div>
                  <div>
                    <Link to={`/seeker/post/${post.id}`} className="font-semibold text-foreground text-sm hover:text-primary transition-colors">{post.author_name || 'Anonymous User'}</Link>
                    <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line mb-4">{post.content}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.hashtags?.map((hashtag) => (
                    <Badge key={hashtag.id} variant="secondary" className="bg-primary/10 text-primary border-0 text-xs cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => handleTagClick(hashtag.name)}>
                      <Hash className="w-3 h-3 mr-0.5" />{hashtag.name}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-6 pt-4 border-t border-border">
                  <button onClick={() => handleLike(post)} className={`flex items-center gap-2 text-sm transition-colors text-muted-foreground hover:text-primary`}>
                    <Heart className={`w-4 h-4`} /> {post.like_count}
                  </button>
                  <Link to={`/seeker/post/${post.id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <MessageCircle className="w-4 h-4" /> {post.comment_count}
                  </Link>
                  <button onClick={() => handleShare(post.id)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>
              </GlassCard>
            );
          }) : (
            <GlassCard className="text-center py-12">
              <Hash className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No posts found {activeTag && `for #${activeTag}`}</p>
              {activeTag && <Button variant="ghost" size="sm" className="mt-2" onClick={() => setSearchParams({})}>Clear filter</Button>}
            </GlassCard>
          )}
        </div>

        <div className="space-y-6">
          <GlassCard>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Trending
            </h3>
            {isLoadingTags ? (
              <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : trendingHashtags.length > 0 ? (
              <div className="space-y-3">
                {trendingHashtags.map((h) => (
                  <div key={h.id} className="flex items-center justify-between cursor-pointer hover:bg-secondary/30 rounded-lg px-2 py-1 -mx-2 transition-colors" onClick={() => handleTagClick(h.name)}>
                    <span className={`text-sm font-medium ${activeTag === h.name ? "text-primary" : "text-foreground"}`}>#{h.name}</span>
                    <span className="text-xs text-muted-foreground">{h.usage_count} posts</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No trending topics yet.</p>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default SocialFeed;
