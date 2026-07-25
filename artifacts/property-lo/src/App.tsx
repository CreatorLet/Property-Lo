import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { setAuthTokenGetter } from '@workspace/api-client-react';

import { AppLayout } from '@/components/layout';
import { AdminLayout } from '@/components/admin-layout';
import { RequireAuth, RequireAdmin } from '@/components/auth-wrappers';

// Public pages
import Home from '@/pages/home';
import Listings from '@/pages/listings';
import ListingDetail from '@/pages/listing-detail';
import Contact from '@/pages/contact';
import About from '@/pages/about';
import Terms from '@/pages/terms';
import Privacy from '@/pages/privacy';

// Auth pages
import Signup from '@/pages/signup';
import VerifyOtp from '@/pages/verify-otp';
import Signin from '@/pages/signin';
import ForgotPassword from '@/pages/forgot-password';
import ResetPassword from '@/pages/reset-password';

// User Dashboard
import DashboardOverview from '@/pages/dashboard/overview';
import Favorites from '@/pages/dashboard/favorites';
import Chats from '@/pages/dashboard/chats';
import ChatDetail from '@/pages/dashboard/chat-detail';
import Support from '@/pages/dashboard/support';
import Profile from '@/pages/profile';

// Admin
import AdminSignin from '@/pages/admin/signin';
import AdminDashboard from '@/pages/admin/dashboard';
import AdminListings from '@/pages/admin/listings';
import AdminUsers from '@/pages/admin/users';
import AdminChats from '@/pages/admin/chats';
import AdminChatDetail from '@/pages/admin/chat-detail';
import AdminSupport from '@/pages/admin/support';
import AdminSupportDetail from '@/pages/admin/support-detail';
import AdminAds from '@/pages/admin/ads';
import AdminContact from '@/pages/admin/contact';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Admin routes with separate layout */}
      <Route path="/admin">
        <AdminSignin />
      </Route>
      <Route path="/admin/*">
        <RequireAdmin>
          <AdminLayout>
            <Switch>
              <Route path="/admin/dashboard" component={AdminDashboard} />
              <Route path="/admin/listings" component={AdminListings} />
              <Route path="/admin/users" component={AdminUsers} />
              <Route path="/admin/chats" component={AdminChats} />
              <Route path="/admin/chats/:id" component={AdminChatDetail} />
              <Route path="/admin/support" component={AdminSupport} />
              <Route path="/admin/support/:id" component={AdminSupportDetail} />
              <Route path="/admin/ads" component={AdminAds} />
              <Route path="/admin/contact" component={AdminContact} />
              <Route component={NotFound} />
            </Switch>
          </AdminLayout>
        </RequireAdmin>
      </Route>

      {/* Public and User routes with standard layout */}
      <Route>
        <AppLayout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/listings" component={Listings} />
            <Route path="/listings/:id" component={ListingDetail} />
            <Route path="/contact" component={Contact} />
            <Route path="/about" component={About} />
            <Route path="/terms" component={Terms} />
            <Route path="/privacy" component={Privacy} />
            
            <Route path="/signup" component={Signup} />
            <Route path="/verify-otp" component={VerifyOtp} />
            <Route path="/signin" component={Signin} />
            <Route path="/forgot-password" component={ForgotPassword} />
            <Route path="/reset-password" component={ResetPassword} />

            {/* User Dashboard Routes */}
            <Route path="/dashboard">
              <RequireAuth>
                <DashboardOverview />
              </RequireAuth>
            </Route>
            <Route path="/dashboard/favorites">
              <RequireAuth>
                <Favorites />
              </RequireAuth>
            </Route>
            <Route path="/dashboard/chats">
              <RequireAuth>
                <Chats />
              </RequireAuth>
            </Route>
            <Route path="/dashboard/chats/:id">
              <RequireAuth>
                <ChatDetail />
              </RequireAuth>
            </Route>
            <Route path="/dashboard/support">
              <RequireAuth>
                <Support />
              </RequireAuth>
            </Route>
            <Route path="/profile">
              <RequireAuth>
                <Profile />
              </RequireAuth>
            </Route>

            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </Route>
    </Switch>
  );
}

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location]);

  return null;
}

function App() {
  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("propertylo_token"));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <ScrollToTop />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
