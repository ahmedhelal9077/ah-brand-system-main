"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { Search, ShoppingBag, Grid, User, ChevronLeft, ChevronRight, MapPin, Camera, Users } from "lucide-react";
import { useSettings } from "@/lib/SettingsContext";
type Variant = {id: string;colorName: string;colorHex: string | null;stock: number;imageUrl: string | null;};
type Product = {id: string;name: string;price: number;code: number;variants: Variant[];};
type Category = {id: string;name: string;products: Product[];};
type StoreLink = {id: string;name: string;url: string;icon: string;};
type StoreLocation = {id: string;name: string;url: string;};

// Flattened type for the Lookbook grid
type LookbookItemType = {product: Product;categoryName: string;};

const ProductCard = ({ product, categoryName, t }: {product: Product;categoryName: string;t: any;}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    if (showOverlay) {
      const timer = setTimeout(() => setShowOverlay(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showOverlay]);

  if (!product.variants || product.variants.length === 0) return null;

  const activeVariant = product.variants[activeIndex];
  const hasMultiple = product.variants.length > 1;

  const nextVariant = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % product.variants.length);
  };

  const prevVariant = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + product.variants.length) % product.variants.length);
  };

  return (
    <div
      className="lookbook-item group"
      onClick={() => setShowOverlay(true)}
      style={{
        backgroundColor: activeVariant.colorHex || "var(--secondary)",
        minHeight: activeVariant.imageUrl ? "auto" : "350px",
        display: "flex", flexDirection: "column", justifyContent: "center",
        position: "relative"
      }}>
      
      {/* Carousel Images */}
      <div style={{ position: "relative", width: "100%", paddingTop: "133.33%", overflow: "hidden" }}>
        {product.variants.map((v, i) =>
        <div key={v.id} style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
          opacity: i === activeIndex ? 1 : 0,
          transition: "opacity 0.4s ease-in-out",
          zIndex: i === activeIndex ? 1 : 0
        }}>
            {v.imageUrl ?
          <img
            src={v.imageUrl}
            alt={`${product.name} - ${v.colorName}`}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            loading="lazy" /> :


          <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", opacity: 0.3 }}>
                <ShoppingBag size={80} color="#fff" />
              </div>
          }
          </div>
        )}
        
        {/* Navigation Arrows */}
        {hasMultiple &&
        <>
            <button onClick={prevVariant} className="carousel-arrow left" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", zIndex: 10, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", border: "none", borderRadius: "50%", padding: "8px", color: "white", cursor: "pointer", transition: "all 0.3s" }}>
              <ChevronLeft size={20} />
            </button>
            <button onClick={nextVariant} className="carousel-arrow right" style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", zIndex: 10, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", border: "none", borderRadius: "50%", padding: "8px", color: "white", cursor: "pointer", transition: "all 0.3s" }}>
              <ChevronRight size={20} />
            </button>
          </>
        }
      </div>

      {/* Dots Indicator */}
      {hasMultiple &&
      <div style={{ position: "absolute", bottom: "110px", left: 0, right: 0, display: "flex", justifyContent: "center", gap: "6px", zIndex: 10, padding: "10px" }}>
          {product.variants.map((v, i) =>
        <button
          key={v.id}
          onClick={(e) => {e.preventDefault();e.stopPropagation();setActiveIndex(i);}}
          style={{
            width: i === activeIndex ? "24px" : "8px",
            height: "8px",
            borderRadius: "4px",
            background: i === activeIndex ? "white" : "rgba(255,255,255,0.5)",
            border: "none",
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            padding: 0
          }}
          title={v.colorName} />

        )}
        </div>
      }

      {/* Hover Overlay */}
      <div className={`lookbook-overlay ${showOverlay ? 'show-mobile' : ''}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.9, marginBottom: "0.3rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <span>{categoryName}</span>
              <span style={{ background: "rgba(255,255,255,0.2)", padding: "2px 6px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold", backdropFilter: "blur(4px)" }}>
                Code: {product.code}
              </span>
            </div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: "bold", margin: 0, textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
              {product.name}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
              {activeVariant.colorHex &&
              <span style={{ display: "inline-block", width: "12px", height: "12px", borderRadius: "50%", background: activeVariant.colorHex, border: "1px solid rgba(255,255,255,0.5)" }} />
              }
              <span style={{ fontSize: "0.95rem", opacity: 0.9 }}>{activeVariant.colorName}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: "900", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
              {product.price}
            </div>
            {activeVariant.stock === 0 &&
            <div style={{ fontSize: "0.75rem", background: "var(--danger)", color: "white", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-sm)", marginTop: "0.3rem", fontWeight: "bold", display: "inline-block" }}>
                {t("outOfStock" as any) || "Sold Out"}
              </div>
            }
          </div>
        </div>
      </div>
    </div>);

};

export default function StoreClient({ categories, storeLinks = [], storeLocations = [] }: {categories: Category[];storeLinks?: StoreLink[];storeLocations?: StoreLocation[];}) {
  const { t } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");

  const priceRanges = [
  { id: "all", label: t("priceAll" as any) },
  { id: "under500", label: t("priceUnder500" as any), min: 0, max: 499 },
  { id: "500-1000", label: t("price500to1000" as any), min: 500, max: 1000 },
  { id: "1000-2000", label: t("price1000to2000" as any), min: 1001, max: 2000 },
  { id: "above2000", label: t("priceAbove2000" as any), min: 2001, max: Infinity }];


  const allProducts = useMemo(() => {
    const items: LookbookItemType[] = [];
    categories.forEach((cat) => {
      cat.products.forEach((prod) => {
        if (prod.variants && prod.variants.length > 0) {
          items.push({
            product: prod,
            categoryName: cat.name
          });
        }
      });
    });
    return items;
  }, [categories]);

  const uniqueCategories = useMemo(() => ["all", ...Array.from(new Set(allProducts.map((p) => p.categoryName)))], [allProducts]);

  const filteredProducts = useMemo(() => {
    let filtered = allProducts;
    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.categoryName === selectedCategory);
    }

    if (selectedPriceRange !== "all") {
      const range = priceRanges.find((r) => r.id === selectedPriceRange);
      if (range) {
        filtered = filtered.filter((p) => p.product.price >= range.min! && p.product.price <= range.max!);
      }
    }

    if (!searchQuery) return filtered;

    const q = searchQuery.toLowerCase();
    return filtered.filter((p) =>
    p.product.name.toLowerCase().includes(q) ||
    p.categoryName.toLowerCase().includes(q) ||
    p.product.code.toString().includes(q) ||
    p.product.price.toString().includes(q) ||
    p.product.variants.some((v) => v.colorName.toLowerCase().includes(q))
    );
  }, [allProducts, searchQuery, selectedCategory, selectedPriceRange]);

  return (
    <div className="page-wrapper" style={{ background: "var(--background)", minHeight: "100vh" }}>
      {/* Minimalist Sticky Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "var(--glass-bg)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid var(--glass-border)",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.03)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--foreground)" }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "900", letterSpacing: "1px", fontFamily: "'Outfit', sans-serif", margin: 0 }}>
            AH <span style={{ fontWeight: "300" }}>BRAND</span>
          </h1>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div className="input-group" style={{ marginBottom: "0", width: "100%", minWidth: "250px", position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: "2.5rem", borderRadius: "var(--radius-full)", background: "rgba(0,0,0,0.04)", border: "none" }}
              placeholder={(t("products" as any) || "Search Collection") + "..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} />
            
          </div>
          <Link href="/login" style={{ color: "var(--foreground)", opacity: 0.7, transition: "opacity 0.2s" }} className="hover-opacity" title={t("login" as any) || "Login"}>
            <User size={24} />
          </Link>
        </div>
      </header>

      {/* Lookbook Grid Content */}
      <main style={{ padding: "2rem", maxWidth: "1600px", margin: "0 auto", width: "100%" }}>
        
        {/* Contact & Branches Banner */}
        {(storeLinks.length > 0 || storeLocations.length > 0) &&
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between", background: "var(--glass-bg)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)", padding: "1rem 1.5rem", marginBottom: "2rem", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            
            {storeLinks.length > 0 &&
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ fontWeight: "bold", fontSize: "0.95rem" }}>{t("contactUs" as any)}</span>
                {storeLinks.map((link) => {
              let Icon = Camera;
              let color = "#E1306C";
              let bg = "rgba(225,48,108,0.1)";
              if (link.icon === "Facebook") {Icon = Users;color = "#1877F2";bg = "rgba(24,119,242,0.1)";}
              if (link.icon === "Globe") {Icon = Grid;color = "var(--foreground)";bg = "rgba(0,0,0,0.05)";}

              return (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.8rem", borderRadius: "var(--radius-full)", background: bg, color: color, fontSize: "0.85rem", fontWeight: "600", transition: "all 0.2s" }} className="hover-opacity">
                      <Icon size={16} /> {link.name}
                    </a>);

            })}
              </div>
          }
            
            {storeLocations.length > 0 &&
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontWeight: "bold", fontSize: "0.95rem" }}>{t("ourBranches" as any)}</span>
                {storeLocations.map((loc) =>
            <a key={loc.id} href={loc.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.8rem", borderRadius: "var(--radius-full)", background: "rgba(0,0,0,0.05)", color: "var(--foreground)", fontSize: "0.85rem", fontWeight: "600", transition: "all 0.2s" }} className="hover-opacity">
                    <MapPin size={16} /> {loc.name}
                  </a>
            )}
              </div>
          }
          </div>
        }

        {/* Category Filters */}
        <div style={{ display: "flex", flexShrink: 0, gap: "0.75rem", overflowX: "auto", paddingBottom: "0.5rem", marginBottom: "0.5rem", WebkitOverflowScrolling: "touch", msOverflowStyle: "none", scrollbarWidth: "none" }}>
          {uniqueCategories.map((cat) =>
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: "0.6rem 1.5rem",
              borderRadius: "var(--radius-full)",
              background: selectedCategory === cat ? "var(--foreground)" : "var(--glass-bg)",
              color: selectedCategory === cat ? "var(--background)" : "var(--foreground)",
              border: `1px solid ${selectedCategory === cat ? "var(--foreground)" : "var(--glass-border)"}`,
              whiteSpace: "nowrap",
              fontWeight: selectedCategory === cat ? "bold" : "500",
              fontSize: "0.95rem",
              transition: "all 0.2s",
              flexShrink: 0
            }}
            className="hover-opacity">
            
              {cat === "all" ? t("allCategories" as any) : cat}
            </button>
          )}
        </div>

        {/* Price Filters */}
        <div style={{ display: "flex", flexShrink: 0, gap: "0.5rem", overflowX: "auto", paddingBottom: "1.5rem", marginBottom: "1rem", WebkitOverflowScrolling: "touch", msOverflowStyle: "none", scrollbarWidth: "none" }}>
          {priceRanges.map((range) =>
          <button
            key={range.id}
            onClick={() => setSelectedPriceRange(range.id)}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "var(--radius-full)",
              background: selectedPriceRange === range.id ? "rgba(0,0,0,0.08)" : "transparent",
              color: "var(--foreground)",
              border: `1px solid ${selectedPriceRange === range.id ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.05)"}`,
              whiteSpace: "nowrap",
              fontSize: "0.85rem",
              transition: "all 0.2s",
              cursor: "pointer",
              flexShrink: 0
            }}
            className="hover-opacity">
            
              {range.label}
            </button>
          )}
        </div>

        {filteredProducts.length === 0 ?
        <div style={{ textAlign: "center", padding: "5rem 0", color: "#9ca3af" }}>
            <ShoppingBag size={48} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
            <h2 style={{ fontSize: "1.5rem" }}>{t("noMatchingItems" as any) || "No matching items found."}</h2>
          </div> :

        <div className="lookbook-grid">
            {filteredProducts.map((item, index) =>
          <ProductCard key={item.product.id} product={item.product} categoryName={item.categoryName} t={t} />
          )}
          </div>
        }
      </main>

      {/* Footer */}
      <footer style={{ padding: "3rem 2rem", textAlign: "center", color: "#9ca3af", marginTop: "auto", display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
        {storeLocations.length > 0 &&
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(0,0,0,0.03)", padding: "0.75rem 1.5rem", borderRadius: "var(--radius-full)", flexWrap: "wrap", justifyContent: "center" }}>
            <MapPin size={18} />
            <span style={{ fontSize: "0.95rem", fontWeight: "600" }}>{t("ourBranches" as any)}</span>
            {storeLocations.map((loc, i) =>
          <a key={loc.id}
          href={loc.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--foreground)", textDecoration: "underline", fontSize: "0.95rem" }}
          className="hover-opacity">
            
                {loc.name}{i < storeLocations.length - 1 ? t("trans_401") : ""}
              </a>
          )}
          </div>
        }
        <p style={{ letterSpacing: "2px", textTransform: "uppercase", fontSize: "0.85rem", marginTop: "1rem" }}>
          &copy; {new Date().getFullYear()} <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: "900" }}>AH <span style={{ fontWeight: "300" }}>BRAND</span></span>. All rights reserved.
        </p>
      </footer>
    </div>);

}
