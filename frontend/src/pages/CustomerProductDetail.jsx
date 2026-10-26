import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { addCustomerCartItem, fetchCustomerProduct } from "../api/customerApi";
import "../styles/CustomerProducts.css";

function CustomerProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError] = useState("");

  useEffect(() => {
    const accessToken = sessionStorage.getItem("access_token");
    if (!accessToken) {
      navigate("/login?role=user", { replace: true });
      return undefined;
    }

    let isCurrent = true;
    fetchCustomerProduct(accessToken, productId)
      .then((productData) => {
        if (isCurrent) {
          setProduct(productData);
          setImageUnavailable(!productData.image_url);
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
  }, [navigate, productId, retryCount]);

  async function handleAddToCart() {
    const accessToken = sessionStorage.getItem("access_token");
    if (!accessToken) {
      navigate("/login?role=user", { replace: true });
      return;
    }

    setIsAddingToCart(true);
    setCartMessage("");
    setCartError("");
    try {
      const result = await addCustomerCartItem(
        accessToken,
        product.id,
        Number(quantity)
      );
      setCartMessage(`Added to your cart. Cart quantity: ${result.quantity}.`);
    } catch (error) {
      if (error?.status === 401) {
        sessionStorage.removeItem("access_token");
        navigate("/login?role=user", { replace: true });
        return;
      }

      setCartError(
        error instanceof Error
          ? error.message
          : "Unable to add this product to your cart."
      );
    } finally {
      setIsAddingToCart(false);
    }
  }

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
        <Link className="customer-detail-back" to="/customer">
          ← Back to products
        </Link>

        {isLoading ? (
          <p className="customer-products-message" role="status">
            Loading product...
          </p>
        ) : loadError ? (
          <section
            className="customer-products-message customer-products-error"
            role="alert"
          >
            <p>{loadError}</p>
            <button
              className="customer-products-retry"
              type="button"
              onClick={() => {
                setIsLoading(true);
                setRetryCount((count) => count + 1);
              }}
            >
              Try again
            </button>
          </section>
        ) : product ? (
          <section className="customer-product-detail">
            <div className="customer-product-detail-image">
              {product.image_url && !imageUnavailable ? (
                <img
                  src={product.image_url}
                  alt={product.p_name}
                  onError={() => setImageUnavailable(true)}
                />
              ) : (
                <span className="customer-product-image-placeholder">
                  Image unavailable
                </span>
              )}
            </div>
            <div className="customer-product-detail-content">
              <p className="customer-product-category">{product.category}</p>
              <h1>{product.p_name}</h1>
              <div className="customer-product-detail-price">
                <strong>₹{Number(product.price).toFixed(2)}</strong>
                {product.mrp && Number(product.mrp) > Number(product.price) && (
                  <del>₹{Number(product.mrp).toFixed(2)}</del>
                )}
              </div>
              <p
                className={`customer-product-stock${product.stock > 0 ? "" : " out-of-stock"}`}
              >
                {product.stock > 0
                  ? `${product.stock} in stock`
                  : "Out of stock"}
              </p>
              <p className="customer-product-detail-description">
                {product.description || "No description has been provided."}
              </p>

              <label className="customer-product-quantity">
                Quantity
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  disabled={product.stock < 1}
                  onChange={(event) => {
                    const nextQuantity = Number(event.target.value);
                    setQuantity(
                      Math.min(product.stock, Math.max(1, nextQuantity || 1))
                    );
                  }}
                />
              </label>

              <div className="customer-product-actions">
                <button
                  className="customer-product-add-button"
                  type="button"
                  disabled={product.stock < 1 || isAddingToCart}
                  onClick={handleAddToCart}
                >
                  {isAddingToCart ? "Adding..." : "Add to cart"}
                </button>
                <button
                  className="customer-product-buy-button"
                  type="button"
                  disabled={product.stock < 1}
                  onClick={() =>
                    navigate(
                      `/checkout/${product.id}?quantity=${quantity}`
                    )
                  }
                >
                  Buy now
                </button>
              </div>
              {cartMessage && (
                <p className="customer-product-cart-message" role="status">
                  {cartMessage}
                </p>
              )}
              {cartError && (
                <p className="customer-product-cart-error" role="alert">
                  {cartError}
                </p>
              )}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

export default CustomerProductDetail;
