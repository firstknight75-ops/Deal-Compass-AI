import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Archive,
  ArrowRight,
  Edit,
  FileText,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  addSpecialOpportunityComment,
  archiveSpecialOpportunity,
  getSpecialOpportunity,
  listSpecialOpportunityActivities,
  listSpecialOpportunityDocuments,
  registerSpecialOpportunityDocument,
  scoreSpecialOpportunity,
  updateSpecialOpportunity,
} from "@/lib/marketplace.functions";
import type {
  OpportunityActivityRow,
  OpportunityDocumentRow,
  SpecialOpportunityRow,
} from "@/lib/marketplace/types";

export const Route = createFileRoute("/_authenticated/marketplace/$opportunityId")({
  head: () => ({ meta: [{ title: "تفاصيل الفرصة — ديل كومباس AI+" }] }),
  component: OpportunityDetailPage,
});

function OpportunityDetailPage() {
  const { opportunityId } = Route.useParams();
  const getSpecial = useServerFn(getSpecialOpportunity);
  const listActivities = useServerFn(listSpecialOpportunityActivities);
  const addComment = useServerFn(addSpecialOpportunityComment);
  const archive = useServerFn(archiveSpecialOpportunity);
  const scoreWithAI = useServerFn(scoreSpecialOpportunity);
  const listDocuments = useServerFn(listSpecialOpportunityDocuments);
  const registerDocument = useServerFn(registerSpecialOpportunityDocument);
  const qc = useQueryClient();
  const [comment, setComment] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  const { data: opportunity, isLoading } = useQuery({
    queryKey: ["special-opportunity", opportunityId],
    queryFn: () => getSpecial({ data: { id: opportunityId } }),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["special-opportunity-activities", opportunityId],
    queryFn: () => listActivities({ data: { id: opportunityId } }),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["special-opportunity-documents", opportunityId],
    queryFn: () => listDocuments({ data: { id: opportunityId } }),
  });

  const commentMutation = useMutation({
    mutationFn: () => addComment({ data: { opportunityId, body_ar: comment } }),
    onSuccess: () => {
      setComment("");
      toast.success("تمت إضافة التعليق");
      qc.invalidateQueries({ queryKey: ["special-opportunity-activities", opportunityId] });
    },
    onError: () => toast.error("تعذر إضافة التعليق"),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("يجب تسجيل الدخول لرفع المستندات");

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const storagePath = `${userData.user.id}/${opportunityId}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("trade-documents")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) throw uploadError;

      return registerDocument({
        data: {
          opportunityId,
          storage_path: storagePath,
          file_name: file.name,
          mime_type: file.type || "application/octet-stream",
          file_size_bytes: file.size,
          title_ar: file.name,
        },
      });
    },
    onSuccess: () => {
      toast.success("تم رفع المستند");
      qc.invalidateQueries({ queryKey: ["special-opportunity-documents", opportunityId] });
      qc.invalidateQueries({ queryKey: ["special-opportunity-activities", opportunityId] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "تعذر رفع المستند"),
  });

  const scoreMutation = useMutation({
    mutationFn: () => scoreWithAI({ data: { id: opportunityId } }),
    onSuccess: () => {
      toast.success("تم تحديث تقييم الذكاء الاصطناعي");
      qc.invalidateQueries({ queryKey: ["special-opportunity", opportunityId] });
      qc.invalidateQueries({ queryKey: ["special-opportunity-activities", opportunityId] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "تعذر تقييم الفرصة"),
  });

  const archiveMutation = useMutation({
    mutationFn: () => archive({ data: { id: opportunityId } }),
    onSuccess: () => {
      toast.success("تمت أرشفة الفرصة");
      qc.invalidateQueries({ queryKey: ["special-opportunity", opportunityId] });
      qc.invalidateQueries({ queryKey: ["special-opportunity-activities", opportunityId] });
    },
    onError: () => toast.error("تعذر أرشفة الفرصة"),
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
            جارٍ تحميل تفاصيل الفرصة…
          </div>
        ) : (
          <OpportunityHeader
            opportunity={opportunity as SpecialOpportunityRow}
            onArchive={() => archiveMutation.mutate()}
            onEdit={() => setEditOpen(true)}
            onScore={() => scoreMutation.mutate()}
            isScoring={scoreMutation.isPending}
          />
        )}

        <section className="grid lg:grid-cols-[1fr_340px] gap-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-accent" />
              <h2 className="font-semibold">تعليق داخلي</h2>
            </div>
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              placeholder="أضف ملاحظة أو تعليقاً على هذه الفرصة..."
            />
            <Button
              disabled={commentMutation.isPending || comment.trim().length === 0}
              onClick={() => commentMutation.mutate()}
            >
              {commentMutation.isPending ? "جارٍ الإضافة…" : "إضافة تعليق"}
            </Button>
          </Card>

          <div className="space-y-6">
            <DocumentsPanel
              documents={documents as OpportunityDocumentRow[]}
              isUploading={uploadMutation.isPending}
              onUpload={(file) => uploadMutation.mutate(file)}
            />
            <Timeline activities={activities as OpportunityActivityRow[]} />
          </div>
        </section>

        {opportunity && (
          <EditSpecialOpportunityDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            opportunity={opportunity as SpecialOpportunityRow}
          />
        )}
      </main>
    </AppShell>
  );
}

function OpportunityHeader({
  opportunity,
  onArchive,
  onEdit,
  onScore,
  isScoring,
}: {
  opportunity: SpecialOpportunityRow;
  onArchive: () => void;
  onEdit: () => void;
  onScore: () => void;
  isScoring: boolean;
}) {
  return (
    <Card className="p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{opportunity.status}</Badge>
            {opportunity.ai_score !== null && (
              <Badge variant="outline" className="gap-1">
                <ShieldCheck className="h-3 w-3" /> درجة الذكاء الاصطناعي {opportunity.ai_score}%
              </Badge>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-semibold leading-10">{opportunity.title_ar}</h1>
            <p className="text-sm text-muted-foreground mt-2">
              {opportunity.country ?? "غير محدد"} {opportunity.city ? `• ${opportunity.city}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={onEdit}
            disabled={opportunity.status === "archived"}
          >
            <Edit className="h-4 w-4" /> تعديل
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={onArchive}
            disabled={opportunity.status === "archived"}
          >
            <Archive className="h-4 w-4" /> أرشفة
          </Button>
        </div>
      </div>

      <p className="leading-8 text-sm text-muted-foreground whitespace-pre-wrap">
        {opportunity.description_ar}
      </p>

      {opportunity.ai_explainer_ar && (
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-7 whitespace-pre-wrap">
          <div className="font-medium mb-1">شرح تقييم الذكاء الاصطناعي</div>
          {opportunity.ai_explainer_ar}
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <Info
          label="السعر"
          value={
            opportunity.price_amount
              ? `${opportunity.price_amount.toLocaleString("ar-IQ")} ${opportunity.currency}`
              : "عند التواصل"
          }
        />
        <Info
          label="الكمية"
          value={
            opportunity.quantity
              ? `${opportunity.quantity.toLocaleString("ar-IQ")} ${opportunity.unit ?? ""}`
              : "غير محددة"
          }
        />
        <Info
          label="آخر تحديث"
          value={new Date(opportunity.updated_at).toLocaleDateString("ar-IQ")}
        />
      </div>
    </Card>
  );
}

function EditSpecialOpportunityDialog({
  open,
  onOpenChange,
  opportunity,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  opportunity: SpecialOpportunityRow;
}) {
  const update = useServerFn(updateSpecialOpportunity);
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title_ar: opportunity.title_ar,
    description_ar: opportunity.description_ar,
    country: opportunity.country ?? "",
    city: opportunity.city ?? "",
    price_amount: opportunity.price_amount?.toString() ?? "",
    currency: opportunity.currency,
    quantity: opportunity.quantity?.toString() ?? "",
    unit: opportunity.unit ?? "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      update({
        data: {
          id: opportunity.id,
          title_ar: form.title_ar,
          description_ar: form.description_ar,
          country: form.country || null,
          city: form.city || null,
          price_amount: form.price_amount ? Number(form.price_amount) : null,
          currency: form.currency,
          quantity: form.quantity ? Number(form.quantity) : null,
          unit: form.unit || null,
        },
      }),
    onSuccess: () => {
      toast.success("تم تحديث الفرصة");
      qc.invalidateQueries({ queryKey: ["special-opportunity", opportunity.id] });
      qc.invalidateQueries({ queryKey: ["special-opportunity-activities", opportunity.id] });
      onOpenChange(false);
    },
    onError: () => toast.error("تعذر تحديث الفرصة"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل الفرصة الخاصة</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="edit-title">العنوان العربي</Label>
            <Input
              id="edit-title"
              value={form.title_ar}
              onChange={(event) => setForm({ ...form, title_ar: event.target.value })}
              required
              minLength={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">الوصف العربي</Label>
            <Textarea
              id="edit-description"
              rows={5}
              value={form.description_ar}
              onChange={(event) => setForm({ ...form, description_ar: event.target.value })}
              required
              minLength={10}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>الدولة</Label>
              <Input
                value={form.country}
                onChange={(event) => setForm({ ...form, country: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>المدينة</Label>
              <Input
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-4 gap-3">
            <div className="space-y-2 sm:col-span-2">
              <Label>السعر</Label>
              <Input
                type="number"
                min="0"
                value={form.price_amount}
                onChange={(event) => setForm({ ...form, price_amount: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>العملة</Label>
              <Input
                value={form.currency}
                maxLength={3}
                onChange={(event) =>
                  setForm({ ...form, currency: event.target.value.toUpperCase() })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>الوحدة</Label>
              <Input
                value={form.unit}
                onChange={(event) => setForm({ ...form, unit: event.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "جارٍ الحفظ…" : "حفظ التعديلات"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium mt-1">{value}</div>
    </div>
  );
}

function DocumentsPanel({
  documents,
  isUploading,
  onUpload,
}: {
  documents: OpportunityDocumentRow[];
  isUploading: boolean;
  onUpload: (file: File) => void;
}) {
  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-accent" />
          <h2 className="font-semibold">المستندات</h2>
        </div>
        <label className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors">
          <Upload className="h-4 w-4" />
          {isUploading ? "جارٍ الرفع…" : "رفع"}
          <input
            type="file"
            className="hidden"
            accept="application/pdf,image/jpeg,image/png,image/webp,.docx,.xlsx"
            disabled={isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
              event.target.value = "";
            }}
          />
        </label>
      </div>
      {documents.length === 0 ? (
        <div className="text-sm text-muted-foreground">لا توجد مستندات مرفوعة بعد.</div>
      ) : (
        <div className="space-y-2">
          {documents.map((document) => (
            <div key={document.id} className="rounded-md border border-border p-3 text-sm">
              <div className="font-medium truncate">{document.title_ar ?? document.file_name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {(document.file_size_bytes / 1024 / 1024).toFixed(2)} MB •{" "}
                {new Date(document.created_at).toLocaleDateString("ar-IQ")}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function Timeline({ activities }: { activities: OpportunityActivityRow[] }) {
  return (
    <Card className="p-5 space-y-4">
      <h2 className="font-semibold">سجل النشاط</h2>
      {activities.length === 0 ? (
        <div className="text-sm text-muted-foreground">لا توجد أنشطة بعد.</div>
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
