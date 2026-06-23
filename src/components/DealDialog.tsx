import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createDeal,
  updateDeal,
  deleteDeal,
  DEAL_STAGES,
  type DealStage,
} from "@/lib/deals.functions";
import { toast } from "sonner";

export interface DealRow {
  id: string;
  name: string;
  company: string | null;
  stage: DealStage;
  value_cents: number;
  currency: string;
  probability: number;
  expected_close_date: string | null;
  owner: string | null;
  notes: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  deal: DealRow | null;
  defaultStage?: DealStage;
}

const STAGE_LABEL: Record<DealStage, string> = {
  lead: "عميل محتمل",
  qualified: "مؤهل",
  proposal: "عرض",
  negotiation: "تفاوض",
  won: "فازت",
  lost: "خسرت",
};

export function DealDialog({ open, onOpenChange, deal, defaultStage }: Props) {
  const qc = useQueryClient();
  const create = useServerFn(createDeal);
  const update = useServerFn(updateDeal);
  const remove = useServerFn(deleteDeal);

  const [form, setForm] = useState({
    name: "",
    company: "",
    stage: "lead" as DealStage,
    value: "0",
    currency: "USD",
    probability: "10",
    expected_close_date: "",
    owner: "",
    notes: "",
  });

  useEffect(() => {
    if (deal) {
      setForm({
        name: deal.name,
        company: deal.company ?? "",
        stage: deal.stage,
        value: (deal.value_cents / 100).toString(),
        currency: deal.currency,
        probability: deal.probability.toString(),
        expected_close_date: deal.expected_close_date ?? "",
        owner: deal.owner ?? "",
        notes: deal.notes ?? "",
      });
    } else {
      setForm((f) => ({
        ...f,
        stage: defaultStage ?? "lead",
        name: "",
        company: "",
        value: "0",
        probability: "10",
        expected_close_date: "",
        owner: "",
        notes: "",
      }));
    }
  }, [deal, defaultStage, open]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        company: form.company || null,
        stage: form.stage,
        value_cents: Math.round(parseFloat(form.value || "0") * 100),
        currency: form.currency || "USD",
        probability: parseInt(form.probability || "0", 10),
        expected_close_date: form.expected_close_date || null,
        owner: form.owner || null,
        notes: form.notes || null,
      };
      if (deal) return update({ data: { id: deal.id, patch: payload } });
      return create({ data: payload });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      toast.success(deal ? "تم تحديث الصفقة" : "تم إنشاء الصفقة");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "فشل الحفظ"),
  });

  const del = useMutation({
    mutationFn: async () => deal && remove({ data: { id: deal.id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      toast.success("تم حذف الصفقة");
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>{deal ? "تعديل الصفقة" : "صفقة جديدة"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">اسم الصفقة</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="company">الشركة</Label>
              <Input
                id="company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="owner">المالك</Label>
              <Input
                id="owner"
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>المرحلة</Label>
              <Select
                value={form.stage}
                onValueChange={(v) => setForm({ ...form, stage: v as DealStage })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {STAGE_LABEL[stage]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="value">القيمة</Label>
              <Input
                id="value"
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prob">نسبة الفوز %</Label>
              <Input
                id="prob"
                type="number"
                min="0"
                max="100"
                value={form.probability}
                onChange={(e) => setForm({ ...form, probability: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="close">تاريخ الإغلاق المتوقع</Label>
            <Input
              id="close"
              type="date"
              value={form.expected_close_date}
              onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            {deal && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => del.mutate()}
                disabled={del.isPending}
                className="ml-auto"
              >
                حذف
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "جارٍ الحفظ…" : "حفظ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
