// project/src/components/ui/SectionCard.tsx
import React from "react";

type SectionCardProps = {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
};

export default function SectionCard({ title, description, className = "", children }: SectionCardProps) {
  return (
    <section
      className={[
        "rounded-2xl border border-white/10 bg-white/[0.03]",
        "p-4 sm:p-5 space-y-3",
        className,
      ].join(" ")}
    >
      <header className="space-y-1">
        <h3 className="text-white text-lg font-semibold">{title}</h3>
        {description ? <p className="text-slate-400 text-sm">{description}</p> : null}
      </header>
      <div className="space-y-3">
        {children}
      </div>
    </section>
  );
}
