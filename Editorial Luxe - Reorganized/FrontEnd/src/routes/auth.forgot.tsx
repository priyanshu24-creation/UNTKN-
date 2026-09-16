import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AuthShell, Field, FormError } from "@/components/auth/AuthShell";
import { ActionButton } from "@/components/ui/EditorialButton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/forgot")({
  head: () => ({
    meta: [
      { title: "Reset Password — UNTKN" },
      { name: "description", content: "Request a password reset link for your UNTKN account." },
      { property: "og:title", content: "Reset Password — UNTKN" },
      { property: "og:description", content: "Request a password reset link." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setBusy(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell
        eyebrow="Account"
        title="Link sent"
        intro="If that email is registered, a reset link is on its way."
      >
        <Link to="/auth/signin" className="label-xs link-rule">
          Back to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Account"
      title="Forgot password"
      intro="Enter your email and we'll send a link to set a new password."
    >
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
        <FormError message={error} />
        <ActionButton type="submit" size="lg" full disabled={busy}>
          {busy ? "Sending…" : "Send reset link"}
        </ActionButton>
      </form>
      <p className="mt-8 label-xs text-muted-foreground">
        <Link to="/auth/signin" className="link-rule">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
