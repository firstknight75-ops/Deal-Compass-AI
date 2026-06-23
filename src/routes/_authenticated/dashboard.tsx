import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, TrendingUp, Target, DollarSign, Briefcase } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DealDialog, type DealRow } from "@/components/DealDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listDeals, DEAL_STAGES, type DealStage } from "@/lib/deals.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Pipeline — DealCompass AI+" }] }),
  component: Dashboard,
});

const STAGE_LABEL: Record<DealStage, string> = {
  lead: "Lead",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

const STAGE_TONE: Record<DealStage, string> = {
  lead: "bg-[color:var(--stage-lead)]/15 text-[color:var(--stage-lead)] border-[color:var(--stage-lead)]/30",
  qualified: "bg-[color:var(--stage-qualified)]/15 text-[color:var(--stage-qualified)] border-[color:var(--stage-qualified)]/30",
  proposal: "bg-[color:var(--stage-proposal)]/15 text-[color:var(--stage-proposal)] border-[color:var(--stage-proposal)]/30",
  negotiation: "bg-[color:var(--stage-negotiation)]/15 text-[color:var(--stage-negotiation)] border-[color:var(--stage-negotiation)]/30",
  won: "bg-[color:var(--stage-won)]/15 text-[color:var(--stage-won)] border-[color:var(--stage-won)]/30",
  lost: "bg-[color:var(--stage-lost)]/15 text-[color:var(--stage-lost)] border-[color:var(--stage-lost)]/30",
};

function fmtMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function Dashboard() {
  const list = useServerFn(listDeals);
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["deals"],
    queryFn: () => list(),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DealRow | null>(null);
  const [defaultStage, setDefaultStage] = useState<DealStage>("lead");

  const byStage = useMemo(() => {
    const m: Record<DealStage, DealRow[]> = {
      lead: [], qualified: [], proposal: [], negotiation: [], won: [], lost: [],
    };
    for (const d of deals as DealRow[]) m[d.stage].push(d);
    return m;
  }, [deals]);

  const stats = useMemo(() => {
    const active = (deals as DealRow[]).filter((d) => d.stage !== "won" && d.stage !== "lost");
    const won = (deals as DealRow[]).filter((d) => d.stage === "won");
    const pipelineValue = active.reduce((s, d) => s + d.value_cents, 0);
    const weighted = active.reduce((s, d) => s + (d.value_cents * d.probability) / 100, 0);
    const wonValue = won.reduce((s, d) => s + d.value_cents, 0);
    return { count: active.length, pipelineValue, weighted, wonValue };
  }, [deals]);

  function openNew(stage: DealStage = "lead") {
    setEditing(null);
    setDefaultStage(stage);
    setDialogOpen(true);
  }
  function openEdit(d: DealRow) {
    setEditing(d);
    setDialogOpen(true);
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Pipeline</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track every deal from first touch to close.
            </p>
          </div>
          <Button onClick={() => openNew()} className="gap-1.5">
            <Plus className="h-4 w-4" /> New deal
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Briefcase} label="Active deals" value={stats.count.toString()} />
          <StatCard icon={DollarSign} label="Pipeline value" value={fmtMoney(stats.pipelineValue)} />
          <StatCard icon={Target} label="Weighted forecast" value={fmtMoney(stats.weighted)} />
          <StatCard icon={TrendingUp} label="Closed won" value={fmtMoney(stats.wonValue)} accent />
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground py-12 text-center">Loading deals…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
            {DEAL_STAGES.map((stage) => {
              const items = byStage[stage];
              const total = items.reduce((s, d) => s + d.value_cents, 0);
              return (
                <div key={stage} className="flex flex-col min-w-0">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full bg-[color:var(--stage-${stage})]`} />
                      <h3 className="text-sm font-medium">{STAGE_LABEL[stage]}</h3>
                      <span className="text-xs text-muted-foreground">{items.length}</span>
                    </div>
                    <button
                      onClick={() => openNew(stage)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Add deal"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground px-1 mb-3">
                    {fmtMoney(total)}
                  </div>
                  <div className="flex-1 space-y-2 min-h-[80px]">
                    {items.length === 0 ? (
                      <button
                        onClick={() => openNew(stage)}
                        className="w-full text-xs text-muted-foreground border border-dashed border-border rounded-md py-6 hover:bg-muted/50 transition-colors"
                      >
                        + Add deal
                      </button>
                    ) : (
                      items.map((d) => (
                        <Card
                          key={d.id}
                          onClick={() => openEdit(d)}
                          className="p-3 cursor-pointer hover:border-accent/50 hover:shadow-sm transition-all space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-medium text-sm leading-tight">{d.name}</div>
                          </div>
                          {d.company && (
                            <div className="text-xs text-muted-foreground">{d.company}</div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold tabular-nums">
                              {fmtMoney(d.value_cents, d.currency)}
                            </span>
                            <Badge variant="outline" className={`${STAGE_TONE[d.stage]} text-[10px] px-1.5 py-0`}>
                              {d.probability}%
                            </Badge>
                          </div>
                          {d.expected_close_date && (
                            <div className="text-[11px] text-muted-foreground">
                              Close {new Date(d.expected_close_date).toLocaleDateString()}
                            </div>
                          )}
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DealDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        deal={editing}
        defaultStage={defaultStage}
      />
    </AppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card className="p-4 space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className={`text-2xl font-semibold tabular-nums ${accent ? "text-accent" : ""}`}>
        {value}
      </div>
    </Card>
  );
}
