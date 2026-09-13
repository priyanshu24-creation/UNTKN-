import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { AuthShell, Field, FormError } from "@/components/auth/AuthShell";
import { ActionButton } from "@/components/ui/EditorialButton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/signup")({
  head: () => ({
    meta: [
      { title: "Create Account — UNTKN" },
      {
        name: "description",
        content: "Create an UNTKN account to check out faster, track orders and save pieces.",
      },
      { property: "og:title", content: "Create Account — UNTKN" },
      { property: "og:description", content: "Create an UNTKN account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    setBusy(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/signin`,
      },
    });
    setBusy(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      navigate({ to: "/account" });
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <AuthShell
        eyebrow="Account"
        title="Check your inbox"
        intro="We've sent a confirmation link to your email. Open it to activate your account."
      >
        <Link to="/auth/signin" className="label-xs link-rule">
          Back to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Account" title="Create account">
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field
          label="Full name"
          name="full_name"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
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
          autoComplete="new-password"
          required
          showPasswordToggle
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FormError message={error} />
        <ActionButton type="submit" size="lg" full disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </ActionButton>
      </form>
      <p className="mt-8 label-xs text-muted-foreground">
        Already registered?{" "}
        <Link to="/auth/signin" className="link-rule">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
