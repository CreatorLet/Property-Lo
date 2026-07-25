import { Link } from 'wouter';
import { ArrowRight, Building2, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const values = [
  {
    icon: ShieldCheck,
    title: 'Trust first',
    description: 'Clear property details and a straightforward experience help you make confident decisions.',
  },
  {
    icon: HeartHandshake,
    title: 'People focused',
    description: 'We make it easier for renters, buyers, agents, and landlords to connect with less friction.',
  },
  {
    icon: Sparkles,
    title: 'Better search',
    description: 'Useful browsing tools keep the process focused on finding a place that feels right for you.',
  },
];

export default function About() {
  return (
    <div className="bg-muted/10">
      <section className="border-b border-border bg-gradient-to-br from-[#063d32] via-primary to-[#168463] px-4 py-16 text-primary-foreground md:py-24">
        <div className="container mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/65">About PropertyLo</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-display font-bold tracking-tight md:text-6xl">
            Finding a place to call home should feel simpler.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
            PropertyLo is a local property marketplace built to make it easier to discover homes for rent, sale, and shortlet across Nigeria.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-4 py-14 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Building2 className="h-7 w-7" />
            </div>
            <h2 className="text-3xl font-display font-bold tracking-tight md:text-4xl">A more human way to find property.</h2>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground">
              Whether you are looking for your next home, helping someone find theirs, or managing a property, PropertyLo brings the important parts of the journey together in one place.
            </p>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
              We believe property search should be clear, practical, and designed around real people—not complicated processes.
            </p>
          </div>
          <div className="rounded-3xl border border-primary/10 bg-card p-6 shadow-sm md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">What matters to us</p>
            <div className="mt-6 space-y-6">
              {values.map((value) => {
                const Icon = value.icon;
                return (
                  <div key={value.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{value.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{value.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:p-8">
          <div>
            <h2 className="text-2xl font-display font-bold">Ready to start looking?</h2>
            <p className="mt-1 text-muted-foreground">Explore available properties and take the next step with confidence.</p>
          </div>
          <Link href="/listings">
            <Button className="gap-2">
              Browse listings <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}