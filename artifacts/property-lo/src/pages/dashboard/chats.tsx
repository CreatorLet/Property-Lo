import { useGetChats } from '@workspace/api-client-react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export default function Chats() {
  const { data: chats, isLoading } = useGetChats({ query: { refetchInterval: 10000 } });

  return (
    <DashboardLayout title="Messages">
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !chats || chats.length === 0 ? (
          <div className="p-12 text-center">
            <div className="bg-blue-100 text-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-medium text-foreground mb-2">No messages</h3>
            <p className="text-muted-foreground">
              When you contact an agent about a property, the conversation will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {chats.map(chat => (
              <Link key={chat.id} href={`/dashboard/chats/${chat.id}`}>
                <div className="p-4 hover:bg-muted/50 transition-colors flex items-center gap-4 cursor-pointer relative">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-foreground truncate pr-4">
                        {chat.listing_title || "Property Inquiry"}
                      </h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground truncate flex-1">
                        {chat.last_message || "No messages yet"}
                      </p>
                      {chat.user_unread > 0 && (
                        <Badge className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 min-w-[1.25rem] text-center shrink-0">
                          {chat.user_unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
