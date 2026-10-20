import * as React from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/admin/login")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Admin Login — Volka Studio" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const search = useSearch({ from: "/admin/login" });
  const navigate = useNavigate();
  const { user, isAdmin, refresh, error: authError } = useAdminAuth();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // If already authenticated and admin, redirect immediately
  React.useEffect(() => {
    if (user && isAdmin) {
      navigate({ to: search.redirect || "/admin", replace: true });
    }
  }, [user, isAdmin, navigate, search.redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Refresh admin context to check admin_users table
        await refresh();

        // Check if admin status is confirmed
        const { data: adminRecord, error: checkErr } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (checkErr || !adminRecord) {
          setError(
            "Access denied. This account does not have administrator privileges.",
          );
          setLoading(false);
          return;
        }

        navigate({ to: search.redirect || "/admin", replace: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in. Please try again.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-4 py-12 text-primary-foreground sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-primary-foreground/15 bg-primary/95 p-8 shadow-2xl backdrop-blur">
        <div className="text-center">
          <span className="font-display text-4xl font-light tracking-[0.12em] text-primary-foreground">
            VOLKA
          </span>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.25em] text-gold">
            Studio Back Office
          </p>
          <p className="mt-3 text-sm font-light text-primary-foreground/60">
            Sign in with your studio administrator account.
          </p>
        </div>

        {(error || authError) && (
          <div className="flex items-start gap-3 rounded border border-destructive/40 bg-destructive/15 p-4 text-xs leading-relaxed text-destructive-foreground">
            <AlertCircle className="size-4 shrink-0 mt-0.5 text-destructive" />
            <p>{error || authError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-xs uppercase tracking-[0.14em] text-primary-foreground/80">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary-foreground/40" />
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@volkastudio.com"
                required
                className="pl-10 border-primary-foreground/20 bg-primary-foreground/5 text-primary-foreground placeholder:text-primary-foreground/30 focus-visible:border-gold focus-visible:ring-gold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password" className="text-xs uppercase tracking-[0.14em] text-primary-foreground/80">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary-foreground/40" />
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="pl-10 border-primary-foreground/20 bg-primary-foreground/5 text-primary-foreground placeholder:text-primary-foreground/30 focus-visible:border-gold focus-visible:ring-gold"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="volka"
            size="volka"
            disabled={loading}
            className="w-full mt-6"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>Enter studio back office</span>
                <ArrowRight className="size-4" />
              </span>
            )}
          </Button>
        </form>

        <div className="pt-4 text-center">
          <a
            href="/"
            className="text-xs text-primary-foreground/50 transition-colors hover:text-gold"
          >
            ← Back to public website
          </a>
        </div>
      </div>
    </div>
  );
}
