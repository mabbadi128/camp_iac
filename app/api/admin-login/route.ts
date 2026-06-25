import { NextResponse } from "next/server";

function normalizePassword(value: string) {
  return value
    .trim()
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString());
}

export async function POST(request: Request) {
  const body = await request.json();

  const passwordFromUser = normalizePassword(String(body.password || ""));
  const adminPassword = normalizePassword(String(process.env.ADMIN_PASSWORD || ""));

  console.log("USER PASSWORD LENGTH:", passwordFromUser.length);
  console.log("ENV PASSWORD EXISTS:", adminPassword ? "YES" : "NO");
  console.log("ENV PASSWORD LENGTH:", adminPassword.length);

  if (!adminPassword) {
    return NextResponse.json(
      { message: "كلمة السر غير مقروءة من .env.local" },
      { status: 500 }
    );
  }

  if (passwordFromUser !== adminPassword) {
    return NextResponse.json(
      { message: "كلمة السر غير صحيحة" },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set("quiz_admin_auth", "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return response;
}