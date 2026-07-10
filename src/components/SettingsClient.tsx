"use client";

import React, { useState, useRef } from "react";
import { Download, Upload, AlertTriangle, CheckCircle, Loader2, Send, Users, Link as LinkIcon, MapPin, Plus, Trash2 } from "lucide-react";
import { updateTelegramSettings, saveStoreLinks, saveStoreLocations } from "@/app/dashboard/settings/actions";

export default function SettingsClient({ initialSettings, initialStoreLinks = [], initialStoreLocations = [] }: { initialSettings?: any, initialStoreLinks?: any[], initialStoreLocations?: any[] }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Telegram Settings State
  const [telegramToken, setTelegramToken] = useState(initialSettings?.telegramToken || "");
  const [telegramChatId, setTelegramChatId] = useState(initialSettings?.telegramChatId || "");
  const [isTelegramEnabled, setIsTelegramEnabled] = useState(initialSettings?.isTelegramEnabled || false);
  const [savingTelegram, setSavingTelegram] = useState(false);
  // Bosta Settings State
  const [bostaApiKey, setBostaApiKey] = useState(initialSettings?.bostaApiKey || "");
  const [storeCity, setStoreCity] = useState(initialSettings?.storeCity || "");
  const [storeAddress, setStoreAddress] = useState(initialSettings?.storeAddress || "");
  const [syncingBosta, setSyncingBosta] = useState(false);

  // Links & Locations State
  const [storeLinks, setStoreLinks] = useState(initialStoreLinks);
  const [storeLocations, setStoreLocations] = useState(initialStoreLocations);

  const handleAddLink = () => setStoreLinks([...storeLinks, { id: Date.now().toString(), name: "", url: "", icon: "Globe" }]);
  const handleRemoveLink = (id: string) => setStoreLinks(storeLinks.filter((l: any) => l.id !== id));
  const handleLinkChange = (id: string, field: string, value: string) => {
    setStoreLinks(storeLinks.map((l: any) => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleAddLocation = () => setStoreLocations([...storeLocations, { id: Date.now().toString(), name: "", url: "" }]);
  const handleRemoveLocation = (id: string) => setStoreLocations(storeLocations.filter((l: any) => l.id !== id));
  const handleLocationChange = (id: string, field: string, value: string) => {
    setStoreLocations(storeLocations.map((l: any) => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleSaveIntegrations = async () => {
    try {
      setSavingTelegram(true);
      setMessage(null);
      await updateTelegramSettings(telegramToken, telegramChatId, isTelegramEnabled, bostaApiKey, storeCity, storeAddress);
      
      const linksToSave = storeLinks.map((l: any) => ({ name: l.name, url: l.url, icon: l.icon })).filter((l: any) => l.name && l.url);
      const locationsToSave = storeLocations.map((l: any) => ({ name: l.name, url: l.url })).filter((l: any) => l.name && l.url);
      
      await saveStoreLinks(linksToSave);
      await saveStoreLocations(locationsToSave);

      setMessage({ type: "success", text: "Settings and Integrations updated successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update Telegram settings" });
    } finally {
      setSavingTelegram(false);
    }
  };

  const handleSyncBostaCustomers = async () => {
    try {
      setSyncingBosta(true);
      setMessage(null);
      const res = await fetch("/api/bosta/sync-customers", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to sync customers");
      setMessage({ type: "success", text: `Successfully synced ${data.totalProcessed} customers from Bosta!` });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to sync customers" });
    } finally {
      setSyncingBosta(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("Failed to generate backup");
      
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `bag-inventory-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage({ type: "success", text: "Backup downloaded successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmRestore = window.confirm(
      "WARNING: This will completely wipe all current products, sales, and settings, and replace them with the data from the backup file. Are you absolutely sure you want to proceed?"
    );

    if (!confirmRestore) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const fileText = await file.text();
      const jsonData = JSON.parse(fileText);

      const res = await fetch("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonData)
      });

      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error || "Failed to restore backup");

      setMessage({ type: "success", text: "Database restored successfully! Please refresh the page." });
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Invalid backup file format" });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Settings & Data Management</h1>
        <p style={{ color: "#9ca3af" }}>Backup your store's data or restore from a previous backup file.</p>
      </div>

      {message && (
        <div style={{ 
          padding: "1rem", marginBottom: "2rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "0.5rem",
          background: message.type === "success" ? "rgba(34, 197, 94, 0.1)" : message.type === "warning" ? "rgba(234, 179, 8, 0.1)" : "rgba(239, 68, 68, 0.1)",
          color: message.type === "success" ? "var(--accent)" : message.type === "warning" ? "var(--warning)" : "var(--danger)",
          border: `1px solid ${message.type === "success" ? "var(--accent)" : message.type === "warning" ? "var(--warning)" : "var(--danger)"}`
        }}>
          {message.type === "success" ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          {message.text}
        </div>
      )}

      <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        
        {/* Backup Card */}
        <div className="glass-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--primary)", fontSize: "1.2rem", fontWeight: "bold" }}>
            <Download size={24} /> Export Backup
          </div>
          <p style={{ color: "#9ca3af", fontSize: "0.95rem" }}>
            Download a full snapshot of your current database. This includes all users, categories, products, inventory, sales, and activity logs. Save this file in a secure location.
          </p>
          <button 
            onClick={handleDownloadBackup} 
            disabled={loading}
            className="btn btn-primary" 
            style={{ marginTop: "auto", justifyContent: "center" }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} 
            Download Backup (.json)
          </button>
        </div>

        {/* Restore Card */}
        <div className="glass-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--danger)", fontSize: "1.2rem", fontWeight: "bold" }}>
            <Upload size={24} /> Restore Backup
          </div>
          <p style={{ color: "#9ca3af", fontSize: "0.95rem" }}>
            Upload a previously downloaded `.json` backup file. <strong style={{color: "var(--danger)"}}>Warning: This will permanently erase and replace all your current data!</strong>
          </p>
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            style={{ display: "none" }} 
            onChange={handleRestoreBackup} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={loading}
            className="btn btn-danger" 
            style={{ marginTop: "auto", justifyContent: "center" }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />} 
            Select File to Restore
          </button>
        </div>

        {/* Telegram Integration Card */}
        <div className="glass-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem", border: "1px solid rgba(14, 165, 233, 0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#0ea5e9", fontSize: "1.2rem", fontWeight: "bold" }}>
              <Send size={24} /> Telegram Integration
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input 
                type="checkbox" 
                checked={isTelegramEnabled}
                onChange={(e) => setIsTelegramEnabled(e.target.checked)}
                style={{ width: "1.2rem", height: "1.2rem", accentColor: "#0ea5e9" }}
              />
              <span style={{ fontSize: "0.9rem", color: isTelegramEnabled ? "#0ea5e9" : "#9ca3af" }}>Enabled</span>
            </label>
          </div>
          
          <p style={{ color: "#9ca3af", fontSize: "0.95rem" }}>
            Automate sending online order receipts and deposit screenshots to a Telegram group.
          </p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", opacity: isTelegramEnabled ? 1 : 0.5, pointerEvents: isTelegramEnabled ? "auto" : "none" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.85rem", color: "var(--foreground)" }}>Bot Token</label>
              <input 
                type="text" 
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                className="input-field"
                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                style={{ marginBottom: 0 }}
              />
              <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.2rem" }}>Get this from @BotFather on Telegram.</div>
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.85rem", color: "var(--foreground)" }}>Group Chat ID</label>
              <input 
                type="text" 
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                className="input-field"
                placeholder="-1001234567890"
                style={{ marginBottom: 0 }}
              />
              <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.2rem" }}>Add your bot to the group and get the Chat ID.</div>
            </div>
          </div>
        </div>
        
        {/* Bosta Integration Card */}
        <div className="glass-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem", border: "1px solid rgba(234, 179, 8, 0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--warning)", fontSize: "1.2rem", fontWeight: "bold" }}>
            <Send size={24} /> Bosta Integration
          </div>
          <p style={{ color: "#9ca3af", fontSize: "0.95rem" }}>
            Connect to Bosta API to create shipments automatically.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.85rem", color: "var(--foreground)" }}>Bosta API Key</label>
              <input 
                type="text" 
                value={bostaApiKey}
                onChange={(e) => setBostaApiKey(e.target.value)}
                className="input-field"
                placeholder="eyJhb..."
                style={{ marginBottom: 0 }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.85rem", color: "var(--foreground)" }}>Store City</label>
              <input 
                type="text" 
                value={storeCity}
                onChange={(e) => setStoreCity(e.target.value)}
                className="input-field"
                placeholder="Cairo"
                style={{ marginBottom: 0 }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.85rem", color: "var(--foreground)" }}>Store Address (First Line)</label>
              <input 
                type="text" 
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                className="input-field"
                placeholder="123 Street Name"
                style={{ marginBottom: 0 }}
              />
            </div>
            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
              <button 
                onClick={handleSyncBostaCustomers} 
                disabled={syncingBosta}
                className="btn btn-primary" 
                style={{ width: "100%", justifyContent: "center" }}
              >
                {syncingBosta ? <Loader2 size={18} className="animate-spin" /> : <Users size={18} />} 
                Sync Customers from Bosta
              </button>
              <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginTop: "0.5rem", textAlign: "center" }}>
                Import past customers to enable smart autocomplete in the POS.
              </p>
            </div>
          </div>
        </div>

      </div>
      
      <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "2rem", marginTop: "2rem" }}>
        {/* Dynamic Store Links Card */}
        <div className="glass-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem", border: "1px solid rgba(236, 72, 153, 0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#ec4899", fontSize: "1.2rem", fontWeight: "bold" }}>
              <LinkIcon size={24} /> Social & Contact Links
            </div>
            <button onClick={handleAddLink} className="btn" style={{ background: "rgba(236, 72, 153, 0.1)", color: "#ec4899", padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>
              <Plus size={16} /> Add Link
            </button>
          </div>
          <p style={{ color: "#9ca3af", fontSize: "0.95rem" }}>
            Manage the social and contact links displayed in the store header.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {storeLinks.map((link: any) => (
              <div key={link.id} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                <select 
                  value={link.icon} 
                  onChange={(e) => handleLinkChange(link.id, 'icon', e.target.value)}
                  className="input-field" 
                  style={{ width: "auto", flexShrink: 0 }}
                >
                  <option value="Globe">Web</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Instagram">Instagram</option>
                </select>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <input type="text" placeholder="Name (e.g. Group)" value={link.name} onChange={(e) => handleLinkChange(link.id, 'name', e.target.value)} className="input-field" style={{ marginBottom: 0 }} />
                  <input type="url" placeholder="URL" value={link.url} onChange={(e) => handleLinkChange(link.id, 'url', e.target.value)} className="input-field" style={{ marginBottom: 0 }} />
                </div>
                <button onClick={() => handleRemoveLink(link.id)} className="btn btn-danger" style={{ padding: "0.6rem" }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {storeLinks.length === 0 && <div style={{ color: "#9ca3af", textAlign: "center", padding: "1rem 0" }}>No links added yet.</div>}
          </div>
        </div>

        {/* Dynamic Store Locations Card */}
        <div className="glass-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#10b981", fontSize: "1.2rem", fontWeight: "bold" }}>
              <MapPin size={24} /> Store Branches
            </div>
            <button onClick={handleAddLocation} className="btn" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>
              <Plus size={16} /> Add Branch
            </button>
          </div>
          <p style={{ color: "#9ca3af", fontSize: "0.95rem" }}>
            Manage the physical branches displayed in the store header and footer.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {storeLocations.map((loc: any) => (
              <div key={loc.id} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <input type="text" placeholder="Branch Name (e.g. Tanta Branch)" value={loc.name} onChange={(e) => handleLocationChange(loc.id, 'name', e.target.value)} className="input-field" style={{ marginBottom: 0 }} />
                  <input type="url" placeholder="Google Maps URL" value={loc.url} onChange={(e) => handleLocationChange(loc.id, 'url', e.target.value)} className="input-field" style={{ marginBottom: 0 }} />
                </div>
                <button onClick={() => handleRemoveLocation(loc.id)} className="btn btn-danger" style={{ padding: "0.6rem" }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {storeLocations.length === 0 && <div style={{ color: "#9ca3af", textAlign: "center", padding: "1rem 0" }}>No branches added yet.</div>}
          </div>
        </div>
      </div>
      
      {/* Save Integrations Button */}
      <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
        <button 
          onClick={handleSaveIntegrations} 
          disabled={savingTelegram}
          className="btn" 
          style={{ background: "var(--primary)", color: "white", padding: "1rem 2rem", fontSize: "1.1rem" }}
        >
          {savingTelegram ? <Loader2 size={18} className="animate-spin" /> : "Save All Integrations"}
        </button>
      </div>
    </div>
  );
}
