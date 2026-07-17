"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Package, Tags, ShoppingCart, LogOut, Printer, FileText, Settings, Bell, RefreshCcw, Menu, ChevronLeft, ChevronRight, Activity, AlertTriangle, Moon, Sun, Globe, Store, Wallet, Camera, Briefcase } from "lucide-react";
import { useSettings } from "@/lib/SettingsContext";
import { useState, useEffect, useMemo } from "react";

type Alert = { productName: string; colorName: string; stock: number; code: number };

type SidebarClientProps = {
  role: string;
  username: string;
  lowStockAlerts?: Alert[];
};

export default function SidebarClient({ role, username, lowStockAlerts }: SidebarClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, theme, setTheme, language, setLanguage } = useSettings();
  const [showAlerts, setShowAlerts] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSalesPasswordModal, setShowSalesPasswordModal] = useState(false);
  const [salesPassword, setSalesPassword] = useState("");
  const [isNavigatingTo, setIsNavigatingTo] = useState<string | null>(null);
  const [readAlerts, setReadAlerts] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("readLowStockAlerts");
    if (saved) {
      try {
        setReadAlerts(JSON.parse(saved));
      } catch(e) {}
    }
  }, []);

  const unreadAlerts = useMemo(() => {
    return (lowStockAlerts || []).filter(a => !readAlerts.includes(`${a.code}-${a.colorName}-${a.stock}`));
  }, [lowStockAlerts, readAlerts]);

  const markAsRead = (alert: Alert) => {
    const id = `${alert.code}-${alert.colorName}-${alert.stock}`;
    const newRead = [...readAlerts, id];
    setReadAlerts(newRead);
    localStorage.setItem("readLowStockAlerts", JSON.stringify(newRead));
  };

  const markAllAsRead = () => {
    const allIds = (lowStockAlerts || []).map(a => `${a.code}-${a.colorName}-${a.stock}`);
    const newRead = Array.from(new Set([...readAlerts, ...allIds]));
    setReadAlerts(newRead);
    localStorage.setItem("readLowStockAlerts", JSON.stringify(newRead));
  };

  useEffect(() => {
    setIsNavigatingTo(null);
  }, [pathname]);

  // Auto-collapse on small screens
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }
  }, []);

  const navLinks = [
    { name: t("overview"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("userManagement"), href: "/dashboard/users", icon: Users, ownerOnly: true },
    { name: t("salesHistory" as any) || "Sales History", href: "/dashboard/sales", icon: RefreshCcw, ownerOnly: true },
    { name: t("activityLog" as any) || "Activity Log", href: "/dashboard/activity", icon: FileText, ownerOnly: true },
    { name: t("categories"), href: "/dashboard/categories", icon: Tags },
    { name: t("products"), href: "/dashboard/products", icon: Package },
    { name: t("warehousePerformance" as any) || "Warehouse Performance", href: "/dashboard/warehouse-performance", icon: Activity, ownerOnly: true },
    { name: t("barcodes" as any) || "Barcodes", href: "/dashboard/barcodes", icon: Printer },
    { name: t("settings" as any) || "Settings", href: "/dashboard/settings", icon: Settings, ownerOnly: true },
    { name: t("issues" as any) || "Issues", href: "/dashboard/issues", icon: AlertTriangle, ownerOnly: true },
    { name: t("crm_title") || "Customers", href: "/dashboard/customers", icon: Users, ownerOnly: true },
    { name: t("suppliers_title") || "Suppliers", href: "/dashboard/suppliers", icon: Briefcase, ownerOnly: true },
    { name: t("audit_title") || "Audit", href: "/dashboard/audit", icon: Camera, ownerOnly: true },
    { name: t("pos"), href: "/pos", icon: ShoppingCart },
    { name: t("store"), href: "/store", icon: Store },
    { name: "المصروفات", href: "/dashboard/expenses", icon: Wallet, ownerOnly: true },
    { name: "الحسابات", href: "/dashboard/accounting", icon: FileText, ownerOnly: true }
  ];

  return (
    <aside style={{ 
      width: isCollapsed ? "80px" : "250px", 
      padding: isCollapsed ? "1.5rem 0.5rem" : "2rem 1.5rem", 
      display: "flex", 
      flexDirection: "column", 
      zIndex: 10,
      transition: "all 0.3s ease",
      backgroundColor: "var(--sidebar-bg)",
      color: "var(--sidebar-fg)"
    }}>
      <div style={{ display: "flex", justifyContent: isCollapsed ? "center" : "space-between", alignItems: "center", marginBottom: "3rem", position: "relative" }}>
        {!isCollapsed && <h2 style={{ fontSize: "1.6rem", fontWeight: "900", letterSpacing: "1px", color: "var(--primary)", margin: 0, fontFamily: "'Outfit', sans-serif" }}>AH <span style={{ color: "var(--sidebar-inactive)", fontWeight: "300" }}>BRAND</span></h2>}
        
        <button onClick={() => setIsCollapsed(!isCollapsed)} style={{ 
          background: "transparent", border: "none", cursor: "pointer", color: "var(--sidebar-fg)", 
          display: "flex", alignItems: "center", justifyContent: "center", padding: "0.2rem", opacity: 0.7
        }} title="Toggle Sidebar">
          {isCollapsed ? <Menu size={24} /> : <ChevronRight size={20} />}
        </button>

        {role === "OWNER" && lowStockAlerts && !isCollapsed && (
          <div style={{ position: "relative", marginRight: "0.5rem" }}>
            <button onClick={() => setShowAlerts(!showAlerts)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--sidebar-fg)", position: "relative" }} title="تنبيهات النواقص">
              <Bell size={20} opacity={0.7} />
              {unreadAlerts.length > 0 && (
                <span style={{ position: "absolute", top: -5, right: -5, background: "var(--primary)", color: "var(--sidebar-bg)", fontSize: "0.6rem", width: "16px", height: "16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                  {unreadAlerts.length}
                </span>
              )}
            </button>
            
            {showAlerts && (
              <div className="glass-panel" style={{ position: "absolute", top: "100%", right: -10, marginTop: "0.5rem", width: "280px", padding: "1rem", zIndex: 100, maxHeight: "300px", overflowY: "auto", boxShadow: "var(--shadow-lg)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
                  <h3 style={{ fontSize: "0.9rem", fontWeight: "bold", color: "var(--foreground)", margin: 0 }}>تنبيهات النواقص (3 قطع أو أقل)</h3>
                  {unreadAlerts.length > 0 && (
                    <button onClick={markAllAsRead} style={{ fontSize: "0.7rem", background: "var(--primary)", color: "var(--sidebar-bg)", border: "none", borderRadius: "var(--radius-sm)", padding: "0.2rem 0.5rem", cursor: "pointer", fontWeight: "bold" }}>Read All</button>
                  )}
                </div>
                {unreadAlerts.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>لا يوجد نواقص حالياً.</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {unreadAlerts.map((alert, i) => (
                      <li key={i} style={{ fontSize: "0.85rem", background: "rgba(239, 68, 68, 0.1)", padding: "0.5rem", borderRadius: "var(--radius-sm)", color: "var(--danger)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong>{alert.productName} (#{alert.code})</strong><br />
                          لون {alert.colorName} - باقي {alert.stock} قطع
                        </div>
                        <button onClick={() => markAsRead(alert)} style={{ background: "transparent", border: "1px solid var(--danger)", color: "var(--danger)", borderRadius: "var(--radius-sm)", padding: "0.2rem 0.4rem", fontSize: "0.7rem", cursor: "pointer" }}>READ</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {role === "OWNER" && lowStockAlerts && isCollapsed && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem", position: "relative" }}>
          <button onClick={() => setShowAlerts(!showAlerts)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--sidebar-fg)", position: "relative" }} title="تنبيهات النواقص">
            <Bell size={20} opacity={0.7} />
            {unreadAlerts.length > 0 && (
              <span style={{ position: "absolute", top: -5, right: -5, background: "var(--primary)", color: "var(--sidebar-bg)", fontSize: "0.6rem", width: "16px", height: "16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                {unreadAlerts.length}
              </span>
            )}
          </button>
          {showAlerts && (
              <div className="glass-panel" style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: "0.5rem", width: "280px", padding: "1rem", zIndex: 100, maxHeight: "300px", overflowY: "auto", boxShadow: "var(--shadow-lg)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
                  <h3 style={{ fontSize: "0.9rem", fontWeight: "bold", color: "var(--foreground)", margin: 0 }}>تنبيهات النواقص (3 قطع أو أقل)</h3>
                  {unreadAlerts.length > 0 && (
                    <button onClick={markAllAsRead} style={{ fontSize: "0.7rem", background: "var(--primary)", color: "var(--sidebar-bg)", border: "none", borderRadius: "var(--radius-sm)", padding: "0.2rem 0.5rem", cursor: "pointer", fontWeight: "bold" }}>Read All</button>
                  )}
                </div>
                {unreadAlerts.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>لا يوجد نواقص حالياً.</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {unreadAlerts.map((alert, i) => (
                      <li key={i} style={{ fontSize: "0.85rem", background: "rgba(239, 68, 68, 0.1)", padding: "0.5rem", borderRadius: "var(--radius-sm)", color: "var(--danger)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong>{alert.productName} (#{alert.code})</strong><br />
                          لون {alert.colorName} - باقي {alert.stock} قطع
                        </div>
                        <button onClick={() => markAsRead(alert)} style={{ background: "transparent", border: "1px solid var(--danger)", color: "var(--danger)", borderRadius: "var(--radius-sm)", padding: "0.2rem 0.4rem", fontSize: "0.7rem", cursor: "pointer" }}>READ</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
          )}
        </div>
      )}
      
      <nav style={{ display: "flex", flexDirection: "column", gap: "0.8rem", flexGrow: 1 }}>
        {navLinks.map((link) => {
          if (link.ownerOnly && role !== "OWNER") return null;
          
          const isActive = link.href === "/dashboard" 
            ? pathname === "/dashboard" 
            : pathname?.startsWith(link.href);

          const isSalesLink = link.href === "/dashboard/sales";

          const linkProps = {
            style: { 
              display: "flex", alignItems: "center", gap: "1rem", padding: "0.6rem 0.5rem", 
              transition: "all 0.3s ease", color: isActive ? "var(--sidebar-fg)" : "var(--sidebar-inactive)",
              justifyContent: isCollapsed ? "center" : "flex-start",
              cursor: "pointer",
              fontWeight: isActive ? 600 : 400
            },
            className: isActive ? "sidebar-link-active" : "hover-opacity",
            title: link.name
          };

          if (isSalesLink) {
            return (
              <a key={link.href} onClick={(e) => { e.preventDefault(); setShowSalesPasswordModal(true); }} {...linkProps}>
                <link.icon size={20} strokeWidth={isActive ? 2.5 : 2} style={{ color: isActive ? "var(--primary)" : "inherit" }} />
                {!isCollapsed && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{link.name}</span>}
              </a>
            );
          }

          return (
            <Link key={link.href} href={link.href} onClick={() => { if (!isActive) setIsNavigatingTo(link.href); }} {...linkProps}>
              {isNavigatingTo === link.href ? <RefreshCcw className="animate-spin" size={20} /> : <link.icon size={20} strokeWidth={isActive ? 2.5 : 2} style={{ color: isActive ? "var(--primary)" : "inherit" }} />}
              {!isCollapsed && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{link.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto", paddingTop: "2rem", display: "flex", flexDirection: "column", alignItems: isCollapsed ? "center" : "stretch" }}>
        
        {/* Settings / Toggles */}
        <div style={{ display: "flex", justifyContent: isCollapsed ? "center" : "space-between", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: isCollapsed ? "wrap" : "nowrap" }}>
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
            style={{ background: "var(--sidebar-hover)", border: "1px solid var(--sidebar-border)", borderRadius: "var(--radius-sm)", padding: "0.5rem", color: "var(--sidebar-fg)", cursor: "pointer", flex: 1, display: "flex", justifyContent: "center" }}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button 
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')} 
            style={{ background: "var(--sidebar-hover)", border: "1px solid var(--sidebar-border)", borderRadius: "var(--radius-sm)", padding: "0.5rem", color: "var(--sidebar-fg)", cursor: "pointer", flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
            title="Toggle Language"
          >
            <Globe size={18} />
            {!isCollapsed && <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>{language === "ar" ? "EN" : "عربي"}</span>}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sidebar-bg)", fontWeight: "bold", fontSize: "1rem" }}>
            {username.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div style={{ fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", justifyContent: "space-between", alignItems: "center", flex: 1 }}>
              <span>{username}</span>
              <a href="/api/auth/logout" style={{ color: "var(--sidebar-inactive)", cursor: "pointer", transition: "color 0.2s" }} title="Logout">
                <LogOut size={16} />
              </a>
            </div>
          )}
        </div>
      </div>

      {showSalesPasswordModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: "400px" }}>
            <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "var(--primary)" }}>الرقم السري لإدارة المبيعات</h2>
            <input 
              type="password" 
              placeholder="أدخل الرقم السري..." 
              value={salesPassword}
              onChange={e => setSalesPassword(e.target.value)}
              className="input-field"
              style={{ marginBottom: "1rem" }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (salesPassword === "00") {
                    setShowSalesPasswordModal(false);
                    setSalesPassword("");
                    router.push("/dashboard/sales");
                  } else {
                    alert("كلمة المرور غير صحيحة!");
                  }
                }
              }}
            />
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => { setShowSalesPasswordModal(false); setSalesPassword(""); }}>إلغاء</button>
              <button className="btn btn-primary" onClick={() => {
                if (salesPassword === "00") {
                  setShowSalesPasswordModal(false);
                  setSalesPassword("");
                  router.push("/dashboard/sales");
                } else {
                  alert("كلمة المرور غير صحيحة!");
                }
              }}>دخول</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
