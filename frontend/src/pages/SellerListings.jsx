import { useCallback, useEffect, useState } from "react";
import "../styles/SellerSections.css";

const productCategories = [
  "Electronics",
  "Clothing",
  "Home Decor",
  "Kitchen Appliances",
  "Accessories",
  "Footwear",
  "Beauty & Personal Care",
  "Books & Stationery",
  "Sports & Outdoors",
  "Toys & Games",
  "Groceries",
  "Pet Supplies",
  "Other",
];

function getAccessToken() {
  return sessionStorage.getItem("access_token");
}

function getErrorMessage(data, fallback) {
  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (data.detail) {
    return JSON.stringify(data.detail);
  }

  return fallback;
}

async function fetchSellerProducts(accessToken) {
  const response = await fetch("http://127.0.0.1:8000/seller/products", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Unable to load your products."));
  }

  if (!Array.isArray(data)) {
    throw new Error("The server returned an invalid products list.");
  }

  return data;
}

function SellerListings() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(() => Boolean(getAccessToken()));
  const [loadError, setLoadError] = useState(() =>
    getAccessToken() ? "" : "Your session has expired. Please log in again."
  );
  const [editingProductId, setEditingProductId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editMessage, setEditMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setLoadError("Your session has expired. Please log in again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError("");
    try {
      setProducts(await fetchSellerProducts(accessToken));
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to connect to the server."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      return undefined;
    }

    let isCurrent = true;
    fetchSellerProducts(accessToken)
      .then((data) => {
        if (isCurrent) {
          setProducts(data);
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to connect to the server."
          );
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  function startEditing(product) {
    setEditingProductId(product.id);
    setEditForm({
      p_name: product.p_name,
      category: product.category,
      description: product.description || "",
      image_url: product.image_url || "",
      price: String(product.price),
      mrp: String(product.mrp),
      stock: String(product.stock),
    });
    setEditMessage("");
  }

  function cancelEditing() {
    setEditingProductId(null);
    setEditForm(null);
    setEditMessage("");
  }

  function handleEditChange(event) {
    const { name, value } = event.target;
    setEditForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setEditMessage("");

    if (Number(editForm.mrp) < Number(editForm.price)) {
      setEditMessage("MRP must be greater than or equal to the selling price.");
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      setEditMessage("Your session has expired. Please log in again.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/seller/products/${editingProductId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ...editForm,
            price: Number(editForm.price),
            mrp: Number(editForm.mrp),
            stock: Number(editForm.stock),
            description: editForm.description || null,
            image_url: editForm.image_url || null,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Unable to update product."));
      }

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === data.id ? data : product
        )
      );
      cancelEditing();
    } catch (error) {
      setEditMessage(
        error instanceof Error
          ? error.message
          : "Unable to connect to the server."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="seller-section">
      <p className="seller-section-eyebrow">CATALOG</p>
      <h1>View Listings</h1>
      <p className="seller-section-description">
        View and manage the products currently listed in your store.
      </p>

      {isLoading && (
        <p className="seller-listings-status" role="status">
          Loading your products...
        </p>
      )}

      {!isLoading && loadError && (
        <div className="seller-listings-error" role="alert">
          <p>{loadError}</p>
          <button
            className="seller-secondary-button"
            type="button"
            onClick={loadProducts}
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !loadError && products.length === 0 && (
        <div className="seller-empty-state">
          <span className="seller-empty-icon" aria-hidden="true">
            □
          </span>
          <h2>No listings yet</h2>
          <p>Your published products will appear here.</p>
        </div>
      )}

      {!isLoading && !loadError && products.length > 0 && (
        <div className="seller-listings-grid">
          {products.map((product) => (
            <article className="seller-listing-card" key={product.id}>
              {product.image_url ? (
                <img
                  className="seller-listing-image"
                  src={product.image_url}
                  alt={product.p_name}
                  onError={(event) => {
                    event.currentTarget.hidden = true;
                  }}
                />
              ) : (
                <div className="seller-listing-image-placeholder">
                  No image
                </div>
              )}

              {editingProductId === product.id ? (
                <form className="seller-listing-edit-form" onSubmit={handleSave}>
                  <label>
                    Product name
                    <input
                      name="p_name"
                      value={editForm.p_name}
                      onChange={handleEditChange}
                      maxLength={1000}
                      required
                    />
                  </label>
                  <label>
                    Category
                    <select
                      name="category"
                      value={editForm.category}
                      onChange={handleEditChange}
                      required
                    >
                      {productCategories.map((category) => (
                        <option value={category} key={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="seller-listing-edit-wide">
                    Description
                    <textarea
                      name="description"
                      value={editForm.description}
                      onChange={handleEditChange}
                      maxLength={1000}
                      rows="3"
                    />
                  </label>
                  <label className="seller-listing-edit-wide">
                    Image URL
                    <input
                      name="image_url"
                      type="url"
                      value={editForm.image_url}
                      onChange={handleEditChange}
                      maxLength={2000}
                    />
                  </label>
                  <label>
                    Selling price
                    <input
                      name="price"
                      type="number"
                      value={editForm.price}
                      onChange={handleEditChange}
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </label>
                  <label>
                    MRP
                    <input
                      name="mrp"
                      type="number"
                      value={editForm.mrp}
                      onChange={handleEditChange}
                      min={editForm.price || "0.01"}
                      step="0.01"
                      required
                    />
                  </label>
                  <label>
                    Stock
                    <input
                      name="stock"
                      type="number"
                      value={editForm.stock}
                      onChange={handleEditChange}
                      min="0"
                      step="1"
                      required
                    />
                  </label>
                  {editMessage && (
                    <p className="seller-product-message seller-listing-edit-wide" role="alert">
                      {editMessage}
                    </p>
                  )}
                  <div className="seller-listing-edit-actions seller-listing-edit-wide">
                    <button
                      className="seller-secondary-button"
                      type="button"
                      onClick={cancelEditing}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button
                      className="seller-primary-button"
                      type="submit"
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="seller-listing-details">
                  <div className="seller-listing-heading">
                    <div>
                      <p className="seller-listing-category">{product.category}</p>
                      <h2>{product.p_name}</h2>
                    </div>
                    <button
                      className="seller-secondary-button"
                      type="button"
                      onClick={() => startEditing(product)}
                    >
                      Edit
                    </button>
                  </div>
                  <p className="seller-listing-description">
                    {product.description || "No description provided."}
                  </p>
                  <dl className="seller-listing-meta">
                    <div>
                      <dt>Price</dt>
                      <dd>{Number(product.price).toFixed(2)}</dd>
                    </div>
                    <div>
                      <dt>MRP</dt>
                      <dd>{Number(product.mrp).toFixed(2)}</dd>
                    </div>
                    <div>
                      <dt>Stock</dt>
                      <dd>{product.stock}</dd>
                    </div>
                    <div>
                      <dt>Product ID</dt>
                      <dd>{product.id}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default SellerListings;
