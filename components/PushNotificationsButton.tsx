// "use client";

// import { useState } from "react";

// function urlBase64ToUint8Array(base64String: string) {
//   const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

//   const base64 = (base64String + padding)
//     .replace(/-/g, "+")
//     .replace(/_/g, "/");

//   const rawData = window.atob(base64);
//   const outputArray = new Uint8Array(rawData.length);

//   for (let index = 0; index < rawData.length; index++) {
//     outputArray[index] = rawData.charCodeAt(index);
//   }

//   return outputArray;
// }

// export default function PushNotificationsButton() {
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);

//   async function enableNotifications() {
//     setMessage("");

//     if (!("serviceWorker" in navigator)) {
//       setMessage("المتصفح لا يدعم Service Worker");
//       return;
//     }

//     if (!("PushManager" in window)) {
//       setMessage("المتصفح لا يدعم إشعارات Push");
//       return;
//     }

//     if (!("Notification" in window)) {
//       setMessage("المتصفح لا يدعم الإشعارات");
//       return;
//     }

//     const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

//     if (!publicKey) {
//       setMessage("VAPID public key غير موجود");
//       return;
//     }

//     setLoading(true);

//     const permission = await Notification.requestPermission();

//     if (permission !== "granted") {
//       setLoading(false);
//       setMessage("لازم تسمح بالإشعارات من المتصفح");
//       return;
//     }

// await navigator.serviceWorker.register("/sw.js", {
//   scope: "/",
// });

// const registration = await navigator.serviceWorker.ready;

// let subscription = await registration.pushManager.getSubscription();

// if (!subscription) {
//   subscription = await registration.pushManager.subscribe({
//     userVisibleOnly: true,
//     applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
//   });
// }

//     const res = await fetch("/api/push/subscribe", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         subscription,
//       }),
//     });

//     setLoading(false);

//     if (!res.ok) {
//       setMessage("فشل تفعيل الإشعارات");
//       return;
//     }

//     setMessage("تم تفعيل إشعارات المعسكر ✅");
//   }

//   return (
//     <div className="rounded-3xl border border-[#F2C94C]/30 bg-[#F2C94C]/10 p-4 text-center shadow-[0_18px_45px_rgba(0,0,0,0.25)] backdrop-blur-md">
//       <button
//         onClick={enableNotifications}
//         disabled={loading}
//         className="w-full rounded-2xl bg-[#F2C94C] px-5 py-3 font-black text-[#063F36] transition hover:scale-[1.02] disabled:opacity-60"
//       >
//         {loading ? "جار التفعيل..." : "تفعيل إشعارات المعسكر 🔔"}
//       </button>

//       {message && (
//         <p className="mt-3 text-sm font-bold text-white/85">{message}</p>
//       )}
//     </div>
//   );
// }


"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index++) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

async function saveSubscription(subscription: PushSubscription) {
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subscription,
    }),
  });

  return res.ok;
}

export default function PushNotificationsButton() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  async function getReadyRegistration() {
    await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    return await navigator.serviceWorker.ready;
  }

  async function syncExistingSubscription() {
    try {
      if (!("serviceWorker" in navigator)) return;
      if (!("PushManager" in window)) return;
      if (!("Notification" in window)) return;

      if (Notification.permission !== "granted") {
        setIsEnabled(false);
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        return;
      }

      const registration = await getReadyRegistration();

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        });
      }

      const saved = await saveSubscription(subscription);

      if (saved) {
        setIsEnabled(true);
        setMessage("الإشعارات مفعّلة ✅");
      }
    } catch {
      setIsEnabled(false);
    }
  }

  async function enableNotifications() {
    setMessage("");

    if (!("serviceWorker" in navigator)) {
      setMessage("المتصفح لا يدعم Service Worker");
      return;
    }

    if (!("PushManager" in window)) {
      setMessage("المتصفح لا يدعم إشعارات Push");
      return;
    }

    if (!("Notification" in window)) {
      setMessage("المتصفح لا يدعم الإشعارات");
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!publicKey) {
      setMessage("VAPID public key غير موجود");
      return;
    }

    setLoading(true);

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setLoading(false);
        setMessage("لازم تسمح بالإشعارات من المتصفح");
        return;
      }

      const registration = await getReadyRegistration();

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        });
      }

      const saved = await saveSubscription(subscription);

      setLoading(false);

      if (!saved) {
        setMessage("فشل حفظ الاشتراك");
        return;
      }

      setIsEnabled(true);
      setMessage("تم تفعيل إشعارات المعسكر ✅");
    } catch {
      setLoading(false);
      setMessage("صار خطأ أثناء تفعيل الإشعارات");
    }
  }

  useEffect(() => {
    syncExistingSubscription();
  }, []);

  return (
    <div className="rounded-3xl border border-[#F2C94C]/30 bg-[#F2C94C]/10 p-4 text-center shadow-[0_18px_45px_rgba(0,0,0,0.25)] backdrop-blur-md">
      <button
        onClick={enableNotifications}
        disabled={loading}
        className="w-full rounded-2xl bg-[#F2C94C] px-5 py-3 font-black text-[#063F36] transition hover:scale-[1.02] disabled:opacity-60"
      >
        {loading
          ? "جار التفعيل..."
          : isEnabled
          ? "إشعارات المعسكر مفعّلة ✅"
          : "تفعيل إشعارات المعسكر 🔔"}
      </button>

      {message && (
        <p className="mt-3 text-sm font-bold text-white/85">{message}</p>
      )}
    </div>
  );
}