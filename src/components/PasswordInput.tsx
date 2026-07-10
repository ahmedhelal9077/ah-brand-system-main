"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({ name, id, placeholder, required }: { name: string, id: string, placeholder: string, required?: boolean }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <input 
        className="input-field" 
        type={showPassword ? "text" : "password"} 
        id={id} 
        name={name} 
        required={required} 
        placeholder={placeholder} 
        style={{ paddingRight: "2.5rem", width: "100%", margin: 0 }}
      />
      <button 
        type="button" 
        onClick={() => setShowPassword(!showPassword)}
        style={{ 
          position: "absolute", 
          right: "0.5rem", 
          background: "none", 
          border: "none", 
          color: "#9ca3af", 
          cursor: "pointer", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center" 
        }}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
