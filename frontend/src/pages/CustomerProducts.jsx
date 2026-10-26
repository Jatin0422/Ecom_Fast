import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/CustomerProducts.css";

function getErrorMessage(data, fallback) {
  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (data.detail) {
    return JSON.stringify(data.detail);
  }

  return fallback;
}

async function fetchProducts(accessToken) {
  const response = await fetch("http://127.0.0.1:8000/customer/products", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      getErrorMessage(data, "Unable to load products.")
    );
    error.status = response.status;
    throw error;
  }

  if (!Array.isArray(data)) {
    throw new Error("The server returned an invalid products list.");
  }

  return data;
}

function ProductCard({ product }) {
  const [imageUnavailable, setImageUnavailable] = useState(!product.image_url);

  return (
    <Link
      className="customer-product-card customer-product-link"
      to={`/products/${product.id}`}
    >
      <div className="customer-product-image">
        {imageUnavailable ? (
          <span className="customer-product-image-placeholder">
            Image unavailable
          </span>
        ) : (
          <img
            src={product.image_url}
            alt={product.p_name}
            loading="lazy"
            onError={() => setImageUnavailable(true)}
          />
        )}
      </div>
      <div className="customer-product-details">
        <p className="customer-product-category">{product.category}</p>
        <h2>{product.p_name}</h2>
        {product.description && (
          <p className="customer-product-description">
            {product.description}
          </p>
        )}
        <div className="customer-product-price">
          <strong>₹{Number(product.price).toFixed(2)}</strong>
          {product.mrp && Number(product.mrp) > Number(product.price) && (
            <del>₹{Number(product.mrp).toFixed(2)}</del>
          )}
        </div>
        <p
          className={`customer-product-stock${product.stock > 0 ? "" : " out-of-stock"}`}
        >
          {product.stock > 0 ? "In stock" : "Out of stock"}
        </p>
        <span className="customer-product-view-link">View details →</span>
      </div>
    </Link>
  );
}

function CustomerProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(
    () => Boolean(sessionStorage.getItem("access_token"))
  );
  const [loadError, setLoadError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const accessToken = sessionStorage.getItem("access_token");
    if (!accessToken) {
      navigate("/login?role=user", { replace: true });
      return undefined;
    }

    let isCurrent = true;

    fetchProducts(accessToken)
      .then((productList) => {
        if (isCurrent) {
          setProducts(productList);
          setLoadError("");
        }
      })
      .catch((error) => {
        if (!isCurrent) {
          return;
        }

        if (error?.status === 401) {
          sessionStorage.removeItem("access_token");
          navigate("/login?role=user", { replace: true });
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to connect to the server."
        );
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [navigate, reloadCount]);

  function handleLogout() {
    sessionStorage.removeItem("access_token");
    navigate("/", { replace: true });
  }

  return (
    <div className="customer-store">
      <header className="customer-store-header">
        <Link className="customer-store-brand" to="/customer">
          Market
        </Link>
        <div className="customer-store-header-actions">
          <Link className="customer-store-cart-link" to="/cart">
            Cart
          </Link>
          <Link className="customer-store-cart-link" to="/orders">
            Orders
          </Link>
          <button
            className="customer-store-logout"
            type="button"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </header>

      <main className="customer-store-main">
        <section className="customer-store-intro">
          <p className="customer-store-eyebrow">Customer store</p>
          <h1>Discover products</h1>
          <p>
            Browse products available from our sellers.
          </p>
        </section>

        {isLoading ? (
          <p className="customer-products-message" role="status">
            Loading products...
          </p>
        ) : loadError ? (
          <section className="customer-products-message customer-products-error" role="alert">
            <p>{loadError}</p>
            <button
              className="customer-products-retry"
              type="button"
              onClick={() => {
                setIsLoading(true);
                setLoadError("");
                setReloadCount((count) => count + 1);
              }}
            >
              Try again
            </button>
          </section>
        ) : products.length === 0 ? (
          <section className="customer-products-empty" aria-label="Products">
            <div className="customer-products-empty-icon" aria-hidden="true">
              ◇
            </div>
            <h2>No products to show yet</h2>
            <p>Products will appear here when sellers add them.</p>
          </section>
        ) : (
          <section className="customer-products-grid" aria-label="Products">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default CustomerProducts;
