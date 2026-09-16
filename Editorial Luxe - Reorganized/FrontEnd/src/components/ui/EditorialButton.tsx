import { Link } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export const editorialButton = cva(
  "group relative inline-flex items-center justify-center gap-3 whitespace-nowrap font-sans uppercase transition-colors duration-300 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        solid: "bg-primary text-primary-foreground hover:bg-charcoal",
        outline: "border border-foreground text-foreground hover:bg-foreground hover:text-background",
        ghost: "text-foreground hover:text-muted-foreground",
        onImage:
          "border border-paper/70 text-paper backdrop-blur-[2px] hover:bg-paper hover:text-ink",
        signal: "bg-signal text-signal-foreground hover:bg-signal/90",
      },
      size: {
        sm: "h-9 px-4 text-[0.625rem] tracking-[0.22em]",
        md: "h-12 px-8 text-[0.6875rem] tracking-[0.24em]",
        lg: "h-14 px-10 text-xs tracking-[0.26em]",
        bare: "text-[0.6875rem] tracking-[0.24em]",
      },
      full: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "solid", size: "md", full: false },
  },
);

type Variants = VariantProps<typeof editorialButton>;

export function ActionButton({
  className,
  variant,
  size,
  full,
  children,
  ...props
}: ComponentProps<"button"> & Variants) {
  return (
    <button className={cn(editorialButton({ variant, size, full }), className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  className,
  variant,
  size,
  full,
  children,
  ...props
}: ComponentProps<typeof Link> & Variants & { children: ReactNode }) {
  return (
    <Link className={cn(editorialButton({ variant, size, full }), className)} {...props}>
      {children}
    </Link>
  );
}
