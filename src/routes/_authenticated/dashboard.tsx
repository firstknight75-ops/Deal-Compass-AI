import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, TrendingUp, Target, DollarSign, Briefcase } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DealDialog, type DealRow } from "@/components/DealDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listDeals, updateDeal, DEAL_STAGES, type DealStage } from "@/lib/deals.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "مسار الصفقات — ديل كومباس AI+" }] }),
  component: Dashboard,
});

const STAGE_LABEL: Record<DealStage, string> = {
  lead: "عميل محتمل",
  qualified: "مؤهل",
  proposal: "عرض",
  negotiation: "تفاوض",
  won: "فازت",
  lost: "خسرت",
};

const STAGE_TONE: Record<DealStage, string> = {
  lead: "bg-[color:var(--stage-lead)]/15 text-[color:var(--stage-lead)] border-[color:var(--stage-lead)]/30",
  qualified:
    "bg-[color:var(--stage-qualified)]/15 text-[color:var(--stage-qualified)] border-[color:var(--stage-qualified)]/30",
  proposal:
    "bg-[color:var(--stage-proposal)]/15 text-[color:var(--stage-proposal)] border-[color:var(--stage-proposal)]/30",
  negotiation:
    "bg-[color:var(--stage-negotiation)]/15 text-[color:var(--stage-negotiation)] border-[color:var(--stage-negotiation)]/30",
  won: "bg-[color:var(--stage-won)]/15 text-[color:var(--stage-won)] border-[color:var(--stage-won)]/30",
  lost: "bg-[color:var(--stage-lost)]/15 text-[color:var(--stage-lost)] border-[color:var(--stage-lost)]/30",
};

function fmtMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat("ar-IQ", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function Dashboard() {
  const qc = useQueryClient();
  const list = useServerFn(listDeals);
  const update = useServerFn(updateDeal);
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["deals"],
    queryFn: () => list(),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DealRow | null>(null);
  const [defaultStage, setDefaultStage] = useState<DealStage>("lead");
  const [draggingDealId, setDraggingDealId] = useState<string | null>(null);

  const moveDeal = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: DealStage }) =>
      update({ data: { id, patch: { stage } } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deals"] }),
  });

  const byStage = useMemo(() => {
    const m: Record<DealStage, DealRow[]> = {
      lead: [],
      qualified: [],
      proposal: [],
      negotiation: [],
      won: [],
      lost: [],
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
            <h1 className="text-3xl font-semibold tracking-tight">مسار الصفقات</h1>
            <p className="text-sm text-muted-foreground mt-1">
              تابع كل صفقة من أول تواصل حتى الإغلاق.
            </p>
          </div>
          <Button onClick={() => openNew()} className="gap-1.5">
            <Plus className="h-4 w-4" /> صفقة جديدة
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Briefcase} label="الصفقات النشطة" value={stats.count.toString()} />
          <StatCard icon={DollarSign} label="قيمة المسار" value={fmtMoney(stats.pipelineValue)} />
          <StatCard icon={Target} label="التوقعات الموزونة" value={fmtMoney(stats.weighted)} />
          <StatCard
            icon={TrendingUp}
            label="المغلق الرابح"
            value={fmtMoney(stats.wonValue)}
            accent
          />
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground py-12 text-center">جارٍ تحميل الصفقات…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
            {DEAL_STAGES.map((stage) => {
              const items = byStage[stage];
              const total = items.reduce((s, d) => s + d.value_cents, 0);
              return (
                <div
                  key={stage}
                  className="flex flex-col min-w-0"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const dealId = event.dataTransfer.getData("text/deal-id") || draggingDealId;
                    if (dealId) moveDeal.mutate({ id: dealId, stage });
                    setDraggingDealId(null);
                  }}
                >
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full bg-[color:var(--stage-${stage})]`} />
                      <h3 className="text-sm font-medium">{STAGE_LABEL[stage]}</h3>
                      <span className="text-xs text-muted-foreground">{items.length}</span>
                    </div>
                    <button
                      onClick={() => openNew(stage)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="إضافة صفقة"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground px-1 mb-3">{fmtMoney(total)}</div>
                  <div className="flex-1 space-y-2 min-h-[80px]">
                    {items.length === 0 ? (
                      <button
                        onClick={() => openNew(stage)}
                        className="w-full text-xs text-muted-foreground border border-dashed border-border rounded-md py-6 hover:bg-muted/50 transition-colors"
                      >
                        + إضافة صفقة
                      </button>
                    ) : (
                      items.map((d) => (
                        <Card
                          key={d.id}
                          draggable
                          onDragStart={(event) => {
                            setDraggingDealId(d.id);
                            event.dataTransfer.setData("text/deal-id", d.id);
                            event.dataTransfer.effectAllowed = "move";
                          }}
                          onDragEnd={() => setDraggingDealId(null)}
                          onClick={() => openEdit(d)}
                          className={`p-3 cursor-grab active:cursor-grabbing hover:border-accent/50 hover:shadow-sm transition-all space-y-2 ${draggingDealId === d.id ? "opacity-50" : ""}`}
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
                            <div className="flex items-center gap-1">
                              <Badge
                                variant="outline"
                                className={`${STAGE_TONE[d.stage]} text-[10px] px-1.5 py-0`}
                              >
                                {d.probability}%
                              </Badge>
                            </div>
                          </div>
                          {d.expected_close_date && (
                            <div className="text-[11px] text-muted-foreground">
                              الإغلاق {new Date(d.expected_close_date).toLocaleDateString("ar-IQ")}
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
