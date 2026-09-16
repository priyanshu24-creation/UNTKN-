import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Field, FormError } from "@/components/auth/AuthShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { ActionButton } from "@/components/ui/EditorialButton";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, updateMyProfile } from "@backend/lib/account.functions";

export const Route = createFileRoute("/_authenticated/account/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const profile = useQuery({ queryKey: ["my-profile"], queryFn: () => getMyProfile() });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile.data) return;
    setFullName(profile.data.full_name ?? "");
    setPhone(profile.data.phone ?? "");
  }, [profile.data]);

  const save = useMutation({
    mutationFn: () =>
      updateMyProfile({ data: { full_name: fullName || null, phone: phone || null } }),
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (e: Error) => setError(e.message || "We couldn't save your details."),
  });

  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordNote, setPasswordNote] = useState<string | null>(null);

  async function sendPasswordReset() {
    if (!user?.email) return;
    setPasswordBusy(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setPasswordBusy(false);
    setPasswordNote(
      resetError ? resetError.message : "A password reset link is on its way to your inbox.",
    );
  }

  return (
    <div className="space-y-16">
      <section>
        <h2 className="display-sm hairline-b pb-4">Your details</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            setSaved(false);
            save.mutate();
          }}
          className="mt-8 max-w-md space-y-5"
          noValidate
        >
          <Field label="Email" value={user?.email ?? ""} readOnly disabled />
          <Field
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Field label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <FormError message={error} />
          {saved && <p className="text-sm text-muted-foreground">Saved.</p>}
          <ActionButton type="submit" size="md" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save changes"}
          </ActionButton>
        </form>
      </section>

      <section>
        <h2 className="display-sm hairline-b pb-4">Password</h2>
        <p className="mt-6 max-w-prose text-sm leading-relaxed text-muted-foreground">
          We&apos;ll email you a secure link to set a new password.
        </p>
        {passwordNote && <p className="mt-4 text-sm text-muted-foreground">{passwordNote}</p>}
        <ActionButton
          variant="outline"
          size="md"
          className="mt-6"
          onClick={sendPasswordReset}
          disabled={passwordBusy}
        >
          {passwordBusy ? "Sending…" : "Send reset link"}
        </ActionButton>
      </section>

      <section>
        <h2 className="display-sm hairline-b pb-4">Session</h2>
        <ActionButton
          variant="outline"
          size="md"
          className="mt-6"
          onClick={async () => {
            await signOut();
            navigate({ to: "/" });
          }}
        >
          Sign out
        </ActionButton>
      </section>
    </div>
  );
}
