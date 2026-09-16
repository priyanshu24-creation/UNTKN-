import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { useAuth } from "@/components/providers/AuthProvider";
import { getMyAdminAccess } from "@backend/lib/admin.functions";

const LINKS = [
  { label: "Overview", to: "/admin" as const, exact: true },
  { label: "Products", to: "/admin/products" as const },
  { label: "Orders", to: "/admin/orders" as const },
  { label: "Customers", to: "/admin/customers" as const },
  { label: "Categories", to: "/admin/categories" as const },
  { label: "Coupons", to: "/admin/coupons" as const },
  { label: "Reviews", to: "/admin/reviews" as const },
  { label: "Newsletter", to: "/admin/newsletter" as const },
  { label: "Content", to: "/admin/content" as const },
  { label: "Activity", to: "/admin/activity" as const },
  { label: "Settings", to: "/admin/settings" as const },
];

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Studio — UNTKN" },
      { name: "description", content: "UNTKN internal studio." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const access = useServerFn(getMyAdminAccess);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "access"],
    queryFn: () => access(),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="shell py-40">
        <p className="label-xs text-muted-foreground">Checking access…</p>
      </div>
    );
  }

  if (error || !data?.isAdmin) {
    return (
      <div className="shell py-40">
        <p className="label-xs text-muted-foreground">Studio</p>
        <h1 className="display-md mt-4">Not authorised</h1>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
          This area is limited to team accounts. If you should have access, ask an administrator to
          grant your account the admin role.
        </p>
        <Link to="/" className="label-xs link-rule mt-10 inline-block">
          Back to store
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[240px_1fr]">
      {/* Studio rail */}
      <aside className="hairline-b flex flex-col justify-between bg-charcoal px-6 py-8 text-background lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:px-8 lg:py-10">
        <div>
          <Link to="/admin" className="block">
            <p className="font-display text-2xl tracking-[0.35em] text-background">
              UNTKN
            </p>
            <p className="label-xs mt-2 text-background/50">Studio</p>
          </Link>

          <nav aria-label="Studio" className="mt-10 lg:mt-14">
            <ul className="flex flex-wrap gap-x-5 gap-y-3 lg:flex-col lg:gap-1">
              {LINKS.map((link, i) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    activeOptions={{ exact: link.exact ?? false }}
                    className="group flex items-baseline gap-3 py-1.5"
                    activeProps={{ "data-active": true }}
                  >
                    <span className="w-6 font-sans text-[10px] tracking-widest text-background/35">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="label-xs text-background/55 transition-colors duration-200 group-hover:text-background group-data-[active]:text-background">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex items-center gap-6 lg:mt-0 lg:flex-col lg:items-start lg:gap-4">
          <Link
            to="/"
            className="label-xs text-background/50 transition-colors hover:text-background"
          >
            ← View store
          </Link>
          <button
            type="button"
            className="label-xs text-background/50 transition-colors hover:text-background"
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="min-w-0 px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
        <Outlet />
      </div>
    </div>
  );
}
