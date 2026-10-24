import "../styles/SellerSections.css";

function SellerListings() {
  return (
    <section className="seller-section">
      <p className="seller-section-eyebrow">CATALOG</p>
      <h1>View Listings</h1>
      <p className="seller-section-description">
        View and manage the products currently listed in your store.
      </p>
      <div className="seller-empty-state">
        <span className="seller-empty-icon" aria-hidden="true">
          □
        </span>
        <h2>No listings yet</h2>
        <p>Your published products will appear here.</p>
      </div>
    </section>
  );
}

export default SellerListings;
