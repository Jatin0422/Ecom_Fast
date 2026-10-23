import "../styles/AccountChoice.css";
import { Link, useSearchParams } from "react-router-dom";

function AccountChoice() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") === "seller" ? "seller" : "user";

  return (
    <main className="account-choice-page">
      <section className="account-choice-card">
        <Link className="account-choice-home-link" to="/">
          Back to home
        </Link>
        <p className="account-choice-eyebrow">
          {role === "seller" ? "Seller account" : "User account"}
        </p>
        <h1>How would you like to continue?</h1>
        <p className="account-choice-description">
          Sign up to create a new account, or log in to an existing one.
        </p>

        <div className="account-choice-actions">
          <Link
            className="account-choice-button account-choice-button-primary"
            to={`/register?role=${role}`}
          >
            Sign up
          </Link>
          <Link
            className="account-choice-button account-choice-button-secondary"
            to={`/login?role=${role}`}
          >
            Log in
          </Link>
        </div>
      </section>
    </main>
  );
}

export default AccountChoice;
