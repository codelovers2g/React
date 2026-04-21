// productItem: Presentation component for individual products with optimistic status. 
import React from "react";

function ProductItem({ product }) {
  const isOptimistic = product.isSending;
  
  return (
    <div className={`product-card ${isOptimistic ? "optimistic" : "saved"}`}>
      <div className="product-name">{product.name}</div>
      <div className="product-meta">
        {product.category} • ${product.price}
      </div>
      {isOptimistic && (
        <div className="status-label">Saving to database...</div>
      )}
    </div>
  );
}

export default ProductItem;
