import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, ArrowRight, TrendingUp, Target, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ديل كومباس AI+ — بوصلة كل صفقة بثقة" },
      {
        name: "description",
        content:
          "رؤية واضحة لمسار الصفقات، تقييم صحة الفرص، وتحليلات جاهزة للقرار لفرق الإيرادات الحديثة.",
      },
      { property: "og:title", content: "ديل كومباس AI+" },
      {
        property: "og:description",
        content:
          "رؤية واضحة لمسار الصفقات، تقييم صحة الفرص، وتحليلات جاهزة للقرار لفرق الإيرادات الحديثة.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Compass className="h-5 w-5 text-accent" />
            ديل كومباس <span className="text-accent">AI+</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">تسجيل الدخول</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">ابدأ الآن</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          مصمم لفرق الإيرادات التي تتحرك بسرعة
        </div>
        <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight max-w-3xl mx-auto leading-[1.05]">
          وجّه كل صفقة <span className="text-accent">بوضوح</span>.
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          رؤية لمسار الصفقات، تقييم لصحة الفرص، وتحليلات جاهزة لاتخاذ القرار — كلها في مساحة عمل
          واحدة.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button asChild size="lg">
            <Link to="/auth">
              ابدأ مجاناً <ArrowRight className="mr-1.5 h-4 w-4 rotate-180" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        <Feature
          icon={TrendingUp}
          title="مسار صفقات مباشر"
          body="رتّب وتابع وتنبأ بالإيرادات في الوقت الفعلي. كل مرحلة وكل قيمة في مكانها."
        />
        <Feature
          icon={Target}
          title="توقعات موزونة"
          body="إيرادات معدّلة حسب احتمالية الفوز عبر الصفقات النشطة — بدون جداول مشتتة أو مفاجآت."
        />
        <Feature
          icon={Shield}
          title="خصوصية من الأساس"
          body="أمان على مستوى الصفوف. صفقاتك تخصك وحدك ولا تظهر لأي حساب آخر."
        />
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © ديل كومباس AI+
      </footer>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-3">
      <div className="h-9 w-9 rounded-md bg-accent/10 text-accent flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
