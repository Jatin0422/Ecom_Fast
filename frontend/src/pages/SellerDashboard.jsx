import { useOutletContext } from "react-router-dom";
import "../styles/SellerDashboard.css";

function SellerDashboard() {
  const { storeName, dashboardSummary } = useOutletContext();
  const dashboardMetrics = [
    {
      label: "Total orders",
      value: dashboardSummary.total_orders,
      symbol: "O",
      tone: "blue",
    },
    {
      label: "Cancelled orders",
      value: dashboardSummary.cancelled_orders,
      symbol: "C",
      tone: "red",
    },
    {
      label: "Returns",
      value: dashboardSummary.returns,
      symbol: "R",
      tone: "amber",
    },
    {
      label: "Order value",
      value: `₹${Number(dashboardSummary.order_value).toFixed(2)}`,
      symbol: "₹",
      tone: "green",
    },
  ];

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
      </header>

      <section className="seller-dashboard-metrics" aria-label="Store overview">
        {dashboardMetrics.map((metric) => (
          <article className="seller-metric-card" key={metric.label}>
            <div
              className={`seller-metric-icon ${metric.tone}`}
              aria-hidden="true"
            >
              {metric.symbol}
            </div>
            <p className="seller-metric-label">{metric.label}</p>
            <p className="seller-metric-value">{metric.value}</p>
            <p className="seller-metric-note">
              {metric.label === "Returns"
                ? "Return tracking is not configured"
                : "Based on orders containing your products"}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default SellerDashboard;
