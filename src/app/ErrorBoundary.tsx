import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Application recovered from an unexpected error.", {
      error,
      errorInfo
    });
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-background px-6 py-10 text-primary-text">
          <section className="mx-auto flex max-w-md flex-col gap-4 rounded-lg border border-border bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-accent">
              Recovery
            </p>
            <h1 className="text-2xl font-bold">Let&apos;s reload the hive.</h1>
            <p className="text-secondary-text">
              Something unexpected happened, but your browser is still safe.
            </p>
            <button
              className="rounded-lg bg-primary-yellow px-4 py-3 font-semibold text-primary-text transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-blue-accent focus:ring-offset-2"
              type="button"
              onClick={() => {
                window.location.reload();
              }}
            >
              Reload
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
