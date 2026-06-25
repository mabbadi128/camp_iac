"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type EventData = {
  id: string;
  title: string;
  code: string;
  status: string;
  current_question_id: string | null;
  current_question_ends_at: string | null;
  paused_remaining_seconds: number | null;
};

type QuestionData = {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  time_limit_seconds: number;
  order_number: number;
};

export default function ScreenPage() {
  const [eventCode, setEventCode] = useState("");
  const [event, setEvent] = useState<EventData | null>(null);
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  async function loadScreen(code: string) {
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("code", code)
      .single();

    if (eventError || !eventData) {
      setEvent(null);
      setQuestion(null);
      setLoading(false);
      return;
    }

    setEvent(eventData as EventData);

    if (eventData.status === "waiting") {
      setTimeLeft(eventData.paused_remaining_seconds || 0);
    }

    const { count: participants } = await supabase
      .from("participants")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventData.id);

    setParticipantsCount(participants || 0);

    const { count: qCount } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventData.id);

    setQuestionsCount(qCount || 0);

    if (!eventData.current_question_id) {
      setQuestion(null);
      setTimeLeft(0);
      setLoading(false);
      return;
    }

    const { data: questionData } = await supabase
      .from("questions")
      .select("*")
      .eq("id", eventData.current_question_id)
      .single();

    if (questionData) {
      setQuestion(questionData as QuestionData);
    } else {
      setQuestion(null);
    }

    if (eventData.current_question_ends_at) {
      const secondsLeft = Math.max(
        0,
        Math.ceil(
          (new Date(eventData.current_question_ends_at).getTime() -
            new Date().getTime()) /
            1000
        )
      );

      setTimeLeft(secondsLeft);
    } else if (eventData.status !== "waiting") {
      setTimeLeft(0);
    }

    setLoading(false);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const codeFromUrl =
      params.get("code") ||
      localStorage.getItem("quiz_admin_event_code") ||
      "";

    if (!codeFromUrl) {
      setEvent(null);
      setQuestion(null);
      setLoading(false);
      return;
    }

    setEventCode(codeFromUrl);
    loadScreen(codeFromUrl);

    const interval = setInterval(() => {
      loadScreen(codeFromUrl);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const answers = question
    ? [
        ["A", question.option_a],
        ["B", question.option_b],
        ["C", question.option_c],
        ["D", question.option_d],
      ]
    : [];

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#032B25] px-4 text-white">
        <h1 className="text-center text-2xl font-black md:text-4xl">
          جار تحميل شاشة العرض...
        </h1>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#032B25] px-4 text-white">
        <div className="w-full max-w-lg rounded-3xl bg-white/10 p-6 text-center md:p-10">
          <h1 className="text-2xl font-black text-[#F2C94C] md:text-4xl">
            لم يتم العثور على الفعالية
          </h1>
          <p className="mt-4 break-all text-white/70">الكود: {eventCode}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#032B25] text-white">
      <section className="relative flex min-h-screen flex-col p-4 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0A6152_0%,#063F36_45%,#032B25_100%)]" />

        <header className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="shrink-0 rounded-2xl bg-white p-2 md:p-3">
              <img
                src="/iac-logo.png"
                alt="Logo"
                className="h-10 w-auto md:h-14"
              />
            </div>

            <div className="min-w-0">
              <h1 className="break-words text-lg font-black md:text-2xl">
                {event.title}
              </h1>
              <p className="text-sm text-white/60 md:text-base">
                كود الفعالية: {event.code}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:flex md:items-center md:gap-4">
            <a
              href="/"
              className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-center text-sm font-black text-white backdrop-blur transition hover:bg-white/20"
            >
              العودة للرئيسية
            </a>

            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center backdrop-blur md:px-6">
              <span className="text-sm text-white/60">المشاركين: </span>
              <span className="text-xl font-black text-[#F2C94C] md:text-2xl">
                {participantsCount}
              </span>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center backdrop-blur md:px-6">
              <span className="text-sm text-white/60">الحالة: </span>
              <span className="text-lg font-black text-[#F2C94C] md:text-xl">
                {event.status}
              </span>
            </div>
          </div>
        </header>

        <div className="relative z-10 flex flex-1 items-center justify-center py-8">
          {!question ? (
            <div className="w-full max-w-4xl rounded-[2rem] border border-white/10 bg-white/10 p-6 text-center shadow-2xl backdrop-blur md:p-10">
              <h2 className="text-3xl font-black text-[#F2C94C] md:text-5xl">
                {event.status === "finished"
                  ? "انتهت الفعالية"
                  : "بانتظار بدء السؤال"}
              </h2>

              <p className="mt-5 text-lg text-white/70 md:text-2xl">
                يتم الانتقال بين الأسئلة من لوحة التحكم
              </p>
            </div>
          ) : (
            <div className="w-full max-w-5xl rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur md:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:mb-8">
                <span className="rounded-full bg-[#F2C94C] px-4 py-2 text-center text-sm font-black text-[#063F36] md:text-base">
                  السؤال {question.order_number} / {questionsCount}
                </span>

                <span
                  className={`rounded-full border px-4 py-2 text-center text-sm font-black md:text-base ${
                    event.status === "waiting"
                      ? "border-[#F2C94C]/40 bg-[#F2C94C]/10 text-[#F2C94C]"
                      : timeLeft <= 5
                      ? "border-red-300 bg-red-500/20 text-red-100"
                      : "border-white/20 text-white"
                  }`}
                >
                  {event.status === "waiting"
                    ? `وضع الانتظار - ${timeLeft} ثانية متبقية`
                    : timeLeft > 0
                    ? `${timeLeft} ثانية`
                    : "انتهى الوقت"}
                </span>
              </div>

              <div className="mb-8 text-center md:mb-10">
                <h2 className="break-words text-2xl font-black leading-relaxed md:text-5xl">
                  {question.question_text}
                </h2>

                {event.status === "waiting" && (
                  <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-[#F2C94C]/40 bg-[#F2C94C]/10 px-4 py-3 text-base font-black text-[#F2C94C] md:px-6 md:py-4 md:text-xl">
                    وضع الانتظار — لم يبدأ استقبال الإجابات بعد
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                {answers.map(([letter, answer]) => (
                  <div
                    key={letter}
                    className="flex items-center gap-3 rounded-3xl border border-white/15 bg-white/10 p-4 text-lg font-black md:gap-4 md:p-5 md:text-2xl"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F2C94C] text-[#063F36] md:h-14 md:w-14">
                      {letter}
                    </span>

                    <span className="break-words leading-relaxed">
                      {answer}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}