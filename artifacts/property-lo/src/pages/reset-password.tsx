import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useResetPassword } from '@workspace/api-client-react';
import { useLocation, useSearch } from 'wouter';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck } from 'lucide-react';

const resetSchema = z.object({
  otp: z.string().min(6, "Token is required"),
  new_password: z.string().min(6, "Password must be at least 6 characters"),
  confirm_password: z.string(),
}).refine(data => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const email = params.get('email') || '';
  
  const { toast } = useToast();
  const resetPassword = useResetPassword();

  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      otp: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const onSubmit = (data: z.infer<typeof resetSchema>) => {
    if (!email) {
      toast({ title: "Email missing", variant: "destructive" });
      return;
    }
    
    resetPassword.mutate({ data: { email, otp: data.otp, new_password: data.new_password } }, {
      onSuccess: () => {
        toast({ title: "Password reset successful", description: "You can now log in with your new password." });
        setLocation('/signin');
      },
      onError: (error) => {
        toast({
          title: "Reset failed",
          description: error.message || "Invalid token or error",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12 bg-muted/10">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-display font-bold text-center">Set new password</h1>
          <p className="text-muted-foreground text-center mt-2 text-sm">
            Enter the token sent to {email} and your new password.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reset Token / OTP</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter 6-digit code" {...field} className="bg-muted/50 tracking-widest text-center" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="bg-muted/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="bg-muted/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full h-12 text-lg" disabled={resetPassword.isPending}>
              {resetPassword.isPending ? 'Resetting...' : 'Save new password'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
