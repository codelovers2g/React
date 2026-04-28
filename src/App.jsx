// App: Orchestrates global state, inventory operations, and optimistic UI synchronization. 

import React, { useState, useOptimistic } from "react";
import "./styles/App.css";
import productService from "./api/productService";
import AddProductForm from "./components/AddProductForm";
import ProductList from "./components/ProductList";

function App() {
  const [products, setProducts] = useState(productService.getProducts());

  // Manages optimistic UI state for instant feedback during async operations
  const [optimisticProducts, addOptimisticProduct] = useOptimistic(
    products,
    (state, newProduct) => [
      ...state,
      { ...newProduct, id: `opt-${Date.now()}`, isSending: true },
    ]
  );

  // Syncs local state after successful API confirmation 
  const handleAddProduct = (product) => {
    setProducts((current) => [...current, product]);
  };

  // Triggers optimistic update before form action execution 
  const handleOptimisticUpdate = (product) => {
    addOptimisticProduct(product);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Inventory Management System</h1>
      </header>

      <main className="main-grid">
        <section>
          <h2 className="section-title">Add New Product</h2>
          <AddProductForm onAddProduct={handleAddProduct} />
        </section>

        <section>
          <h2 className="section-title">Verified Inventory</h2>
          <ProductList products={optimisticProducts} />
        </section>
      </main>
    </div>
  );
}

export default App;
