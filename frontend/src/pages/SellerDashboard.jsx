import { useOutletContext } from "react-router-dom";
import "../styles/SellerDashboard.css";

const dashboardMetrics = [
  { label: "Total orders", value: "0", symbol: "O", tone: "blue" },
  { label: "Cancelled orders", value: "0", symbol: "C", tone: "red" },
  { label: "Returns", value: "0", symbol: "R", tone: "amber" },
  { label: "Sales", value: "$0.00", symbol: "$", tone: "green" },
];

function SellerDashboard() {
  const { storeName } = useOutletContext();

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
            <p className="seller-metric-note">Metrics will appear here</p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default SellerDashboard;
