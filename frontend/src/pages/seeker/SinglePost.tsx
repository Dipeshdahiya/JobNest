import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import { Heart, MessageCircle, Share2, Send, Hash, ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { socialApi } from "@/lib/api/socialApi";

const SinglePost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  const { data: post, isLoading: isPostLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: () => socialApi.getPost(id!),
    enabled: !!id,
  });

  const { data: comments = [], isLoading: isCommentsLoading } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => socialApi.getComments(id!),
    enabled: !!id,
  });

  const likeMutation = useMutation({
    mutationFn: ({ id, liked }: { id: string, liked: boolean }) => 
       liked ? socialApi.unlikePost(id) : socialApi.likePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] });
    },
    onError: () => {
      toast({ title: "Action failed", variant: "destructive" });
    }
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => socialApi.addComment(id!, { content }),
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      toast({ title: "Commented!", description: "Your comment has been added." });
    },
    onError: () => {
      toast({ title: "Failed to comment", variant: "destructive" });
    }
  });

  const handleLike = () => {
    if (!post) return;
    likeMutation.mutate({ id: post.id, liked: false });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied!", description: "Post link copied to clipboard." });
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText);
  };

  if (isPostLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 text-center py-12">
        <p className="text-muted-foreground">Post not found.</p>
        <Button variant="ghost" onClick={() => navigate("/seeker/social")}>Back to Feed</Button>
      </div>
    );
  }

  const authorInitial = post.author_name ? post.author_name.charAt(0).toUpperCase() : '?';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/seeker/social")} className="text-muted-foreground">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Feed
      </Button>

      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
            {authorInitial}
          </div>
          <div>
            <p className="font-semibold text-foreground">{post.author_name || 'Anonymous User'}</p>
            <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line mb-4">{post.content}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {post.hashtags?.map((tag) => (
            <Link key={tag.id} to={`/seeker/social?tag=${tag.name}`}>
              <Badge className="bg-primary/10 text-primary border-0 text-xs cursor-pointer hover:bg-primary/20 transition-colors">
                <Hash className="w-3 h-3 mr-0.5" />{tag.name}
              </Badge>
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-6 pt-4 border-t border-border mb-6">
          <button onClick={handleLike} className={`flex items-center gap-2 text-sm transition-colors text-muted-foreground hover:text-primary`}>
            <Heart className={`w-4 h-4`} /> {post.like_count}
          </button>
          <button className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageCircle className="w-4 h-4" /> {post.comment_count}
          </button>
          <button onClick={handleShare} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>

        <h3 className="font-semibold text-foreground mb-4">Comments</h3>
        <div className="space-y-4 mb-4">
          {isCommentsLoading ? (
            <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : comments.length > 0 ? comments.map((c) => {
            const commenterName = c.author_name || 'Anonymous';
            return (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-semibold text-xs flex-shrink-0">
                  {commenterName.charAt(0).toUpperCase()}
                </div>
                <div className="bg-secondary/30 rounded-xl rounded-tl-md px-4 py-3 flex-1">
                  <p className="text-sm font-medium text-foreground">{commenterName}</p>
                  <p className="text-xs text-muted-foreground mt-1">{c.content}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{new Date(c.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            );
          }) : (
            <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <input
            placeholder="Write a comment..."
            className="flex-1 bg-secondary/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleComment()}
            disabled={commentMutation.isPending}
          />
          <button 
            onClick={handleComment} 
            disabled={!commentText.trim() || commentMutation.isPending}
            className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground disabled:opacity-50"
          >
            {commentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default SinglePost;
