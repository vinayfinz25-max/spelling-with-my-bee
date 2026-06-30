export function LoadingView() {
  return (
    <main className="grid min-h-[70vh] place-items-center bg-background px-6 text-primary-text">
      <div className="flex items-center gap-3">
        <span className="size-3 animate-pulse rounded-full bg-primary-yellow" />
        <span className="text-sm font-semibold text-secondary-text">
          Loading
        </span>
      </div>
    </main>
  );
}
