import { AlertCircle, LoaderCircle, RotateCw, SearchX } from "lucide-react";

export function LoadingState({ label = "Loading products" }: { label?: string }) {
  return (
    <div className="state-panel" role="status" aria-live="polite">
      <LoaderCircle className="state-icon is-spinning" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="state-panel" role="alert">
      <AlertCircle className="state-icon state-icon-error" aria-hidden="true" />
      <h2>We couldn’t load this view</h2>
      <p>{message}</p>
      <button className="button button-secondary" onClick={onRetry} type="button">
        <RotateCw size={16} aria-hidden="true" /> Try again
      </button>
    </div>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="state-panel">
      <SearchX className="state-icon" aria-hidden="true" />
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}