import { useEffect, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useVerifyOtp, useResendOtp } from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Clock3, MailOpen } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';

export default function VerifyOtp() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const email = params.get('email') || '';
  
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [hasResentOtp, setHasResentOtp] = useState(false);
  const { toast } = useToast();
  const verifyOtp = useVerifyOtp();
  const resendOtp = useResendOtp();
  const { saveAuth } = useAuth();

  useEffect(() => {
    if (!email) {
      setLocation('/signup');
    }
  }, [email, setLocation]);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = window.setTimeout(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = () => {
    if (otp.length !== 6) return;
    
    verifyOtp.mutate({ data: { email, otp } }, {
      onSuccess: (res) => {
        saveAuth(res.token, res.user);
        toast({ title: "Email verified successfully!" });
        setLocation('/dashboard');
      },
      onError: (error) => {
        toast({
          title: "Verification failed",
          description: error.message || "Invalid or expired OTP",
          variant: "destructive",
        });
      }
    });
  };

  const handleResend = () => {
    if (resendCooldown > 0 || resendOtp.isPending) return;

    setHasResentOtp(true);
    setResendCooldown(60);
    resendOtp.mutate({ data: { email } }, {
      onSuccess: () => {
        toast({ title: "OTP resent", description: "Check your email for the new code." });
      },
      onError: (error) => {
        toast({
          title: "Failed to resend",
          description: error.message || "Please try again later.",
          variant: "destructive",
        });
        setResendCooldown(0);
      }
    });
  };

  const formattedCooldown = `0:${resendCooldown.toString().padStart(2, '0')}`;

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12 bg-muted/10">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <MailOpen className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-display font-bold text-center">Check your email</h1>
          <p className="text-muted-foreground text-center mt-2 text-sm px-4">
            We've sent a 6-digit verification code to <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <div className="flex flex-col items-center space-y-8">
          <InputOTP maxLength={6} value={otp} onChange={setOtp} onComplete={handleVerify}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <Button 
            onClick={handleVerify} 
            className="w-full h-12 text-lg" 
            disabled={otp.length !== 6 || verifyOtp.isPending}
          >
            {verifyOtp.isPending ? 'Verifying...' : 'Verify Code'}
          </Button>
        </div>

        <div className="mt-8 space-y-3 text-center text-sm text-muted-foreground">
          <p>
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendOtp.isPending || resendCooldown > 0}
              className="font-semibold text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resendOtp.isPending ? 'Resending...' : 'Resend OTP'}
            </button>
          </p>

          {hasResentOtp ? (
            <div
              role="status"
              aria-live="polite"
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium ${
                resendCooldown > 0
                  ? 'border-primary/15 bg-primary/5 text-primary'
                  : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              <Clock3 className="h-4 w-4 shrink-0" />
              {resendCooldown > 0
                ? `A new code was sent. You can resend again in ${formattedCooldown}.`
                : 'You can resend a new code now.'}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/80">A 60-second wait starts after you resend.</p>
          )}
        </div>
      </div>
    </div>
  );
}
