import type { ReactNode } from "react";

export function PolicyPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: { heading: string; body: ReactNode }[];
}) {
  return (
    <div className="shell pb-40 pt-28 md:pt-40">
      <header className="max-w-3xl">
        <p className="label-xs text-muted-foreground">{eyebrow}</p>
        <h1 className="display-lg mt-6">{title}</h1>
        <p className="mt-8 max-w-prose text-sm leading-relaxed text-muted-foreground">{intro}</p>
      </header>

      <div className="mt-20 max-w-2xl space-y-14">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="display-sm">{section.heading}</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
              {section.body}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
