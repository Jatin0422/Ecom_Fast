import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  checkoutCustomerCart,
  fetchCustomerCart,
  fetchCustomerProduct,
  orderProductNow,
} from "../api/customerApi";
import "../styles/CustomerProducts.css";

function CustomerCheckout() {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const quantity = Math.max(1, Number(searchParams.get("quantity")) || 1);
  const [cartItems, setCartItems] = useState([]);
  const [product, setProduct] = useState(null);
  const [shippingAddress, setShippingAddress] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [orderError, setOrderError] = useState("");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const accessToken = sessionStorage.getItem("access_token");
    if (!accessToken) {
      navigate("/login?role=user", { replace: true });
      return undefined;
    }

    let isCurrent = true;
    const loadCheckout = productId
      ? fetchCustomerProduct(accessToken, productId).then((productData) => ({
          product: productData,
        }))
      : fetchCustomerCart(accessToken).then((items) => ({ items }));

    loadCheckout
      .then((data) => {
        if (!isCurrent) {
          return;
        }
        setProduct(data.product || null);
        setCartItems(data.items || []);
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
            : "Unable to load checkout details."
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
  }, [navigate, productId]);

  const total = product
    ? Number(product.price) * quantity
    : cartItems.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0
      );

  async function handlePlaceOrder(event) {
    event.preventDefault();
    const accessToken = sessionStorage.getItem("access_token");
    if (!accessToken) {
      navigate("/login?role=user", { replace: true });
      return;
    }

    setIsSubmitting(true);
    setOrderError("");
    try {
      const createdOrder = productId
        ? await orderProductNow(
            accessToken,
            productId,
            quantity,
            shippingAddress.trim()
          )
        : await checkoutCustomerCart(accessToken, shippingAddress.trim());
      setOrder(createdOrder);
    } catch (error) {
      if (error?.status === 401) {
        sessionStorage.removeItem("access_token");
        navigate("/login?role=user", { replace: true });
        return;
      }
      setOrderError(
        error instanceof Error ? error.message : "Unable to place your order."
      );
    } finally {
      setIsSubmitting(false);
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
        <Link
          className="customer-detail-back"
          to={productId ? `/products/${productId}` : "/cart"}
        >
          {productId ? "← Back to product" : "← Back to cart"}
        </Link>

        {order ? (
          <section className="customer-checkout-placeholder">
            <p className="customer-store-eyebrow">Order confirmed</p>
            <h1>Thank you for your order</h1>
            <p className="customer-checkout-note">
              Order #{order.id} has been placed with cash on delivery.
            </p>
            <div className="customer-checkout-summary">
              <span>Total due on delivery</span>
              <strong>₹{Number(order.total_amount).toFixed(2)}</strong>
            </div>
            <p className="customer-checkout-note">
              The seller will see your order in their seller workspace.
            </p>
            <Link className="customer-checkout-return" to="/customer">
              Continue browsing
            </Link>
            <Link className="customer-detail-back" to="/orders">
              View order history
            </Link>
          </section>
        ) : isLoading ? (
          <p className="customer-products-message" role="status">
            Loading checkout...
          </p>
        ) : loadError ? (
          <p className="customer-products-message customer-products-error" role="alert">
            {loadError}
          </p>
        ) : !productId && cartItems.length === 0 ? (
          <section className="customer-products-empty">
            <h2>Your cart is empty</h2>
            <p>Add some products before checking out.</p>
            <Link className="customer-checkout-return" to="/customer">
              Browse products
            </Link>
          </section>
        ) : (
          <section className="customer-checkout-placeholder">
            <p className="customer-store-eyebrow">Cash on delivery</p>
            <h1>Place your order</h1>
            <div className="customer-checkout-lines">
              {product ? (
                <div className="customer-checkout-summary">
                  <span>
                    {product.p_name} × {quantity}
                  </span>
                  <strong>
                    ₹{(Number(product.price) * quantity).toFixed(2)}
                  </strong>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    className="customer-checkout-summary"
                    key={item.product_id}
                  >
                    <span>
                      {item.product.p_name} × {item.quantity}
                    </span>
                    <strong>
                      ₹
                      {(
                        Number(item.product.price) * item.quantity
                      ).toFixed(2)}
                    </strong>
                  </div>
                ))
              )}
              <div className="customer-checkout-total">
                <span>Order total</span>
                <strong>₹{total.toFixed(2)}</strong>
              </div>
            </div>
            <form className="customer-checkout-form" onSubmit={handlePlaceOrder}>
              <label>
                Delivery address
                <textarea
                  value={shippingAddress}
                  onChange={(event) => setShippingAddress(event.target.value)}
                  minLength={1}
                  maxLength={500}
                  rows={3}
                  required
                  placeholder="Enter the full address for delivery"
                />
              </label>
              <fieldset className="customer-payment-method">
                <legend>Payment method</legend>
                <label>
                  <input type="radio" checked readOnly />
                  Cash on delivery
                </label>
              </fieldset>
              {orderError && (
                <p className="customer-product-cart-error" role="alert">
                  {orderError}
                </p>
              )}
              <button
                className="customer-product-buy-button"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Placing order..." : "Place order"}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

export default CustomerCheckout;
