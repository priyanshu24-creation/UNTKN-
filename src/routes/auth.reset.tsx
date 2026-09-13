import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { AuthShell, Field, FormError } from "@/components/auth/AuthShell";
import { ActionButton } from "@/components/ui/EditorialButton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/reset")({
  head: () => ({
    meta: [
      { title: "Set a New Password — UNTKN" },
      { name: "description", content: "Choose a new password for your UNTKN account." },
      { property: "og:title", content: "Set a New Password — UNTKN" },
      { property: "og:description", content: "Choose a new password for your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Both passwords must match.");
      return;
    }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(
        updateError.message.includes("session")
          ? "This reset link has expired. Request a new one."
          : updateError.message,
      );
      return;
    }
    navigate({ to: "/account" });
  }

  return (
    <AuthShell
      eyebrow="Account"
      title="New password"
      intro="Choose a new password to finish signing in."
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          showPasswordToggle
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Field
          label="Confirm password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          showPasswordToggle
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <FormError message={error} />
        <ActionButton type="submit" size="lg" full disabled={busy}>
          {busy ? "Saving…" : "Save password"}
        </ActionButton>
      </form>
    </AuthShell>
  );
}
