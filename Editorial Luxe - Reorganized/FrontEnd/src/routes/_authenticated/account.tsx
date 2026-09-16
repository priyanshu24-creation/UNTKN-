import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";

import { useAuth } from "@/components/providers/AuthProvider";

const LINKS = [
  { label: "Overview", to: "/account" as const },
  { label: "Orders", to: "/account/orders" as const },
  { label: "Wishlist", to: "/account/wishlist" as const },
  { label: "Addresses", to: "/account/addresses" as const },
  { label: "Settings", to: "/account/settings" as const },
];

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Your Account — UNTKN" },
      { name: "description", content: "Manage your UNTKN orders, addresses, wishlist and details." },
      { property: "og:title", content: "Your Account — UNTKN" },
      { property: "og:description", content: "Manage your UNTKN orders and details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountLayout,
});

function AccountLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="shell pb-40 pt-28 md:pt-40">
      <header className="hairline-b pb-8">
        <p className="label-xs text-muted-foreground">Account</p>
        <h1 className="display-md mt-4">Your account</h1>
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-[200px_1fr] lg:gap-20">
        <nav aria-label="Account" className="lg:sticky lg:top-28 lg:self-start">
          <ul className="flex flex-wrap gap-x-6 gap-y-3 lg:flex-col lg:gap-3">
            {LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  activeOptions={{ exact: link.to === "/account" }}
                  activeProps={{ className: "text-foreground" }}
                  inactiveProps={{ className: "text-muted-foreground" }}
                  className="label-xs link-rule"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
                className="label-xs text-muted-foreground link-rule"
              >
                Sign out
              </button>
            </li>
          </ul>
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
