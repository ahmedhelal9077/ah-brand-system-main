"use client";


import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pendingText?: string;
  children: React.ReactNode;
}

export default function SubmitButton({ children, pendingText, className, disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  
  return (
    <button 
      type="submit" 
      disabled={disabled || pending} 
      className={className} 
      style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", ...props.style }}
      {...props}
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin" size={16} />
          {pendingText || children}
        </>
      ) : children}
    </button>
  );
}
