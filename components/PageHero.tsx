import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  titleAccent?: string;
  subtitle?: ReactNode;
  children?: ReactNode;
  compact?: boolean;
}

export function PageHero({
  eyebrow,
  title,
  titleAccent,
  subtitle,
  children,
  compact = false,
}: PageHeroProps) {
  return (
    <section className={cn("sta-hero -mx-4 sm:-mx-6", compact ? "py-10" : "py-14 md:py-16")}>
      <div className="sta-hero-ripples" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            {eyebrow && (
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-white/80 md:text-base">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-2 font-sans text-3xl font-bold uppercase leading-tight tracking-wide md:text-4xl lg:text-5xl">
              {title}
              {titleAccent && (
                <>
                  <br />
                  <span className="text-4xl md:text-5xl lg:text-6xl">{titleAccent}</span>
                </>
              )}
            </h1>
            {subtitle && (
              <p className="mt-4 max-w-md text-base text-white/85 md:text-lg">{subtitle}</p>
            )}
          </div>

          {children && (
            <div className="sta-panel w-full max-w-md shrink-0 p-6 md:p-8">
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
