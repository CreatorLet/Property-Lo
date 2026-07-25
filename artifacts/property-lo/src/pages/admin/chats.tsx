import { useGetAdminChats } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, ChevronRight, User as UserIcon } from 'lucide-react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export default function AdminChats() {
  const { data: chats, isLoading } = useGetAdminChats({ query: { refetchInterval: 10000 } });

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Property Inquiries</h1>
        <p className="text-muted-foreground mt-1">Manage all user chats regarding property listings.</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map(i => (
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
          <div className="p-16 text-center">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium text-foreground mb-2">No active inquiries</h3>
            <p className="text-muted-foreground">
              When users contact you about a property, they will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {chats.map(chat => (
              <Link key={chat.id} href={`/admin/chats/${chat.id}`}>
                <div className="p-4 hover:bg-muted/50 transition-colors flex items-center gap-4 cursor-pointer relative">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <UserIcon className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2 pr-4 truncate">
                        <h4 className="font-semibold text-foreground truncate">
                          {chat.user_name || "User"}
                        </h4>
                        <span className="text-muted-foreground text-sm truncate">
                          regarding <span className="font-medium">{chat.listing_title}</span>
                        </span>
                        {chat.label && (
                          <Badge variant="outline" className="text-[10px] uppercase shrink-0">
                            {chat.label}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground truncate flex-1 font-medium">
                        {chat.last_message || "No messages yet"}
                      </p>
                      {chat.admin_unread > 0 && (
                        <Badge className="bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 min-w-[1.25rem] text-center shrink-0 border-none">
                          {chat.admin_unread}
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
    </div>
  );
}
