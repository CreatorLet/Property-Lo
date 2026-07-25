import { useState, useRef, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useGetAdminSupportMessages, useSendAdminSupportMessage } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function AdminSupportDetail() {
  const [, params] = useRoute('/admin/support/:id');
  const [, setLocation] = useLocation();
  const id = params?.id || '';
  const { toast } = useToast();

  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useGetAdminSupportMessages(id, { 
    query: { 
      enabled: !!id,
      refetchInterval: 5000 
    } 
  });
  
  const sendMessage = useSendAdminSupportMessage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const content = message.trim();
    setMessage(''); 

    sendMessage.mutate({ chatId: id, data: { content } }, {
      onError: (error) => {
        setMessage(content); 
        toast({ title: "Failed to send", description: error.message, variant: "destructive" });
      }
    });
  };

  if (!id) return null;

  return (
    <div className="flex flex-col h-full bg-background max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/admin/support')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Support Ticket</h1>
            <p className="text-sm text-muted-foreground">ID: {id.split('-')[0]}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-2/3 rounded-2xl rounded-tl-sm bg-muted" />
            <Skeleton className="h-12 w-2/3 rounded-2xl rounded-tr-sm bg-primary/20 ml-auto" />
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No messages.
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.is_from_user;
            return (
              <div key={msg.id} className={`flex flex-col ${!isUser ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] md:max-w-[60%] px-4 py-3 rounded-2xl ${
                  !isUser 
                    ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                    : 'bg-card border border-border text-foreground rounded-tl-sm shadow-sm'
                }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1 font-medium">
                  {!isUser ? 'Support Agent' : 'User'} • {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border bg-card">
        <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto">
          <Input 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your support reply..."
            className="flex-1 h-12"
            disabled={sendMessage.isPending}
          />
          <Button type="submit" disabled={!message.trim() || sendMessage.isPending} className="shrink-0 h-12 px-6">
            <Send className="h-4 w-4 mr-2" />
            Send Reply
          </Button>
        </form>
      </div>
    </div>
  );
}
