// project/src/components/ui/Input.tsx
import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label?: React.ReactNode;
};

export default function Input({ error, label, className = "", ...rest }: InputProps) {
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-slate-300 text-sm">{label}</span> : null}
      <input
        {...rest}
        className={[
          "w-full px-4 py-3 rounded-xl",
          "bg-white/5 border border-white/10",
          "text-white placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-accent/40",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          className,
        ].join(" ")}
      />
      {error ? <span className="text-rose-300 text-xs">{error}</span> : null}
    </label>
  );
}