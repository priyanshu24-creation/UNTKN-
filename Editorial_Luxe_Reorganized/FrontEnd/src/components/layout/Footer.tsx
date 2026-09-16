import { Link } from "@tanstack/react-router";

import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { useSiteConfig } from "@/components/ui/SiteConfigProvider";

export function Footer() {
  const config = useSiteConfig();
  const year = new Date().getFullYear();

  const columns: Array<{ heading: string; links: ReadonlyArray<{ label: string; to: string }> }> = [
    { heading: "Shop", links: config.nav.footer.shop },
    { heading: "Label", links: config.nav.footer.company },
    { heading: "Help", links: config.nav.footer.help },
  ];

  return (
    <footer className="hairline-t mt-24 bg-background md:mt-32">
      <div className="shell grid gap-14 py-16 md:grid-cols-12 md:py-24">
        <div className="md:col-span-5">
          <p className="font-display text-4xl tracking-[0.14em] md:text-5xl">
            {config.brand.wordmark}
          </p>
          <p className="body-lg mt-5 max-w-sm text-balance">{config.brand.shortDescription}</p>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {config.social.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="label-xs link-rule"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-10 md:col-span-4 md:grid-cols-3">
          {columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="label-xs text-muted-foreground">{column.heading}</h2>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm link-rule">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="md:col-span-3">
          <h2 className="label-xs text-muted-foreground">Studio List</h2>
          <p className="mt-5 text-sm text-muted-foreground">
            Short runs sell out. Subscribers hear first.
          </p>
          <NewsletterForm className="mt-5" source="footer" />
        </div>
      </div>

      <div className="hairline-t">
        <div className="shell flex flex-col gap-3 py-6 md:flex-row md:items-center md:justify-between">
          <p className="label-xs text-muted-foreground">
            © {year} {config.brand.name}. All rights reserved.
          </p>
          <p className="label-xs text-muted-foreground">
            {config.contact.email} · {config.commerce.country}
          </p>
        </div>
      </div>
    </footer>
  );
}
