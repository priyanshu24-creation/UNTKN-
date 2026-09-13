import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import {
  AdminButton,
  AdminHeader,
  AdminMessage,
  AdminPanel,
  EmptyRow,
  TextArea,
  TextField,
} from "@/components/admin/AdminUI";
import { listAdminContent, saveSiteSetting } from "@/lib/admin.functions";
import { siteConfig } from "@/config/site";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const fetchContent = useServerFn(listAdminContent);
  const save = useServerFn(saveSiteSetting);
  const query = useQuery({ queryKey: ["admin", "content"], queryFn: () => fetchContent() });

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("{}");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="space-y-12">
      <AdminHeader eyebrow="Studio" title="Settings" />
      <AdminMessage tone="error" message={error} />
      <AdminMessage tone="success" message={status} />

      <AdminPanel title="Brand">
        <dl className="grid gap-4 text-sm md:grid-cols-2">
          {[
            ["Name", siteConfig.brand.name],
            ["Tagline", siteConfig.brand.tagline],
            ["Currency", siteConfig.commerce.currency],
            ["Country", siteConfig.commerce.country],
            ["Support email", siteConfig.contact.email],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="label-xs text-muted-foreground">{label}</dt>
              <dd className="mt-2">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Brand identity, social links and contact details are held in one place in the project
          configuration so they stay consistent everywhere.
        </p>
      </AdminPanel>

      <AdminPanel title="Store settings">
        {query.isLoading ? (
          <p className="label-xs text-muted-foreground">Loading settings…</p>
        ) : (query.data?.settings ?? []).length === 0 ? (
          <EmptyRow>No stored settings yet.</EmptyRow>
        ) : (
          <ul className="space-y-8">
            {(query.data?.settings ?? []).map((setting: any) => (
              <SettingEditor
                key={setting.key}
                settingKey={setting.key}
                value={setting.value}
                onSave={async (value) => {
                  setError(null);
                  setStatus(null);
                  try {
                    await save({ data: { key: setting.key, value } });
                    setStatus(`Saved ${setting.key}.`);
                    await query.refetch();
                  } catch (cause) {
                    setError(cause instanceof Error ? cause.message : "Could not save.");
                  }
                }}
              />
            ))}
          </ul>
        )}
      </AdminPanel>

      <AdminPanel title="Add a setting">
        <div className="grid gap-6">
          <TextField
            label="Key"
            name="setting_key"
            value={newKey}
            onChange={(event) => setNewKey(event.target.value.trim())}
          />
          <TextArea
            label="Value (JSON)"
            name="setting_value"
            value={newValue}
            onChange={(event) => setNewValue(event.target.value)}
          />
          <div>
            <AdminButton
              disabled={newKey.length < 1}
              onClick={async () => {
                setError(null);
                setStatus(null);
                try {
                  await save({ data: { key: newKey, value: JSON.parse(newValue) } });
                  setNewKey("");
                  setNewValue("{}");
                  setStatus("Setting saved.");
                  await query.refetch();
                } catch (cause) {
                  setError(
                    cause instanceof Error ? cause.message : "That value is not valid JSON.",
                  );
                }
              }}
            >
              Save setting
            </AdminButton>
          </div>
        </div>
      </AdminPanel>
    </div>
  );
}

function SettingEditor({
  settingKey,
  value,
  onSave,
}: {
  settingKey: string;
  value: unknown;
  onSave: (value: unknown) => Promise<void>;
}) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [invalid, setInvalid] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <li className="hairline-t pt-6 first:border-t-0 first:pt-0">
      <TextArea
        label={settingKey}
        name={`setting-${settingKey}`}
        rows={Math.min(14, text.split("\n").length + 1)}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setInvalid(false);
        }}
      />
      <div className="mt-4 flex flex-wrap items-center gap-6">
        <AdminButton
          variant="ghost"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const parsed = JSON.parse(text);
              await onSave(parsed);
            } catch {
              setInvalid(true);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Saving…" : "Save"}
        </AdminButton>
        {invalid && <span className="text-sm text-signal">That is not valid JSON.</span>}
      </div>
    </li>
  );
}
