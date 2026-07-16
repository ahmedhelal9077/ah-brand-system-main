"use client";


import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Language, TranslationKey } from "./i18n";

type Theme = "light" | "dark";

interface SettingsContextType {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [language, setLanguageState] = useState<Language>("ar");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem("theme") as Theme;
    const storedLang = localStorage.getItem("language") as Language;
    
    if (storedTheme) {
      setThemeState(storedTheme);
      document.documentElement.setAttribute("data-theme", storedTheme);
    }
    
    if (storedLang) {
      setLanguageState(storedLang);
      document.documentElement.lang = storedLang;
      document.documentElement.dir = storedLang === "ar" ? "rtl" : "ltr";
    } else {
      document.documentElement.lang = "ar";
      document.documentElement.dir = "rtl";
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem("language", newLang);
    document.cookie = `language=${newLang}; path=/; max-age=31536000`;
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    window.location.reload(); // Force full reload to update Server Components
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  // Prevent hydration mismatch by hiding content until mounted, 
  // BUT we must still wrap children in the Provider so useContext doesn't crash during SSR!
  return (
    <SettingsContext.Provider value={{ theme, language, setTheme, setLanguage, t }}>
      <div style={{ visibility: mounted ? "visible" : "hidden" }}>
        {children}
      </div>
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
