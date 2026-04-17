/*
 * Latest Version Used: 19.0.0
 * File Purpose: Comprehensive CRUD Reference Implementation
 * Created Date: 2026-04-17
 */

import React, { useState, useOptimistic, useTransition } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

// Mock API functions to demonstrate async operations
const mockApi = {
  getProducts: () => [
    { id: 1, name: "Premium Laptop", price: 1200, category: "Electronics" },
    { id: 2, name: "Wireless Mouse", price: 25, category: "Accessories" },
  ],
  addProduct: async (newProduct) => {
    // Artificial delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (newProduct.name === "error") throw new Error("Invalid product name");
    return { ...newProduct, id: Math.random() };
  },
};

// Button component demonstrating useFormStatus 
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        padding: "10px 20px",
        backgroundColor: pending ? "#ccc" : "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: pending ? "not-allowed" : "pointer",
        transition: "background-color 0.3s",
      }}
    >
      {pending ? "Adding Product..." : "Add Product"}
    </button>
  );
}

// REACT 19: 'useActionState' manages form state & errors automatically.
// REACT 19: 'useFormStatus' lets child components access form pending status.
function AddProductForm({ onAddProduct }) {
  const [error, submitAction] = useActionState(async (_, formData) => {
    try {
      const product = await mockApi.addProduct({
        name: formData.get("name"), price: Number(formData.get("price")), category: formData.get("category"),
      });
      onAddProduct(product); return null;
    } catch (e) { return e.message; }
  }, null);
  return (
    <form action={submitAction} style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "30px" }}>
      <input name="name" placeholder="Product Name" required style={inputStyle} />
      <input name="price" type="number" placeholder="Price" required style={inputStyle} />
      <input name="category" placeholder="Category" required style={inputStyle} />
      {error && <p style={{ color: "red", margin: "5px 0" }}>{error}</p>}
      <SubmitButton />
    </form>
  );
}


const inputStyle = {
  padding: "10px",
  borderRadius: "4px",
  border: "1px solid #ddd",
  fontSize: "16px",
};

// Main Reference Component
export default function ReactCRUD() {
  const [products, setProducts] = useState(mockApi.getProducts());
  const [optimisticProducts, addOptimisticProduct] = useOptimistic(
    products,
    (state, newProduct) => [...state, { ...newProduct, id: "temp-" + Date.now(), isSending: true }]
  );

  const handleAddProduct = (product) => {
    setProducts((current) => [...current, product]);
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px", fontFamily: "Inter, sans-serif" }}>
      <header style={{ marginBottom: "40px", borderBottom: "2px solid #f0f0f0", paddingBottom: "20px" }}>
        <h1 style={{ color: "#333", marginBottom: "10px" }}>Inventory Management</h1>
        <p style={{ color: "#666" }}>React 19 Reference Implementation demonstrating Form Actions and Optimistic UI.</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
        <section>
          <h2 style={{ marginBottom: "20px" }}>Add New Product</h2>
          <AddProductForm onAddProduct={handleAddProduct} />
        </section>

        <section>
          <h2 style={{ marginBottom: "20px" }}>Product List</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {optimisticProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  padding: "15px",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  border: "1px solid #efefef",
                  opacity: product.isSending ? 0.6 : 1,
                  borderLeft: product.isSending ? "4px solid #007bff" : "4px solid #28a745",
                }}
              >
                <div style={{ fontWeight: "600", fontSize: "18px" }}>{product.name}</div>
                <div style={{ color: "#666", fontSize: "14px" }}>
                  {product.category} • ${product.price}
                </div>
                {product.isSending && <div style={{ fontSize: "12px", color: "#007bff", marginTop: "5px" }}>Saving...</div>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
