import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AuthShell, Field, FormError } from "@/components/auth/AuthShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { ActionButton } from "@/components/ui/EditorialButton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/signin")({
  head: () => ({
    meta: [
      { title: "Sign In — UNTKN" },
      { name: "description", content: "Sign in to your UNTKN account to track orders and manage your wishlist." },
      { property: "og:title", content: "Sign In — UNTKN" },
      { property: "og:description", content: "Sign in to your UNTKN account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/account" });
  }, [user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "That email and password don't match."
          : signInError.message,
      );
      return;
    }
    navigate({ to: "/account" });
  }

  return (
    <AuthShell eyebrow="Account" title="Sign in">
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          showPasswordToggle
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FormError message={error} />
        <ActionButton type="submit" size="lg" full disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </ActionButton>
      </form>
      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 label-xs text-muted-foreground">
        <Link to="/auth/forgot" className="link-rule">
          Forgot password
        </Link>
        <Link to="/auth/signup" className="link-rule">
          Create an account
        </Link>
      </div>
    </AuthShell>
  );
}
