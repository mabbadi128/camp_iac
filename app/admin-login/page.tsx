"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    setMessage("");

    if (!password.trim()) {
      setMessage("اكتب كلمة السر");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setMessage(data?.message || "كلمة السر غير صحيحة");
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#063F36] p-5 text-white">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
        <div className="mb-6 rounded-[1.5rem] bg-white p-6">
          <img src="/iac-logo.png" alt="Logo" className="mx-auto h-28 w-auto" />
        </div>

        <h1 className="text-center text-3xl font-black">دخول الأدمن</h1>

        <div className="mt-6 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") login();
            }}
            placeholder="كلمة سر الأدمن"
            className="w-full rounded-2xl bg-white px-5 py-4 text-right text-[#063F36] outline-none placeholder:text-gray-400"
          />

          {message && (
            <p className="rounded-2xl bg-red-500/20 p-3 text-center text-sm font-bold text-red-100">
              {message}
            </p>
          )}

          <button
            onClick={login}
            disabled={loading}
            className="w-full rounded-2xl bg-[#F2C94C] px-6 py-4 text-lg font-black text-[#063F36] disabled:opacity-50"
          >
            {loading ? "جار الدخول..." : "دخول لوحة التحكم"}
          </button>

          <a
  href="/"
  className="block w-full rounded-2xl border border-white/20 px-6 py-4 text-center font-black text-white hover:bg-white/10"
>
  العودة للصفحة الرئيسية
</a>
        </div>
      </div>
    </main>
  );
}