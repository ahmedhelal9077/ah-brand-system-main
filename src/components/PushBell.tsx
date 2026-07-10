"use client";

import { useState, useEffect } from "react";
import { Bell, BellRing } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushBell() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(subscription !== null);
        });
      });
    }
  }, []);

  const subscribeToPush = async () => {
    if (!isSupported) return alert("الإشعارات غير مدعومة في متصفحك");
    
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
            console.error("No VAPID public key available.");
            return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        });
        
        if (res.ok) {
            setIsSubscribed(true);
            alert('تم تفعيل الإشعارات بنجاح! 🔔');
        } else {
            alert('حدث خطأ أثناء تفعيل الإشعارات.');
        }
      } else {
        alert('تم رفض صلاحية الإشعارات.');
      }
    } catch (error) {
      console.error('Error subscribing to push:', error);
      alert('حدث خطأ أثناء تفعيل الإشعارات.');
    }
  };

  if (!isSupported) return null;

  return (
    <button 
        onClick={subscribeToPush} 
        style={{ color: isSubscribed ? "var(--primary)" : "var(--foreground)", opacity: isSubscribed ? 1 : 0.7, transition: "opacity 0.2s", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }} 
        className="hover-opacity" 
        title={isSubscribed ? "الإشعارات مفعلة" : "تفعيل الإشعارات"}
    >
      {isSubscribed ? <BellRing size={24} /> : <Bell size={24} />}
    </button>
  );
}
