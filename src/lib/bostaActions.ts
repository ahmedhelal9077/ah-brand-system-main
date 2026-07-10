"use server";

import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth";

const prisma = new PrismaClient();

const BOSTA_CITIES_MAP: Record<string, { cityId: string, cityName: string, zoneId: string, zoneName: string }> = {
  "القاهرة": { cityId: "FceDyHXwpSYYF9zGW", cityName: "Cairo", zoneId: "NQz5sDOeG", zoneName: "Helwan" },
  "Cairo": { cityId: "FceDyHXwpSYYF9zGW", cityName: "Cairo", zoneId: "NQz5sDOeG", zoneName: "Helwan" },
  "الجيزة": { cityId: "0064Qb0OgcA", cityName: "Giza", zoneId: "6H2Y1vDnwkU", zoneName: "ElHaram" },
  "Giza": { cityId: "0064Qb0OgcA", cityName: "Giza", zoneId: "6H2Y1vDnwkU", zoneName: "ElHaram" },
  "الاسكندرية": { cityId: "Jrb6X6ucjiYgMP4T7", cityName: "Alexandria", zoneId: "Dcz5iviLLiJ", zoneName: "ElMontazah" },
  "إسكندرية": { cityId: "Jrb6X6ucjiYgMP4T7", cityName: "Alexandria", zoneId: "Dcz5iviLLiJ", zoneName: "ElMontazah" },
  "اسكندرية": { cityId: "Jrb6X6ucjiYgMP4T7", cityName: "Alexandria", zoneId: "Dcz5iviLLiJ", zoneName: "ElMontazah" },
  "Alexandria": { cityId: "Jrb6X6ucjiYgMP4T7", cityName: "Alexandria", zoneId: "Dcz5iviLLiJ", zoneName: "ElMontazah" },
  "المنصورة": { cityId: "RrDhS8YYsXAwZ9Zfo", cityName: "Dakahlia", zoneId: "i3dGei0sqb5", zoneName: "Aga" },
  "الدقهلية": { cityId: "RrDhS8YYsXAwZ9Zfo", cityName: "Dakahlia", zoneId: "i3dGei0sqb5", zoneName: "Aga" },
  "الزقازيق": { cityId: "6ExcoGbpYHnggP8JD", cityName: "Sharqia", zoneId: "qj1cLDrTnYR", zoneName: "ElZakazik" },
  "الشرقية": { cityId: "6ExcoGbpYHnggP8JD", cityName: "Sharqia", zoneId: "qj1cLDrTnYR", zoneName: "ElZakazik" },
  "طنطا": { cityId: "K3RwC677J8kJytdZD", cityName: "Gharbia", zoneId: "id2ECbuxHPP", zoneName: "Tanta" },
  "الغربية": { cityId: "K3RwC677J8kJytdZD", cityName: "Gharbia", zoneId: "id2ECbuxHPP", zoneName: "Tanta" },
  "بنها": { cityId: "yp3atroeTwnyiBNKE", cityName: "El Kalioubia", zoneId: "Zm_gFyNDth4", zoneName: "Qalyoub" },
  "القليوبية": { cityId: "yp3atroeTwnyiBNKE", cityName: "El Kalioubia", zoneId: "Zm_gFyNDth4", zoneName: "Qalyoub" },
  "العبور": { cityId: "yp3atroeTwnyiBNKE", cityName: "El Kalioubia", zoneId: "Zm_gFyNDth4", zoneName: "Qalyoub" },
  "شبين الكوم": { cityId: "ruBSjGBDX9wpRa3cc", cityName: "Monufia", zoneId: "UTlrEwOne3f", zoneName: "Shebeen ElKom" },
  "المنوفية": { cityId: "ruBSjGBDX9wpRa3cc", cityName: "Monufia", zoneId: "UTlrEwOne3f", zoneName: "Shebeen ElKom" },
  "دمنهور": { cityId: "g3GchTSmCgR2JynsJ", cityName: "Behira", zoneId: "FwhfuxIXJc2", zoneName: "Kafr ElDawar" },
  "البحيرة": { cityId: "g3GchTSmCgR2JynsJ", cityName: "Behira", zoneId: "FwhfuxIXJc2", zoneName: "Kafr ElDawar" },
  "كفر الشيخ": { cityId: "ByP7rFCjL6XzF6j4S", cityName: "Kafr Alsheikh", zoneId: "nFA25mUoSu9", zoneName: "Kafr ElSheikh" },
  "دمياط": { cityId: "qoZvYcZ8Cqji4pGp5", cityName: "Damietta", zoneId: "I74EMXTjrny", zoneName: "Qesm Damietta 01" },
  "بورسعيد": { cityId: "skFtf6ZmKo8kBEBDK", cityName: "Port Said", zoneId: "LbiunDUkIj", zoneName: "Qesm ElSharq" },
  "الاسماعيلية": { cityId: "PJqNriLtFtx2cfkKP", cityName: "Ismailia", zoneId: "__lPpoC45_C", zoneName: "Ismailia 01" },
  "الإسماعيلية": { cityId: "PJqNriLtFtx2cfkKP", cityName: "Ismailia", zoneId: "__lPpoC45_C", zoneName: "Ismailia 01" },
  "السويس": { cityId: "PickurJ5uJZ9rDTHW", cityName: "Suez", zoneId: "jncrc5c-ks4", zoneName: "Port Tawfik" },
  "العريش": { cityId: "ZuCaDAVQlPT", cityName: "North Sinai", zoneId: "ur9NCqG_HVD", zoneName: "ElArish" },
  "الفيوم": { cityId: "BW5MiNxEirB7tuz2y", cityName: "Fayoum", zoneId: "XOrKI_XCWDz", zoneName: "Fayoum" },
  "بني سويف": { cityId: "LzbbvTzZ7D2CgE2PL", cityName: "Bani Suif", zoneId: "B_7aviisBY7", zoneName: "Beni Suef" },
  "المنيا": { cityId: "si6eLnKjXqTFTMBj9", cityName: "Menya", zoneId: "ja03e0agN4c", zoneName: "ElMinya" },
  "اسيوط": { cityId: "7mDPAohM3ArSZmWTm", cityName: "Assuit", zoneId: "kdolpWDwRkg", zoneName: "Asyut 01" },
  "أسيوط": { cityId: "7mDPAohM3ArSZmWTm", cityName: "Assuit", zoneId: "kdolpWDwRkg", zoneName: "Asyut 01" },
  "سوهاج": { cityId: "n3EENg2adhuR9xBZK", cityName: "Sohag", zoneId: "MmXquOXW887", zoneName: "Sohag 01" },
  "قنا": { cityId: "vfTHTes3uGjAszgtg", cityName: "Qena", zoneId: "y4biTJ94x7Z", zoneName: "Qena" },
  "الاقصر": { cityId: "wgYEdH2WMzxGE2Ztp", cityName: "Luxor", zoneId: "Gzzs636DLbl", zoneName: "ElZenia" },
  "الأقصر": { cityId: "wgYEdH2WMzxGE2Ztp", cityName: "Luxor", zoneId: "Gzzs636DLbl", zoneName: "ElZenia" },
  "اسوان": { cityId: "kLvZ5JY6LJPL5chzN", cityName: "Aswan", zoneId: "E866yF-p4U", zoneName: "Qesm Aswan" },
  "أسوان": { cityId: "kLvZ5JY6LJPL5chzN", cityName: "Aswan", zoneId: "E866yF-p4U", zoneName: "Qesm Aswan" },
  "مطروح": { cityId: "KBpGiRZJMIx", cityName: "Matrouh", zoneId: "M1WuQy8PDO9", zoneName: "Marsa Matrouh" },
  "البحر الاحمر": { cityId: "r5TscLCNSjR2GimxQ", cityName: "Red Sea", zoneId: "1e-QgHqN0pk", zoneName: "Hurghada" },
  "الشيخ زايد": { cityId: "0064Qb0OgcA", cityName: "Giza", zoneId: "6H2Y1vDnwkU", zoneName: "ElHaram" },
  "اكتوبر": { cityId: "0064Qb0OgcA", cityName: "Giza", zoneId: "6H2Y1vDnwkU", zoneName: "ElHaram" },
  "أكتوبر": { cityId: "0064Qb0OgcA", cityName: "Giza", zoneId: "6H2Y1vDnwkU", zoneName: "ElHaram" },
  "مدينتي": { cityId: "FceDyHXwpSYYF9zGW", cityName: "Cairo", zoneId: "NQz5sDOeG", zoneName: "Helwan" },
  "الشروق": { cityId: "FceDyHXwpSYYF9zGW", cityName: "Cairo", zoneId: "NQz5sDOeG", zoneName: "Helwan" },
  "التجمع": { cityId: "FceDyHXwpSYYF9zGW", cityName: "Cairo", zoneId: "NQz5sDOeG", zoneName: "Helwan" },
};

