import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, Lightbulb, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listCompanies, listRecommendations } from "@/lib/marketplace.functions";
import type { CompanyRow, RecommendationRow } from "@/lib/marketplace/types";

export const Route = createFileRoute("/_authenticated/intelligence")({
  head: () => ({ meta: [{ title: "استخبارات الشركات — ديل كومباس AI+" }] }),
  component: IntelligencePage,
});

function IntelligencePage() {
  const [search, setSearch] = useState("");
  const listCompanyRows = useServerFn(listCompanies);
  const listRecommendationRows = useServerFn(listRecommendations);
  const filters = useMemo(() => ({ query: search.trim() || undefined, limit: 24 }), [search]);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies", filters],
    queryFn: () => listCompanyRows({ data: filters }),
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ["recommendations"],
    queryFn: () => listRecommendationRows(),
  });

  return (
    <AppShell>
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6" dir="rtl">
        <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <Badge variant="outline" className="gap-1 w-fit">
            <Building2 className="h-3.5 w-3.5" /> استخبارات الشركات والتوصيات
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">اكتشف الشركات والفرص المناسبة</h1>
          <p className="text-sm text-muted-foreground leading-6 max-w-2xl">
            ملفات شركات، درجات ثقة ومخاطر، وتوصيات مخصصة تساعدك على اختيار الموردين والمشترين
            التاليين.
          </p>
        </section>

        <section className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ابحث عن شركة أو صناعة أو دولة..."
                className="ps-10"
              />
            </div>
            {isLoading ? (
              <div className="text-sm text-muted-foreground text-center py-16">
                جارٍ تحميل الشركات…
              </div>
            ) : (
              <CompanyGrid companies={companies as CompanyRow[]} />
            )}
          </div>
          <RecommendationPanel recommendations={recommendations as RecommendationRow[]} />
        </section>
      </main>
    </AppShell>
  );
}

function CompanyGrid({ companies }: { companies: CompanyRow[] }) {
  if (companies.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card py-16 text-center text-sm text-muted-foreground">
        لا توجد شركات مطابقة حالياً.
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {companies.map((company) => (
        <Card key={company.id} className="p-4 space-y-4">
          <div>
            <h2 className="font-semibold leading-7">{company.name_ar ?? company.name}</h2>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {company.description_ar ?? company.industry ?? "ملف شركة قيد الإثراء."}
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            {company.country ?? "غير محدد"} {company.city ? `• ${company.city}` : ""}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Badge variant="outline" className="justify-center gap-1">
              <ShieldCheck className="h-3 w-3" /> الثقة {company.trust_score}%
            </Badge>
            <Badge variant="outline" className="justify-center gap-1">
              <ShieldAlert className="h-3 w-3" /> المخاطر {company.risk_score}%
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}

function RecommendationPanel({ recommendations }: { recommendations: RecommendationRow[] }) {
  return (
    <Card className="p-5 space-y-4 h-fit">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-accent" />
        <h2 className="font-semibold">توصيات مخصصة</h2>
      </div>
      {recommendations.length === 0 ? (
        <div className="text-sm text-muted-foreground leading-6">
          لا توجد توصيات بعد. ستظهر هنا التوصيات بعد توفر بيانات كافية عن نشاطك.
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((recommendation) => (
            <div key={recommendation.id} className="rounded-md border border-border p-3 space-y-1">
              <div className="text-sm font-medium">{recommendation.reason_ar}</div>
              <div className="text-xs text-muted-foreground">
                درجة الملاءمة: {recommendation.score}%
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
