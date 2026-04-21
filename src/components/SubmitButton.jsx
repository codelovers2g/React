// SubmitButton: Decouples form submission status from parent logic via useFormStatus. 
import React from "react";
import { useFormStatus } from "react-dom";

function SubmitButton({ label = "Add Product", loadingLabel = "Processing..." }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        padding: "12px 24px",
        backgroundColor: pending ? "#cbd5e0" : "#3182ce",
        color: "white",
        border: "none",
        borderRadius: "6px",
        fontWeight: "600",
        cursor: pending ? "not-allowed" : "pointer",
        transition: "all 0.2s ease-in-out",
        boxShadow: pending ? "none" : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      }}
    >
      {pending ? loadingLabel : label}
    </button>
  );
}

export default SubmitButton;
