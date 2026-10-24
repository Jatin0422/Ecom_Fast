import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SellerDashboard.css";

const dashboardMetrics = [
  { label: "Total orders", value: "0", symbol: "O", tone: "blue" },
  { label: "Cancelled orders", value: "0", symbol: "C", tone: "red" },
  { label: "Returns", value: "0", symbol: "R", tone: "amber" },
  { label: "Sales", value: "$0.00", symbol: "$", tone: "green" },
];

function SellerDashboard() {
  const navigate = useNavigate();
  const [storeName, setStoreName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const accessToken = sessionStorage.getItem("access_token");
    if (!accessToken) {
      navigate("/login?role=seller", { replace: true });
      return;
    }

    async function verifySeller() {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/seller/dashboard",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          sessionStorage.removeItem("access_token");
          navigate("/login?role=seller", { replace: true });
          return;
        }

        const data = await response.json();
        setStoreName(data.store_name || "");
      } catch {
        setError("Unable to verify your seller account. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    verifySeller();
  }, [navigate]);

  function handleLogout() {
    sessionStorage.removeItem("access_token");
    navigate("/", { replace: true });
  }

  if (isLoading) {
    return (
      <main className="seller-dashboard-page">
        <p className="seller-dashboard-loading">Verifying seller account...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="seller-dashboard-page">
        <section className="seller-dashboard-error" role="alert">
          <p>{error}</p>
          <button
            className="seller-dashboard-logout"
            type="button"
            onClick={() => navigate("/login?role=seller", { replace: true })}
          >
            Return to login
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="seller-dashboard-page">
      <header className="seller-dashboard-header">
        <div>
          <p className="seller-dashboard-eyebrow">Seller workspace</p>
          <h1>{storeName || "Dashboard"}</h1>
          <p className="seller-dashboard-subtitle">
            Here is an overview of your store.
          </p>
        </div>
        <button
          className="seller-dashboard-logout"
          type="button"
          onClick={handleLogout}
        >
          Log out
        </button>
      </header>

      <section className="seller-dashboard-metrics" aria-label="Store overview">
        {dashboardMetrics.map((metric) => (
          <article className="seller-metric-card" key={metric.label}>
            <div className={`seller-metric-icon ${metric.tone}`} aria-hidden="true">
              {metric.symbol}
            </div>
            <p className="seller-metric-label">{metric.label}</p>
            <p className="seller-metric-value">{metric.value}</p>
            <p className="seller-metric-note">Metrics will appear here</p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default SellerDashboard;
