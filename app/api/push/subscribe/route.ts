import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const body = await request.json();

  const subscription = body.subscription;
  const userAgent = request.headers.get("user-agent") || "";

  if (
    !subscription?.endpoint ||
    !subscription?.keys?.p256dh ||
    !subscription?.keys?.auth
  ) {
    return NextResponse.json(
      { message: "بيانات الاشتراك غير كاملة" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
    {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: userAgent,
    },
    {
      onConflict: "endpoint",
    }
  );

  if (error) {
    return NextResponse.json(
      {
        message: "فشل حفظ الاشتراك",
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}