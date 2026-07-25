import { Link } from 'wouter';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Privacy() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-20">
      <div className="mb-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <LockKeyhole className="h-7 w-7" />
      </div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Your privacy</p>
      <h1 className="mt-3 text-4xl font-display font-bold tracking-tight md:text-5xl">Privacy Policy</h1>
      <p className="mt-4 text-muted-foreground">Last updated: July 23, 2026</p>

      <div className="prose prose-neutral mt-10 max-w-none dark:prose-invert">
        <p>
          This Privacy Policy describes how PropertyLo handles information when you browse listings, create an account, contact us, or use our messaging and support features.
        </p>
        <h2>Information you provide</h2>
        <p>
          Depending on how you use the service, this may include your name, email address, phone number, profile details, messages, contact requests, saved properties, and information you submit through forms.
        </p>
        <h2>How we use information</h2>
        <p>
          We use information to provide and improve PropertyLo, operate accounts, show your saved properties, support conversations, respond to enquiries, protect the service, and communicate important service updates.
        </p>
        <h2>Sharing and property enquiries</h2>
        <p>
          Information submitted through a property enquiry or conversation may be shared with the relevant agent, landlord, or support staff so that the request can be handled. We do not sell personal information.
        </p>
        <h2>Security and retention</h2>
        <p>
          We use reasonable safeguards to protect account and service information. We retain information for as long as needed to provide the service, meet legal obligations, resolve disputes, and enforce our agreements.
        </p>
        <h2>Your choices</h2>
        <p>
          You can review and update eligible account information through your profile. For privacy questions or requests, please reach out through the <Link href="/contact">Contact page</Link>.
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