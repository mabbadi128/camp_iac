"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import PushNotificationsButton from "@/components/PushNotificationsButton";

type EventData = {
  id: string;
  title: string;
  code: string;
  status: string;
  current_question_id: string | null;
  current_question_started_at: string | null;
  current_question_ends_at: string | null;
    paused_remaining_seconds: number | null;
};

type QuestionData = {
  id: string;
  event_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  time_limit_seconds: number;
  order_number: number;
};

type ParticipantData = {
  id: string;
  name: string;
  player_code: string;
  total_score: number;
};

export default function PlayPage() {
  const currentQuestionIdRef = useRef("");

  const [event, setEvent] = useState<EventData | null>(null);
  const [participantId, setParticipantId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerCode, setPlayerCode] = useState("");
  const [participant, setParticipant] = useState<ParticipantData | null>(null);

  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<"A" | "B" | "C" | "D" | "">("");
  const [answered, setAnswered] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
async function loadCurrentGame() {
  const savedEventId = localStorage.getItem("quiz_event_id") || "";
  const savedParticipantId = localStorage.getItem("quiz_participant_id") || "";
  const savedPlayerName = localStorage.getItem("quiz_player_name") || "";
  const savedPlayerCode = localStorage.getItem("quiz_player_code") || "";

  if (!savedEventId || !savedParticipantId) {
    window.location.href = "/join";
    return;
  }

  setParticipantId(savedParticipantId);
  setPlayerName(savedPlayerName);
  setPlayerCode(savedPlayerCode);

  const { data: participantData } = await supabase
    .from("participants")
    .select("*")
    .eq("id", savedParticipantId)
    .single();

  if (participantData) {
    setParticipant(participantData as ParticipantData);
  }

  const { data: eventData, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", savedEventId)
    .single();

  if (eventError || !eventData) {
    setLoading(false);
    setMessage("لم يتم العثور على الفعالية");
    return;
  }

  const currentEvent = eventData as EventData;
  setEvent(currentEvent);

  if (!currentEvent.current_question_id) {
    currentQuestionIdRef.current = "";
    setQuestion(null);
    setSelectedAnswer("");
    setAnswered(false);
    setTimeUp(false);
    setTimeLeft(0);

    if (currentEvent.status === "finished") {
      setMessage("انتهت الفعالية ✅");
    } else {
      setMessage("بانتظار بدء السؤال من لوحة التحكم");
    }

    setLoading(false);
    return;
  }

  const isNewQuestion =
    currentQuestionIdRef.current !== currentEvent.current_question_id;

  if (isNewQuestion) {
    currentQuestionIdRef.current = currentEvent.current_question_id;
    setSelectedAnswer("");
    setAnswered(false);
    setTimeUp(false);
    setMessage("");
  }

  const { data: questionData, error: questionError } = await supabase
    .from("questions")
    .select("*")
    .eq("id", currentEvent.current_question_id)
    .single();

  if (questionError || !questionData) {
    setQuestion(null);
    setMessage("لا يوجد سؤال حالياً");
    setLoading(false);
    return;
  }

  setQuestion(questionData as QuestionData);

  if (currentEvent.status === "waiting") {
    setTimeLeft(currentEvent.paused_remaining_seconds || 0);
    setTimeUp(false);
    setAnswered(false);
    setSelectedAnswer("");
    setMessage("وضع الانتظار ⏳ لم يبدأ استقبال الإجابات بعد");
    setLoading(false);
    return;
  }

  const { data: oldAnswer } = await supabase
    .from("answers")
    .select("*")
    .eq("participant_id", savedParticipantId)
    .eq("question_id", questionData.id)
    .maybeSingle();

  if (oldAnswer) {
    setAnswered(true);
    setTimeUp(false);
    setSelectedAnswer(oldAnswer.selected_option);
    setMessage("تم تسجيل إجابتك لهذا السؤال");
    setLoading(false);
    return;
  }

  if (currentEvent.current_question_ends_at) {
    const secondsLeft = Math.max(
      0,
      Math.ceil(
        (new Date(currentEvent.current_question_ends_at).getTime() -
          new Date().getTime()) /
          1000
      )
    );

    setTimeLeft(secondsLeft);

    if (secondsLeft <= 0) {
      setTimeUp(true);
      setAnswered(true);
      setMessage("خلص الوقت ⏰ لم يعد بإمكانك الإجابة");
    } else {
      setTimeUp(false);
      setAnswered(false);
    }
  }

  setLoading(false);
}

async function submitAnswer(answer: "A" | "B" | "C" | "D") {
  if (!event || event.status === "waiting") {
    setMessage("وضع الانتظار ⏳ لم يبدأ استقبال الإجابات بعد");
    return;
  }

  if (!question || !participantId || answered || timeUp || timeLeft <= 0) {
    return;
  }

  setSelectedAnswer(answer);

  const isCorrect = answer === question.correct_option;
  const score = isCorrect ? 100 : 0;

  let responseTimeMs: number | null = null;

  if (event.current_question_started_at) {
    responseTimeMs =
      new Date().getTime() -
      new Date(event.current_question_started_at).getTime();
  }

  const { error: answerError } = await supabase.from("answers").insert({
    event_id: event.id,
    participant_id: participantId,
    question_id: question.id,
    selected_option: answer,
    is_correct: isCorrect,
    score,
    response_time_ms: responseTimeMs,
  });

  if (answerError) {
    setAnswered(true);
    setMessage("أنت جاوبت على هذا السؤال مسبقاً");
    return;
  }

  const newTotalScore = (participant?.total_score || 0) + score;

  await supabase
    .from("participants")
    .update({
      total_score: newTotalScore,
    })
    .eq("id", participantId);

  setParticipant((prev) =>
    prev ? { ...prev, total_score: newTotalScore } : prev
  );

  setAnswered(true);

  if (isCorrect) {
    setMessage("إجابة صحيحة ✅ حصلت على 100 نقطة");
  } else {
    setMessage("إجابة خاطئة ❌");
  }

  await loadCurrentGame();
}
  useEffect(() => {
    loadCurrentGame();

    const interval = setInterval(() => {
      loadCurrentGame();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#063F36] text-white">
        <p className="text-2xl font-black">جار التحميل...</p>
      </main>
    );
  }

  if (!question) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#063F36] p-5 text-white">
  
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-8 text-center">
          <div className="mb-6 rounded-2xl bg-white p-5">
            <img src="/iac-logo.png" alt="Logo" className="mx-auto h-24 w-auto" />
          </div>

          <h1 className="text-2xl font-black">{message}</h1>

          <p className="mt-4 text-white/60">
            ابقَ في هذه الصفحة، السؤال سيظهر تلقائياً عند تشغيله من لوحة التحكم.
          </p>
        </div>
      </main>
    );
  }

  const answers = [
    ["A", question.option_a],
    ["B", question.option_b],
    ["C", question.option_c],
    ["D", question.option_d],
  ] as const;

  return (
    <main className="min-h-screen bg-[#063F36] p-5 text-white">
      <div className="mx-auto max-w-md">
        <PushNotificationsButton />
        <header className="mb-5 rounded-3xl border border-white/10 bg-white/10 p-5">
          <div className="mb-4 rounded-2xl bg-white p-4">
            <img src="/iac-logo.png" alt="Logo" className="mx-auto h-20 w-auto" />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-white/60">المشارك</p>
              <h1 className="text-xl font-black">{playerName || playerCode}</h1>
              <p className="mt-1 text-sm text-white/50">{event?.title}</p>
            </div>

            <div className="rounded-2xl bg-[#F2C94C] px-4 py-2 text-center text-[#063F36]">
              <p className="text-xs font-bold">النقاط</p>
              <p className="text-xl font-black">
                {participant?.total_score ?? 0}
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <span className="rounded-full bg-[#F2C94C] px-4 py-2 text-sm font-black text-[#063F36]">
              السؤال {question.order_number}
            </span>

            <span
              className={`rounded-full border px-4 py-2 text-sm font-black ${
                timeLeft <= 5
                  ? "border-red-300 bg-red-500/20 text-red-100"
                  : "border-white/20 text-white"
              }`}
            >
         {event?.status === "waiting"
 ? `وضع الانتظار - ${timeLeft} ثانية متبقية`
  : timeLeft > 0
  ? `${timeLeft} ثانية`
  : "انتهى الوقت"}
            </span>
          </div>

          <div className="mb-6">
  <h2 className="text-2xl font-black leading-relaxed">
    {question.question_text}
  </h2>

  {event?.status === "waiting" && (
    <div className="mt-4 rounded-2xl border border-[#F2C94C]/40 bg-[#F2C94C]/10 p-4 text-center font-black text-[#F2C94C]">
      وضع الانتظار — لم يبدأ استقبال الإجابات بعد
    </div>
  )}
</div>

          <div className="space-y-3">
            {answers.map(([letter, text]) => {
              const isSelected = selectedAnswer === letter;

              return (
                <button
                  key={letter}
                  onClick={() => submitAnswer(letter)}
                 disabled={answered || timeUp || timeLeft <= 0 || event?.status === "waiting"}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-right text-lg font-black transition ${
                    isSelected
                      ? "border-[#F2C94C] bg-[#F2C94C] text-[#063F36]"
                      : "border-white/10 bg-white/10 hover:bg-white/20"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl font-black ${
                      isSelected
                        ? "bg-[#063F36] text-white"
                        : "bg-white text-[#063F36]"
                    }`}
                  >
                    {letter}
                  </span>

                  <span>{text}</span>
                </button>
              );
            })}
          </div>

          {message && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4 text-center font-black">
              {message}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}