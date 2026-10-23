import "../styles/Home.css";
import { Link } from "react-router-dom";

function Home() {
  return (
    <main className="home-page">
      <section className="home-card">
        <p className="home-eyebrow">Welcome</p>
        <h1>Find your place in our marketplace</h1>
        <p className="home-description">
          Choose how you would like to continue.
        </p>

        <div className="home-actions">
          <Link className="home-button home-button-primary" to="/account?role=seller">
            Continue as Seller
          </Link>
          <Link className="home-button home-button-secondary" to="/account?role=user">
            Continue as User
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Home;
