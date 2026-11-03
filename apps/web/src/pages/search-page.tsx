import { useSearchParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/async-state";
import { ProductGrid } from "../components/product-grid";
import { useResource } from "../hooks/use-resource";
import { searchProducts } from "../services/api";

const loadSearch = (query: string) => searchProducts(query);

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const { resource, retry } = useResource(query, loadSearch);

  return (
    <main className="shell main-content page-content">
      <div className="page-kicker">Search / {query || "Collection"}</div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">The collection, searched</span>
          <h1 className="page-title">{query ? <>Results for <em>“{query}”</em></> : "Search the collection"}</h1>
        </div>
        {resource.status === "success" && query && <span className="result-count">{resource.data.length} results</span>}
      </div>
      {!query && <EmptyState title="Start with a word" message="Use the search field above to find something by name, detail or category." />}
      {query && resource.status === "loading" && <LoadingState label="Searching the collection" />}
      {query && resource.status === "error" && <ErrorState message={resource.message} onRetry={retry} />}
      {query && resource.status === "success" && resource.data.length === 0 && (
        <EmptyState title="No matches this time" message="Try a shorter search or another product detail." />
      )}
      {query && resource.status === "success" && resource.data.length > 0 && (
        <ProductGrid products={resource.data} />
      )}
    </main>
  );
}