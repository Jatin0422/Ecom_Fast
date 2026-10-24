import "../styles/SellerSections.css";

function SellerOrders() {
  return (
    <section className="seller-section">
      <p className="seller-section-eyebrow">FULFILLMENT</p>
      <h1>Orders</h1>
      <p className="seller-section-description">
        Review and manage orders placed for your products.
      </p>
      <div className="seller-empty-state">
        <span className="seller-empty-icon" aria-hidden="true">
          ↔
        </span>
        <h2>No orders to show</h2>
        <p>Orders will appear here when customers purchase your products.</p>
      </div>
    </section>
  );
}

export default SellerOrders;
