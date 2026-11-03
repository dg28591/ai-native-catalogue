import { ArrowDownRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/async-state";
import { ProductGrid } from "../components/product-grid";
import { useResource } from "../hooks/use-resource";
import { getFeaturedProducts } from "../services/api";

const loadFeatured = () => getFeaturedProducts();

export function HomePage() {
  const { resource, retry } = useResource("featured", loadFeatured);

  return (
    <>
      <section className="home-intro">
        <div className="shell intro-inner">
          <div className="intro-copy">
            <span className="eyebrow"><Sparkles size={14} aria-hidden="true" /> A considered collection</span>
            <h1>Good things,<br /><em>well found.</em></h1>
            <p>Everyday objects with a little more thought behind them. Browse the pieces people rate highest.</p>
            <a className="text-link" href="#featured">Explore the collection <ArrowDownRight size={16} /></a>
          </div>
          <div className="intro-stamp" aria-hidden="true">
            <span>THE</span><strong>GOOD<br />FIND</strong><span>NO. 001</span>
          </div>
          <div className="intro-note"><span>01 / 05</span><span>Selected by the people who use them</span></div>
        </div>
      </section>

      <main className="shell main-content" id="featured">
        <div className="section-heading">
          <div>
            <span className="eyebrow">The shortlist</span>
            <h2>Five worth knowing</h2>
          </div>
          <Link className="text-link" to="/products">Browse all <ArrowDownRight size={16} /></Link>
        </div>
        {resource.status === "loading" && <LoadingState label="Finding the top rated" />}
        {resource.status === "error" && <ErrorState message={resource.message} onRetry={retry} />}
        {resource.status === "success" && resource.data.length === 0 && (
          <EmptyState title="Nothing featured yet" message="There are no rated products to show right now." />
        )}
        {resource.status === "success" && resource.data.length > 0 && (
          <ProductGrid products={resource.data.slice(0, 5)} />
        )}
      </main>
    </>
  );
}