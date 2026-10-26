import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SellerSections.css";

function SellerOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const accessToken = sessionStorage.getItem("access_token");
    if (!accessToken) {
      navigate("/login?role=seller", { replace: true });
      return undefined;
    }

    let isCurrent = true;
    fetch("http://127.0.0.1:8000/seller/orders", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          const message =
            typeof data.detail === "string"
              ? data.detail
              : JSON.stringify(data.detail || "Unable to load orders.");
          const requestError = new Error(message);
          requestError.status = response.status;
          throw requestError;
        }
        if (!Array.isArray(data)) {
          throw new Error("The server returned an invalid orders list.");
        }
        return data;
      })
      .then((data) => {
        if (isCurrent) {
          setOrders(data);
          setError("");
        }
      })
      .catch((requestError) => {
        if (!isCurrent) {
          return;
        }
        if (requestError?.status === 401) {
          sessionStorage.removeItem("access_token");
          navigate("/login?role=seller", { replace: true });
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
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
  }, [navigate, retryCount]);

  return (
    <section className="seller-section">
      <p className="seller-section-eyebrow">FULFILLMENT</p>
      <h1>Orders</h1>
      <p className="seller-section-description">
        Orders containing your products, with cash-on-delivery details.
      </p>

      {isLoading ? (
        <p className="seller-listings-status" role="status">
          Loading orders...
        </p>
      ) : error ? (
        <div className="seller-listings-error" role="alert">
          <span>{error}</span>
          <button
            className="seller-secondary-button"
            type="button"
            onClick={() => {
              setIsLoading(true);
              setRetryCount((count) => count + 1);
            }}
          >
            Try again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="seller-empty-state">
          <span className="seller-empty-icon" aria-hidden="true">
            ↔
          </span>
          <h2>No orders to show</h2>
          <p>Orders for your products will appear here.</p>
        </div>
      ) : (
        <div className="seller-orders-list">
          {orders.map((orderItem) => (
            <article
              className="seller-order-card"
              key={`${orderItem.order_id}-${orderItem.product_id}`}
            >
              <header className="seller-order-header">
                <div>
                  <p className="seller-order-id">Order #{orderItem.order_id}</p>
                  <p className="seller-order-date">
                    {new Date(orderItem.created_at).toLocaleString()}
                  </p>
                </div>
                <span className="seller-order-status">
                  {orderItem.order_status}
                </span>
              </header>
              <dl className="seller-order-details">
                <div>
                  <dt>Product</dt>
                  <dd>{orderItem.product_name}</dd>
                </div>
                <div>
                  <dt>Quantity</dt>
                  <dd>{orderItem.quantity}</dd>
                </div>
                <div>
                  <dt>Item total</dt>
                  <dd>₹{Number(orderItem.item_total).toFixed(2)}</dd>
                </div>
                <div>
                  <dt>Payment</dt>
                  <dd>
                    {orderItem.payment_method.toUpperCase()} (
                    {orderItem.payment_status})
                  </dd>
                </div>
                <div>
                  <dt>Customer</dt>
                  <dd>{orderItem.customer_name}</dd>
                </div>
                <div className="seller-order-address">
                  <dt>Delivery address</dt>
                  <dd>{orderItem.shipping_address}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default SellerOrders;
