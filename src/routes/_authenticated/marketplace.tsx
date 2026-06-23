import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bookmark, Heart, Plus, Search, ShieldCheck, Sparkles } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  createSpecialOpportunity,
  favoriteSpecialOpportunity,
  listGeneralOpportunities,
  listSpecialOpportunities,
  listTradeCategories,
  saveGeneralOpportunity,
} from "@/lib/marketplace.functions";
import {
  SPECIAL_OPPORTUNITY_TYPES,
  type GeneralOpportunityRow,
  type SpecialOpportunityType,
  type TradeCategoryRow,
  type SpecialOpportunityRow,
} from "@/lib/marketplace/types";

export const Route = createFileRoute("/_authenticated/marketplace")({
  head: () => ({ meta: [{ title: "السوق الذكي — ديل كومباس AI+" }] }),
  component: MarketplacePage,
});

const TYPE_LABEL: Record<SpecialOpportunityType, string> = {
  sell_listing: "عرض بيع",
  buy_request: "طلب شراء",
  service_offer: "خدمة",
  machinery_listing: "مكائن ومعدات",
  wholesale_lot: "جملة",
  import_request: "طلب استيراد",
  export_request: "طلب تصدير",
  verified_tender: "مناقصة موثقة",
};

function MarketplacePage() {
  const [mode, setMode] = useState<"special" | "general">("special");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const filters = useMemo(
    () => ({
      query: search.trim() || undefined,
      categoryId: categoryId === "all" ? undefined : categoryId,
      limit: 24,
    }),
    [categoryId, search],
  );

  const listCategories = useServerFn(listTradeCategories);
  const listGeneral = useServerFn(listGeneralOpportunities);
  const listSpecial = useServerFn(listSpecialOpportunities);

  const { data: categories = [] } = useQuery({
    queryKey: ["trade-categories"],
    queryFn: () => listCategories(),
  });

  const { data: generalRows = [], isLoading: generalLoading } = useQuery({
    queryKey: ["general-opportunities", filters],
    queryFn: () => listGeneral({ data: filters }),
    enabled: mode === "general",
  });

  const { data: specialRows = [], isLoading: specialLoading } = useQuery({
    queryKey: ["special-opportunities", filters],
    queryFn: () => listSpecial({ data: filters }),
    enabled: mode === "special",
  });

  return (
    <AppShell>
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6" dir="rtl">
        <section className="rounded-2xl border border-border bg-card p-6 overflow-hidden relative">
          <div className="absolute inset-inline-start-0 top-0 h-full w-1 bg-accent" />
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <Badge variant="outline" className="gap-1 w-fit">
                <Sparkles className="h-3.5 w-3.5" />
                سوق B2B ذكي للشرق الأوسط
              </Badge>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  السوق الذكي والفرص التجارية
                </h1>
                <p className="text-sm text-muted-foreground mt-2 leading-6">
                  فرص خاصة مملوكة للمستخدمين، وفرص عامة مستخرجة بالذكاء الاصطناعي من مصادر عامة أو
                  مصرح بها.
                </p>
              </div>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              أضف فرصة خاصة
            </Button>
          </div>
        </section>

        <section className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث عن منتجات، مناقصات، موردين، طلبات شراء..."
              className="ps-10"
            />
          </div>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="التصنيف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل التصنيفات</SelectItem>
              {(categories as TradeCategoryRow[]).map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name_ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 rounded-md border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setMode("special")}
              className={`rounded px-3 py-2 text-sm transition ${mode === "special" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              فرص خاصة
            </button>
            <button
              type="button"
              onClick={() => setMode("general")}
              className={`rounded px-3 py-2 text-sm transition ${mode === "general" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              فرص عامة
            </button>
          </div>
        </section>

        {mode === "special" ? (
          <SpecialGrid rows={specialRows as SpecialOpportunityRow[]} loading={specialLoading} />
        ) : (
          <GeneralGrid rows={generalRows as GeneralOpportunityRow[]} loading={generalLoading} />
        )}
      </main>

      <CreateSpecialDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        categories={categories as TradeCategoryRow[]}
      />
    </AppShell>
  );
}

function SpecialGrid({ rows, loading }: { rows: SpecialOpportunityRow[]; loading: boolean }) {
  const favorite = useServerFn(favoriteSpecialOpportunity);
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => favorite({ data: { id } }),
    onSuccess: () => {
      toast.success("تمت الإضافة إلى المفضلة");
      qc.invalidateQueries({ queryKey: ["special-opportunities"] });
    },
    onError: () => toast.error("تعذر إضافة الفرصة إلى المفضلة"),
  });

  if (loading) return <LoadingState label="جارٍ تحميل فرص السوق…" />;
  if (rows.length === 0) return <EmptyState label="لا توجد فرص خاصة مطابقة حالياً." />;

  return (
    <section className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {rows.map((row) => (
        <Card key={row.id} className="p-4 space-y-4 hover:border-accent/50 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <Badge variant="secondary">{TYPE_LABEL[row.type]}</Badge>
            <button
              type="button"
              onClick={() => mutation.mutate(row.id)}
              className="text-muted-foreground hover:text-accent"
              aria-label="إضافة إلى المفضلة"
            >
              <Heart className="h-4 w-4" />
            </button>
          </div>
          <Link
            to="/marketplace/$opportunityId"
            params={{ opportunityId: row.id }}
            className="block"
          >
            <h2 className="font-semibold leading-7 hover:text-accent transition-colors">
              {row.title_ar}
            </h2>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{row.description_ar}</p>
          </Link>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {row.country && <span>{row.country}</span>}
            {row.city && <span>• {row.city}</span>}
            {row.quantity && (
              <span>
                • {row.quantity} {row.unit}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="font-semibold text-accent">
              {row.price_amount
                ? `${row.price_amount.toLocaleString("ar-IQ")} ${row.currency}`
                : "السعر عند التواصل"}
            </div>
            {row.ai_score !== null && (
              <Badge variant="outline" className="gap-1">
                <ShieldCheck className="h-3 w-3" /> {row.ai_score}%
              </Badge>
            )}
          </div>
        </Card>
      ))}
    </section>
  );
}

function GeneralGrid({ rows, loading }: { rows: GeneralOpportunityRow[]; loading: boolean }) {
  const save = useServerFn(saveGeneralOpportunity);
  const mutation = useMutation({
    mutationFn: (id: string) => save({ data: { id } }),
    onSuccess: () => toast.success("تم حفظ الفرصة العامة"),
    onError: () => toast.error("تعذر حفظ الفرصة"),
  });

  if (loading) return <LoadingState label="جارٍ تحميل الفرص العامة…" />;
  if (rows.length === 0) return <EmptyState label="لا توجد فرص عامة مطابقة حالياً." />;

  return (
    <section className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {rows.map((row) => (
        <Card key={row.id} className="p-4 space-y-4 border-dashed">
          <div className="flex items-start justify-between gap-3">
            <Badge variant="outline">فرصة عامة مجانية</Badge>
            <button
              type="button"
              onClick={() => mutation.mutate(row.id)}
              className="text-muted-foreground hover:text-accent"
              aria-label="حفظ الفرصة"
            >
              <Bookmark className="h-4 w-4" />
            </button>
          </div>
          <div>
            <h2 className="font-semibold leading-7">{row.title_ar ?? row.title}</h2>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {row.summary_ar ?? row.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {row.country && <span>{row.country}</span>}
            {row.city && <span>• {row.city}</span>}
            <span>• المصدر: {row.source_name}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-xs">
            <span>الثقة: {row.confidence_score}%</span>
            <span>المخاطر: {row.risk_score}%</span>
          </div>
        </Card>
      ))}
    </section>
  );
}

function CreateSpecialDialog({
  open,
  onOpenChange,
  categories,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  categories: TradeCategoryRow[];
}) {
  const create = useServerFn(createSpecialOpportunity);
  const qc = useQueryClient();
  const [form, setForm] = useState({
    type: "sell_listing" as SpecialOpportunityType,
    title_ar: "",
    description_ar: "",
    category_id: "none",
    country: "العراق",
    city: "",
    price_amount: "",
    currency: "USD",
    quantity: "",
    unit: "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      create({
        data: {
          type: form.type,
          title_ar: form.title_ar,
          description_ar: form.description_ar,
          category_id: form.category_id === "none" ? null : form.category_id,
          country: form.country || null,
          city: form.city || null,
          price_amount: form.price_amount ? Number(form.price_amount) : null,
          currency: form.currency,
          quantity: form.quantity ? Number(form.quantity) : null,
          unit: form.unit || null,
          publish: true,
        },
      }),
    onSuccess: () => {
      toast.success("تم نشر الفرصة الخاصة");
      qc.invalidateQueries({ queryKey: ["special-opportunities"] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "تعذر نشر الفرصة"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة فرصة خاصة</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>نوع الفرصة</Label>
              <Select
                value={form.type}
                onValueChange={(value) =>
                  setForm({ ...form, type: value as SpecialOpportunityType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPECIAL_OPPORTUNITY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {TYPE_LABEL[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>التصنيف</Label>
              <Select
                value={form.category_id}
                onValueChange={(value) => setForm({ ...form, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون تصنيف</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title_ar">العنوان العربي</Label>
            <Input
              id="title_ar"
              value={form.title_ar}
              onChange={(event) => setForm({ ...form, title_ar: event.target.value })}
              required
              minLength={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description_ar">الوصف العربي</Label>
            <Textarea
              id="description_ar"
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
                placeholder="طن، كرتون..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "جارٍ النشر…" : "نشر الفرصة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LoadingState({ label }: { label: string }) {
  return <div className="text-sm text-muted-foreground text-center py-16">{label}</div>;
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card py-16 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
