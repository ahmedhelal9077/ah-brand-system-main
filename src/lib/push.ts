import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function initWebPush() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
  
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("VAPID keys are missing!");
    return false;
  }
  
  webpush.setVapidDetails(
    'mailto:contact@ahbrand.com',
    vapidPublicKey,
    vapidPrivateKey
  );
  return true;
}

export async function notifyAllSubscribers(title: string, body: string, url: string = '/') {
  if (!initWebPush()) return;

  try {
    const subscriptions = await prisma.pushSubscription.findMany();
    
    const payload = JSON.stringify({
      title,
      body,
      url,
      icon: '/icon512_maskable.png'
    });

    const promises = subscriptions.map(sub => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth,
          p256dh: sub.p256dh
        }
      };
      
      return webpush.sendNotification(pushSub, payload).catch(err => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription has expired or is no longer valid
          console.log('Subscription has expired or is no longer valid: ', err);
          return prisma.pushSubscription.delete({ where: { id: sub.id } });
        } else {
          console.error('Subscription error: ', err);
        }
      });
    });

    // Don't await this so it doesn't block the server action response
    Promise.all(promises).catch(console.error);
  } catch (error) {
    console.error("Error sending push notifications:", error);
  }
}
