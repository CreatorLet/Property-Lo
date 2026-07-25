import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Building2, UserCircle, LogOut, Menu, X, LayoutDashboard, Heart, MessageSquare, Mail, LifeBuoy, Compass } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const { isAuthenticated, user, signOut } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground group-hover:scale-105 transition-transform duration-200">
                <Building2 className="h-6 w-6" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-foreground">
                Property<span className="text-secondary">Lo</span>
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1 ml-4">
              <Link href="/listings">
                <Button variant="ghost" className={`font-medium ${isActive('/listings') ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
                  Browse
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="ghost" className={`font-medium ${isActive('/contact') ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
                  Contact
                </Button>
              </Link>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        {user?.avatar_base64 && <AvatarImage src={user.avatar_base64} alt={user.full_name} />}
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.full_name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer flex items-center w-full">
                        <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/favorites" className="cursor-pointer flex items-center w-full">
                        <Heart className="mr-2 h-4 w-4 text-muted-foreground" />
                        Favorites
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/chats" className="cursor-pointer flex items-center w-full">
                        <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                        Messages
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/support" className="cursor-pointer flex items-center w-full">
                        <LifeBuoy className="mr-2 h-4 w-4 text-muted-foreground" />
                        Support
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer flex items-center w-full">
                        <UserCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                        Profile Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-destructive focus:bg-destructive/10 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="ghost" className="font-medium text-muted-foreground">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button className="font-medium shadow-md shadow-primary/20">Sign up</Button>
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background absolute top-16 left-0 w-full shadow-lg p-4 flex flex-col gap-2 z-40">
          {isAuthenticated ? (
            <>
              <div className="px-4 py-2 flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  {user?.avatar_base64 && <AvatarImage src={user.avatar_base64} alt={user.full_name} />}
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <p className="px-4 pt-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">My account</p>
              <Link href="/listings">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setIsMobileMenuOpen(false)}>
                  <Compass className="mr-3 h-4 w-4 text-primary" /> Browse all listings
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setIsMobileMenuOpen(false)}>
                  <LayoutDashboard className="mr-3 h-4 w-4 text-primary" /> Dashboard overview
                </Button>
              </Link>
              <Link href="/dashboard/favorites">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setIsMobileMenuOpen(false)}>
                  <Heart className="mr-3 h-4 w-4 text-muted-foreground" /> Saved favorites
                </Button>
              </Link>
              <Link href="/dashboard/chats">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setIsMobileMenuOpen(false)}>
                  <MessageSquare className="mr-3 h-4 w-4 text-muted-foreground" /> Messages
                </Button>
              </Link>
              <Link href="/dashboard/support">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setIsMobileMenuOpen(false)}>
                  <LifeBuoy className="mr-3 h-4 w-4 text-muted-foreground" /> Support
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setIsMobileMenuOpen(false)}>
                  <UserCircle className="mr-3 h-4 w-4 text-muted-foreground" /> Profile settings
                </Button>
              </Link>
              <div className="h-px bg-border my-2" />
              <Button variant="ghost" className="w-full justify-start text-destructive" onClick={() => { signOut(); setIsMobileMenuOpen(false); }}>
                <LogOut className="mr-3 h-4 w-4" /> Sign out
              </Button>
            </>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              <Link href="/signin">
                <Button variant="outline" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>Log in</Button>
              </Link>
              <Link href="/signup">
                <Button className="w-full" onClick={() => setIsMobileMenuOpen(false)}>Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-12 mt-auto">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-foreground">
                Property<span className="text-secondary">Lo</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed max-w-xs">
              Your trusted local estate agency, online. Finding homes for rent, sale, or shortlet across Nigeria.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-display font-semibold">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/listings?purpose=rent" className="hover:text-primary transition-colors">Properties for Rent</Link></li>
              <li><Link href="/listings?purpose=sale" className="hover:text-primary transition-colors">Properties for Sale</Link></li>
              <li><Link href="/listings?purpose=shortlet" className="hover:text-primary transition-colors">Shortlets</Link></li>
              <li><Link href="/listings" className="hover:text-primary transition-colors">All Listings</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-display font-semibold">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-display font-semibold">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@propertylo.ng</li>
              <li className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> +234 800 123 4567</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} PropertyLo. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Built with ❤️ in Lagos</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col w-full bg-background selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main className="flex-1 flex flex-col w-full">{children}</main>
      <Footer />
    </div>
  );
}
