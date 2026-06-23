import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RadioTower, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { listRadarSources } from "@/lib/marketplace.functions";
import type { RadarSourceRow } from "@/lib/marketplace/types";

export const Route = createFileRoute("/_authenticated/radar")({
  head: () => ({ meta: [{ title: "رادار الفرص — ديل كومباس AI+" }] }),
  component: RadarPage,
});

const SOURCE_LABEL: Record<string, string> = {
  public_website: "موقع عام",
  government_tender: "مناقصة حكومية",
  rss: "RSS",
  supplier_website: "موقع مورد",
  business_directory: "دليل أعمال",
  public_telegram: "قناة تيليغرام عامة",
  partner_feed: "تغذية شريك",
  admin_upload: "رفع إداري",
};

function RadarPage() {
  const listSources = useServerFn(listRadarSources);
  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["radar-sources"],
    queryFn: () => listSources(),
  });

  return (
    <AppShell>
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6" dir="rtl">
        <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <Badge variant="outline" className="gap-1 w-fit">
            <RadioTower className="h-3.5 w-3.5" /> رادار الفرص
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">مصادر الفرص العامة</h1>
          <p className="text-sm text-muted-foreground leading-6 max-w-2xl">
            سجل مصادر عامة أو مصرح بها لاستخراج الفرص التجارية. لا توجد عمال ingestion مفعّلة حتى
            يتم تأكيد مزود الطوابير والتنفيذ.
          </p>
        </section>

        {isLoading ? (
          <div className="text-sm text-muted-foreground text-center py-16">جارٍ تحميل المصادر…</div>
        ) : (
          <SourceGrid sources={sources as RadarSourceRow[]} />
        )}
      </main>
    </AppShell>
  );
}

function SourceGrid({ sources }: { sources: RadarSourceRow[] }) {
  if (sources.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card py-16 text-center text-sm text-muted-foreground">
        لا توجد مصادر رادار مسجلة بعد.
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {sources.map((source) => (
        <Card key={source.id} className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold leading-7">{source.name}</h2>
              <p className="text-xs text-muted-foreground">
                {SOURCE_LABEL[source.source_type] ?? source.source_type}
              </p>
            </div>
            <Badge variant={source.is_active ? "default" : "outline"}>
              {source.is_active ? "نشط" : "متوقف"}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>الدولة: {source.country ?? "غير محددة"}</div>
            <div>اللغة: {source.language}</div>
            <div>
              آخر فحص:{" "}
              {source.last_checked_at
                ? new Date(source.last_checked_at).toLocaleDateString("ar-IQ")
                : "لم يتم بعد"}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground border-t border-border pt-3">
            <ShieldCheck className="h-3.5 w-3.5" /> لا يتم جلب أي محتوى خاص أو غير مصرح به.
          </div>
        </Card>
      ))}
    </div>
  );
}
