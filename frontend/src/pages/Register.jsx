
import { useState } from "react";
import "../styles/Register.css";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialRole = searchParams.get("role") === "seller" ? "seller" : "user";
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    city: "",
    state: "",
    address: "",
    store_name: "",
    role: initialRole,
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
    const registrationData = {
      ...formData,
      ...(formData.role === "seller" ? {} : { store_name: null }),
    };
    const response = await fetch(
      "http://127.0.0.1:8000/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        typeof data.detail === "string"
          ? data.detail
          : JSON.stringify(data.detail || "Registration failed");

      throw new Error(errorMessage);
    }

    navigate(`/login?role=${formData.role}`);
  } catch (error) {
    setMessage(
      error.message || "Unable to connect to the backend"
    );
  }
}

  return (
    <div className="register-page">
      <div className="register-card">
        <Link className="register-home-link" to="/">
          Back to home
        </Link>
        <h1>Create Account</h1>
        <p className="subtitle">
          Register for our e-commerce platform
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="role">Account Type</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            disabled
            required
          >
            <option value="seller">Seller</option>
            <option value="user">User</option>
          </select>

          <label htmlFor="full_name">Full Name</label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
          />

          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />

          <label htmlFor="city">City</label>
          <input
            id="city"
            name="city"
            type="text"
            value={formData.city}
            onChange={handleChange}
            placeholder="Enter your city"
            required
          />

          <label htmlFor="state">State</label>
          <input
            id="state"
            name="state"
            type="text"
            value={formData.state}
            onChange={handleChange}
            placeholder="Enter your state"
            required
          />

          <label htmlFor="address">Address</label>
          <input
            id="address"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter your address"
            autoComplete="street-address"
            required
          />

          {formData.role === "seller" && (
            <>
              <label htmlFor="store_name">Store Name</label>
              <input
                id="store_name"
                name="store_name"
                type="text"
                value={formData.store_name}
                onChange={handleChange}
                placeholder="Enter your store name"
                minLength={2}
                maxLength={150}
                required
              />
            </>
          )}

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a password"
            minLength={8}
            required
          />

          <button type="submit">Register</button>
        </form>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

export default Register;
