import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAdminSignin } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function AdminSignin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const adminSignin = useAdminSignin();
  const { saveAuth } = useAuth();

  const form = useForm<z.infer<typeof signinSchema>>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: z.infer<typeof signinSchema>) => {
    adminSignin.mutate({ data }, {
      onSuccess: (res) => {
        saveAuth(res.token, res.user);
        toast({ title: "Admin access granted" });
        setLocation('/admin/dashboard');
      },
      onError: (error) => {
        toast({
          title: "Access denied",
          description: error.message || "Invalid admin credentials",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-sidebar">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-destructive" />
        
        <div className="flex flex-col items-center mb-8 pt-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-display font-bold text-center">Admin Portal</h1>
          <p className="text-muted-foreground text-center mt-2 text-sm">Restricted access area.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Email</FormLabel>
                  <FormControl>
                    <Input placeholder="admin@propertylo.ng" type="email" {...field} className="bg-muted/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="bg-muted/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" variant="destructive" className="w-full h-12 text-lg font-bold mt-4" disabled={adminSignin.isPending}>
              {adminSignin.isPending ? 'Authenticating...' : 'Secure Login'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
