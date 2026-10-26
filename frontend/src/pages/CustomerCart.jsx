import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchCustomerCart,
  removeCustomerCartItem,
  updateCustomerCartItem,
} from "../api/customerApi";
import "../styles/CustomerProducts.css";

function CustomerCart() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyProductId, setBusyProductId] = useState(null);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const accessToken = sessionStorage.getItem("access_token");
    if (!accessToken) {
      navigate("/login?role=user", { replace: true });
      return undefined;
    }

    let isCurrent = true;
    fetchCustomerCart(accessToken)
      .then((cartItems) => {
        if (isCurrent) {
          setItems(cartItems);
          setError("");
        }
      })
      .catch((loadError) => {
        if (!isCurrent) {
          return;
        }
        if (loadError?.status === 401) {
          sessionStorage.removeItem("access_token");
          navigate("/login?role=user", { replace: true });
          return;
        }
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load your cart."
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
  }, [navigate, retryCount]);

  async function changeQuantity(productId, quantity) {
    const accessToken = sessionStorage.getItem("access_token");
    if (!accessToken) {
      navigate("/login?role=user", { replace: true });
      return;
    }
    setBusyProductId(productId);
    setError("");
    try {
      const updatedItem = await updateCustomerCartItem(
        accessToken,
        productId,
        quantity
      );
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.product_id === productId ? updatedItem : item
        )
      );
    } catch (updateError) {
      if (updateError?.status === 401) {
        sessionStorage.removeItem("access_token");
        navigate("/login?role=user", { replace: true });
        return;
      }
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update this cart item."
      );
    } finally {
      setBusyProductId(null);
    }
  }

  async function removeItem(productId) {
    const accessToken = sessionStorage.getItem("access_token");
    if (!accessToken) {
      navigate("/login?role=user", { replace: true });
      return;
    }
    setBusyProductId(productId);
    setError("");
    try {
      await removeCustomerCartItem(accessToken, productId);
      setItems((currentItems) =>
        currentItems.filter((item) => item.product_id !== productId)
      );
    } catch (removeError) {
      if (removeError?.status === 401) {
        sessionStorage.removeItem("access_token");
        navigate("/login?role=user", { replace: true });
        return;
      }
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Unable to remove this cart item."
      );
    } finally {
      setBusyProductId(null);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("access_token");
    navigate("/", { replace: true });
  }

  const total = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  return (
    <div className="customer-store">
      <header className="customer-store-header">
        <Link className="customer-store-brand" to="/customer">
          Market
        </Link>
        <div className="customer-store-header-actions">
          <Link className="customer-store-cart-link active" to="/cart">
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
          <p className="customer-store-eyebrow">Your basket</p>
          <h1>Shopping cart</h1>
          <p>Review quantities before placing your cash-on-delivery order.</p>
        </section>

        {isLoading ? (
          <p className="customer-products-message" role="status">
            Loading cart...
          </p>
        ) : error && items.length === 0 ? (
          <section
            className="customer-products-message customer-products-error"
            role="alert"
          >
            <p>{error}</p>
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
        ) : items.length === 0 ? (
          <section className="customer-products-empty">
            <h2>Your cart is empty</h2>
            <p>Products you add will show up here.</p>
            <Link className="customer-checkout-return" to="/customer">
              Browse products
            </Link>
          </section>
        ) : (
          <div className="customer-cart-layout">
            <section className="customer-cart-items" aria-label="Cart items">
              {items.map((item) => (
                <article className="customer-cart-item" key={item.product_id}>
                  <Link
                    className="customer-cart-item-image"
                    to={`/products/${item.product_id}`}
                  >
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.p_name}
                      />
                    ) : (
                      <span>Image unavailable</span>
                    )}
                  </Link>
                  <div className="customer-cart-item-details">
                    <p className="customer-product-category">
                      {item.product.category}
                    </p>
                    <Link
                      className="customer-cart-item-name"
                      to={`/products/${item.product_id}`}
                    >
                      {item.product.p_name}
                    </Link>
                    <p className="customer-cart-item-price">
                      ₹{Number(item.product.price).toFixed(2)} each
                    </p>
                    <div className="customer-cart-item-actions">
                      <div className="customer-cart-quantity">
                        <span>Qty</span>
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${item.product.p_name}`}
                          disabled={
                            busyProductId === item.product_id ||
                            item.quantity <= 1
                          }
                          onClick={() =>
                            changeQuantity(item.product_id, item.quantity - 1)
                          }
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${item.product.p_name}`}
                          disabled={
                            busyProductId === item.product_id ||
                            item.quantity >= item.product.stock
                          }
                          onClick={() =>
                            changeQuantity(item.product_id, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="customer-cart-remove"
                        type="button"
                        disabled={busyProductId === item.product_id}
                        onClick={() => removeItem(item.product_id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <strong className="customer-cart-item-subtotal">
                    ₹
                    {(Number(item.product.price) * item.quantity).toFixed(2)}
                  </strong>
                </article>
              ))}
              {error && (
                <p className="customer-product-cart-error" role="alert">
                  {error}
                </p>
              )}
            </section>

            <aside className="customer-cart-summary">
              <p className="customer-store-eyebrow">Summary</p>
              <h2>Order total</h2>
              <p className="customer-cart-total">₹{total.toFixed(2)}</p>
              <p className="customer-checkout-note">
                Pay this amount in cash when your order is delivered.
              </p>
              <Link className="customer-checkout-return" to="/checkout">
                Continue to checkout
              </Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default CustomerCart;
