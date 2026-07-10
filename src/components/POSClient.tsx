"use client";

import { useState, useEffect, useRef } from "react";
import { processSale, processReservation, processOnlineOrder, appendItemsToSale } from "../app/pos/actions";
import { Search, ShoppingCart, CheckCircle, AlertTriangle, LogOut, LayoutDashboard, Clock, Image as ImageIcon, Send, Camera, PlusCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSettings } from "@/lib/SettingsContext";
import CameraScanner from "./CameraScanner";
import { egyptCitiesMap } from "@/lib/egyptCities";
import { isNameWord, extractNameAndAddress } from "@/lib/arabicNames";

type VariantData = {
  id: string;
  colorName: string;
  colorHex: string | null;
  imageUrl: string | null;
  barcode: string;
  stock: number;
  product: { name: string; price: number; code: number; category?: { name: string } | null };
};

type CartItem = VariantData & { quantity: number };

// Helper to convert Arabic numerals to English
const toEnglishDigits = (str: string) => {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, function (w) {
    return String(arabicNumbers.indexOf(w));
  });
};

const POSProductCard = ({ variants, onAddToCart, t }: { variants: VariantData[], onAddToCart: (v: VariantData) => void, t: any }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeVariant = variants[activeIndex] || variants[0];
  
  if (!activeVariant) return null;

  return (
    <div className="glass-panel" style={{ padding: "0.8rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {/* Image */}
      {activeVariant.imageUrl ? (
        <img src={activeVariant.imageUrl} loading="lazy" alt={activeVariant.product.name} style={{ width: "100%", height: "120px", objectFit: "contain", borderRadius: "var(--radius-sm)", display: "block" }} />
      ) : (
        <div style={{ width: "100%", height: "120px", background: "var(--secondary)", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <ImageIcon size={32} opacity={0.5} />
        </div>
      )}
      
      {/* Details */}
      <div style={{ fontSize: "0.75rem", color: "var(--primary)", fontFamily: "monospace" }}>
        #{activeVariant.product.code} | {activeVariant.barcode}
      </div>
      <h3 style={{ fontWeight: "bold", fontSize: "0.95rem", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeVariant.product.name}</h3>
      
      {/* Price & Stock */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: "bold", fontSize: "1rem" }}>{activeVariant.product.price}</span>
        <span style={{ fontSize: "0.75rem", color: activeVariant.stock === 0 ? "var(--danger)" : "var(--accent)", fontWeight: "bold" }}>
          {activeVariant.stock} {t("available")}
        </span>
      </div>

      {/* Color Swatches */}
      {variants.length > 1 && (
        <div 
          className="hide-scrollbar"
          style={{ 
            display: "flex", 
            gap: "0.4rem", 
            overflowX: "auto", 
            marginTop: "0.3rem",
            paddingBottom: "0.2rem",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {variants.map((v, i) => (
            <button
              key={v.id}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveIndex(i); }}
              title={v.colorName}
              style={{
                flexShrink: 0,
                width: "24px", height: "24px", borderRadius: "50%",
                background: v.colorHex || "#ccc",
                border: i === activeIndex ? "2px solid var(--foreground)" : "1px solid var(--border)",
                boxShadow: i === activeIndex ? "0 0 0 2px var(--background) inset" : "none",
                cursor: "pointer",
                padding: 0
              }}
            />
          ))}
        </div>
      )}

      {/* Add Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onAddToCart(activeVariant); }}
        disabled={activeVariant.stock === 0}
        className="btn btn-primary"
        style={{ width: "100%", marginTop: "0.3rem", padding: "0.5rem", justifyContent: "center", background: activeVariant.stock === 0 ? "var(--secondary)" : "var(--primary)", color: activeVariant.stock === 0 ? "#9ca3af" : "white" }}
      >
        <ShoppingCart size={16} /> إضافة 
      </button>
    </div>
  );
};

export default function POSClient({ variants, userRole }: { variants: VariantData[], userRole: string }) {
  const { t } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerPhone2, setCustomerPhone2] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [magicText, setMagicText] = useState("");
  const [customerDeposit, setCustomerDeposit] = useState<number | "">("");
  const [depositImages, setDepositImages] = useState<string[]>([]);
  const [receiptData, setReceiptData] = useState<{ cart: CartItem[], total: number, date: Date, customerData: { name: string, phone: string, phone2?: string, city: string, address: string }, orderNotes: string, invoiceCode?: string, discountAmount?: number } | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [discountValue, setDiscountValue] = useState<number | "">("");
  const [discountType, setDiscountType] = useState<"amount" | "percentage">("amount");
  const [showAppendModal, setShowAppendModal] = useState(false);
  const [appendInvoiceCode, setAppendInvoiceCode] = useState("");
  const [isExchange, setIsExchange] = useState(false);
  const [visibleCount, setVisibleCount] = useState(30);

  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [editingInvoiceCode, setEditingInvoiceCode] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editInputCode, setEditInputCode] = useState("");

  const [showEditDepositModal, setShowEditDepositModal] = useState(false);
  const [editDepositInvoiceCode, setEditDepositInvoiceCode] = useState("");
  const [editDepositAmountPOS, setEditDepositAmountPOS] = useState<number | "">("");
  const [editDepositScreenshotPOS, setEditDepositScreenshotPOS] = useState<File | null>(null);
  const [isUpdatingDepositPOS, setIsUpdatingDepositPOS] = useState(false);

  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const calculatedDiscount = discountType === "percentage" ? (subtotal * (Number(discountValue) || 0)) / 100 : (Number(discountValue) || 0);
  const total = Math.max(0, subtotal - calculatedDiscount);

  const getCityFromAddress = (address: string) => {
    for (const [key, value] of Object.entries(egyptCitiesMap)) {
      if (address.includes(key)) return value;
    }
    return "";
  };

  const currentCity = customerCity.trim() || getCityFromAddress(customerAddress);
  const upperEgyptCities = ["الفيوم", "بني سويف", "المنيا", "اسيوط", "أسيوط", "سوهاج", "قنا", "الاقصر", "الأقصر", "اسوان", "أسوان", "الوادي الجديد"];
  
  const isTantaOrder = currentCity === "طنطا" || currentCity.includes("طنطا") || (currentCity === "الغربية" && (customerAddress.includes("طنطا") || customerAddress.toLowerCase().includes("tanta")));

  const expectedShipping = isTantaOrder ? 0 : (currentCity 
    ? (upperEgyptCities.includes(currentCity) ? 130 : 110) 
    : (cart.length > 0 ? 110 : 0));

  const finalRequired = total + expectedShipping;
  const depositNum = Number(customerDeposit) || 0;
  const remainingCOD = Math.max(0, finalRequired - depositNum);
  const isDepositExceeding = depositNum > finalRequired;

  const categories = ["الكل", ...Array.from(new Set(variants.map(v => v.product.category?.name || "Uncategorized")))];

  const filteredVariants = variants.filter(v => {
    const categoryName = v.product.category?.name || "Uncategorized";
    if (selectedCategory !== "الكل" && categoryName !== selectedCategory) return false;
    
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return v.barcode.includes(q) || 
           v.product.name.toLowerCase().includes(q) || 
           v.colorName.toLowerCase().includes(q) ||
           v.product.code.toString().includes(q) ||
           v.product.price.toString().includes(q);
  });

  useEffect(() => {
    setVisibleCount(30);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    let phone = customerPhone.replace(/\D/g, "");
    if (phone.length === 11 && phone.startsWith("01")) {
      fetch(`/api/customers/search?phone=${phone}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setCustomerName(prev => prev ? prev : (data.name || ""));
            setCustomerCity(prev => prev ? prev : (data.city || ""));
            setCustomerAddress(prev => prev ? prev : (data.address || ""));
          }
        })
        .catch(err => console.error("Error fetching customer", err));
    }
  }, [customerPhone]);

  const addToCart = (variant: VariantData) => {
    if (variant.stock <= 0) return alert(t("outOfStock"));
    
    setCart(prev => {
      const existing = prev.find(item => item.id === variant.id);
      if (existing) {
        if (existing.quantity >= variant.stock) {
          alert(t("cannotExceedStock" as any) || "Cannot exceed available stock");
          return prev;
        }
        return prev.map(item => item.id === variant.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...variant, quantity: 1 }];
    });
  };

  function processMagicText(text: string) {
    if (!text.trim()) return;
    text = toEnglishDigits(text);

    const isMultiLine = text.includes("\n") || text.includes("الاسم") || text.includes("العنوان");

    let cleanText = text
      .replace(/الاسم\s*[:\-]?\s*/gi, "\n")
      .replace(/العنوان\s*[:\-]?\s*/gi, "\n")
      .replace(/المحافظة\s*[:\-]?\s*/gi, "\n")
      .replace(/رقم الموبايل\s*[:\-]?\s*/gi, "\n")
      .replace(/تليفون\s*[:\-]?\s*/gi, "\n");

    // Extract phones
    const phoneRegex = /(?:(?:\+|00)20\s*|0)?1[0125](?:\s*\d){8}/g;
    const phoneMatches = Array.from(cleanText.matchAll(phoneRegex));
    
    if (phoneMatches && phoneMatches.length > 0) {
      let firstPhone = "";
      let secondPhone = "";
      
      if (phoneMatches.length === 1) {
        firstPhone = phoneMatches[0][0];
      } else {
        // If there are multiple, check for "واتس"
        const p1 = phoneMatches[0][0];
        const p2 = phoneMatches[1][0];
        
        // Find positions
        const idx1 = cleanText.indexOf(p1);
        const idx2 = cleanText.indexOf(p2);
        
        // Check surrounding text (e.g., 20 chars before) for "واتس"
        const textBefore1 = cleanText.substring(Math.max(0, idx1 - 20), idx1);
        const textBefore2 = cleanText.substring(Math.max(0, idx2 - 20), idx2);
        
        if (textBefore2.includes("واتس")) {
          firstPhone = p2;
          secondPhone = p1;
        } else {
          firstPhone = p1;
          secondPhone = p2;
        }
      }

      const formatPhone = (p: string) => {
        let formatted = p.replace(/\D/g, "");
        if (formatted.startsWith("002001")) formatted = formatted.replace("002001", "01");
        else if (formatted.startsWith("00201")) formatted = formatted.replace("00201", "01");
        else if (formatted.startsWith("2001")) formatted = formatted.replace("2001", "01");
        else if (formatted.startsWith("201")) formatted = formatted.replace("201", "01");
        else if (formatted.startsWith("1") && formatted.length === 10) formatted = "0" + formatted;
        return formatted;
      };
      
      setCustomerPhone(formatPhone(firstPhone));
      cleanText = cleanText.replace(firstPhone, isMultiLine ? "\n" : " ");
      
      if (secondPhone) {
        setCustomerPhone2(formatPhone(secondPhone));
        cleanText = cleanText.replace(secondPhone, isMultiLine ? "\n" : " ");
      }
    }

    // Extract city
    for (const [key, value] of Object.entries(egyptCitiesMap)) {
      if (cleanText.includes(key)) {
        setCustomerCity(value);
        break;
      }
    }

    // Extract Name & Address
    cleanText = cleanText.replace(/[,،\n]/g, " ").trim();
    const { name, address } = extractNameAndAddress(cleanText);
    setCustomerName(name);
    setCustomerAddress(address);
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const addToCartRef = useRef(addToCart);
  useEffect(() => {
    addToCartRef.current = addToCart;
  }, [addToCart]);

  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const currentTime = Date.now();
      
      // If time between keystrokes is too long (> 150ms), it's probably human typing
      if (currentTime - lastKeyTime > 150) {
        buffer = "";
      }

      if (e.key === "Enter") {
        if (buffer.length >= 3) {
          const variant = variants.find(v => v.barcode === buffer);
          if (variant) {
            addToCartRef.current(variant);
          } else {
            // Optional: alert that barcode is not found
          }
        }
        buffer = "";
      } else if (e.key.length === 1) {
        buffer += e.key;
      }

      lastKeyTime = currentTime;
    };

    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Allow pasting in specific inputs like order notes, phone, etc without overriding everything.
      // But if they paste in the magic box OR the body, we extract.
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        if (target.id !== "magic-box") return; // Allow normal pasting in other inputs
      }

      const pastedText = e.clipboardData?.getData("text");
      if (pastedText && pastedText.trim().length > 10) {
        // Prevent default if they pasted outside, or if they pasted in the magic box
        if (target.id === "magic-box") e.preventDefault();
        
        setMagicText(pastedText);
        processMagicText(pastedText);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("paste", handleGlobalPaste);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("paste", handleGlobalPaste);
    }
  }, [variants]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: string[] = [];
    let loadedCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 800;
          
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 60% quality
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
          newImages.push(compressedBase64);
          
          loadedCount++;
          if (loadedCount === files.length) {
            setDepositImages(prev => [...prev, ...newImages]);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMagicWand = () => {
    processMagicText(magicText);
    setMagicText("");
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    const confirm = window.confirm(t("confirmDeduct"));
    if (!confirm) return;

    setIsProcessing(true);
    const result = await processSale(
      cart.map(c => ({ variantId: c.id, quantity: c.quantity, price: c.product.price })),
      { name: customerName, phone: customerPhone, phone2: customerPhone2, city: customerCity, address: customerAddress },
      orderNotes,
      calculatedDiscount
    );
    
    if ("error" in result && result.error) {
      alert("Error: " + result.error);
    } else {
      setSuccessMsg(t("saleSuccess" as any) || "Sale recorded successfully!");
      setReceiptData({ cart: [...cart], total, discountAmount: calculatedDiscount, date: new Date(), customerData: { name: customerName, phone: customerPhone, phone2: customerPhone2, city: customerCity, address: customerAddress }, orderNotes, invoiceCode: result.invoiceCode });
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerPhone2("");
      setCustomerCity("");
      setCustomerAddress("");
      setOrderNotes("");
      setCustomerDeposit("");
      setDepositImages([]);
      setDiscountValue("");
      setTimeout(() => {
        setSuccessMsg("");
      }, 2000);
    }
    setIsProcessing(false);
  };

  const handleOnlineOrder = async () => {
    if (cart.length === 0) return;
    
    const depositNum = Number(customerDeposit) || 0;
    if (!isTantaOrder && depositNum > 0 && depositImages.length === 0) {
      return alert("برجاء إرفاق صورة اسكرين التحويل أولاً!");
    }
    
    let cleanPhone = customerPhone.replace(/\D/g, "");
    if (cleanPhone.startsWith("002001")) cleanPhone = cleanPhone.replace("002001", "01");
    else if (cleanPhone.startsWith("00201")) cleanPhone = cleanPhone.replace("00201", "01");
    else if (cleanPhone.startsWith("2001")) cleanPhone = cleanPhone.replace("2001", "01");
    else if (cleanPhone.startsWith("201")) cleanPhone = cleanPhone.replace("201", "01");
    else if (cleanPhone.startsWith("1") && cleanPhone.length === 10) cleanPhone = "0" + cleanPhone;

    if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith("01")) {
      return alert("برجاء إدخال رقم تليفون مصري صحيح (مثال: 01012345678) لتأكيد الأونلاين!");
    }
    
    // Update the state so the receipt and DB save the clean 11-digit version
    setCustomerPhone(cleanPhone);
    
    if (!customerCity && !customerAddress) {
      return alert("برجاء إدخال المحافظة والعنوان لتأكيد طلب الأونلاين!");
    }

    if (!isTantaOrder && customerDeposit === "") return alert("برجاء إدخال قيمة التحويل اللي العميلة دفعته! (اكتب 0 لو مفيش تحويل)");
    if (isDepositExceeding) return alert("المبلغ المحول أكبر من إجمالي الفاتورة ومصاريف الشحن!");
    
    const confirm = window.confirm("تأكيد طلب الأونلاين وإرسال التفاصيل لجروب تليجرام؟");
    if (!confirm) return;

    setIsProcessing(true);
    const result = await processOnlineOrder(
      cart.map(c => ({ variantId: c.id, quantity: c.quantity, price: c.product.price, name: c.product.name, code: c.product.code, imageUrl: c.imageUrl })),
      { name: customerName, phone: customerPhone, phone2: customerPhone2, city: customerCity, address: customerAddress },
      orderNotes,
      depositImages,
      String(customerDeposit),
      calculatedDiscount,
      isExchange
    );
    
    if ("error" in result && result.error) {
      alert("Error: " + result.error);
    } else {
      setSuccessMsg("تم تسجيل الأونلاين بنجاح!");
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerPhone2("");
      setCustomerCity("");
      setCustomerAddress("");
      setOrderNotes("");
      setIsExchange(false);
      setCustomerDeposit("");
      setDepositImages([]);
      setDiscountValue("");
      setTimeout(() => setSuccessMsg(""), 2000);
    }
    setIsProcessing(false);
  };

  const handleAppendToOrder = async () => {
    if (cart.length === 0 || !appendInvoiceCode) return;
    
    const confirm = window.confirm(`تأكيد إضافة المنتجات للفاتورة رقم ${appendInvoiceCode}؟`);
    if (!confirm) return;

    setIsProcessing(true);
    const result = await appendItemsToSale(
      appendInvoiceCode,
      cart.map(c => ({ variantId: c.id, quantity: c.quantity, price: c.product.price, name: c.product.name, code: c.product.code, imageUrl: c.imageUrl })),
      (customerName || customerPhone) ? { name: customerName, phone: customerPhone, phone2: customerPhone2, city: customerCity, address: customerAddress } : null,
      orderNotes,
      depositImages,
      String(customerDeposit)
    );
    
    if ("error" in result && result.error) {
      alert("خطأ: " + result.error);
    } else {
      setSuccessMsg("تمت الإضافة للفاتورة بنجاح!");
      setCart([]);
      setShowAppendModal(false);
      setAppendInvoiceCode("");
      setTimeout(() => setSuccessMsg(""), 2000);
    }
    setIsProcessing(false);
  };

  const handleUpdateDepositPOS = async () => {
    if (!editDepositInvoiceCode || editDepositAmountPOS === "" || editDepositAmountPOS <= 0) return;
    if (!editDepositScreenshotPOS) {
      alert("يجب إرفاق صورة التحويل.");
      return;
    }
    setIsUpdatingDepositPOS(true);
    try {
      const { updateSaleRemainingAmountByCode } = await import('@/app/dashboard/sales/actions');
      
      const formData = new FormData();
      formData.append("invoiceCode", editDepositInvoiceCode);
      formData.append("additionalDeposit", String(editDepositAmountPOS));
      formData.append("screenshot", editDepositScreenshotPOS);

      const res = await updateSaleRemainingAmountByCode(formData);
      if (res.error) {
        alert(res.error);
      } else {
        alert("تم تعديل المتبقي بنجاح وتحديث بوسطة (إن وجد) وإرسال إشعار تليجرام!");
        setShowEditDepositModal(false);
        setEditDepositInvoiceCode("");
        setEditDepositAmountPOS("");
        setEditDepositScreenshotPOS(null);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUpdatingDepositPOS(false);
    }
  };

  const handleLoadInvoiceForEdit = async () => {
    if (!editInputCode) return;
    setIsProcessing(true);
    const { fetchSaleForEdit } = await import('@/app/pos/actions');
    const res = await fetchSaleForEdit(editInputCode);
    if (res.error || !res.sale) {
      alert(res.error || "خطأ في جلب الفاتورة");
      setIsProcessing(false);
      return;
    }
    const sale = res.sale;
    setCustomerName(sale.customerName || "");
    setCustomerPhone(sale.customerPhone || "");
    setCustomerCity(sale.customerCity || "");
    setCustomerAddress(sale.customerAddress || "");
    setOrderNotes(sale.orderNotes || "");
    setDiscountValue(sale.discountAmount || "");
    setDiscountType("amount");
    setCustomerDeposit("");
    
    const loadedCart = sale.items.map((item: any) => ({
       id: item.productVariantId,
       colorName: item.productVariant.colorName,
       colorHex: item.productVariant.colorHex,
       imageUrl: item.productVariant.imageUrl,
       barcode: item.productVariant.barcode,
       stock: item.productVariant.stock,
       product: {
         name: item.productVariant.product.name,
         price: item.priceAtSale,
         code: item.productVariant.product.code,
         category: item.productVariant.product.category
       },
       quantity: item.quantity
    }));
    setCart(loadedCart);
    
    setEditingSaleId(sale.id);
    setEditingInvoiceCode(sale.invoiceCode || "");
    setShowEditModal(false);
    setEditInputCode("");
    setIsProcessing(false);
  };

  const handleUpdateOrderCashier = async () => {
    if (!editingSaleId || cart.length === 0) return;
    
    const confirm = window.confirm(`تأكيد حفظ التعديلات على الفاتورة ${editingInvoiceCode} بالكامل؟`);
    if (!confirm) return;

    setIsProcessing(true);
    const { editOrderCashier } = await import('@/app/pos/actions');
    const result = await editOrderCashier(
      editingSaleId,
      cart.map(c => ({ variantId: c.id, quantity: c.quantity, price: c.product.price, name: c.product.name, code: c.product.code, imageUrl: c.imageUrl })),
      { name: customerName, phone: customerPhone, phone2: customerPhone2, city: customerCity, address: customerAddress },
      orderNotes,
      depositImages,
      String(customerDeposit),
      calculatedDiscount
    );
    
    if (result.error) {
      alert(result.error);
    } else {
      setSuccessMsg("تم تعديل الفاتورة بنجاح!");
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerPhone2("");
      setCustomerCity("");
      setCustomerAddress("");
      setOrderNotes("");
      setCustomerDeposit("");
      setDepositImages([]);
      setDiscountValue("");
      setEditingSaleId(null);
      setEditingInvoiceCode("");
      setTimeout(() => setSuccessMsg(""), 2000);
    }
    setIsProcessing(false);
  };

  const handleReservation = async () => {
    if (cart.length === 0) return;
    
    const confirm = window.confirm(t("confirmReserve") || "Are you sure you want to reserve this item?");
    if (!confirm) return;

    setIsProcessing(true);
    // Defaulting to 1 day reservation for now
    const result = await processReservation(cart.map(c => ({ variantId: c.id, quantity: c.quantity })), 1);
    
    if ("error" in result && result.error) {
      alert("Error: " + result.error);
    } else {
      setSuccessMsg(t("reserveSuccess" as any) || "Items reserved successfully!");
      setCart([]);
      setTimeout(() => {
        setSuccessMsg("");
        window.location.reload(); 
      }, 2000);
    }
    setIsProcessing(false);
  };

  return (
    <div className="page-wrapper" style={{ flexDirection: "column", height: "100vh" }}>
      {/* Header */}
      <header style={{ background: "var(--secondary)", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <ShoppingCart className="text-primary" />
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{t("pos")}</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {userRole === "OWNER" && (
            <Link href="/dashboard" className="btn btn-secondary">
              <LayoutDashboard size={18} /> {t("dashboard")}
            </Link>
          )}
          <a href="/api/auth/logout" className="btn btn-secondary">
            <LogOut size={18} /> {t("logout")}
          </a>
        </div>
      </header>

      {/* Main Content */}
      <div className="pos-layout">
        
        {/* Left Side: Search & Catalog */}
        <div className="pos-catalog">
          <div className="input-group" style={{ position: "relative", marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
            <div style={{ position: "relative", flexGrow: 1 }}>
              <Search size={20} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: "3rem", fontSize: "1.1rem" }}
                placeholder={(t("searchPosPlaceholder" as any) || "Search by Name, Code, Color, Price") + "..."} 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const variantByBarcode = variants.find(v => v.barcode === searchQuery);
                    if (variantByBarcode) {
                      addToCart(variantByBarcode);
                      setSearchQuery("");
                    } else if (filteredVariants.length === 1) {
                      addToCart(filteredVariants[0]);
                      setSearchQuery("");
                    }
                  }
                }}
                autoFocus
              />
            </div>
            <button onClick={() => setShowCamera(true)} className="btn btn-secondary" style={{ padding: "0 1rem", flexShrink: 0 }} title="سكانر الكاميرا">
              <Camera size={20} />
            </button>
          </div>

          <div style={{ display: "flex", flexShrink: 0, gap: "0.5rem", overflowX: "auto", paddingBottom: "1rem", marginBottom: "0.5rem", WebkitOverflowScrolling: "touch", msOverflowStyle: "none", scrollbarWidth: "none" }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "0.5rem 1.2rem",
                  borderRadius: "var(--radius-full)",
                  background: selectedCategory === cat ? "var(--primary)" : "var(--glass-bg)",
                  color: selectedCategory === cat ? "var(--background)" : "var(--foreground)",
                  border: `1px solid ${selectedCategory === cat ? "var(--primary)" : "var(--glass-border)"}`,
                  whiteSpace: "nowrap",
                  fontWeight: selectedCategory === cat ? "bold" : "normal",
                  transition: "all 0.2s",
                  flexShrink: 0
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" }}>
            {Array.from(
              filteredVariants.reduce((acc, v) => {
                if (!acc.has(v.product.code)) acc.set(v.product.code, []);
                acc.get(v.product.code)!.push(v);
                return acc;
              }, new Map<number, VariantData[]>()).values()
            ).slice(0, visibleCount).map((productVariants) => (
              <POSProductCard 
                key={productVariants[0].product.code} 
                variants={productVariants} 
                onAddToCart={addToCart} 
                t={t} 
              />
            ))}
          </div>
          
          {visibleCount < Array.from(new Set(filteredVariants.map(v => v.product.code))).length && (
            <button 
              onClick={() => setVisibleCount(prev => prev + 30)} 
              className="btn btn-secondary" 
              style={{ width: "100%", padding: "1rem", marginTop: "1rem", border: "1px dashed var(--border)" }}
            >
              عرض المزيد...
            </button>
          )}
        </div>

        {/* Right Side: Cart */}
        <div className="pos-cart">
          <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{t("currentOrder" as any) || "Current Order"}</h2>
          </div>
          
          <div style={{ flexGrow: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem", minHeight: "150px" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", color: "#9ca3af", marginTop: "2rem" }}>{t("cartEmpty" as any) || "Cart is empty"}</div>
              ) : (
              cart.map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--background)", padding: "0.8rem", borderRadius: "var(--radius-md)" }}>
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: "0.9rem" }}>{item.product.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>{item.colorName} | {item.product.price}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{ fontWeight: "bold" }}>x{item.quantity}</span>
                    <button onClick={() => removeFromCart(item.id)} className="btn btn-danger" style={{ padding: "0.3rem 0.5rem" }}>X</button>
                  </div>
                </div>
              ))
            )}
            </div>
            
            <div style={{ padding: "0 1rem 1rem 1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {cart.length > 0 && (
                <div style={{ padding: "1rem", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "rgba(0,0,0,0.02)", display: "flex", flexDirection: "column" }}>
                  <textarea 
                    id="magic-box"
                    placeholder="الصق رسالة العميل هنا، أو اضغط Ctrl+V في أي مكان 🪄" 
                    value={magicText}
                    onChange={e => {
                      setMagicText(e.target.value);
                      if (e.target.value.trim().length > 10) {
                        processMagicText(e.target.value);
                      }
                    }}
                    className="input-field"
                    style={{ fontSize: "0.9rem", padding: "0.5rem 1rem", marginBottom: "0.5rem", minHeight: "50px", resize: "vertical", borderColor: "var(--primary)", flexGrow: 1, borderStyle: "dashed" }}
                  />
                <input 
                  type="text" 
                  placeholder="اسم العميل" 
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="input-field"
                  style={{ fontSize: "0.9rem", padding: "0.5rem 1rem", marginBottom: "0.5rem" }}
                />
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                  <input 
                    type="text" 
                    placeholder="رقم الموبايل (أساسي)" 
                    value={customerPhone}
                    onChange={e => setCustomerPhone(toEnglishDigits(e.target.value))}
                    className="input-field"
                    style={{ fontSize: "0.9rem", padding: "0.5rem 1rem", flex: "1 1 45%" }}
                  />
                  <input 
                    type="text" 
                    placeholder="رقم إضافي (اختياري)" 
                    value={customerPhone2}
                    onChange={e => setCustomerPhone2(toEnglishDigits(e.target.value))}
                    className="input-field"
                    style={{ fontSize: "0.9rem", padding: "0.5rem 1rem", flex: "1 1 45%" }}
                  />
                  <input 
                    type="text" 
                    placeholder="المحافظة" 
                    value={customerCity}
                    onChange={e => setCustomerCity(e.target.value)}
                    className="input-field"
                    style={{ fontSize: "0.9rem", padding: "0.5rem 1rem", flex: "1 1 100%" }}
                  />
                </div>
                <input 
                  type="text" 
                  placeholder="العنوان بالتفصيل" 
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  className="input-field"
                  style={{ fontSize: "0.9rem", padding: "0.5rem 1rem", marginBottom: "0.5rem" }}
                />
                <input 
                  type="text" 
                  placeholder="الملحوظات (اختياري)" 
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  className="input-field"
                  style={{ fontSize: "0.9rem", padding: "0.5rem 1rem", marginBottom: "0.5rem" }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", padding: "0.5rem", background: "rgba(245, 158, 11, 0.1)", borderRadius: "var(--radius-sm)" }}>
                  <input
                    type="checkbox"
                    id="isExchange"
                    checked={isExchange}
                    onChange={(e) => setIsExchange(e.target.checked)}
                    style={{ width: "20px", height: "20px" }}
                  />
                  <label htmlFor="isExchange" style={{ color: "var(--warning)", fontWeight: "bold", cursor: "pointer" }}>
                    هذا أوردر استبدال 🔄
                  </label>
                </div>
                <input 
                  type="number" 
                  placeholder="العميلة حولت كام؟ (مبلغ التحويل)" 
                  value={customerDeposit}
                  onChange={e => setCustomerDeposit(e.target.value === "" ? "" : Number(toEnglishDigits(e.target.value)))}
                  className="input-field"
                  style={{ fontSize: "0.9rem", padding: "0.5rem 1rem", marginBottom: "0.5rem", borderColor: isDepositExceeding ? "var(--danger)" : "" }}
                />
                {isDepositExceeding && (
                  <div style={{ color: "var(--danger)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                    المبلغ المحول أكبر من إجمالي الفاتورة ومصاريف الشحن!
                  </div>
                )}
                {cart.length > 0 && customerDeposit !== "" && !isDepositExceeding && (
                  <div style={{ background: "rgba(0,0,0,0.1)", padding: "0.5rem", borderRadius: "var(--radius-sm)", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>المنتجات:</span> <span>{total} ج.م</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--warning)" }}><span>الشحن المتوقع:</span> <span>{expectedShipping} ج.م</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", borderTop: "1px solid var(--border)", paddingTop: "0.3rem", marginTop: "0.3rem" }}>
                      <span>المطلوب الكلي:</span> <span>{finalRequired} ج.م</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--accent)", fontWeight: "bold", borderTop: "1px solid var(--border)", paddingTop: "0.3rem", marginTop: "0.3rem" }}>
                      <span>المتبقي للتحصيل (COD):</span> <span>{remainingCOD} ج.م</span>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <label className="btn btn-secondary" style={{ flex: 1, padding: "0.5rem", fontSize: "0.85rem", cursor: "pointer", display: "flex", justifyContent: "center", border: depositImages.length > 0 ? "1px solid var(--accent)" : "" }}>
                    <ImageIcon size={16} /> {depositImages.length > 0 ? `تم إرفاق ${depositImages.length} صور` : "إرفاق التحويل (يمكن اختيار أكثر من صورة)"}
                    <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImageUpload} />
                  </label>
                  {depositImages.length > 0 && (
                    <button onClick={() => setDepositImages([])} style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", padding: "0.5rem" }}>X مسح الصور</button>
                  )}
                </div>
                </div>
              )}

              {cart.length > 0 && (
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", background: "var(--background)", padding: "0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: "bold", whiteSpace: "nowrap" }}>الخصم:</span>
                  <input
                    type="number"
                    min="0"
                    value={discountValue}
                    onChange={e => setDiscountValue(e.target.value === "" ? "" : Number(e.target.value))}
                    className="input-field"
                    style={{ padding: "0.4rem", margin: 0, minWidth: "60px", flexGrow: 1 }}
                    placeholder="0"
                  />
                  <select 
                    value={discountType} 
                    onChange={e => setDiscountType(e.target.value as "amount" | "percentage")}
                    className="input-field"
                    style={{ padding: "0.4rem", margin: 0, width: "auto" }}
                  >
                    <option value="amount">ج.م</option>
                    <option value="percentage">%</option>
                  </select>
                </div>
              )}
              {editingSaleId && (
                <div style={{ background: "rgba(234, 179, 8, 0.1)", border: "1px solid var(--accent)", padding: "0.5rem", borderRadius: "var(--radius-sm)", textAlign: "center", color: "var(--accent)" }}>
                  جاري تعديل الفاتورة: <strong>{editingInvoiceCode}</strong>
                  <button onClick={() => { setEditingSaleId(null); setEditingInvoiceCode(""); setCart([]); }} style={{ display: "block", width: "100%", background: "none", border: "none", color: "var(--danger)", cursor: "pointer", marginTop: "0.5rem" }}>
                    إلغاء التعديل (تفريغ)
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: "1rem 1.5rem", borderTop: "2px solid var(--border)", background: "var(--background)", boxShadow: "0 -4px 10px rgba(0,0,0,0.05)", zIndex: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.9rem", color: "#9ca3af" }}>
              <span>المجموع:</span>
              <span>{subtotal.toFixed(2)}</span>
            </div>
            {calculatedDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.9rem", color: "var(--accent)" }}>
                <span>الخصم:</span>
                <span>-{calculatedDiscount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", fontSize: "1.2rem", fontWeight: "bold" }}>
              <span>الإجمالي النهائي:</span>
              <span className="text-primary">{total.toFixed(2)}</span>
            </div>
            
            {successMsg ? (
              <div style={{ color: "var(--accent)", display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center", padding: "0.8rem" }}>
                <CheckCircle /> {successMsg}
              </div>
            ) : editingSaleId ? (
              <button 
                onClick={handleUpdateOrderCashier}
                disabled={cart.length === 0 || isProcessing}
                className="btn btn-primary"
                style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", background: "var(--accent)", color: "var(--background)", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
              >
                {isProcessing ? <><Loader2 className="animate-spin" size={18} /> جاري الحفظ...</> : "حفظ التعديلات في المخزن والتليجرام"}
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button 
                    onClick={handleCheckout} 
                    disabled={cart.length === 0 || isProcessing}
                    className="btn btn-primary" 
                    style={{ flex: 1, padding: "1rem", fontSize: "1.1rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
                  >
                    {isProcessing ? <><Loader2 className="animate-spin" size={18} /> {(t("processing" as any) || "Processing...")}</> : t("deductStock")}
                  </button>
                  <button 
                    onClick={handleReservation} 
                    disabled={cart.length === 0 || isProcessing}
                    className="btn btn-secondary" 
                    style={{ padding: "1rem", display: "flex", justifyContent: "center", alignItems: "center" }}
                    title={t("reserve")}
                  >
                    {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Clock size={20} />}
                  </button>
                </div>
                {(depositImages.length > 0 || isTantaOrder) && (
                  <button 
                    onClick={handleOnlineOrder}
                    disabled={isProcessing}
                    className="btn"
                    style={{ background: "#0ea5e9", color: "white", padding: "1rem", fontSize: "1.1rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
                  >
                    {isProcessing ? <><Loader2 className="animate-spin" size={18} /> جاري التأكيد...</> : <><Send size={18} /> تأكيد الأونلاين (Telegram)</>}
                  </button>
                )}
                <button 
                  onClick={() => setShowAppendModal(true)}
                  disabled={cart.length === 0 || isProcessing}
                  className="btn btn-secondary"
                  style={{ padding: "0.8rem", fontSize: "1rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
                >
                  <PlusCircle size={18} /> إضافة لفاتورة سابقة
                </button>
                <button 
                  onClick={() => setShowEditModal(true)}
                  disabled={isProcessing}
                  className="btn btn-secondary"
                  style={{ padding: "0.8rem", fontSize: "1rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", border: "1px solid var(--accent)", color: "var(--accent)" }}
                >
                  تعديل فاتورة بالكامل
                </button>
              </div>
            )}
            <div style={{ fontSize: "0.75rem", color: "var(--warning)", textAlign: "center", marginTop: "1rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.3rem" }}>
               <AlertTriangle size={14} /> {t("confirmationRequired" as any) || "Confirmation required before deduction"}
            </div>
          </div>
        </div>

      </div>
      
      {/* Receipt Modal */}
      {receiptData && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
          <div style={{ background: "white", padding: "2rem", width: "320px", color: "black", fontFamily: "monospace", position: "relative" }} id="printable-receipt">
            <h2 style={{ textAlign: "center", borderBottom: "1px dashed black", paddingBottom: "1rem", marginBottom: "1rem" }}>AH Brand Store</h2>
            <p style={{ margin: "0.2rem 0" }}>Date: {receiptData.date.toLocaleString()}</p>
            {receiptData.invoiceCode && <p style={{ margin: "0.2rem 0", fontWeight: "bold" }}>Invoice: #{receiptData.invoiceCode}</p>}
            {receiptData.customerData.name && <p style={{ margin: "0.2rem 0" }}>العميل: {receiptData.customerData.name}</p>}
            {receiptData.customerData.phone && <p style={{ margin: "0.2rem 0" }}>ت: {receiptData.customerData.phone}</p>}
            {receiptData.customerData.address && <p style={{ margin: "0.2rem 0" }}>العنوان: {receiptData.customerData.city} - {receiptData.customerData.address}</p>}
            {receiptData.orderNotes && <p style={{ margin: "0.2rem 0" }}>ملاحظات: {receiptData.orderNotes}</p>}
            <div style={{ borderBottom: "1px dashed black", margin: "1rem 0" }} />
            {receiptData.cart.map(item => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ maxWidth: "70%" }}>{item.quantity}x {item.product.name} <br/><small>{item.colorName} | #{item.product.code}</small></span>
                <span>{(item.quantity * item.product.price).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ borderBottom: "1px dashed black", margin: "1rem 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem" }}>
              <span>Subtotal:</span>
              <span>{(receiptData.total + (receiptData.discountAmount || 0)).toFixed(2)} EGP</span>
            </div>
            {receiptData.discountAmount ? (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem", color: "#555" }}>
                <span>Discount:</span>
                <span>-{receiptData.discountAmount.toFixed(2)} EGP</span>
              </div>
            ) : null}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "1.2rem", marginTop: "0.5rem" }}>
              <span>Total:</span>
              <span>{receiptData.total.toFixed(2)} EGP</span>
            </div>
            <p style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.9rem" }}>Thank you for shopping with us!</p>
          </div>
          
          <div className="no-print" style={{ position: "absolute", top: "2rem", right: "2rem", display: "flex", gap: "1rem" }}>
            <button onClick={() => { window.print(); }} className="btn btn-primary">Print Receipt</button>
            <button onClick={() => { setReceiptData(null); window.location.reload(); }} className="btn btn-secondary">Close</button>
          </div>
        </div>
      )}

      {/* Camera Scanner Modal */}
      {showCamera && (
        <CameraScanner 
          onScan={(text) => {
            setShowCamera(false);
            const variant = variants.find(v => v.barcode === text);
            if (variant) {
              addToCart(variant);
            } else {
              alert(t("barcodeNotFound" as any) || "Barcode not found: " + text);
            }
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Edit Full Order Modal */}
      {showEditModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
          <div className="glass-panel" style={{ padding: "2rem", width: "400px", maxWidth: "90%" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>تعديل فاتورة بالكامل</h2>
            <p style={{ color: "#9ca3af", marginBottom: "1.5rem", fontSize: "0.9rem" }}>أدخل رقم الفاتورة (مثال: 240626-1) عشان نحملها وتقدر تعدل فيها أي حاجة زي الموبايل، المحافظة، أو المنتجات.</p>
            
            <input 
              type="text" 
              placeholder="رقم الفاتورة..." 
              className="input-field" 
              value={editInputCode}
              onChange={e => setEditInputCode(e.target.value)}
              style={{ marginBottom: "1.5rem" }}
              autoFocus
            />

            <div style={{ display: "flex", gap: "1rem" }}>
              <button onClick={handleLoadInvoiceForEdit} disabled={!editInputCode || isProcessing} className="btn btn-primary" style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}>
                {isProcessing ? <><Loader2 className="animate-spin" size={18} /> جاري التحميل...</> : "تحميل الفاتورة"}
              </button>
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Append to Order Modal */}
      {showAppendModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
          <div className="glass-panel" style={{ padding: "2rem", width: "400px", maxWidth: "90%" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>إضافة المنتجات لفاتورة سابقة</h2>
            <p style={{ color: "#9ca3af", marginBottom: "1.5rem", fontSize: "0.9rem" }}>أدخل رقم الفاتورة القديمة (مثال: 240626-1) عشان نضيف القطع دي عليها.</p>
            
            <input 
              type="text" 
              placeholder="رقم الفاتورة..." 
              className="input-field" 
              value={appendInvoiceCode}
              onChange={e => setAppendInvoiceCode(e.target.value)}
              style={{ marginBottom: "1.5rem" }}
              autoFocus
            />

            <div style={{ display: "flex", gap: "1rem" }}>
              <button onClick={handleAppendToOrder} disabled={!appendInvoiceCode || isProcessing} className="btn btn-primary" style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}>
                {isProcessing ? <><Loader2 className="animate-spin" size={18} /> جاري الإضافة...</> : "تأكيد الإضافة"}
              </button>
              <button onClick={() => setShowAppendModal(false)} className="btn btn-secondary">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Deposit Modal (POS) */}
      {showEditDepositModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100
        }}>
          <div className="glass-panel" style={{ padding: "2rem", width: "400px", maxWidth: "90%" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>تعديل تحصيل لفاتورة</h2>
            <p style={{ color: "#9ca3af", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
              أدخل رقم الفاتورة والمبلغ الإضافي اللي العميل حوله عشان يتخصم من التحصيل (وهيتحدث في بوسطة أوتوماتيك لو مبعوت).
            </p>
            
            <input 
              type="text" 
              placeholder="رقم الفاتورة (مثال: 240626-1)" 
              className="input-field" 
              value={editDepositInvoiceCode}
              onChange={e => setEditDepositInvoiceCode(e.target.value)}
              style={{ marginBottom: "1rem" }}
              autoFocus
            />

            <input 
              type="number" 
              placeholder="قيمة التحويل الإضافي (مثال: 200)" 
              className="input-field" 
              value={editDepositAmountPOS}
              onChange={e => setEditDepositAmountPOS(e.target.value === "" ? "" : Number(toEnglishDigits(e.target.value)))}
              style={{ marginBottom: "1rem" }}
            />

            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>إرفاق صورة التحويل (إجباري):</label>
            <input 
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setEditDepositScreenshotPOS(e.target.files[0]);
                }
              }}
              className="input-field"
              style={{ marginBottom: "1.5rem", padding: "0.5rem" }}
            />

            <div style={{ display: "flex", gap: "1rem" }}>
              <button 
                onClick={handleUpdateDepositPOS} 
                disabled={!editDepositInvoiceCode || editDepositAmountPOS === "" || editDepositAmountPOS <= 0 || !editDepositScreenshotPOS || isUpdatingDepositPOS} 
                className="btn btn-primary" 
                style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
              >
                {isUpdatingDepositPOS ? <><Loader2 className="animate-spin" size={18} /> جاري التحديث...</> : "تأكيد وتحديث بوسطة"}
              </button>
              <button onClick={() => { setShowEditDepositModal(false); setEditDepositScreenshotPOS(null); }} className="btn btn-secondary" disabled={isUpdatingDepositPOS}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hover-bg:hover { transform: translateY(-3px); border-color: var(--primary); box-shadow: var(--shadow-glow); }
        .pos-layout {
          display: flex;
          flex-grow: 1;
          overflow: hidden;
        }
        .pos-catalog {
          flex-grow: 1;
          padding: 2rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .pos-cart {
          width: 380px;
          background: var(--secondary);
          border-left: 1px solid var(--border);
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 768px) {
          .pos-layout {
            flex-direction: column;
            overflow: auto;
          }
          .pos-catalog {
            padding: 1rem;
            overflow-y: visible;
          }
          .pos-cart {
            width: 100%;
            border-left: none;
            border-top: 2px solid var(--primary);
            height: auto;
          }
        }
        @media print {
          body * { visibility: hidden; }
          #printable-receipt, #printable-receipt * { visibility: visible; }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}
