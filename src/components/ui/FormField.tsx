// project/src/components/ui/FormField.tsx
import React from "react";

type FormFieldProps = {
  label: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export default function FormField({ label, description, error, children, className = "" }: FormFieldProps) {
  return (
    <div className={["space-y-1.5", className].join(" ")}>
      <div className="text-slate-300 text-sm">{label}</div>
      {description ? <div className="text-slate-500 text-xs">{description}</div> : null}
      {children}
      {error ? <div className="text-rose-300 text-xs">{error}</div> : null}
    </div>
  );
}
