import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import "../styles/SellerLayout.css";

const navigationItems = [
  { label: "Dashboard", to: "/seller/dashboard", icon: "▦" },
  { label: "Product Listing", to: "/seller/products", icon: "+" },
  { label: "Orders", to: "/seller/orders", icon: "↔" },
  { label: "View Listings", to: "/seller/listings", icon: "□" },
];

function SellerLayout() {
  const navigate = useNavigate();
  const [storeName, setStoreName] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [status, setStatus] = useState(() =>
    sessionStorage.getItem("access_token") ? "loading" : "unauthorized"
  );

  useEffect(() => {
    const accessToken = sessionStorage.getItem("access_token");
    if (!accessToken) {
      return undefined;
    }

    let isCurrent = true;

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
          if (isCurrent) {
            setStatus("unauthorized");
          }
          return;
        }

        const data = await response.json();
        if (isCurrent) {
          setStoreName(data.store_name || "");
          setStatus("authorized");
        }
      } catch {
        if (isCurrent) {
          setStatus("error");
        }
      }
    }

    verifySeller();
    return () => {
      isCurrent = false;
    };
  }, [retryCount]);

  function handleLogout() {
    sessionStorage.removeItem("access_token");
    navigate("/", { replace: true });
  }

  if (status === "loading") {
    return (
      <main className="seller-layout-status">
        <p>Verifying seller account...</p>
      </main>
    );
  }

  if (status === "unauthorized") {
    return <Navigate to="/login?role=seller" replace />;
  }

  if (status === "error") {
    return (
      <main className="seller-layout-status" role="alert">
        <p>
          Could not verify your seller account. Check your connection and try
          again.
        </p>
        <button
          className="seller-layout-retry"
          type="button"
          onClick={() => {
            setStatus("loading");
            setRetryCount((currentCount) => currentCount + 1);
          }}
        >
          Retry
        </button>
      </main>
    );
  }

  return (
    <div className="seller-shell">
      <aside className="seller-sidebar">
        <div className="seller-brand">
          <span className="seller-brand-mark">M</span>
          <span>
            Market<span className="seller-brand-light">place</span>
          </span>
        </div>

        <p className="seller-sidebar-heading">SELLER MENU</p>
        <nav className="seller-navigation" aria-label="Seller navigation">
          {navigationItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                `seller-nav-link${isActive ? " active" : ""}`
              }
              end={item.end}
              key={item.to}
              to={item.to}
            >
              <span className="seller-nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="seller-sidebar-bottom">
          <div className="seller-account">
            <span className="seller-account-avatar">
              {(storeName || "S").slice(0, 1).toUpperCase()}
            </span>
            <span className="seller-account-name">
              <strong>{storeName || "Seller account"}</strong>
              <small>Seller</small>
            </span>
          </div>
        </div>
      </aside>

      <div className="seller-workspace">
        <header className="seller-topbar">
          <span className="seller-topbar-caption">Seller workspace</span>
          <div className="seller-topbar-actions">
            <span className="seller-topbar-store">{storeName || "My store"}</span>
            <button
              className="seller-topbar-logout"
              type="button"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </header>
        <div className="seller-content">
          <Outlet context={{ storeName }} />
        </div>
      </div>
    </div>
  );
}

export default SellerLayout;
