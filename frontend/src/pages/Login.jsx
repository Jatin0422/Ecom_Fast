import { useState } from "react";
import "../styles/Login.css";
import { Link, useSearchParams } from "react-router-dom";

function Login() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") === "seller" ? "seller" : "user";
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail || "Login failed");
        throw new Error(errorMessage);
      }

      sessionStorage.setItem("access_token", data.access_token);
      setMessage("Login successful.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to connect to the backend"
      );
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <Link className="login-home-link" to={`/account?role=${role}`}>
          Back
        </Link>
        <p className="login-eyebrow">
          {role === "seller" ? "Seller account" : "User account"}
        </p>
        <h1>Log in</h1>
        <p className="login-description">
          Enter the email and password associated with your account.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            autoComplete="email"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            autoComplete="current-password"
            minLength={8}
            maxLength={16}
            required
          />

          <button type="submit">Log in</button>
        </form>

        {message && (
          <p className="login-message" role="status">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}

export default Login;
