import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import {
  AdminButton,
  AdminHeader,
  AdminMessage,
  AdminPanel,
  CheckField,
  EmptyRow,
  ImageUploadButton,
  SelectField,
  TextArea,
  TextField,
} from "@/components/admin/AdminUI";
import {
  deleteLookbookItem,
  listAdminContent,
  saveHomepageSection,
  saveLookbookItem,
} from "@/backend/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/content")({
  component: AdminContent,
});

const SPANS = ["full", "half", "third", "tall"] as const;

function AdminContent() {
  const fetchContent = useServerFn(listAdminContent);
  const saveSection = useServerFn(saveHomepageSection);
  const saveLook = useServerFn(saveLookbookItem);
  const removeLook = useServerFn(deleteLookbookItem);

  const query = useQuery({ queryKey: ["admin", "content"], queryFn: () => fetchContent() });
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="space-y-12">
      <AdminHeader eyebrow="Storefront" title="Content" />
      <AdminMessage tone="error" message={error} />
      <AdminMessage tone="success" message={status} />

      {query.isLoading ? (
        <p className="label-xs text-muted-foreground">Loading content…</p>
      ) : (
        <>
          {(query.data?.sections ?? []).map((section: any) => (
            <SectionEditor
              key={section.id}
              section={section}
              onSave={async (payload) => {
                setError(null);
                setStatus(null);
                try {
                  await saveSection({ data: payload });
                  setStatus(`Saved ${section.section_key}.`);
                  await query.refetch();
                } catch (cause) {
                  setError(cause instanceof Error ? cause.message : "Could not save.");
                }
              }}
            />
          ))}

          <AdminPanel title="Lookbook">
            {(query.data?.lookbook ?? []).length === 0 ? (
              <EmptyRow>No lookbook imagery yet.</EmptyRow>
            ) : (
              <ul className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {(query.data?.lookbook ?? []).map((item: any) => (
                  <li key={item.id} className="space-y-3">
                    <div className="aspect-[3/4] overflow-hidden bg-muted">
                      <img
                        src={item.image_url}
                        alt={item.title ?? ""}
                        className="h-full w-full object-cover object-center"
                        loading="lazy"
                      />
                    </div>
                    <input
                      defaultValue={item.title ?? ""}
                      aria-label="Lookbook title"
                      className="w-full border-b border-transparent bg-transparent font-sans text-sm outline-none focus-visible:border-foreground"
                      onBlur={async (event) => {
                        await saveLook({
                          data: {
                            id: item.id,
                            title: event.target.value.trim() || null,
                            caption: item.caption ?? null,
                            image_url: item.image_url,
                            product_id: item.product_id ?? null,
                            span: item.span,
                            sort_order: item.sort_order,
                            active: item.active,
                          },
                        });
                        await query.refetch();
                      }}
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <SelectField
                        label="Span"
                        name={`span-${item.id}`}
                        defaultValue={item.span}
                        onChange={async (event) => {
                          await saveLook({
                            data: {
                              id: item.id,
                              title: item.title ?? null,
                              caption: item.caption ?? null,
                              image_url: item.image_url,
                              product_id: item.product_id ?? null,
                              span: event.target.value as (typeof SPANS)[number],
                              sort_order: item.sort_order,
                              active: item.active,
                            },
                          });
                          await query.refetch();
                        }}
                      >
                        {SPANS.map((span) => (
                          <option key={span} value={span}>
                            {span}
                          </option>
                        ))}
                      </SelectField>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        className="label-xs link-rule text-muted-foreground"
                        onClick={async () => {
                          await saveLook({
                            data: {
                              id: item.id,
                              title: item.title ?? null,
                              caption: item.caption ?? null,
                              image_url: item.image_url,
                              product_id: item.product_id ?? null,
                              span: item.span,
                              sort_order: item.sort_order,
                              active: !item.active,
                            },
                          });
                          await query.refetch();
                        }}
                      >
                        {item.active ? "Hide" : "Show"}
                      </button>
                      <button
                        type="button"
                        className="label-xs link-rule text-signal"
                        onClick={async () => {
                          await removeLook({ data: { id: item.id } });
                          await query.refetch();
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8">
              <ImageUploadButton
                bucket="content-images"
                label="Add lookbook image"
                onUploaded={async (url) => {
                  await saveLook({
                    data: {
                      title: null,
                      caption: null,
                      image_url: url,
                      product_id: null,
                      span: "half",
                      sort_order: (query.data?.lookbook ?? []).length,
                      active: true,
                    },
                  });
                  await query.refetch();
                }}
              />
            </div>
          </AdminPanel>
        </>
      )}
    </div>
  );
}

function SectionEditor({
  section,
  onSave,
}: {
  section: any;
  onSave: (payload: {
    id: string;
    eyebrow: string | null;
    title: string | null;
    subtitle: string | null;
    body: string | null;
    image_url: string | null;
    secondary_image_url: string | null;
    cta_label: string | null;
    cta_href: string | null;
    secondary_cta_label: string | null;
    secondary_cta_href: string | null;
    active: boolean;
  }) => Promise<void>;
}) {
  const [draft, setDraft] = useState({
    eyebrow: section.eyebrow ?? "",
    title: section.title ?? "",
    subtitle: section.subtitle ?? "",
    body: section.body ?? "",
    image_url: section.image_url ?? "",
    secondary_image_url: section.secondary_image_url ?? "",
    cta_label: section.cta_label ?? "",
    cta_href: section.cta_href ?? "",
    secondary_cta_label: section.secondary_cta_label ?? "",
    secondary_cta_href: section.secondary_cta_href ?? "",
    active: Boolean(section.active),
  });
  const [busy, setBusy] = useState(false);

  const nullable = (value: string) => (value.trim() === "" ? null : value.trim());
  const set = (key: keyof typeof draft, value: string | boolean) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <AdminPanel title={String(section.section_key).replace(/_/g, " ")}>
      <div className="grid gap-6 md:grid-cols-2">
        <TextField
          label="Eyebrow"
          name={`eyebrow-${section.id}`}
          value={draft.eyebrow}
          onChange={(event) => set("eyebrow", event.target.value)}
        />
        <TextField
          label="Title"
          name={`title-${section.id}`}
          value={draft.title}
          onChange={(event) => set("title", event.target.value)}
        />
        <TextField
          label="Subtitle"
          name={`subtitle-${section.id}`}
          value={draft.subtitle}
          onChange={(event) => set("subtitle", event.target.value)}
        />
        <div className="flex items-end">
          <CheckField
            label="Visible"
            name={`active-${section.id}`}
            checked={draft.active}
            onChange={(event) => set("active", event.target.checked)}
          />
        </div>
      </div>

      <div className="mt-6">
        <TextArea
          label="Body copy"
          name={`body-${section.id}`}
          value={draft.body}
          onChange={(event) => set("body", event.target.value)}
        />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <TextField
          label="Button label"
          name={`cta-${section.id}`}
          value={draft.cta_label}
          onChange={(event) => set("cta_label", event.target.value)}
        />
        <TextField
          label="Button link"
          name={`cta-href-${section.id}`}
          value={draft.cta_href}
          onChange={(event) => set("cta_href", event.target.value)}
        />
        <TextField
          label="Second button label"
          name={`cta2-${section.id}`}
          value={draft.secondary_cta_label}
          onChange={(event) => set("secondary_cta_label", event.target.value)}
        />
        <TextField
          label="Second button link"
          name={`cta2-href-${section.id}`}
          value={draft.secondary_cta_href}
          onChange={(event) => set("secondary_cta_href", event.target.value)}
        />
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        {(
          [
            ["image_url", "Primary image"],
            ["secondary_image_url", "Secondary image"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="space-y-4">
            <p className="label-xs text-muted-foreground">{label}</p>
            <div className="aspect-[4/5] max-w-56 overflow-hidden bg-muted">
              {draft[key] && (
                <img
                  src={draft[key]}
                  alt=""
                  className="h-full w-full object-cover object-center"
                  loading="lazy"
                />
              )}
            </div>
            <ImageUploadButton
              bucket="content-images"
              label={draft[key] ? "Replace" : "Upload"}
              onUploaded={(url) => set(key, url)}
            />
          </div>
        ))}
      </div>

      <div className="mt-8">
        <AdminButton
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onSave({
                id: section.id,
                eyebrow: nullable(draft.eyebrow),
                title: nullable(draft.title),
                subtitle: nullable(draft.subtitle),
                body: nullable(draft.body),
                image_url: nullable(draft.image_url),
                secondary_image_url: nullable(draft.secondary_image_url),
                cta_label: nullable(draft.cta_label),
                cta_href: nullable(draft.cta_href),
                secondary_cta_label: nullable(draft.secondary_cta_label),
                secondary_cta_href: nullable(draft.secondary_cta_href),
                active: draft.active,
              });
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Saving…" : "Save section"}
        </AdminButton>
      </div>
    </AdminPanel>
  );
}
