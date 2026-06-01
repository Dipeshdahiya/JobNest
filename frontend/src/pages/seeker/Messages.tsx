import { useState, useEffect, useRef } from "react";
import GlassCard from "@/components/GlassCard";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messagingApi, Conversation } from "@/lib/api/messagingApi";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "react-router-dom";

const Messages = () => {
  const [searchParams] = useSearchParams();
  const initUser = searchParams.get("user");
  const [activeChat, setActiveChat] = useState<string | null>(initUser);
  const [inputText, setInputText] = useState("");
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: isConversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagingApi.getConversations(),
    refetchInterval: 10000, // Poll every 10s
  });

  const { data: chatMessages = [], isLoading: isMessagesLoading } = useQuery({
    queryKey: ['conversation', activeChat],
    queryFn: () => messagingApi.getConversation(activeChat!),
    enabled: !!activeChat,
    refetchInterval: 5000, // Poll every 5s if active
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => messagingApi.sendMessage({ receiver_id: activeChat!, content }),
    onSuccess: (newMessage) => {
      setInputText("");
      queryClient.setQueryData(['conversation', activeChat], (old: any) => [...(old || []), newMessage]);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const markReadMutation = useMutation({
    mutationFn: (messageId: string) => messagingApi.markAsRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', activeChat] });
    }
  });

  useEffect(() => {
    // Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Mark unread as read
    if (chatMessages.length > 0) {
      const unreadFromPartner = chatMessages.filter(m => !m.is_read && m.sender_id !== currentUser?.id);
      if (unreadFromPartner.length > 0) {
        // Just mark the latest one, backend likely marks all older ones or we loop
        unreadFromPartner.forEach(m => markReadMutation.mutate(m.id));
      }
    }
  }, [chatMessages, currentUser?.id]);

  useEffect(() => {
    if (!activeChat && conversations.length > 0 && !initUser) {
      setActiveChat(conversations[0].partner_id);
    }
  }, [conversations, activeChat, initUser]);

  const handleSend = () => {
    if (!inputText.trim() || !activeChat) return;
    sendMutation.mutate(inputText);
  };

  const activeConversation = conversations.find(c => c.partner_id === activeChat);
  const partnerName = activeConversation?.partner_name || 'User';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Messages</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        <GlassCard className="overflow-y-auto max-h-full">
          <h3 className="font-semibold text-foreground mb-4">Conversations</h3>
          
          {isConversationsLoading ? (
            <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : conversations.length > 0 ? (
             <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.partner_id}
                  onClick={() => setActiveChat(conv.partner_id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors",
                    activeChat === conv.partner_id ? "bg-primary/10 border border-primary/20" : "hover:bg-secondary/50",
                    conv.unread_count > 0 ? "bg-secondary/30" : ""
                  )}
                >
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm flex-shrink-0">
                    {conv.partner_name ? conv.partner_name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground truncate">{conv.partner_name || 'User'}</p>
                      <span className="text-xs text-muted-foreground">{conv.last_message ? new Date(conv.last_message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                    </div>
                    <p className={`text-xs truncate ${conv.unread_count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{conv.last_message?.content || ''}</p>
                  </div>
                  {conv.unread_count > 0 && <div className="w-5 h-5 rounded-full gradient-primary text-[10px] flex items-center justify-center text-primary-foreground">{conv.unread_count}</div>}
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center py-10 opacity-50">
               <MessageSquare className="w-8 h-8 mx-auto mb-2" />
               <p className="text-sm">No conversations</p>
             </div>
          )}
        </GlassCard>

        <GlassCard className="lg:col-span-2 flex flex-col max-h-full">
          {!activeChat ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-50">
              <MessageSquare className="w-12 h-12 mb-3" />
              <p>Select a conversation to start messaging</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  {partnerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{partnerName}</p>
                </div>
              </div>

              <div className="flex-1 py-4 space-y-4 overflow-y-auto">
                {isMessagesLoading ? (
                  <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : chatMessages.map((msg) => {
                  const isMe = msg.sender_id === currentUser?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`rounded-2xl px-4 py-3 max-w-xs ${isMe ? "gradient-primary rounded-br-md" : "bg-secondary/50 rounded-bl-md"}`}>
                        <p className={`text-sm ${isMe ? "text-primary-foreground" : "text-foreground"}`}>{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <input
                  placeholder="Type a message..."
                  className="flex-1 bg-secondary/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  disabled={sendMutation.isPending}
                />
                <button 
                  onClick={handleSend} 
                  disabled={!inputText.trim() || sendMutation.isPending}
                  className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default Messages;
