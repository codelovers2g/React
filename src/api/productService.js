const productService = {
  // @returns {Array} Initial seed data for the inventory storefront. 
  getProducts: () => [
    { id: 1, name: "Premium Laptop", price: 1200, category: "Electronics" },
    { id: 2, name: "Wireless Mouse", price: 25, category: "Accessories" },
  ],

  /**
   * Network simulation latency to demonstrate optimistic UI behaviors.
   * @throws {Error} Constraint violation if name matches 'error'.
   */
  addProduct: async (newProduct) => {
    // Simulates a 1000ms network delay to test slow connection conditions.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    if (newProduct.name?.toLowerCase() === "error") {
      throw new Error("Invalid product name: 'error' is restricted.");
    }
    
    return { 
      ...newProduct, 
      id: Math.random()
    };
  },
};

export default productService;
