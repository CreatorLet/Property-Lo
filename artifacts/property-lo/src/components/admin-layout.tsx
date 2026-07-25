import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Building2, LayoutDashboard, Users, Home, MessageSquare, Image as ImageIcon, Mail, LogOut, LifeBuoy, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const links = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Listings', path: '/admin/listings', icon: Home },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Chats', path: '/admin/chats', icon: MessageSquare },
    { name: 'Support', path: '/admin/support', icon: LifeBuoy },
    { name: 'Ads', path: '/admin/ads', icon: ImageIcon },
    { name: 'Contact Inbox', path: '/admin/contact', icon: Mail },
  ];

  const renderSidebarContent = () => (
    <>
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
        <Link href="/admin/dashboard" className="flex items-center gap-2 group" onClick={() => setIsMobileOpen(false)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-sidebar-foreground">
            Property<span className="text-secondary">Lo</span> <span className="text-sm font-normal text-sidebar-foreground/60 ml-1">Admin</span>
          </span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.path || location.startsWith(`${link.path}/`);
          return (
            <Link key={link.path} href={link.path} onClick={() => setIsMobileOpen(false)}>
              <Button 
                variant="ghost" 
                className={`w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                  isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''
                }`}
              >
                <Icon className="mr-3 h-5 w-5 opacity-80" />
                {link.name}
              </Button>
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-sidebar-border/50">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive/80 hover:bg-destructive/20 hover:text-destructive"
          onClick={() => {
            signOut();
            setIsMobileOpen(false);
          }}
        >
          <LogOut className="mr-3 h-5 w-5 opacity-80" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full bg-muted/20 flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden h-16 flex items-center justify-between px-4 border-b border-sidebar-border bg-sidebar shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-sidebar-foreground">
            Property<span className="text-secondary">Lo</span> <span className="text-sm font-normal text-sidebar-foreground/60 ml-1">Admin</span>
          </span>
        </div>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar border-r border-sidebar-border flex flex-col">
            <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
            {renderSidebarContent()}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex-col">
        {renderSidebarContent()}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative">
        {children}
      </main>
    </div>
  );
}
