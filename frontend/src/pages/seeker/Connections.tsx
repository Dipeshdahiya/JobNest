import { useState } from "react";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Loader2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { connectionApi, Connection } from "@/lib/api/connectionApi";
import { userApi } from "@/lib/api/userApi";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

const ConnectionUserCard = ({ connection, type }: { connection: Connection, type: "connections" | "requests" }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Determine who the other person is
  const otherUserId = connection.requester_id === currentUser?.id ? connection.receiver_id : connection.requester_id;

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', otherUserId],
    queryFn: () => userApi.getUser(otherUserId),
  });

  const acceptMutation = useMutation({
    mutationFn: () => connectionApi.accept(connection.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['pendingConnections'] });
      toast({ title: "Connected", description: "Connection request accepted" });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: () => connectionApi.reject(connection.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['pendingConnections'] });
      toast({ title: "Rejected", description: "Connection request rejected" });
    }
  });

  if (isLoading) {
    return <GlassCard className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></GlassCard>;
  }

  if (!user) return null;

  const name = user.email?.split('@')[0] || "User";

  return (
    <GlassCard hover className="text-center cursor-pointer flex flex-col" onClick={() => navigate(`/seeker/public-profile?user=${user.id}`)}>
      <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg mx-auto mb-3">
        {name.charAt(0).toUpperCase()}
      </div>
      <h3 className="font-semibold text-foreground text-sm">{name}</h3>
      <p className="text-xs text-muted-foreground mt-1">{user.role}</p>
      
      <div className="mt-auto pt-4 flex gap-2 w-full">
        {type === "connections" ? (
          <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10 w-full" onClick={(e) => { e.stopPropagation(); navigate(`/seeker/messages?user=${user.id}`); }}>
            <UserCheck className="w-3 h-3 mr-1" /> Message
          </Button>
        ) : (
          <>
            <Button size="sm" className="w-full gradient-primary border-0 text-primary-foreground" onClick={(e) => { e.stopPropagation(); acceptMutation.mutate(); }} disabled={acceptMutation.isPending}>
              {acceptMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <UserPlus className="w-3 h-3 mr-1" />} Accept
            </Button>
            <Button size="sm" variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); rejectMutation.mutate(); }} disabled={rejectMutation.isPending}>
              {rejectMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <XCircle className="w-3 h-3 mr-1" />} Decline
            </Button>
          </  >
        )}
      </div>
    </GlassCard>
  );
};

const Connections = () => {
  const [tab, setTab] = useState<"connections" | "requests">("connections");

  const { data: connections = [], isLoading: isLoadingConnections } = useQuery({
    queryKey: ['connections'],
    queryFn: () => connectionApi.listConnections(),
  });

  const { data: pendingRequests = [], isLoading: isLoadingPending } = useQuery({
    queryKey: ['pendingConnections'],
    queryFn: () => connectionApi.listPending(),
  });

  const isLoading = tab === "connections" ? isLoadingConnections : isLoadingPending;
  const displayList = tab === "connections" ? connections : pendingRequests;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Connections</h1>
      </div>

      <div className="flex gap-1 p-1 glass rounded-xl w-fit">
        {(["connections", "requests"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t} {t === 'requests' && pendingRequests.length > 0 && <span className="bg-destructive text-destructive-foreground ml-2 px-1.5 py-0.5 rounded-full text-xs">{pendingRequests.length}</span>}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : displayList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayList.map((connection) => (
            <ConnectionUserCard key={connection.id} connection={connection} type={tab} />
          ))}
        </div>
      ) : (
        <GlassCard className="text-center py-20 lg:col-span-3">
           <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
           <p className="text-lg font-medium text-foreground">No {tab} found</p>
           <p className="text-sm text-muted-foreground mt-1">When you connect with others, they will appear here.</p>
        </GlassCard>
      )}
    </div>
  );
};

export default Connections;