const getBostaLocation = (cityName: string) => {
  if (!cityName) return BOSTA_CITIES_MAP["القاهرة"]; // Default Cairo
  const cleanName = cityName.trim();
  return BOSTA_CITIES_MAP[cleanName] || BOSTA_CITIES_MAP["القاهرة"];
};

export async function sendOrderToBosta(saleId: string) {
  const session = await getSession();
  if (!session) throw new Error("Not logged in");

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { 
      items: {
        include: {
          productVariant: {
            include: {
              product: true
            }
          }
        }
      } 
    }
  });

  if (!sale) throw new Error("Order not found");
  if (!sale.customerName || !sale.customerPhone || !sale.customerCity || !sale.customerAddress) {
    throw new Error("بيانات العميل غير مكتملة (الاسم، التليفون، المحافظة، العنوان)");
  }

  const settings = await prisma.storeSettings.findFirst();
  if (!settings || !settings.bostaApiKey) {
    throw new Error("برجاء إدخال Bosta API Key في صفحة الإعدادات أولاً");
  }

  const isTantaOrder = sale.customerCity === "طنطا" || sale.customerCity?.includes("طنطا") || (sale.customerCity === "الغربية" && (sale.customerAddress?.includes("طنطا") || sale.customerAddress?.toLowerCase().includes("tanta")));

  if (isTantaOrder) {
    const trackingNumber = `LOCAL-TANTA-${sale.invoiceCode || sale.id.substring(0, 6)}`;
    await prisma.sale.update({
      where: { id: saleId },
      data: {
        bostaTracking: trackingNumber,
        bostaAwb: "/local"
      }
    });
    return { success: true, trackingNumber, awbUrl: "/local" };
  }

  // Splitting Name into first and last
  const nameParts = sale.customerName.split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ") || "-";

  const totalItems = sale.items.reduce((acc, item) => acc + item.quantity, 0);

  const loc = getBostaLocation(sale.customerCity || "");

  // Create items description
  const itemsDesc = sale.items.map(item => `${item.productVariant.product.name} (x${item.quantity})`).join(" | ");

  const payload = {
    type: sale.isExchange ? 30 : 10, // 30 is Exchange, 10 is Package Delivery
    specs: {
      packageDetails: {
        itemsCount: totalItems,
        description: `فاتورة رقم ${sale.invoiceCode} | ${itemsDesc}`
      }
    },
    dropOffAddress: {
      city: { name: loc.cityName, _id: loc.cityId },
      zone: { name: loc.zoneName, _id: loc.zoneId },
      firstLine: sale.customerAddress.trim()
    },
    receiver: {
      firstName: firstName,
      lastName: lastName,
      phone: sale.customerPhone.trim()
    } as any,
    cod: sale.remainingAmount !== null ? sale.remainingAmount : sale.totalAmount, // Use remainingAmount if available
    notes: sale.orderNotes || "",
    allowToOpenPackage: true
  };

  if (sale.customerPhone2) {
    payload.receiver.secondPhone = sale.customerPhone2.trim();
  }

  try {
    const res = await fetch("https://app.bosta.co/api/v0/deliveries", {
      method: "POST",
      headers: {
        "Authorization": settings.bostaApiKey.trim(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Bosta Error Response:", data);
      throw new Error(data.message || data.error || "خطأ من سيرفر بوسطة");
    }

    // Success! Update Sale with tracking info
    const trackingNumber = data.trackingNumber;
    // For AWB, Bosta usually uses trackingNumber in the URL or the `_id`
    const awbUrl = `https://app.bosta.co/api/v0/deliveries/awb/${data._id}`;

    await prisma.sale.update({
      where: { id: saleId },
      data: {
        bostaTracking: trackingNumber,
        bostaAwb: awbUrl
      }
    });

    return { success: true, trackingNumber, awbUrl };

  } catch (error: any) {
    console.error("Bosta API Exception:", error);
    return { error: error.message || "Failed to communicate with Bosta" };
  }
}

export async function sendBulkOrdersToBosta(saleIds: string[]) {
  const session = await getSession();
  if (!session) throw new Error("Not logged in");

  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const saleId of saleIds) {
    try {
      const res = await sendOrderToBosta(saleId);
      if (res.error) {
        results.failed++;
        results.errors.push(`Sale ${saleId.slice(-6)}: ${res.error}`);
      } else {
        results.successful++;
      }
    } catch (e: any) {
      results.failed++;
      results.errors.push(`Sale ${saleId.slice(-6)}: ${e.message}`);
    }
  }

  return results;
}

export async function updateBostaDelivery(saleId: string) {
  const session = await getSession();
  if (!session) throw new Error("Not logged in");

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { 
      items: {
        include: {
          productVariant: {
            include: {
              product: true
            }
          }
        }
      } 
    }
  });

  if (!sale) throw new Error("Order not found");
  if (!sale.bostaAwb || !sale.bostaAwb.includes('/awb/')) {
    throw new Error("Order not linked to Bosta");
  }

  const settings = await prisma.storeSettings.findFirst();
  if (!settings || !settings.bostaApiKey) {
    throw new Error("Missing Bosta API Key");
  }

  const deliveryId = sale.bostaAwb.split("/awb/")[1];
  const totalItems = sale.items.reduce((acc, item) => acc + item.quantity, 0);
  const itemsDesc = sale.items.map(item => `${item.productVariant.product.name} (x${item.quantity})`).join(" | ");

  const nameParts = (sale.customerName || "").split(" ");
  const firstName = nameParts[0] || "-";
  const lastName = nameParts.slice(1).join(" ") || "-";
  const loc = getBostaLocation(sale.customerCity || "");

  const payload = {
    cod: sale.remainingAmount !== null ? sale.remainingAmount : sale.totalAmount,
    receiver: {
      firstName: firstName,
      lastName: lastName,
      phone: (sale.customerPhone || "").trim()
    },
    dropOffAddress: {
      city: { name: loc.cityName, _id: loc.cityId },
      zone: { name: loc.zoneName, _id: loc.zoneId },
      firstLine: (sale.customerAddress || "").trim()
    },
    specs: {
      packageDetails: {
        itemsCount: totalItems,
        description: `فاتورة رقم ${sale.invoiceCode} | ${itemsDesc}`
      }
    }
  };

  try {
    const res = await fetch(`https://app.bosta.co/api/v0/deliveries/${deliveryId}`, {
      method: "PUT",
      headers: {
        "Authorization": settings.bostaApiKey.trim(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Bosta Update Error Response:", data);
      throw new Error(data.message || data.error || "خطأ من سيرفر بوسطة أثناء التعديل");
    }

    return { success: true };
  } catch (error: any) {
    console.error("Bosta API Update Exception:", error);
    return { error: error.message || "Failed to communicate with Bosta" };
  }
}
