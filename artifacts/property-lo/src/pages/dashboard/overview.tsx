import { useGetListingStats, useGetChatUnreadCount, useGetSupportUnreadCount, useGetFavorites } from '@workspace/api-client-react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Heart, LifeBuoy } from 'lucide-react';
import { Link } from 'wouter';

export default function DashboardOverview() {
  const { user } = useAuth();
  
  // Note: we might need to filter listings by user, but let's assume getListingStats handles general, 
  // and we'll just show active listings count here, or favorites.
  const { data: stats, isLoading: statsLoading } = useGetListingStats();
  const { data: unreadChats, isLoading: chatsLoading } = useGetChatUnreadCount();
  const { data: unreadSupport, isLoading: supportLoading } = useGetSupportUnreadCount();
  const { data: favorites, isLoading: favLoading } = useGetFavorites();

  const isLoading = statsLoading || chatsLoading || supportLoading || favLoading;

  return (
    <DashboardLayout title="Dashboard Overview" showPersonalDashboard>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/favorites">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-rose-100 dark:bg-rose-950/50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
                  <Heart className="h-6 w-6" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-display font-bold">
                  {favLoading ? <Skeleton className="h-9 w-16" /> : favorites?.length || 0}
                </h3>
                <p className="text-sm text-muted-foreground font-medium">Saved Favorites</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/chats">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-950/50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-6 w-6" />
                </div>
                {unreadChats?.count ? (
                  <span className="absolute top-6 right-6 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                ) : null}
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-display font-bold">
                  {chatsLoading ? <Skeleton className="h-9 w-16" /> : unreadChats?.count || 0}
                </h3>
                <p className="text-sm text-muted-foreground font-medium">Unread Messages</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/support">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                  <LifeBuoy className="h-6 w-6" />
                </div>
                {unreadSupport?.count ? (
                  <span className="absolute top-6 right-6 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                ) : null}
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-display font-bold">
                  {supportLoading ? <Skeleton className="h-9 w-16" /> : unreadSupport?.count || 0}
                </h3>
                <p className="text-sm text-muted-foreground font-medium">Support Replies</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
