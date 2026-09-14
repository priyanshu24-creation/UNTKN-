import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AuthShell, Field, FormError } from "@/components/auth/AuthShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { ActionButton } from "@/components/ui/EditorialButton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/admin-signin")({
  head: () => ({
    meta: [
      { title: "Admin Sign In — UNTKN" },
      { name: "description", content: "Restricted UNTKN Studio administrator sign in." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminSignInPage,
});

function AdminSignInPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setBusy(false);
      setError(
        signInError.message === "Invalid login credentials"
          ? "That email and password don't match."
          : signInError.message,
      );
      return;
    }

    // /admin performs the authoritative server-side role check.
    setBusy(false);
    navigate({ to: "/admin" });
  }

  return (
    <AuthShell
      eyebrow="UNTKN Studio"
      title="Administrator sign in"
      intro="This area is restricted to UNTKN administrators. Customer accounts cannot access the Studio."
    >
      {user && (
        <div className="mb-7 border border-border bg-muted/30 p-4" role="status">
          <p className="label-xs text-muted-foreground">Currently signed in</p>
          <p className="mt-2 break-all text-sm">{user.email}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            This does not give this account admin access. Use an administrator account below.
          </p>
          <button
            type="button"
            className="label-xs link-rule mt-4"
            onClick={async () => {
              await signOut();
              setEmail("");
              setPassword("");
              setError(null);
            }}
          >
            Sign out this account first
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field
          label="Administrator email"
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          showPasswordToggle
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <FormError message={error} />
        <ActionButton type="submit" size="lg" full disabled={busy}>
          {busy ? "Checking access…" : "Enter Studio"}
        </ActionButton>
      </form>

      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 label-xs text-muted-foreground">
        <Link to="/auth/forgot" className="link-rule">Forgot password</Link>
        <Link to="/" className="link-rule">Back to store</Link>
      </div>
    </AuthShell>
  );
}
