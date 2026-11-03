import { useState } from "react";
import { ArrowLeft, Star } from "lucide-react";
import { Mail } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/async-state";
import { EnquiryForm } from "../components/enquiry-form";
import { ProductImage } from "../components/product-image";
import { useResource } from "../hooks/use-resource";
import { getProductById } from "../services/api";

const loadProduct = (id: string) => getProductById(id);
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function ProductPage() {
  const { id = "" } = useParams();
  const { resource, retry } = useResource(id, loadProduct);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  if (resource.status === "loading") {
    return <main className="shell main-content page-content"><LoadingState label="Loading product details" /></main>;
  }
  if (resource.status === "error") {
    return <main className="shell main-content page-content"><ErrorState message={resource.message} onRetry={retry} /></main>;
  }
  if (!resource.data) {
    return <main className="shell main-content page-content"><EmptyState title="Product not found" message="This piece may have left the collection." /></main>;
  }

  const product = resource.data;

  return (
    <main className="shell main-content page-content">
      <Link className="back-link" to="/products"><ArrowLeft size={16} /> Back to the collection</Link>
      <article className="product-detail">
        <div className="detail-image-wrap"><ProductImage product={product} large /></div>
        <div className="detail-copy">
          <div className="page-kicker">Collection / {product.category}</div>
          <span className="eyebrow">A closer look</span>
          <h1>{product.title}</h1>
          <p className="detail-price">{currency.format(product.price)}</p>
          <div className="detail-rating"><Star size={17} fill="currentColor" aria-hidden="true" /><strong>{product.rating.rate.toFixed(1)}</strong><span>from {product.rating.count} reviews</span></div>
          <p className="detail-description">{product.description}</p>
          <div className="detail-rule" />
          <p className="detail-category-label">Filed under <Link to={`/category/${encodeURIComponent(product.category)}`}>{product.category}</Link></p>
          <button
            className="button button-primary detail-enquire-button"
            type="button"
            onClick={() => setIsEnquiryOpen(true)}
          >
            <Mail size={16} aria-hidden="true" /> Enquire about this product
          </button>
        </div>
      </article>
      {isEnquiryOpen && <EnquiryForm product={product} onClose={() => setIsEnquiryOpen(false)} />}
    </main>
  );
}