import React, { useActionState } from "react";
import productService from "../api/productService";
import SubmitButton from "./SubmitButton";

// AddProductForm: Manages product creation lifecycle using React 19 form actions. 
function AddProductForm({ onAddProduct }) {

  // Handles async submission and state synchronization via form action
  const [error, formAction] = useActionState(async (prevState, formData) => {
    try {
      const product = await productService.addProduct({
        name: formData.get("name"),
        price: Number(formData.get("price")),
        category: formData.get("category"),
      });
      
      onAddProduct(product);
      return null;
    } catch (err) {
      return err.message;
    }
  }, null);

  return (
    <form action={formAction} className="form-container">
      <input 
        name="name" 
        placeholder="Name (e.g. MacBook)" 
        required 
        className="input-field" 
      />
      <input 
        name="price" 
        type="number" 
        placeholder="Price (USD)" 
        required 
        className="input-field" 
      />
      <input 
        name="category" 
        placeholder="Category" 
        required 
        className="input-field" 
      />
      
      {error && <p className="error-message"> {error}</p>}
      
      <SubmitButton label="Add Product" loadingLabel="Saving..." />
    </form>
  );
}

export default AddProductForm;