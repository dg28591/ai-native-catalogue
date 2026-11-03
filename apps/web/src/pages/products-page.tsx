import { EmptyState, ErrorState, LoadingState } from "../components/async-state";
import { ProductGrid } from "../components/product-grid";
import { useResource } from "../hooks/use-resource";
import { getProducts } from "../services/api";

const loadProducts = () => getProducts();

export function ProductsPage() {
  const { resource, retry } = useResource("all-products", loadProducts);

  return (
    <main className="shell main-content page-content">
      <div className="page-kicker">The complete collection</div>
      <div className="section-heading">
        <div><span className="eyebrow">Browse everything</span><h1 className="page-title">All products</h1></div>
        {resource.status === "success" && <span className="result-count">{resource.data.length} pieces</span>}
      </div>
      {resource.status === "loading" && <LoadingState label="Loading all products" />}
      {resource.status === "error" && <ErrorState message={resource.message} onRetry={retry} />}
      {resource.status === "success" && resource.data.length === 0 && (
        <EmptyState title="The collection is empty" message="There are no products to show right now." />
      )}
      {resource.status === "success" && resource.data.length > 0 && <ProductGrid products={resource.data} />}
    </main>
  );
}