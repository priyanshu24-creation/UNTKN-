import type { ReactNode } from "react";
import { useState } from "react";

import { siteConfig } from "@/config/site";
import { Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Link } from "@tanstack/react-router";

import authVisual from "@/assets/products/IMG_6402.webp.asset.json";

export function AuthShell({
  eyebrow,
  title,
  intro,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Editorial visual panel */}
      <div className="relative hidden overflow-hidden bg-charcoal lg:block">
        <motion.img
          src={authVisual.url}
          alt={`${siteConfig.brand.name} campaign — oversized black tee`}
          className="absolute inset-0 h-full w-full object-cover"
          initial={reduceMotion ? false : { scale: 1.06, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="label-xs text-white/70"
          >
            {siteConfig.brand.name} — {siteConfig.brand.tagline}
          </motion.p>
          <motion.blockquote
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="max-w-md"
          >
            <p className="font-display text-4xl leading-tight text-white">
              Wear your story.
            </p>
            <footer className="label-xs mt-6 text-white/60">
              More than just a t-shirt
            </footer>
          </motion.blockquote>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-24 sm:px-12 lg:py-32">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          <Link to="/" className="label-xs text-muted-foreground link-rule">
            ← Back to store
          </Link>
          <p className="label-xs mt-10 text-muted-foreground">{eyebrow}</p>
          <h1 className="display-md mt-4">{title}</h1>
          {intro && (
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{intro}</p>
          )}
          <div className="mt-10">{children}</div>
          {footer && (
            <div className="mt-8 hairline-t pt-6 label-xs text-muted-foreground">
              {footer}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export function Field({
  label,
  showPasswordToggle,
  ...props
}: {
  label: string;
  showPasswordToggle?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = props.id ?? props.name;
  const isPassword = props.type === "password";
  const [visible, setVisible] = useState(false);
  const inputType = isPassword && showPasswordToggle && visible ? "text" : props.type;

  return (
    <div>
      <label htmlFor={id} className="label-xs text-muted-foreground">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          {...props}
          type={inputType}
          className="h-12 w-full border border-border bg-transparent px-4 pr-12 font-sans text-sm outline-none transition-colors focus-visible:border-foreground"
        />
        {isPassword && showPasswordToggle && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground"
          >
            <AnimatePresence mode="wait" initial={false}>
              {visible ? (
                <motion.span
                  key="eye"
                  initial={{ opacity: 0, scale: 0.8, rotate: -15 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: 15 }}
                  transition={{ duration: 0.15 }}
                >
                  <Eye className="h-4 w-4" strokeWidth={1.5} />
                </motion.span>
              ) : (
                <motion.span
                  key="eye-off"
                  initial={{ opacity: 0, scale: 0.8, rotate: 15 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: -15 }}
                  transition={{ duration: 0.15 }}
                >
                  <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )}
      </div>
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-signal">
      {message}
    </p>
  );
}
