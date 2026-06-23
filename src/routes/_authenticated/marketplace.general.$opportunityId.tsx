import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Bookmark, ExternalLink, Globe2, ShieldAlert, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  getGeneralOpportunity,
  listGeneralOpportunityActivities,
  saveGeneralOpportunity,
} from "@/lib/marketplace.functions";
import type { GeneralOpportunityRow, OpportunityActivityRow } from "@/lib/marketplace/types";

export const Route = createFileRoute("/_authenticated/marketplace/general/$opportunityId")({
  head: () => ({ meta: [{ title: "تفاصيل فرصة عامة — ديل كومباس AI+" }] }),
  component: GeneralOpportunityDetailPage,
});

function GeneralOpportunityDetailPage() {
  const { opportunityId } = Route.useParams();
  const getGeneral = useServerFn(getGeneralOpportunity);
  const listActivities = useServerFn(listGeneralOpportunityActivities);
  const saveGeneral = useServerFn(saveGeneralOpportunity);

  const { data: opportunity, isLoading } = useQuery({
    queryKey: ["general-opportunity", opportunityId],
    queryFn: () => getGeneral({ data: { id: opportunityId } }),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["general-opportunity-activities", opportunityId],
    queryFn: () => listActivities({ data: { id: opportunityId } }),
  });

  const saveMutation = useMutation({
    mutationFn: () => saveGeneral({ data: { id: opportunityId } }),
    onSuccess: () => toast.success("تم حفظ الفرصة العامة"),
    onError: () => toast.error("تعذر حفظ الفرصة"),
  });

  return (
    <AppShell>
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6" dir="rtl">
        <Button asChild variant="ghost" className="gap-2">
          <Link to="/marketplace">
            <ArrowRight className="h-4 w-4" /> العودة إلى السوق
          </Link>
        </Button>

        {isLoading || !opportunity ? (
          <div className="text-sm text-muted-foreground py-16 text-center">
            جارٍ تحميل تفاصيل الفرصة العامة…
          </div>
        ) : (
          <GeneralOpportunityHeader
            opportunity={opportunity as GeneralOpportunityRow}
            onSave={() => saveMutation.mutate()}
          />
        )}

        <Timeline activities={activities as OpportunityActivityRow[]} />
      </main>
    </AppShell>
  );
}

function GeneralOpportunityHeader({
  opportunity,
  onSave,
}: {
  opportunity: GeneralOpportunityRow;
  onSave: () => void;
}) {
  return (
    <Card className="p-6 space-y-5 border-dashed">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Globe2 className="h-3 w-3" /> فرصة عامة مجانية
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" /> مستخرجة بالذكاء الاصطناعي
            </Badge>
          </div>
          <div>
            <h1 className="text-3xl font-semibold leading-10">
              {opportunity.title_ar ?? opportunity.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {opportunity.country ?? "غير محدد"} {opportunity.city ? `• ${opportunity.city}` : ""}{" "}
              • المصدر: {opportunity.source_name}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {opportunity.source_url && (
            <Button asChild variant="outline" className="gap-2">
              <a href={opportunity.source_url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> المصدر
              </a>
            </Button>
          )}
          <Button className="gap-2" onClick={onSave}>
            <Bookmark className="h-4 w-4" /> حفظ
          </Button>
        </div>
      </div>

      <p className="leading-8 text-sm text-muted-foreground whitespace-pre-wrap">
        {opportunity.summary_ar ?? opportunity.description ?? "لا يوجد وصف متاح."}
      </p>

      {opportunity.ai_explainer_ar && (
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-7">
          <div className="font-medium mb-1">شرح الذكاء الاصطناعي</div>
          {opportunity.ai_explainer_ar}
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <Info label="درجة الثقة" value={`${opportunity.confidence_score}%`} />
        <Info
          label="درجة المخاطر"
          value={`${opportunity.risk_score}%`}
          icon={<ShieldAlert className="h-4 w-4" />}
        />
        <Info
          label="تاريخ النشر"
          value={
            opportunity.published_at
              ? new Date(opportunity.published_at).toLocaleDateString("ar-IQ")
              : "غير محدد"
          }
        />
      </div>
    </Card>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
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

function Timeline({ activities }: { activities: OpportunityActivityRow[] }) {
  return (
    <Card className="p-5 space-y-4">
      <h2 className="font-semibold">سجل الفرصة العامة</h2>
      {activities.length === 0 ? (
        <div className="text-sm text-muted-foreground">لا توجد أنشطة منشورة لهذه الفرصة بعد.</div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="border-s-2 border-accent/30 ps-3 py-1">
              <div className="text-sm font-medium">
                {activity.body_ar ?? activity.activity_type}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(activity.created_at).toLocaleString("ar-IQ")}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
