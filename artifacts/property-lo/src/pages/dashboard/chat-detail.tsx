import { useState, useRef, useEffect } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { useGetChatMessages, useSendChatMessage } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function ChatDetail() {
  const [, params] = useRoute('/dashboard/chats/:id');
  const [, setLocation] = useLocation();
  const id = params?.id || '';
  const { toast } = useToast();

  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useGetChatMessages(id, { 
    query: { 
      enabled: !!id,
      refetchInterval: 5000 // Poll every 5 seconds
    } 
  });
  
  const sendMessage = useSendChatMessage();

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const content = message.trim();
    setMessage(''); // Optimistic clear

    sendMessage.mutate({ id, data: { content } }, {
      onError: (error) => {
        setMessage(content); // Restore on error
        toast({ title: "Failed to send", description: error.message, variant: "destructive" });
      }
    });
  };

  if (!id) return null;

  return (
    <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 flex flex-col max-w-4xl min-h-[calc(100dvh-4rem)] md:h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-4 mb-4 md:mb-6 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => setLocation('/dashboard/chats')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Chat with Agent</h1>
          <p className="text-sm text-muted-foreground">Property Inquiry</p>
        </div>
      </div>

      <div className="flex-1 bg-card md:border border-border md:rounded-xl shadow-sm flex flex-col -mx-4 md:mx-0 md:overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-2/3 rounded-2xl rounded-tl-sm bg-muted" />
              <Skeleton className="h-12 w-2/3 rounded-2xl rounded-tr-sm bg-primary/20 ml-auto" />
              <Skeleton className="h-16 w-3/4 rounded-2xl rounded-tl-sm bg-muted" />
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              No messages yet. Send a message to start the conversation.
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = !msg.is_admin;
              return (
                <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                    isUser 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-muted text-foreground rounded-tl-sm border border-border'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border bg-background md:bg-muted/20 sticky md:static bottom-0 w-full z-10 shrink-0">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-background"
              disabled={sendMessage.isPending}
            />
            <Button type="submit" disabled={!message.trim() || sendMessage.isPending} className="shrink-0">
              <Send className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Send</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
