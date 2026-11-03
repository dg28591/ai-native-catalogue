import { Route, Routes } from "react-router-dom";
import { SiteHeader } from "./components/site-header";
import { CategoryPage } from "./pages/category-page";
import { HomePage } from "./pages/home-page";
import { NotFoundPage } from "./pages/not-found-page";
import { ProductPage } from "./pages/product-page";
import { ProductsPage } from "./pages/products-page";
import { SearchPage } from "./pages/search-page";

export function CatalogueApp() {
  return (
    <div className="app-shell">
      <SiteHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/category/:category" element={<CategoryPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <footer className="site-footer">
        <div className="shell footer-inner"><span>fieldnotes<span className="brand-period">.</span></span><span>A catalogue for finding your next favourite.</span><span>© {new Date().getFullYear()}</span></div>
      </footer>
    </div>
  );
}