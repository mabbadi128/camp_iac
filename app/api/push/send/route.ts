import { NextResponse, type NextRequest } from "next/server";
import * as webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

webpush.setVapidDetails(
  process.env.WEB_PUSH_EMAIL || "mailto:test@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

export async function POST(request: NextRequest) {
  const adminAuth = request.cookies.get("quiz_admin_auth")?.value;

  if (adminAuth !== "true") {
    return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
  }

  const bodyData = await request.json();

  const title = bodyData.title || "إشعار المعسكر";
  const body = bodyData.body || "";
  const url = bodyData.url || "/";

  if (!body.trim()) {
    return NextResponse.json(
      { message: "نص الإشعار مطلوب" },
      { status: 400 }
    );
  }

  const { data: subscriptions, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("*");

  if (error) {
    return NextResponse.json(
      {
        message: "فشل تحميل الاشتراكات",
        error: error.message,
      },
      { status: 500 }
    );
  }

  const payload = JSON.stringify({
    title,
    body,
    url,
  });

  const results = await Promise.allSettled(
    (subscriptions || []).map(async (item) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: item.endpoint,
            keys: {
              p256dh: item.p256dh,
              auth: item.auth,
            },
          },
          payload
        );

        return true;
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await supabaseAdmin
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", item.endpoint);
        }

        throw error;
      }
    })
  );

  const sentCount = results.filter(
    (result) => result.status === "fulfilled"
  ).length;

  const failedCount = results.filter(
    (result) => result.status === "rejected"
  ).length;

  return NextResponse.json({
    success: true,
    total: subscriptions?.length || 0,
    sent: sentCount,
    failed: failedCount,
  });
}