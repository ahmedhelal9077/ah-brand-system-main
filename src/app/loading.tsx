import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh", 
      width: "100vw",
      background: "var(--background)",
      color: "var(--foreground)",
      position: "fixed",
      inset: 0,
      zIndex: 9999
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-logo {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes spin-loader {
          to { transform: rotate(360deg); }
        }
      `}} />
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        gap: "1.5rem",
        animation: "pulse-logo 2s ease-in-out infinite"
      }}>
        <img 
          src="/icon-192.png" 
          alt="AH Brand Logo" 
          style={{ width: "90px", height: "90px", borderRadius: "18px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} 
        />
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent)", fontWeight: "bold", fontSize: "1.1rem" }}>
          <Loader2 style={{ animation: "spin-loader 1s linear infinite" }} size={24} />
          <span>جاري التحميل...</span>
        </div>
      </div>
    </div>
  );
}
