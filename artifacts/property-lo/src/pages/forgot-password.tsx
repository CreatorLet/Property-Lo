import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForgotPassword } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export default function ForgotPassword() {
  const { toast } = useToast();
  const forgotPassword = useForgotPassword();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: z.infer<typeof forgotSchema>) => {
    forgotPassword.mutate({ data }, {
      onSuccess: () => {
        setSubmitted(true);
      },
      onError: (error) => {
        toast({
          title: "Request failed",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12 bg-muted/10">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-lg p-8">
        <Link href="/signin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to log in
        </Link>
        
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-display font-bold text-center">Forgot password?</h1>
          <p className="text-muted-foreground text-center mt-2">
            No worries, we'll send you reset instructions.
          </p>
        </div>

        {submitted ? (
          <div className="text-center space-y-6">
            <div className="p-4 bg-primary/10 text-primary rounded-lg text-sm">
              We've sent a password reset token to <strong>{form.getValues('email')}</strong> if it exists in our system.
            </div>
            <Link href={`/reset-password?email=${encodeURIComponent(form.getValues('email'))}`}>
              <Button className="w-full">Enter Reset Token</Button>
            </Link>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" type="email" {...field} className="bg-muted/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full h-12 text-lg" disabled={forgotPassword.isPending}>
                {forgotPassword.isPending ? 'Sending...' : 'Reset Password'}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
