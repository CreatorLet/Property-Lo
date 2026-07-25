import React from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutDashboard, Heart, MessageSquare, UserCircle, LifeBuoy, ArrowUpRight, Sparkles, CalendarDays, CheckCircle2, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useGetFavorites, useGetChatUnreadCount, useGetSupportUnreadCount } from '@workspace/api-client-react';

export function DashboardSidebar() {
  const [location] = useLocation();

  const links = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Favorites', path: '/dashboard/favorites', icon: Heart },
    { name: 'Messages', path: '/dashboard/chats', icon: MessageSquare },
    { name: 'Support', path: '/dashboard/support', icon: LifeBuoy },
    { name: 'Profile Settings', path: '/profile', icon: UserCircle },
  ];

  return (
    <nav
      aria-label="Dashboard navigation"
      className="fixed inset-x-4 bottom-4 z-40 rounded-2xl border border-border bg-background/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_12px_35px_-15px_hsl(var(--foreground)/0.45)] backdrop-blur-xl md:left-1/2 md:right-auto md:w-[min(720px,calc(100vw-2rem))] md:-translate-x-1/2"
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.path || (link.path !== '/dashboard' && location.startsWith(`${link.path}/`));
          return (
            <Link key={link.path} href={link.path} className="min-w-[4.5rem] flex-1 shrink-0">
              <Button
                variant="ghost"
                className={`h-auto w-full flex-col gap-1 rounded-xl px-2 py-2.5 ${
                  isActive 
                    ? 'bg-primary/10 font-medium text-primary hover:bg-primary/15' 
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'opacity-70'}`} />
                <span className="text-[11px] leading-none sm:text-xs">{link.name}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function PersonalDashboardHero({ title }: { title: string }) {
  const { user } = useAuth();
  const { data: favorites } = useGetFavorites({ query: { staleTime: 30_000 } });
  const { data: unreadChats } = useGetChatUnreadCount({ query: { staleTime: 30_000 } });
  const { data: unreadSupport } = useGetSupportUnreadCount({ query: { staleTime: 30_000 } });
  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const initials = user?.full_name
    ?.split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <header className="relative isolate overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-[#063d32] via-primary to-[#168463] px-5 py-6 text-primary-foreground shadow-2xl shadow-primary/15 md:px-9 md:py-8">
        <div className="pointer-events-none absolute -right-28 -top-32 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(135deg,transparent_0%,transparent_48%,white_49%,transparent_50%,transparent_100%)] [background-size:18px_18px]" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-secondary" />
                Personal dashboard
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-white/65">
                <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                Account active
              </span>
            </div>
            <p className="mt-7 text-sm font-medium text-white/65">Good to see you again, {firstName}</p>
            <h1 className="mt-1 max-w-xl text-3xl font-display font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
              {title}
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/70 md:text-base">
              Keep your favorite properties close, stay on top of conversations, and find your next place with confidence.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/listings">
                <Button size="sm" className="h-10 gap-2 rounded-xl bg-white px-4 text-primary shadow-lg shadow-black/10 hover:bg-white/90">
                  <Compass className="h-4 w-4" />
                  Explore properties <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/profile">
                <Button size="sm" variant="ghost" className="h-10 rounded-xl border border-white/20 px-4 text-white hover:bg-white/10 hover:text-white">
                  Edit profile
                </Button>
              </Link>
            </div>
          </div>

          <div className="w-full max-w-sm rounded-3xl border border-white/20 bg-white/10 p-4 shadow-xl shadow-black/10 backdrop-blur-md lg:min-w-[285px]">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 border-2 border-white/40 shadow-lg">
                {user?.avatar_base64 && <AvatarImage src={user.avatar_base64} alt={user.full_name || 'User'} />}
                <AvatarFallback className="bg-white text-lg font-bold text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-semibold">{user?.full_name || 'PropertyLo member'}</p>
                <p className="truncate text-xs text-white/65">{user?.email}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/15 pt-3 text-xs">
              <div>
                <p className="text-white/55">Member since</p>
                <p className="mt-1 font-semibold">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                    : 'Recently'}
                </p>
              </div>
              <div>
                <p className="text-white/55">Profile status</p>
                <p className="mt-1 inline-flex items-center gap-1.5 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Verified
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-8 grid grid-cols-1 gap-2 border-t border-white/15 pt-4 sm:grid-cols-3">
          <Link href="/dashboard/favorites" className="group rounded-2xl border border-white/15 bg-black/10 p-3.5 transition-colors hover:bg-white/10">
            <div className="flex items-center justify-between">
              <Heart className="h-4 w-4 text-rose-200" />
              <ArrowUpRight className="h-4 w-4 text-white/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
            <p className="mt-2 text-2xl font-display font-bold">{favorites?.length ?? 0}</p>
            <p className="text-xs text-white/65">Saved properties</p>
          </Link>
          <Link href="/dashboard/chats" className="group rounded-2xl border border-white/15 bg-black/10 p-3.5 transition-colors hover:bg-white/10">
            <div className="flex items-center justify-between">
              <MessageSquare className="h-4 w-4 text-sky-200" />
              <ArrowUpRight className="h-4 w-4 text-white/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
            <p className="mt-2 text-2xl font-display font-bold">{unreadChats?.count ?? 0}</p>
            <p className="text-xs text-white/65">Unread messages</p>
          </Link>
          <Link href="/dashboard/support" className="group rounded-2xl border border-white/15 bg-black/10 p-3.5 transition-colors hover:bg-white/10">
            <div className="flex items-center justify-between">
              <LifeBuoy className="h-4 w-4 text-emerald-200" />
              <ArrowUpRight className="h-4 w-4 text-white/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
            <p className="mt-2 text-2xl font-display font-bold">{unreadSupport?.count ?? 0}</p>
            <p className="text-xs text-white/65">Support replies</p>
          </Link>
        </div>
    </header>
  );
}

export function DashboardLayout({ children, title, showPersonalDashboard = false }: { children: React.ReactNode, title: string, showPersonalDashboard?: boolean }) {
  return (
    <div className="container mx-auto px-4 pb-28 pt-6 md:px-6 md:pb-32 md:pt-10">
      {showPersonalDashboard ? (
        <PersonalDashboardHero title={title} />
      ) : (
        <header className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm md:px-7 md:py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Your account</p>
          <h1 className="mt-1 text-2xl font-display font-bold tracking-tight md:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your PropertyLo account and activity.</p>
        </header>
      )}
      <div className="mt-8">
        <div className="min-w-0 flex-1">
          {children}
        </div>
      </div>
      <DashboardSidebar />
    </div>
  );
}
