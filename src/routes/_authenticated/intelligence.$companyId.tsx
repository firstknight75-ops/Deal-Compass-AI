import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  Building2,
  ExternalLink,
  Globe2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCompany, listCompanyOpportunityEdges } from "@/lib/marketplace.functions";
import type { CompanyOpportunityEdgeRow, CompanyRow } from "@/lib/marketplace/types";

export const Route = createFileRoute("/_authenticated/intelligence/$companyId")({
  head: () => ({ meta: [{ title: "ملف الشركة — ديل كومباس AI+" }] }),
  component: CompanyDetailPage,
});

function CompanyDetailPage() {
  const { companyId } = Route.useParams();
  const getCompanyRow = useServerFn(getCompany);
  const listEdges = useServerFn(listCompanyOpportunityEdges);
  const { data: company, isLoading } = useQuery({
    queryKey: ["company", companyId],
    queryFn: () => getCompanyRow({ data: { id: companyId } }),
  });

  const { data: edges = [] } = useQuery({
    queryKey: ["company-opportunity-edges", companyId],
    queryFn: () => listEdges({ data: { id: companyId } }),
  });

  return (
    <AppShell>
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6" dir="rtl">
        <Button asChild variant="ghost" className="gap-2">
          <Link to="/intelligence">
            <ArrowRight className="h-4 w-4" /> العودة إلى الاستخبارات
          </Link>
        </Button>

        {isLoading || !company ? (
          <div className="text-sm text-muted-foreground text-center py-16">
            جارٍ تحميل ملف الشركة…
          </div>
        ) : (
          <CompanyProfile
            company={company as CompanyRow}
            edges={edges as CompanyOpportunityEdgeRow[]}
          />
        )}
      </main>
    </AppShell>
  );
}

function CompanyProfile({
  company,
  edges,
}: {
  company: CompanyRow;
  edges: CompanyOpportunityEdgeRow[];
}) {
  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-3">
            <Badge variant="outline" className="gap-1 w-fit">
              <Building2 className="h-3.5 w-3.5" /> ملف شركة
            </Badge>
            <div>
              <h1 className="text-3xl font-semibold leading-10">
                {company.name_ar ?? company.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                {company.industry ?? "صناعة غير محددة"} • {company.country ?? "غير محدد"}{" "}
                {company.city ? `• ${company.city}` : ""}
              </p>
            </div>
          </div>
          {company.website_url && (
            <Button asChild variant="outline" className="gap-2">
              <a href={company.website_url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> الموقع
              </a>
            </Button>
          )}
        </div>

        <p className="text-sm leading-8 text-muted-foreground whitespace-pre-wrap">
          {company.description_ar ?? "ملف الشركة قيد الإثراء من مصادر عامة ومصرح بها."}
        </p>

        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <Info
            label="درجة الثقة"
            value={`${company.trust_score}%`}
            icon={<ShieldCheck className="h-4 w-4" />}
          />
          <Info
            label="درجة المخاطر"
            value={`${company.risk_score}%`}
            icon={<ShieldAlert className="h-4 w-4" />}
          />
          <Info
            label="النطاق"
            value={company.country ?? "عالمي"}
            icon={<Globe2 className="h-4 w-4" />}
          />
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">الفرص المرتبطة</h2>
        {edges.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            لا توجد علاقات فرص مرتبطة بهذه الشركة بعد.
          </div>
        ) : (
          <div className="space-y-2">
            {edges.map((edge) => (
              <div key={edge.id} className="rounded-md border border-border p-3 text-sm">
                <div className="font-medium">
                  {RELATIONSHIP_LABEL[edge.relationship] ?? edge.relationship}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  النوع: {edge.opportunity_kind === "general" ? "فرصة عامة" : "فرصة خاصة"} • الثقة:{" "}
                  {edge.confidence_score}%
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">ملاحظات استخباراتية</h2>
        <ul className="list-disc list-inside text-sm text-muted-foreground leading-7 space-y-1">
          <li>درجة الثقة والمخاطر أولية وقابلة للتحسين بعد التحقق من الوثائق والتعاملات.</li>
          <li>سيتم ربط ملف الشركة لاحقاً بالفرص، المنتجات، وجهات الشحن ضمن Knowledge Graph.</li>
          <li>لا تستخدم هذه المعلومات كبديل عن التحقق التجاري والقانوني قبل التعاقد.</li>
        </ul>
      </Card>
    </div>
  );
}

const RELATIONSHIP_LABEL: Record<string, string> = {
  posted_by: "نُشرت بواسطة",
  buyer: "مشتري",
  seller: "بائع",
  supplier: "مورد",
  manufacturer: "مصنّع",
  distributor: "موزع",
  mentioned_in: "مذكورة في",
  recommended_for: "موصى بها لـ",
};

function Info({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="font-medium mt-1">{value}</div>
    </div>
  );
}
