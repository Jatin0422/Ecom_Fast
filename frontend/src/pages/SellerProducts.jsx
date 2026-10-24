import { useState } from "react";
import "../styles/SellerSections.css";

const productCategories = [
  "Electronics",
  "Clothing",
  "Home Decor",
  "Kitchen Appliances",
  "Accessories",
  "Footwear",
  "Beauty & Personal Care",
  "Books & Stationery",
  "Sports & Outdoors",
  "Toys & Games",
  "Groceries",
  "Pet Supplies",
  "Other",
];

const initialFormData = {
  p_name: "",
  category: "",
  description: "",
  image_url: "",
  price: "",
  mrp: "",
  stock: "0",
};

function SellerProducts() {
  const [formData, setFormData] = useState(initialFormData);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (Number(formData.mrp) < Number(formData.price)) {
      setMessage("MRP must be greater than or equal to the selling price.");
      return;
    }

    const accessToken = sessionStorage.getItem("access_token");
    if (!accessToken) {
      setMessage("Your session has expired. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/seller/productlisting",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ...formData,
            price: Number(formData.price),
            mrp: Number(formData.mrp),
            stock: Number(formData.stock),
            description: formData.description || null,
            image_url: formData.image_url || null,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail || "Unable to create product.");
        throw new Error(errorMessage);
      }

      setMessage(`Product "${data.p_name}" was created successfully.`);
      setFormData(initialFormData);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to connect to the server."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="seller-section">
      <p className="seller-section-eyebrow">CATALOG</p>
      <h1>Product Listing</h1>
      <p className="seller-section-description">
        Add product details to prepare a listing for your store.
      </p>

      <form className="seller-product-form" onSubmit={handleSubmit}>
        <label>
          Product name
          <input
            name="p_name"
            type="text"
            value={formData.p_name}
            onChange={handleChange}
            placeholder="e.g. Everyday cotton shirt"
            maxLength={1000}
            required
          />
        </label>
        <label>
          Category
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="" disabled>
              Select a category
            </option>
            {productCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="seller-form-wide">
          Description
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your product"
            rows="4"
            maxLength={1000}
          />
        </label>
        <label className="seller-form-wide">
          Product image URL
          <input
            name="image_url"
            type="url"
            value={formData.image_url}
            onChange={handleChange}
            placeholder="https://example.com/product-image.jpg"
            maxLength={2000}
          />
        </label>
        {formData.image_url && (
          <div className="seller-image-preview seller-form-wide">
            <span>Image preview</span>
            <img
              src={formData.image_url}
              alt="Product preview"
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
              onLoad={(event) => {
                event.currentTarget.hidden = false;
              }}
            />
          </div>
        )}
        <label>
          Selling price
          <input
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            placeholder="0.00"
            min="0.01"
            step="0.01"
            required
          />
        </label>
        <label>
          MRP
          <input
            name="mrp"
            type="number"
            value={formData.mrp}
            onChange={handleChange}
            placeholder="0.00"
            min={formData.price || "0.01"}
            step="0.01"
            required
          />
        </label>
        <label>
          Stock quantity
          <input
            name="stock"
            type="number"
            value={formData.stock}
            onChange={handleChange}
            min="0"
            step="1"
            required
          />
        </label>
        <button
          className="seller-primary-button"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Adding product..." : "Add product"}
        </button>
        {message && (
          <p className="seller-product-message" role="status">
            {message}
          </p>
        )}
      </form>
    </section>
  );
}

export default SellerProducts;
