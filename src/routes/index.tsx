import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, ArrowRight, TrendingUp, Target, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DealCompass AI+ — Navigate every deal with clarity" },
      {
        name: "description",
        content:
          "Pipeline visibility, deal health scoring, and decision-grade analytics for modern revenue teams.",
      },
      { property: "og:title", content: "DealCompass AI+" },
      {
        property: "og:description",
        content:
          "Pipeline visibility, deal health scoring, and decision-grade analytics for modern revenue teams.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Compass className="h-5 w-5 text-accent" />
            DealCompass <span className="text-accent">AI+</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Built for revenue teams that ship
        </div>
        <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight max-w-3xl mx-auto leading-[1.05]">
          Navigate every deal with <span className="text-accent">clarity</span>.
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Pipeline visibility, deal health scoring, and decision-grade analytics —
          all in one workspace.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button asChild size="lg">
            <Link to="/auth">
              Start free <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        <Feature
          icon={TrendingUp}
          title="Live pipeline"
          body="Drag, drop, and forecast in real time. Every stage, every dollar, accounted for."
        />
        <Feature
          icon={Target}
          title="Weighted forecast"
          body="Probability-adjusted revenue across active deals. No spreadsheets, no surprises."
        />
        <Feature
          icon={Shield}
          title="Private by design"
          body="Row-level security. Your deals are yours alone — never visible to other accounts."
        />
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © DealCompass AI+
      </footer>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-3">
      <div className="h-9 w-9 rounded-md bg-accent/10 text-accent flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
