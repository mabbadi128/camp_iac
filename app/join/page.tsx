"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type EventData = {
  id: string;
  title: string;
  code: string;
  status: string;
};

export default function JoinPage() {
  const [event, setEvent] = useState<EventData | null>(null);

  const [playerName, setPlayerName] = useState("");
  const [playerCode, setPlayerCode] = useState("");

  const [loadingEvent, setLoadingEvent] = useState(true);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState("");

async function loadEventAutomatically(showLoading = true) {
  if (showLoading) {
    setLoadingEvent(true);
  }

  setMessage("");

  const params = new URLSearchParams(window.location.search);
  const codeFromUrl = params.get("code");

  if (codeFromUrl) {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("code", codeFromUrl)
      .single();

    if (showLoading) {
      setLoadingEvent(false);
    }

    if (error || !data) {
      setEvent(null);
      setMessage("رابط الفعالية غير صحيح");
      return;
    }

    setEvent(data as EventData);
    return;
  }

  const { data: currentEvent, error: currentError } = await supabase
    .from("events")
    .select("*")
    .eq("is_current", true)
    .maybeSingle();

  if (!currentError && currentEvent) {
    if (showLoading) {
      setLoadingEvent(false);
    }

    setEvent(currentEvent as EventData);
    return;
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .in("status", ["waiting", "live"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (showLoading) {
    setLoadingEvent(false);
  }

  if (error || !data) {
    setEvent(null);
    setMessage("لا توجد فعالية متاحة حالياً");
    return;
  }

  setEvent(data as EventData);
}

  async function joinEvent() {
    if (!event) {
      alert("لا توجد فعالية متاحة حالياً");
      return;
    }

    if (!playerName.trim() || !playerCode.trim()) {
      alert("اكتب اسم المشترك وكود المشترك");
      return;
    }

    setJoining(true);

    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .insert({
        event_id: event.id,
        name: playerName.trim(),
        player_code: playerCode.trim(),
      })
      .select()
      .single();

    setJoining(false);

    if (participantError) {
      alert("هذا الكود مستخدم مسبقاً ضمن نفس الفعالية. جرّب كود ثاني.");
      return;
    }

    localStorage.setItem("quiz_event_id", event.id);
    localStorage.setItem("quiz_event_code", event.code);
    localStorage.setItem("quiz_event_title", event.title);
    localStorage.setItem("quiz_participant_id", participant.id);
    localStorage.setItem("quiz_player_name", participant.name);
    localStorage.setItem("quiz_player_code", participant.player_code);

    window.location.href = "/play";
  }
useEffect(() => {
  loadEventAutomatically(true);

  const interval = setInterval(() => {
    loadEventAutomatically(false);
  }, 2000);

  return () => clearInterval(interval);
}, []);

  return (
      <main className="flex min-h-screen items-center justify-center bg-[#063F36] p-5 text-white">
    <a
      href="/"
      className="fixed left-5 top-5 z-50 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-black text-white backdrop-blur hover:bg-white/20"
    >
      العودة للرئيسية
    </a>

      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
        <div className="mb-6 rounded-[1.5rem] bg-white p-6">
          <img src="/iac-logo.png" alt="Logo" className="mx-auto h-28 w-auto" />
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-3xl font-black">دخول المسابقة</h1>
          <p className="mt-3 text-white/70">
            أدخل بياناتك للانضمام إلى الفعالية
          </p>
        </div>

        <div className="mb-5 rounded-3xl border border-white/10 bg-white/10 p-4">
          {loadingEvent ? (
            <p className="text-center font-black text-[#F2C94C]">
              جار تحميل الفعالية...
            </p>
          ) : event ? (
            <div className="rounded-2xl border border-[#F2C94C]/40 bg-[#F2C94C]/10 p-4 text-center">
              <p className="text-sm text-white/60">اسم الفعالية</p>

              <h2 className="mt-1 text-2xl font-black text-[#F2C94C]">
                {event.title}
              </h2>

              <p className="mt-2 text-sm text-white/60">
                الحالة:{" "}
                <span className="font-bold text-white">
                  {event.status === "waiting"
                    ? "بانتظار البدء"
                    : event.status === "live"
                    ? "مباشرة الآن"
                    : event.status === "finished"
                    ? "منتهية"
                    : event.status}
                </span>
              </p>
            </div>
          ) : (
            <p className="rounded-2xl bg-red-500/20 p-3 text-center text-sm font-bold text-red-100">
              {message}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-white/80">
              اسم المشترك
            </label>

            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="مثال: محمد"
              className="w-full rounded-2xl border border-white/10 bg-white px-5 py-4 text-right text-[#063F36] outline-none placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-white/80">
              كود المشترك
            </label>

            <input
              type="text"
              value={playerCode}
              onChange={(e) => setPlayerCode(e.target.value)}
              placeholder="مثال: A01"
              className="w-full rounded-2xl border border-white/10 bg-white px-5 py-4 text-right text-[#063F36] outline-none placeholder:text-gray-400"
            />
          </div>

          <button
            type="button"
            onClick={joinEvent}
            disabled={!event || joining || loadingEvent}
            className="w-full rounded-2xl bg-[#F2C94C] px-6 py-4 text-lg font-black text-[#063F36] transition hover:scale-[1.02] disabled:opacity-50"
          >
            {joining ? "جار الدخول..." : "دخول إلى المسابقة"}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-white/60">
          بعد الدخول ابقَ في صفحة الإجابة، وسيظهر السؤال تلقائيًا عند تشغيله من لوحة التحكم.
        </p>
      </div>
    </main>
  );
}