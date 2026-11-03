import { ArrowRight, RotateCw, Search, ShoppingBag } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useResource } from "../hooks/use-resource";
import { getCategories } from "../services/api";

const loadCategories = () => getCategories();

export function SiteHeader() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { resource: categoriesResource, retry: retryCategories } = useResource(
    "header-categories",
    loadCategories,
  );

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    if (term) navigate(`/search?q=${encodeURIComponent(term)}`);
  }

  const categories = categoriesResource.status === "success" ? categoriesResource.data : [];

  return (
    <header className="site-header">
      <div className="header-main shell">
        <Link className="brand" to="/" aria-label="Fieldnotes home">
          <span className="brand-mark"><ShoppingBag size={18} aria-hidden="true" /></span>
          <span>fieldnotes<span className="brand-period">.</span></span>
        </Link>
        <form className="search-form" onSubmit={handleSearch} role="search">
          <Search size={18} aria-hidden="true" />
          <input
            aria-label="Search products"
            type="search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the collection"
            value={query}
          />
          <button aria-label="Submit search" type="submit"><ArrowRight size={17} /></button>
        </form>
        <Link className="header-all-link" to="/products">All products <ArrowRight size={15} /></Link>
      </div>
      <nav className="category-nav" aria-label="Product categories">
        <div className="shell category-nav-inner">
          <span className="nav-label">Browse by</span>
          <NavLink end to="/">Featured</NavLink>
          {categories.map((category) => (
            <NavLink key={category} to={`/category/${encodeURIComponent(category)}`}>
              {category}
            </NavLink>
          ))}
          {categoriesResource.status === "loading" && <span className="nav-loading">Loading categories</span>}
          {categoriesResource.status === "error" && (
            <span className="category-nav-error" role="alert">
              <span>Categories unavailable</span>
              <button
                aria-label="Retry category loading"
                className="category-nav-retry"
                onClick={retryCategories}
                type="button"
              >
                <RotateCw size={13} aria-hidden="true" /> Retry
              </button>
            </span>
          )}
        </div>
      </nav>
    </header>
  );
}