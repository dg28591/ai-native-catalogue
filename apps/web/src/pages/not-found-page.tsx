import { Link } from "react-router-dom";
import { EmptyState } from "../components/async-state";

export function NotFoundPage() {
  return (
    <main className="shell main-content page-content">
      <EmptyState title="This page is off the map" message="The page you’re looking for isn’t part of this collection." />
      <div className="not-found-link"><Link className="text-link" to="/">Return to the collection</Link></div>
    </main>
  );
}