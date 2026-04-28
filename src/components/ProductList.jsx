// ProductList: Renders inventory collection, supporting optimistic UI states. 
import React from "react";
import ProductItem from "./ProductItem";

function ProductList({ products }) {
  if (products.length === 0) {
    return <p className="text-muted">No products available.</p>;
  }

  return (
    <div className="product-list">
      {products.map((product) => (
        <ProductItem 
          key={product.id || `temp-${product.name}-${Date.now()}`} 
          product={product} 
        />
      ))}
    </div>
  );
}

export default ProductList;
