import React, { useState } from "react";

const Dropdown = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const MultiSelecButton = (option) => {
    console.log("Option sélectionnée :", option);
    setIsOpen(false);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={toggleDropdown}
        style={{
          backgroundColor: "white",
          border: "1px solid black",
          padding: "8px 12px",
          cursor: "pointer",
        }}
      >
        Menu ▼
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            backgroundColor: "white",
            border: "1px solid black",
            minWidth: "120px",
            zIndex: 1,
          }}
        >
          {["Option 1", "Option 2", "Option 3"].map((option, index) => (
            <div
              key={index}
              onClick={() => handleSelect(option)}
              style={{
                padding: "8px",
                cursor: "pointer",
                borderBottom:
                  index !== 2 ? "1px solid #ddd" : "none",
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;