import { useGetAdminStats, useGetAdminAnalytics } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Home, MessageSquare, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: analytics, isLoading: analyticsLoading } = useGetAdminAnalytics();

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and key metrics.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Users" 
          value={stats?.total_users} 
          icon={Users} 
          loading={statsLoading} 
          trend={`+${stats?.new_users_this_month || 0} this month`} 
        />
        <StatCard 
          title="Total Listings" 
          value={stats?.total_listings} 
          icon={Home} 
          loading={statsLoading} 
          trend={`+${stats?.new_listings_this_month || 0} this month`} 
        />
        <StatCard 
          title="Active Chats" 
          value={stats?.total_chats} 
          icon={MessageSquare} 
          loading={statsLoading} 
        />
        <StatCard 
          title="Closed Deals" 
          value={stats?.total_deals} 
          icon={AlertCircle} 
          loading={statsLoading} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* State Breakdown */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-[400px] flex flex-col">
          <h2 className="text-lg font-bold mb-6">Listings by Location</h2>
          <div className="flex-1 min-h-0">
            {analyticsLoading ? (
              <Skeleton className="w-full h-full" />
            ) : analytics?.locations_with_most_listings && analytics.locations_with_most_listings.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.locations_with_most_listings} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="location" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} angle={-45} textAnchor="end" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
            )}
          </div>
        </div>

        {/* Chat Labels Breakdown */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-[400px] flex flex-col">
          <h2 className="text-lg font-bold mb-6">Inquiry Types (Chat Labels)</h2>
          <div className="flex-1 min-h-0">
            {analyticsLoading ? (
              <Skeleton className="w-full h-full" />
            ) : analytics?.chat_label_breakdown && analytics.chat_label_breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.chat_label_breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="label"
                    label={({ label, percent }) => `${label || 'Unlabeled'} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {analytics.chat_label_breakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, loading, trend }: { title: string, value?: number, icon: any, loading: boolean, trend?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-muted-foreground font-medium text-sm">{title}</h3>
        <div className="p-2 bg-muted rounded-md text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-display font-bold text-foreground">
          {loading ? <Skeleton className="h-9 w-16" /> : value || 0}
        </p>
        {trend && (
          <p className="text-xs font-medium text-emerald-600">{trend}</p>
        )}
      </div>
    </div>
  );
}
