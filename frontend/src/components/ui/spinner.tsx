import { cn } from '../../lib/cn';

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent', className)} />
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Spinner className="h-10 w-10" />
    </div>
  );
}
