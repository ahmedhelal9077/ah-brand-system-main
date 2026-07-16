"use client";

import React from "react";
import Link from "next/link";
import { useSettings } from "@/lib/SettingsContext";
import { Moon, Sun, Globe } from "lucide-react";

import { usePathname } from "next/navigation";

export default function Navbar() {
  const { theme, setTheme, language, setLanguage, t } = useSettings();
  const pathname = usePathname();

  if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/pos")) {
    return null;
  }

  return (
    <nav className="glass-panel" style={{ padding: "1rem", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary)" }}>{t("siteTitle")}</h1>
        <div style={{ display: "flex", gap: "1rem" }}>
          <Link href="/store" className="btn btn-secondary">{t("store")}</Link>
        </div>
      </div>
      
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <button
          onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
          className="btn btn-secondary"
          title={t("language")}
          style={{ padding: "0.5rem" }}>
          
          <Globe size={20} />
          <span style={{ margin: "0 0.5rem" }}>{language === "ar" ? "EN" : t("trans_308")}</span>
        </button>
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="btn btn-secondary"
          title={theme === "light" ? t("darkMode") : t("lightMode")}
          style={{ padding: "0.5rem", borderRadius: "50%" }}>
          
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </nav>);

}
