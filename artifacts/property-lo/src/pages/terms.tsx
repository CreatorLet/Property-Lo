import { Link } from 'wouter';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Terms() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-20">
      <div className="mb-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <FileText className="h-7 w-7" />
      </div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Legal</p>
      <h1 className="mt-3 text-4xl font-display font-bold tracking-tight md:text-5xl">Terms of Service</h1>
      <p className="mt-4 text-muted-foreground">Last updated: July 23, 2026</p>

      <div className="prose prose-neutral mt-10 max-w-none dark:prose-invert">
        <p>
          These Terms of Service explain the basic rules for using PropertyLo. By accessing the website or creating an account, you agree to use the service responsibly and in accordance with these terms.
        </p>
        <h2>Using PropertyLo</h2>
        <p>
          PropertyLo helps people discover property listings and communicate with property owners, agents, and our support team. You are responsible for the information you provide and for using listings and communication tools for legitimate purposes.
        </p>
        <h2>Accounts</h2>
        <p>
          Keep your account information accurate and protect your sign-in details. You are responsible for activity that happens through your account. Contact us promptly if you believe your account has been used without permission.
        </p>
        <h2>Listings and communications</h2>
        <p>
          Listing information is provided by property owners or agents and may change. PropertyLo does not replace your own due diligence. Confirm availability, pricing, ownership, terms, and property condition before making a commitment or payment.
        </p>
        <h2>Acceptable use</h2>
        <p>
          Do not misuse the platform, submit misleading information, interfere with the service, attempt unauthorized access, or use contact and messaging features to harass or defraud others.
        </p>
        <h2>Changes and contact</h2>
        <p>
          We may update these terms as the service evolves. If you have a question about these terms, please contact us through the <Link href="/contact">Contact page</Link>.
        </p>
      </div>

      <Link href="/" className="mt-10 inline-block">
        <Button variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Button>
      </Link>
    </div>
  );
}