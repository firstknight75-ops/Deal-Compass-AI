import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, RadioTower, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { createRadarSource, listMyRoles, listRadarSources } from "@/lib/marketplace.functions";
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
  const listRoles = useServerFn(listMyRoles);
  const [createOpen, setCreateOpen] = useState(false);
  const { data: roles = [] } = useQuery({ queryKey: ["my-roles"], queryFn: () => listRoles() });
  const canManage = roles.some((role) => ["admin", "super_admin", "moderator"].includes(role.role));
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
          {canManage && (
            <Button className="gap-2 w-fit" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> إضافة مصدر
            </Button>
          )}
        </section>

        {isLoading ? (
          <div className="text-sm text-muted-foreground text-center py-16">جارٍ تحميل المصادر…</div>
        ) : (
          <SourceGrid sources={sources as RadarSourceRow[]} />
        )}
        <CreateRadarSourceDialog open={createOpen} onOpenChange={setCreateOpen} />
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

const SOURCE_TYPES = [
  "public_website",
  "government_tender",
  "rss",
  "supplier_website",
  "business_directory",
  "public_telegram",
  "partner_feed",
  "admin_upload",
] as const;

function CreateRadarSourceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const create = useServerFn(createRadarSource);
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    source_type: "public_website",
    base_url: "",
    country: "العراق",
    language: "ar",
    is_active: false,
  });

  const mutation = useMutation({
    mutationFn: () =>
      create({
        data: {
          name: form.name,
          source_type: form.source_type as (typeof SOURCE_TYPES)[number],
          base_url: form.base_url || null,
          country: form.country || null,
          language: form.language,
          is_active: form.is_active,
        },
      }),
    onSuccess: () => {
      toast.success("تم إنشاء مصدر الرادار");
      qc.invalidateQueries({ queryKey: ["radar-sources"] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "تعذر إنشاء المصدر"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة مصدر رادار</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label>اسم المصدر</Label>
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
              minLength={2}
            />
          </div>
          <div className="space-y-2">
            <Label>نوع المصدر</Label>
            <Select
              value={form.source_type}
              onValueChange={(value) => setForm({ ...form, source_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {SOURCE_LABEL[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>الرابط الأساسي</Label>
            <Input
              value={form.base_url}
              onChange={(event) => setForm({ ...form, base_url: event.target.value })}
              placeholder="https://example.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>الدولة</Label>
              <Input
                value={form.country}
                onChange={(event) => setForm({ ...form, country: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>اللغة</Label>
              <Input
                value={form.language}
                onChange={(event) => setForm({ ...form, language: event.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <Label>تفعيل المصدر</Label>
            <Switch
              checked={form.is_active}
              onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "جارٍ الحفظ…" : "حفظ المصدر"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
