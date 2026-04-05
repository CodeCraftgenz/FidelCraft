import type { ReactNode } from 'react';

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-bg-dark to-slate-900 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
