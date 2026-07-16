"use client";
import { useSettings } from "@/lib/SettingsContext";

import { useEffect, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";

type CameraScannerProps = {
  onScan: (decodedText: string) => void;
  onClose: () => void;
};

export default function CameraScanner({ onScan, onClose }: CameraScannerProps) {
  const { t } = useSettings();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // We delay slightly to ensure the #reader element is fully mounted
    const timeoutId = setTimeout(() => {
      if (!document.getElementById("reader")) return;

      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        {
          fps: 30, // Increased to 30 for faster scanning
          qrbox: { width: 300, height: 150 }, // Rectangular box is much better for 1D barcodes
          aspectRatio: 1.0,
          formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.QR_CODE],

          videoConstraints: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            advanced: [{ zoom: 2.0 }] as any
          }
        },
        /* verbose= */false
      );

      scannerRef.current.render(
        (decodedText) => {
          if (scannerRef.current) {
            scannerRef.current.clear();
          }
          onScan(decodedText);
        },
        (error) => {

          // ignore scan errors, they happen continuously when no barcode is found
        });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (scannerRef.current) {
        scannerRef.current.clear().catch((e) => console.error("Failed to clear scanner", e));
      }
    };
  }, [onScan]);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "1rem" }}>
      <div className="glass-panel" style={{ background: "var(--background)", padding: "1.5rem", borderRadius: "var(--radius-lg)", width: "100%", maxWidth: "500px", display: "flex", flexDirection: "column" }}>
        <h3 style={{ marginBottom: "1rem", textAlign: "center", fontWeight: "bold" }}>{"سكانر الكاميرا"}</h3>
        
        <div id="reader" style={{ width: "100%", background: "#fff", color: "#000", borderRadius: "8px", overflow: "hidden" }}></div>
        
        <button onClick={onClose} className="btn btn-secondary" style={{ marginTop: "1.5rem", width: "100%" }}>{"إلغاء وإغلاق"}

        </button>
      </div>
    </div>);

}
