import type { ReactNode } from "react";
import { useRef, useState } from "react";

import { uploadAdminImage } from "@/backend/admin.functions";

export function AdminHeader({
  eyebrow,
  title,
  actions,
}: {
  eyebrow: string;
  title: string;
  actions?: ReactNode;
}) {
  return (
    <header className="hairline-b flex flex-wrap items-end justify-between gap-6 pb-6">
      <div>
        <p className="label-xs text-muted-foreground">{eyebrow}</p>
        <h2 className="display-sm mt-3">{title}</h2>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-4">{actions}</div>}
    </header>
  );
}

export function AdminPanel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="hairline p-6 md:p-8">
      {title && <h3 className="label-xs text-muted-foreground">{title}</h3>}
      <div className={title ? "mt-6" : undefined}>{children}</div>
    </section>
  );
}

export function TextField({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = props.id ?? props.name;
  return (
    <div>
      <label htmlFor={id} className="label-xs text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="mt-2 h-11 w-full border border-border bg-transparent px-3 font-sans text-sm outline-none transition-colors focus-visible:border-foreground"
      />
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextArea({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = props.id ?? props.name;
  return (
    <div>
      <label htmlFor={id} className="label-xs text-muted-foreground">
        {label}
      </label>
      <textarea
        id={id}
        rows={4}
        {...props}
        className="mt-2 w-full border border-border bg-transparent p-3 font-sans text-sm leading-relaxed outline-none transition-colors focus-visible:border-foreground"
      />
    </div>
  );
}

export function SelectField({
  label,
  children,
  ...props
}: { label: string; children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = props.id ?? props.name;
  return (
    <div>
      <label htmlFor={id} className="label-xs text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        {...props}
        className="mt-2 h-11 w-full border border-border bg-transparent px-3 font-sans text-sm outline-none transition-colors focus-visible:border-foreground"
      >
        {children}
      </select>
    </div>
  );
}

export function CheckField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = props.id ?? props.name;
  return (
    <label htmlFor={id} className="label-xs flex items-center gap-3 text-muted-foreground">
      <input
        id={id}
        type="checkbox"
        {...props}
        className="size-4 accent-foreground"
      />
      {label}
    </label>
  );
}

export function AdminButton({
  children,
  variant = "solid",
  ...props
}: { variant?: "solid" | "ghost" | "danger" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles =
    variant === "solid"
      ? "bg-foreground text-background hover:opacity-80"
      : variant === "danger"
        ? "border border-border text-signal hover:border-signal"
        : "border border-border text-foreground hover:border-foreground";
  return (
    <button
      type="button"
      {...props}
      className={`label-xs h-11 px-6 transition-all disabled:cursor-not-allowed disabled:opacity-40 ${styles}`}
    >
      {children}
    </button>
  );
}

export function StatusPill({ value }: { value: string }) {
  return (
    <span className="label-xs border border-border px-2 py-1 text-muted-foreground">{value}</span>
  );
}

export function AdminMessage({ tone, message }: { tone: "error" | "success"; message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="status"
      className={`text-sm ${tone === "error" ? "text-signal" : "text-muted-foreground"}`}
    >
      {message}
    </p>
  );
}

export function EmptyRow({ children }: { children: ReactNode }) {
  return <p className="py-10 text-sm text-muted-foreground">{children}</p>;
}

/** Reads a file in the browser, hands the bytes to the server, returns a stored URL. */
export function ImageUploadButton({
  bucket,
  onUploaded,
  label = "Upload image",
}: {
  bucket: "product-images" | "content-images";
  onUploaded: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setBusy(true);
          setError(null);
          try {
            const buffer = await file.arrayBuffer();
            let binary = "";
            const bytes = new Uint8Array(buffer);
            for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
            const result = await uploadAdminImage({
              data: {
                bucket,
                fileName: file.name,
                contentType: file.type || "image/jpeg",
                base64: btoa(binary),
              },
            });
            onUploaded(result.url);
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Upload failed.");
          } finally {
            setBusy(false);
          }
        }}
      />
      <AdminButton variant="ghost" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? "Uploading…" : label}
      </AdminButton>
      <AdminMessage tone="error" message={error} />
    </div>
  );
}
