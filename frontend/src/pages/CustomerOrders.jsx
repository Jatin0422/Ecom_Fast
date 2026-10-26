import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  cancelCustomerOrder,
  fetchCustomerOrders,
} from "../api/customerApi";
import "../styles/CustomerProducts.css";

function CustomerOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const accessToken = sessionStorage.getItem("access_token");
    if (!accessToken) {
      navigate("/login?role=user", { replace: true });
      return undefined;
    }

    let isCurrent = true;
    fetchCustomerOrders(accessToken)
      .then((customerOrders) => {
        if (isCurrent) {
          setOrders(customerOrders);
          setError("");
        }
      })
      .catch((requestError) => {
        if (!isCurrent) {
          return;
        }
        if (requestError?.status === 401) {
          sessionStorage.removeItem("access_token");
          navigate("/login?role=user", { replace: true });
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load your orders."
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

  async function handleCancelOrder(orderId) {
    const accessToken = sessionStorage.getItem("access_token");
    if (!accessToken) {
      navigate("/login?role=user", { replace: true });
      return;
    }

    setBusyOrderId(orderId);
    setError("");
    try {
      const cancelledOrder = await cancelCustomerOrder(accessToken, orderId);
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === cancelledOrder.id ? cancelledOrder : order
        )
      );
    } catch (requestError) {
      if (requestError?.status === 401) {
        sessionStorage.removeItem("access_token");
        navigate("/login?role=user", { replace: true });
        return;
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to cancel this order."
      );
    } finally {
      setBusyOrderId(null);
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
          <Link className="customer-store-cart-link active" to="/orders">
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
          <p className="customer-store-eyebrow">Your purchases</p>
          <h1>Order history</h1>
          <p>Track the status of your orders and cancel pending orders.</p>
        </section>

        {isLoading ? (
          <p className="customer-products-message" role="status">
            Loading orders...
          </p>
        ) : error && orders.length === 0 ? (
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
        ) : orders.length === 0 ? (
          <section className="customer-products-empty">
            <h2>No orders yet</h2>
            <p>Your completed checkouts will appear here.</p>
            <Link className="customer-checkout-return" to="/customer">
              Browse products
            </Link>
          </section>
        ) : (
          <section className="customer-orders-list" aria-label="Your orders">
            {error && (
              <p className="customer-product-cart-error" role="alert">
                {error}
              </p>
            )}
            {orders.map((order) => (
              <article className="customer-order-card" key={order.id}>
                <header className="customer-order-header">
                  <div>
                    <h2>Order #{order.id}</h2>
                    <p>
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`customer-order-status ${order.status === "cancelled" ? "cancelled" : ""}`}
                  >
                    {order.status}
                  </span>
                </header>

                <div className="customer-order-items">
                  {order.items.map((item) => (
                    <div
                      className="customer-order-item"
                      key={`${order.id}-${item.product_id}`}
                    >
                      <span>
                        {item.product_name} × {item.quantity}
                      </span>
                      <strong>
                        ₹
                        {(
                          Number(item.unit_price) * item.quantity
                        ).toFixed(2)}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="customer-order-footer">
                  <div>
                    <p>
                      Cash on delivery · Payment {order.payment_status}
                    </p>
                    <strong>
                      Total ₹{Number(order.total_amount).toFixed(2)}
                    </strong>
                  </div>
                  {order.status === "pending" && (
                    <button
                      className="customer-order-cancel"
                      type="button"
                      disabled={busyOrderId === order.id}
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      {busyOrderId === order.id
                        ? "Cancelling..."
                        : "Cancel order"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default CustomerOrders;
