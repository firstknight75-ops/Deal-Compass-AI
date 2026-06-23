import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Compass } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — ديل كومباس AI+" },
      { name: "description", content: "سجّل الدخول إلى مساحة عمل ديل كومباس." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) throw error;
        toast.success("تم إنشاء الحساب. أنت الآن مسجّل الدخول.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشلت عملية المصادقة");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background" dir="rtl">
      <div className="hidden lg:flex flex-col justify-between bg-primary text-primary-foreground p-12">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
          <Compass className="h-6 w-6 text-accent" />
          ديل كومباس <span className="text-accent">AI+</span>
        </Link>
        <div className="space-y-4 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">وجّه كل صفقة بوضوح.</h2>
          <p className="text-primary-foreground/70 text-sm leading-relaxed">
            رؤية لمسار الصفقات، تقييم لصحة الفرص، وتحليلات جاهزة لاتخاذ القرار — مصممة لفرق
            الإيرادات التي تتحرك بسرعة.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/50">© ديل كومباس AI+</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md p-8 space-y-6 shadow-sm">
          <div className="space-y-1.5">
            <Link to="/" className="lg:hidden flex items-center gap-2 mb-4 font-semibold">
              <Compass className="h-5 w-5 text-accent" />
              ديل كومباس <span className="text-accent">AI+</span>
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">
              {mode === "signin" ? "مرحباً بعودتك" : "أنشئ مساحة عملك"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signin"
                ? "سجّل الدخول للمتابعة إلى مسار صفقاتك."
                : "ابدأ خلال أقل من دقيقة."}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني للعمل</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "يرجى الانتظار…" : mode === "signin" ? "تسجيل الدخول" : "إنشاء حساب"}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            {mode === "signin" ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-accent font-medium hover:underline"
            >
              {mode === "signin" ? "إنشاء حساب" : "تسجيل الدخول"}
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
}
