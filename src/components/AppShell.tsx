import { Link, useNavigate } from "@tanstack/react-router";
import { Compass, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <Compass className="h-5 w-5 text-accent" />
            DealCompass <span className="text-accent">AI+</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/dashboard"
              activeProps={{ className: "bg-secondary text-foreground" }}
              className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
            >
              Pipeline
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut} className="ml-2">
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign out
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
