import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import {
  AdminHeader,
  AdminMessage,
  AdminPanel,
  EmptyRow,
  StatusPill,
} from "@/components/admin/AdminUI";
import { deleteAdminReview, listAdminReviews, setReviewApproval } from "@backend/lib/admin.functions";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  component: AdminReviews,
});

function AdminReviews() {
  const fetchReviews = useServerFn(listAdminReviews);
  const setApproval = useServerFn(setReviewApproval);
  const removeReview = useServerFn(deleteAdminReview);
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({ queryKey: ["admin", "reviews"], queryFn: () => fetchReviews() });
  const reviews = (query.data ?? []) as any[];

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      await query.refetch();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this review.");
    }
  }

  return (
    <div className="space-y-12">
      <AdminHeader eyebrow="Community" title="Reviews" />
      <AdminMessage tone="error" message={error} />

      <AdminPanel title="Awaiting moderation and published">
        {query.isLoading ? (
          <p className="label-xs text-muted-foreground">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <EmptyRow>No reviews have been written yet.</EmptyRow>
        ) : (
          <ul className="divide-y divide-border">
            {reviews.map((review) => (
              <li key={review.id} className="py-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-sans text-sm">
                      {review.product_name} · {review.rating}/5
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {review.author} · {formatDate(review.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <StatusPill value={review.approved ? "published" : "hidden"} />
                    {review.verified_purchase && <StatusPill value="verified buyer" />}
                    <button
                      type="button"
                      className="label-xs link-rule text-muted-foreground"
                      onClick={() =>
                        run(() => setApproval({ data: { id: review.id, approved: !review.approved } }))
                      }
                    >
                      {review.approved ? "Hide" : "Publish"}
                    </button>
                    <button
                      type="button"
                      className="label-xs link-rule text-signal"
                      onClick={() => run(() => removeReview({ data: { id: review.id } }))}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {(review.title || review.body) && (
                  <div className="mt-4 max-w-2xl">
                    {review.title && <p className="font-sans text-sm">{review.title}</p>}
                    {review.body && (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {review.body}
                      </p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}
