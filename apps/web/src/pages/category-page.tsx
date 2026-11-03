import { useParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/async-state";
import { ProductGrid } from "../components/product-grid";
import { useResource } from "../hooks/use-resource";
import { getProductsByCategory } from "../services/api";

const loadCategory = (category: string) => getProductsByCategory(category);

export function CategoryPage() {
  const { category = "" } = useParams();
  const { resource, retry } = useResource(category, loadCategory);

  return (
    <main className="shell main-content page-content">
      <div className="page-kicker">Collection / {category}</div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">Curated by category</span>
          <h1 className="page-title">{category}</h1>
        </div>
        {resource.status === "success" && <span className="result-count">{resource.data.length} pieces</span>}
      </div>
      {resource.status === "loading" && <LoadingState label={`Loading ${category}`} />}
      {resource.status === "error" && <ErrorState message={resource.message} onRetry={retry} />}
      {resource.status === "success" && resource.data.length === 0 && (
        <EmptyState title="No pieces in this collection" message="Try another category or return to the featured collection." />
      )}
      {resource.status === "success" && resource.data.length > 0 && (
        <>
          <section className="catalogue-section" aria-labelledby="top-rated-heading">
            <div className="subsection-heading"><h2 id="top-rated-heading">Top rated</h2><span>THE FIRST FIVE</span></div>
            <ProductGrid products={resource.data.slice(0, 5)} />
          </section>
          {resource.data.length > 5 && (
            <section className="catalogue-section additional-section" aria-labelledby="additional-heading">
              <div className="subsection-heading"><h2 id="additional-heading">More to explore</h2><span>THE REST OF THE COLLECTION</span></div>
              <ProductGrid products={resource.data.slice(5)} />
            </section>
          )}
        </>
      )}
    </main>
  );
}