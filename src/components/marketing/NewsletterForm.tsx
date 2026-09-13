import { useMutation } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

import { subscribeNewsletter } from "@/lib/catalog.functions";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function NewsletterForm({
  className,
  source = "homepage",
  onImage = false,
}: {
  className?: string;
  source?: string;
  onImage?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (value: string) => subscribeNewsletter({ data: { email: value, source } }),
    onError: (e: Error) => setError(e.message || "Something went wrong. Try again."),
  });

  const status = mutation.data?.status;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError("Enter a valid email address.");
      return;
    }
    mutation.mutate(value);
  }

  if (status === "subscribed" || status === "already") {
    return (
      <p
        className={cn("label-xs", onImage ? "text-paper" : "text-foreground", className)}
        role="status"
      >
        {status === "subscribed" ? "You're on the list." : "You're already on the list."}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("w-full", className)} noValidate>
      <div
        className={cn(
          "flex items-center gap-3 border-b pb-2 transition-colors",
          onImage ? "border-paper/50 focus-within:border-paper" : "border-input focus-within:border-foreground",
        )}
      >
        <label htmlFor={`newsletter-${source}`} className="sr-only">
          Email address
        </label>
        <input
          id={`newsletter-${source}`}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error ? true : undefined}
          className={cn(
            "w-full bg-transparent font-sans text-sm outline-none placeholder:text-muted-foreground",
            onImage && "text-paper placeholder:text-paper/60",
          )}
        />
        <button
          type="submit"
          disabled={mutation.isPending}
          aria-label="Subscribe"
          className="shrink-0 transition-transform duration-300 hover:translate-x-1 disabled:opacity-40"
        >
          <ArrowRight className="size-4" />
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-signal" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
