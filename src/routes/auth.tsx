import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Compass } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — DealCompass AI+" },
      { name: "description", content: "Sign in to your DealCompass workspace." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) throw error;
        toast.success("Account created. You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between bg-primary text-primary-foreground p-12">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
          <Compass className="h-6 w-6 text-accent" />
          DealCompass <span className="text-accent">AI+</span>
        </Link>
        <div className="space-y-4 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">
            Navigate every deal with clarity.
          </h2>
          <p className="text-primary-foreground/70 text-sm leading-relaxed">
            Pipeline visibility, deal health scoring, and decision-grade analytics —
            built for revenue teams that ship.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/50">© DealCompass AI+</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md p-8 space-y-6 shadow-sm">
          <div className="space-y-1.5">
            <Link to="/" className="lg:hidden flex items-center gap-2 mb-4 font-semibold">
              <Compass className="h-5 w-5 text-accent" />
              DealCompass <span className="text-accent">AI+</span>
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create your workspace"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in to continue to your pipeline."
                : "Get started in less than a minute."}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            {mode === "signin" ? "No account yet?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-accent font-medium hover:underline"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
}
