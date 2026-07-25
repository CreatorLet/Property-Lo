import { useState, useRef, useEffect } from 'react';
import { useGetSupportChat, useSendSupportMessage } from '@workspace/api-client-react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, LifeBuoy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function Support() {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: supportChat, isLoading } = useGetSupportChat({ 
    query: { refetchInterval: 5000 } 
  });
  
  const sendMessage = useSendSupportMessage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [supportChat?.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const content = message.trim();
    setMessage(''); 

    sendMessage.mutate({ data: { content } }, {
      onError: (error) => {
        setMessage(content); 
        toast({ title: "Failed to send", description: error.message, variant: "destructive" });
      }
    });
  };

  const messages = supportChat?.messages || [];

  return (
    <DashboardLayout title="Support">
      <div className="h-[calc(100vh-16rem)] min-h-[500px] flex flex-col bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        
        <div className="p-4 border-b border-border bg-muted/20 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">PropertyLo Support</h3>
            <p className="text-xs text-muted-foreground">We usually reply within a few hours</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-2/3 rounded-2xl rounded-tl-sm bg-muted" />
              <Skeleton className="h-16 w-3/4 rounded-2xl rounded-tr-sm bg-primary/20 ml-auto" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
              <LifeBuoy className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm">How can we help you today?</p>
              <p className="text-xs mt-1">Send us a message and our support team will get back to you.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.is_from_user;
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

        <div className="p-4 border-t border-border bg-background">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue..."
              className="flex-1"
              disabled={sendMessage.isPending}
            />
            <Button type="submit" disabled={!message.trim() || sendMessage.isPending} className="shrink-0">
              <Send className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Send</span>
            </Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
