import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CatalogueApp } from "./app";
import * as api from "./services/api";
import type { Product } from "./types/product";

const products: Product[] = Array.from({ length: 6 }, (_unused, index) => ({
  id: index + 1,
  title: `Sample piece ${index + 1}`,
  price: 20 + index,
  description: `A thoughtful object number ${index + 1}.`,
  category: "electronics",
  image: `https://fakestoreapi.com/img/${index + 1}.jpg`,
  rating: { rate: 5 - index * 0.4, count: 10 + index },
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CatalogueApp />
    </MemoryRouter>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("catalogue frontend", () => {
  it("shows exactly five featured products on the homepage", async () => {
    vi.spyOn(api, "getFeaturedProducts").mockResolvedValue(products.slice(0, 5));
    vi.spyOn(api, "getCategories").mockResolvedValue(["electronics"]);

    renderAt("/");

    expect(await screen.findAllByTestId("product-card")).toHaveLength(5);
  });

  it("shows top-rated category products before the additional products", async () => {
    vi.spyOn(api, "getProductsByCategory").mockResolvedValue(products);
    vi.spyOn(api, "getCategories").mockResolvedValue(["electronics"]);

    renderAt("/category/electronics");

    const topRated = await screen.findByRole("heading", { name: "Top rated" });
    const topRatedSection = topRated.closest("section");
    expect(topRatedSection).not.toBeNull();
    expect(within(topRatedSection as HTMLElement).getAllByTestId("product-card")).toHaveLength(5);
    const additional = screen.getByRole("heading", { name: "More to explore" });
    expect(within(additional.closest("section") as HTMLElement).getAllByTestId("product-card")).toHaveLength(1);
  });

  it("submits searches through the backend search service", async () => {
    const user = userEvent.setup();
    const searchRequest = vi.spyOn(api, "searchProducts").mockResolvedValue([products[1]]);
    vi.spyOn(api, "getCategories").mockResolvedValue(["electronics"]);

    renderAt("/search?q=Sample");

    expect(await screen.findByText("Sample piece 2")).toBeInTheDocument();
    const searchInput = screen.getByRole("searchbox", { name: "Search products" });
    await user.clear(searchInput);
    await user.type(searchInput, "object");
    await user.click(screen.getByRole("button", { name: "Submit search" }));

    await waitFor(() => expect(searchRequest).toHaveBeenLastCalledWith("object"));
  });

  it("renders product details from the backend API", async () => {
    vi.spyOn(api, "getProductById").mockResolvedValue(products[0]);
    vi.spyOn(api, "getCategories").mockResolvedValue(["electronics"]);

    renderAt("/product/1");

    expect(await screen.findByRole("heading", { name: "Sample piece 1" })).toBeInTheDocument();
    expect(screen.getByText("A thoughtful object number 1.")).toBeInTheDocument();
  });

  it("shows a retry action when a backend request fails", async () => {
    const featuredRequest = vi.spyOn(api, "getFeaturedProducts")
      .mockRejectedValueOnce(new Error("Service unavailable"))
      .mockResolvedValue(products.slice(0, 5));
    vi.spyOn(api, "getCategories").mockResolvedValue(["electronics"]);

    renderAt("/");

    expect(await screen.findByRole("alert")).toHaveTextContent("Service unavailable");
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findAllByTestId("product-card")).toHaveLength(5);
    expect(featuredRequest).toHaveBeenCalledTimes(2);
  });

  it("shows an empty state for a search with no matches", async () => {
    vi.spyOn(api, "searchProducts").mockResolvedValue([]);
    vi.spyOn(api, "getCategories").mockResolvedValue(["electronics"]);

    renderAt("/search?q=missing");

    expect(await screen.findByRole("heading", { name: "No matches this time" })).toBeInTheDocument();
  });

  it("shows a category navigation error and retries successfully", async () => {
    vi.spyOn(api, "getFeaturedProducts").mockResolvedValue(products.slice(0, 5));
    const categoriesRequest = vi.spyOn(api, "getCategories")
      .mockRejectedValueOnce(new Error("Categories service unavailable"))
      .mockResolvedValue(["electronics"]);

    renderAt("/");

    expect(await screen.findByText("Categories unavailable")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retry category loading" }));
    expect(await screen.findByRole("link", { name: "electronics" })).toBeInTheDocument();
    expect(categoriesRequest).toHaveBeenCalledTimes(2);
  });

  it("validates enquiry fields before posting", async () => {
    vi.spyOn(api, "getProductById").mockResolvedValue(products[0]);
    vi.spyOn(api, "getCategories").mockResolvedValue(["electronics"]);
    const submitRequest = vi.spyOn(api, "submitEnquiry");
    const user = userEvent.setup();

    renderAt("/product/1");
    await user.click(await screen.findByRole("button", { name: /enquire about this product/i }));
    await user.click(screen.getByRole("button", { name: "Send enquiry" }));

    expect(screen.getByText("Enter a name between 2 and 100 characters.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter a phone number with 7 to 15 digits.")).toBeInTheDocument();
    expect(screen.getByText("Enter a message between 10 and 2000 characters.")).toBeInTheDocument();
    expect(submitRequest).not.toHaveBeenCalled();
  });

  it("shows thank-you only after the enquiry API succeeds", async () => {
    vi.spyOn(api, "getProductById").mockResolvedValue(products[0]);
    vi.spyOn(api, "getCategories").mockResolvedValue(["electronics"]);
    let finishSubmission: ((response: { message: string }) => void) | undefined;
    const submitRequest = vi.spyOn(api, "submitEnquiry").mockImplementation(
      () => new Promise((resolve) => { finishSubmission = resolve; }),
    );
    const user = userEvent.setup();

    renderAt("/product/1");
    await user.click(await screen.findByRole("button", { name: /enquire about this product/i }));
    await user.type(screen.getByLabelText("Customer name"), "Jordan Customer");
    await user.type(screen.getByLabelText("Email"), "jordan@example.test");
    await user.type(screen.getByLabelText("Phone"), "+1 212 555 0100");
    await user.type(screen.getByLabelText("Message"), "Please tell me more about this item.");
    await user.click(screen.getByRole("button", { name: "Send enquiry" }));

    expect(submitRequest).toHaveBeenCalledWith({
      productId: products[0].id,
      customerName: "Jordan Customer",
      email: "jordan@example.test",
      phone: "+1 212 555 0100",
      message: "Please tell me more about this item.",
    });
    expect(screen.queryByText("Thank you, Jordan Customer.")).not.toBeInTheDocument();
    finishSubmission?.({ message: "Your enquiry was received." });

    expect(await screen.findByRole("status")).toHaveTextContent("Thank you, Jordan Customer.");
  });

  it("does not show thank-you when the enquiry API fails", async () => {
    vi.spyOn(api, "getProductById").mockResolvedValue(products[0]);
    vi.spyOn(api, "getCategories").mockResolvedValue(["electronics"]);
    vi.spyOn(api, "submitEnquiry").mockRejectedValue(new api.ApiError(502, "Mail service unavailable."));
    const user = userEvent.setup();

    renderAt("/product/1");
    await user.click(await screen.findByRole("button", { name: /enquire about this product/i }));
    await user.type(screen.getByLabelText("Customer name"), "Jordan Customer");
    await user.type(screen.getByLabelText("Email"), "jordan@example.test");
    await user.type(screen.getByLabelText("Phone"), "+1 212 555 0100");
    await user.type(screen.getByLabelText("Message"), "Please tell me more about this item.");
    await user.click(screen.getByRole("button", { name: "Send enquiry" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Mail service unavailable.");
    expect(screen.queryByText("Thank you, Jordan Customer.")).not.toBeInTheDocument();
  });

  it("displays field errors returned by the backend", async () => {
    vi.spyOn(api, "getProductById").mockResolvedValue(products[0]);
    vi.spyOn(api, "getCategories").mockResolvedValue(["electronics"]);
    vi.spyOn(api, "submitEnquiry").mockRejectedValue(
      new api.ApiError(400, "Please correct the highlighted fields.", {
        email: "Enter a valid email address.",
      }),
    );
    const user = userEvent.setup();

    renderAt("/product/1");
    await user.click(await screen.findByRole("button", { name: /enquire about this product/i }));
    await user.type(screen.getByLabelText("Customer name"), "Jordan Customer");
    await user.type(screen.getByLabelText("Email"), "jordan@example.test");
    await user.type(screen.getByLabelText("Phone"), "+1 212 555 0100");
    await user.type(screen.getByLabelText("Message"), "Please tell me more about this item.");
    await user.click(screen.getByRole("button", { name: "Send enquiry" }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Please correct the highlighted fields.");
    expect(screen.queryByText("Thank you, Jordan Customer.")).not.toBeInTheDocument();
  });
});