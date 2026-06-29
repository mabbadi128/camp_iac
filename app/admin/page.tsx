"use client";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type EventData = {
  id: string;
  title: string;
  code: string;
  status: string;
  current_question_id: string | null;
  current_question_started_at: string | null;
  current_question_ends_at: string | null;
  is_current: boolean;
  created_at: string;
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
  event_id: string;
  name: string;
  player_code: string;
  total_score: number;
  joined_at: string;
};

type AnswerData = {
  id: string;
  participant_id: string;
  question_id: string;
  selected_option: "A" | "B" | "C" | "D";
  is_correct: boolean;
  score: number;
  answered_at: string;
  participants: {
    name: string;
    player_code: string;
    total_score: number;
  } | null;
  questions: {
    question_text: string;
    correct_option: "A" | "B" | "C" | "D";
    order_number: number;
  } | null;
};

type AdminTab = "events" | "control" | "questions" | "answers" | "winners";

export default function AdminPage() {
  const [baseUrl, setBaseUrl] = useState("");

  const [activeTab, setActiveTab] = useState<AdminTab>("control");

  const [events, setEvents] = useState<EventData[]>([]);
  const [eventCode, setEventCode] = useState("IAC2026");
  const [eventTitle, setEventTitle] = useState("Quiz Arena Live - IAC");
  const [event, setEvent] = useState<EventData | null>(null);

  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [answers, setAnswers] = useState<AnswerData[]>([]);
  const [loading, setLoading] = useState(false);

  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctOption, setCorrectOption] = useState<"A" | "B" | "C" | "D">(
    "A",
  );
  const [timeLimit, setTimeLimit] = useState(20);

  const currentQuestion: QuestionData | null = event?.current_question_id
    ? questions.find((q) => q.id === event.current_question_id) ?? null
    : null;

  const currentQuestionIndex = currentQuestion
    ? questions.findIndex((q) => q.id === currentQuestion.id)
    : -1;

  const topThree = [...participants]
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, 3);

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const participantJoinUrl =
    event && baseUrl
      ? `${baseUrl}/join?code=${encodeURIComponent(event.code)}`
      : "";

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("صار خطأ أثناء تحميل الفعاليات");
      return;
    }

    setEvents((data || []) as EventData[]);
  }

  async function loadEvent() {
    if (!eventCode.trim()) {
      alert("اكتب كود الفعالية");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("code", eventCode.trim())
      .single();

    if (error || !data) {
      setEvent(null);
      setQuestions([]);
      setParticipants([]);
      setAnswers([]);
      setLoading(false);
      return;
    }

    await selectEvent(data as EventData);
    setLoading(false);
  }

  async function selectEvent(selectedEvent: EventData) {
    await supabase
      .from("events")
      .update({ is_current: false })
      .neq("id", selectedEvent.id);

    const { data: updatedEvent, error } = await supabase
      .from("events")
      .update({ is_current: true })
      .eq("id", selectedEvent.id)
      .select()
      .single();

    const finalEvent =
      error || !updatedEvent ? selectedEvent : (updatedEvent as EventData);

    setEvent(finalEvent);
    setEventCode(finalEvent.code);
    setEventTitle(finalEvent.title);

    localStorage.setItem("quiz_admin_event_id", finalEvent.id);
    localStorage.setItem("quiz_admin_event_code", finalEvent.code);
    localStorage.setItem("quiz_admin_event_title", finalEvent.title);

    await Promise.all([
      loadEvents(),
      loadQuestions(finalEvent.id),
      loadParticipants(finalEvent.id),
      loadAnswers(finalEvent.id),
    ]);
  }

  async function loadQuestions(eventId: string) {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("event_id", eventId)
      .order("order_number", { ascending: true });

    if (error) {
      alert("صار خطأ أثناء تحميل الأسئلة");
      return;
    }

    setQuestions((data || []) as QuestionData[]);
  }

  async function loadParticipants(eventId: string) {
    const { data, error } = await supabase
      .from("participants")
      .select("*")
      .eq("event_id", eventId)
      .order("total_score", { ascending: false });

    if (error) {
      alert("صار خطأ أثناء تحميل المشاركين");
      return;
    }

    setParticipants((data || []) as ParticipantData[]);
  }

  async function loadAnswers(eventId: string) {
    const { data, error } = await supabase
      .from("answers")
      .select(`
      id,
      participant_id,
      question_id,
      selected_option,
      is_correct,
      score,
      answered_at,
      participants (
        name,
        player_code,
        total_score
      ),
      questions (
        question_text,
        correct_option,
        order_number
      )
    `)
      .eq("event_id", eventId)
      .order("answered_at", { ascending: false });

    if (error) {
      alert("صار خطأ أثناء تحميل الإجابات");
      return;
    }

    setAnswers((data || []) as unknown as AnswerData[]);
  }

  async function refreshAll() {
    await loadEvents();

    if (!event) return;

    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("id", event.id)
      .single();

    if (data) {
      setEvent(data as EventData);
    }

    await Promise.all([
      loadQuestions(event.id),
      loadParticipants(event.id),
      loadAnswers(event.id),
    ]);
  }

  async function createEvent() {
    if (!eventTitle.trim() || !eventCode.trim()) {
      alert("اكتب اسم الفعالية والكود");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("events")
      .insert({
        title: eventTitle.trim(),
        code: eventCode.trim(),
        status: "waiting",
        current_question_id: null,
        current_question_started_at: null,
        current_question_ends_at: null,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      alert("لم يتم إنشاء الفعالية. يمكن أن يكون الكود مستخدم من قبل.");
      return;
    }

    await loadEvents();
    await selectEvent(data as EventData);
    setActiveTab("questions");
    alert("تم إنشاء الفعالية بنجاح");
  }

  async function updateEvent(item: EventData) {
    const newTitle = prompt("اكتب اسم الفعالية الجديد", item.title);
    if (newTitle === null) return;

    const newCode = prompt("اكتب كود الفعالية الجديد", item.code);
    if (newCode === null) return;

    if (!newTitle.trim() || !newCode.trim()) {
      alert("اسم الفعالية والكود مطلوبين");
      return;
    }

    const { data, error } = await supabase
      .from("events")
      .update({
        title: newTitle.trim(),
        code: newCode.trim(),
      })
      .eq("id", item.id)
      .select()
      .single();

    if (error) {
      alert("ما قدرنا نعدل الفعالية. يمكن الكود مستخدم بفعالية ثانية.");
      return;
    }

    await loadEvents();

    if (event?.id === item.id) {
      await selectEvent(data as EventData);
    }

    alert("تم تعديل الفعالية بنجاح");
  }

  async function deleteEvent(item: EventData) {
    const confirmDelete = confirm(
      `متأكد بدك تحذف الفعالية؟\n\n${item.title}\n\nرح تنحذف معها الأسئلة والمشاركين والإجابات.`,
    );

    if (!confirmDelete) return;

    const { error } = await supabase.from("events").delete().eq("id", item.id);

    if (error) {
      alert("ما قدرنا نحذف الفعالية");
      return;
    }

    if (event?.id === item.id) {
      setEvent(null);
      setQuestions([]);
      setParticipants([]);
      setAnswers([]);
      setEventTitle("");
      setEventCode("");
    }

    await loadEvents();
    alert("تم حذف الفعالية");
  }
  async function addQuestion() {
    if (!event) {
      alert("لازم تختار أو تنشئ فعالية أولاً");
      return;
    }

    if (
      !questionText.trim() ||
      !optionA.trim() ||
      !optionB.trim() ||
      !optionC.trim() ||
      !optionD.trim()
    ) {
      alert("عبّي السؤال وكل الخيارات");
      return;
    }

    const nextOrder =
      questions.length > 0
        ? Math.max(...questions.map((q) => q.order_number)) + 1
        : 1;

    const { error } = await supabase.from("questions").insert({
      event_id: event.id,
      question_text: questionText.trim(),
      option_a: optionA.trim(),
      option_b: optionB.trim(),
      option_c: optionC.trim(),
      option_d: optionD.trim(),
      correct_option: correctOption,
      time_limit_seconds: timeLimit,
      order_number: nextOrder,
    });

    if (error) {
      alert("صار خطأ أثناء إضافة السؤال");
      return;
    }

    setQuestionText("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectOption("A");
    setTimeLimit(20);

    await loadQuestions(event.id);
  }

  async function deleteQuestion(questionId: string) {
    const confirmDelete = confirm("متأكد بدك تحذف السؤال؟");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId);

    if (error) {
      alert("ما قدرنا نحذف السؤال");
      return;
    }

    await refreshAll();
  }

  async function setActiveQuestion(question: QuestionData) {
    if (!event) return;

    const startedAt = new Date();
    const endsAt = new Date(
      startedAt.getTime() + question.time_limit_seconds * 1000,
    );

    const { data, error } = await supabase
      .from("events")
      .update({
        status: "live",
        current_question_id: question.id,
        current_question_started_at: startedAt.toISOString(),
        current_question_ends_at: endsAt.toISOString(),
        paused_remaining_seconds: null,
      })
      .eq("id", event.id)
      .select()
      .single();

    if (error) {
      alert("ما قدرنا نبدأ السؤال");
      return;
    }

    setEvent(data as EventData);
    await refreshAll();
  }
  async function startFirstQuestion() {
    if (questions.length === 0) {
      alert("لا يوجد أسئلة في هذه الفعالية");
      return;
    }

    await setActiveQuestion(questions[0]);
  }

  async function goNextQuestion() {
    if (questions.length === 0) {
      alert("لا يوجد أسئلة");
      return;
    }

    if (!currentQuestion) {
      await startFirstQuestion();
      return;
    }

    const nextQuestion = questions[currentQuestionIndex + 1];

    if (!nextQuestion) {
      await finishEvent();
      return;
    }

    await setActiveQuestion(nextQuestion);
  }

  async function finishEvent() {
    if (!event) return;

    const { data, error } = await supabase
      .from("events")
      .update({
        status: "finished",
        current_question_id: null,
        current_question_started_at: null,
        current_question_ends_at: null,
      })
      .eq("id", event.id)
      .select()
      .single();

    if (error) {
      alert("ما قدرنا ننهي الفعالية");
      return;
    }

    setEvent(data as EventData);
    await refreshAll();
  }

  async function resetEventWaiting() {
    if (!event) return;

    let remainingSeconds = 0;

    if (event.current_question_ends_at) {
      remainingSeconds = Math.max(
        0,
        Math.ceil(
          (new Date(event.current_question_ends_at).getTime() -
            new Date().getTime()) /
          1000,
        ),
      );
    }

    const { data, error } = await supabase
      .from("events")
      .update({
        status: "waiting",
        current_question_started_at: null,
        current_question_ends_at: null,
        paused_remaining_seconds: remainingSeconds,
      })
      .eq("id", event.id)
      .select()
      .single();

    if (error) {
      alert("ما قدرنا نرجع الفعالية لوضع الانتظار");
      return;
    }

    setEvent(data as EventData);
    await refreshAll();
  }

  async function resumeEvent() {
    if (!event) return;

    if (!event.current_question_id) {
      alert("لا يوجد سؤال حالي لاستكماله");
      return;
    }

    const remainingSeconds = event.paused_remaining_seconds || 0;

    if (remainingSeconds <= 0) {
      alert("لا يوجد وقت متبقي لاستكمال السؤال");
      return;
    }

    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + remainingSeconds * 1000);

    const { data, error } = await supabase
      .from("events")
      .update({
        status: "live",
        current_question_started_at: startedAt.toISOString(),
        current_question_ends_at: endsAt.toISOString(),
        paused_remaining_seconds: null,
      })
      .eq("id", event.id)
      .select()
      .single();

    if (error) {
      alert("ما قدرنا نزيل وضع الانتظار");
      return;
    }

    setEvent(data as EventData);
    await refreshAll();
  }
  useEffect(() => {
    async function init() {
      await loadEvents();

      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("code", "IAC2026")
        .maybeSingle();

      if (data) {
        await selectEvent(data as EventData);
      }
    }

    init();
  }, []);

  return (
    <main className="min-h-screen bg-[#063F36] text-white">
      <div className="grid min-h-screen lg:grid-cols-[290px_1fr]">
        <aside className="border-l border-white/10 bg-[#032B25] p-5">
          <div className="mb-6 rounded-3xl bg-white p-5">
            <img
              src="/iac-logo.png"
              alt="Logo"
              className="mx-auto h-20 w-auto"
            />
          </div>

          <h1 className="mb-2 text-2xl font-black">لوحة التحكم</h1>
          <p className="mb-6 text-sm leading-6 text-white/60">
            إدارة الفعاليات، الأسئلة، الانتقال بين الأسئلة، النتائج والفائزين.
          </p>

          <div className="mb-6 space-y-3">
            <SideButton
              active={activeTab === "events"}
              onClick={() => setActiveTab("events")}
              title="الفعاليات"
              count={events.length}
            />

            <SideButton
              active={activeTab === "control"}
              onClick={() => setActiveTab("control")}
              title="تشغيل الفعالية"
              count={currentQuestion ? currentQuestion.order_number : 0}
            />

            <SideButton
              active={activeTab === "questions"}
              onClick={() => setActiveTab("questions")}
              title="إدارة الأسئلة"
              count={questions.length}
            />

            <SideButton
              active={activeTab === "answers"}
              onClick={() => {
                setActiveTab("answers");
                refreshAll();
              }}
              title="إجابات المشاركين"
              count={answers.length}
            />

            <SideButton
              active={activeTab === "winners"}
              onClick={() => {
                setActiveTab("winners");
                refreshAll();
              }}
              title="الفائزون Top 3"
              count={topThree.length}
            />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
            <p className="text-sm text-white/60">الفعالية الحالية</p>
            <p className="mt-2 font-black">
              {event ? event.title : "لا توجد فعالية"}
            </p>
            <p className="mt-1 text-sm text-[#F2C94C]">
              {event ? event.code : "----"}
            </p>
          </div>

          <button
            onClick={refreshAll}
            className="mt-4 w-full rounded-2xl border border-white/20 px-4 py-3 font-black hover:bg-white/10"
          >
            تحديث البيانات
          </button>

          {event && (
            <a
              href="/screen"
              target="_blank"
              className="mt-4 block w-full rounded-2xl bg-[#F2C94C] px-4 py-3 text-center font-black text-[#063F36]"
            >
              فتح شاشة العرض
            </a>
          )}

          {event && participantJoinUrl && (
            <div className="mt-4 rounded-3xl border border-white/10 bg-white/10 p-4">
              <p className="mb-3 text-center text-sm font-bold text-white/70">
                QR دخول المشاركين
              </p>

              <div className="rounded-2xl bg-white p-4">
                <QRCodeSVG
                  value={participantJoinUrl}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#063F36"
                  level="H"
                  className="mx-auto"
                />
              </div>
              <a
                href={participantJoinUrl}
                target="_blank"
                className="mt-3 block rounded-2xl border border-white/20 px-4 py-3 text-center font-black text-white hover:bg-white/10"
              >
                فتح صفحة دخول المشاركين
              </a>

              <p className="mt-3 break-all text-center text-xs text-white/50">
                {participantJoinUrl}
              </p>
            </div>
          )}
                        <CampNotificationsBox />

          <a
            href="/api/admin-logout"
            className="mt-4 block w-full rounded-2xl border border-red-300/30 bg-red-500/20 px-4 py-3 text-center font-black text-red-100 hover:bg-red-500/30"
          >
            تسجيل خروج
          </a>
        </aside>

        <section className="p-5 lg:p-8">
          <header className="mb-6 rounded-3xl border border-white/10 bg-white/10 p-5">
            <div className="grid gap-4 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-white/70">
                  اسم الفعالية
                </label>
                <input
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full rounded-2xl bg-white px-4 py-3 text-right text-[#063F36] outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-white/70">
                  كود الفعالية
                </label>
                <input
                  value={eventCode}
                  onChange={(e) => setEventCode(e.target.value)}
                  className="w-full rounded-2xl bg-white px-4 py-3 text-right text-[#063F36] outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={loadEvent}
                  className="w-full rounded-2xl border border-white/20 px-4 py-3 font-black hover:bg-white/10"
                >
                  تحميل الفعالية
                </button>
              </div>

              <div className="flex items-end">
                <button
                  onClick={createEvent}
                  className="w-full rounded-2xl bg-[#F2C94C] px-4 py-3 font-black text-[#063F36]"
                >
                  إنشاء فعالية
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-5">
              <StatCard title="المشاركين" value={participants.length} />
              <StatCard title="الأسئلة" value={questions.length} />
              <StatCard title="الإجابات" value={answers.length} />
              <StatCard title="الحالة" value={event?.status || "----"} />
              <StatCard
                title="السؤال الحالي"
                value={currentQuestion ? currentQuestion.order_number : "-"}
              />
            </div>
          </header>

          {activeTab === "events" && (
            <EventsSection
              events={events}
              selectedEventId={event?.id || ""}
              selectEvent={selectEvent}
              updateEvent={updateEvent}
              deleteEvent={deleteEvent}
            />
          )}

          {activeTab === "control" && (
            <ControlSection
              event={event}
              questions={questions}
              currentQuestion={currentQuestion}
              topThree={topThree}
              startFirstQuestion={startFirstQuestion}
              goNextQuestion={goNextQuestion}
              finishEvent={finishEvent}
              resetEventWaiting={resetEventWaiting}
              resumeEvent={resumeEvent}
              setActiveQuestion={setActiveQuestion}
            />
          )}

          {activeTab === "questions" && (
            <QuestionsSection
              questions={questions}
              questionText={questionText}
              setQuestionText={setQuestionText}
              optionA={optionA}
              setOptionA={setOptionA}
              optionB={optionB}
              setOptionB={setOptionB}
              optionC={optionC}
              setOptionC={setOptionC}
              optionD={optionD}
              setOptionD={setOptionD}
              correctOption={correctOption}
              setCorrectOption={setCorrectOption}
              timeLimit={timeLimit}
              setTimeLimit={setTimeLimit}
              addQuestion={addQuestion}
              deleteQuestion={deleteQuestion}
            />
          )}

          {activeTab === "answers" && (
            <AnswersSection answers={answers} participants={participants} />
          )}

          {activeTab === "winners" && (
            <WinnersSection topThree={topThree} participants={participants} />
          )}
        </section>
      </div>
    </main>
  );
}
function CampNotificationsBox() {
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  async function sendNotification(message: string) {
    if (!message.trim()) {
      alert("اكتب نص الإشعار");
      return;
    }

    setSending(true);
    setResultMessage("");

    const res = await fetch("/api/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "إشعار المعسكر",
        body: message,
        url: "/",
      }),
    });

    const data = await res.json().catch(() => null);

    setSending(false);

    if (!res.ok) {
      setResultMessage(data?.message || "فشل إرسال الإشعار");
      return;
    }

    setResultMessage(`تم الإرسال: ${data.sent} / ${data.total}`);
  }

  return (
    <div className="mt-4 rounded-3xl border border-white/10 bg-white/10 p-4">
      <p className="mb-3 text-center text-sm font-bold text-white/70">
        إشعارات المعسكر
      </p>

      <div className="grid gap-2">
        <button
          onClick={() => sendNotification("حان وقت الغداء 🍽️")}
          disabled={sending}
          className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-black hover:bg-white/10 disabled:opacity-60"
        >
          🍽️ حان وقت الغداء
        </button>

        <button
          onClick={() => sendNotification("حان وقت النوم 🌙")}
          disabled={sending}
          className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-black hover:bg-white/10 disabled:opacity-60"
        >
          🌙 حان وقت النوم
        </button>

        <button
          onClick={() => sendNotification("يرجى التوجه إلى ساحة النشاط ⛺")}
          disabled={sending}
          className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-black hover:bg-white/10 disabled:opacity-60"
        >
          ⛺ التوجه إلى ساحة النشاط
        </button>

        <button
          onClick={() => sendNotification("يبدأ النشاط التالي بعد 10 دقائق 🔔")}
          disabled={sending}
          className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-black hover:bg-white/10 disabled:opacity-60"
        >
          🔔 النشاط التالي بعد 10 دقائق
        </button>

        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder="اكتب إشعار مخصص..."
          className="mt-2 min-h-24 rounded-2xl bg-white px-4 py-3 text-right text-[#063F36] outline-none"
        />

        <button
          onClick={() => sendNotification(customMessage)}
          disabled={sending}
          className="rounded-2xl bg-[#F2C94C] px-4 py-3 font-black text-[#063F36] disabled:opacity-60"
        >
          {sending ? "جار الإرسال..." : "إرسال إشعار مخصص"}
        </button>

        {resultMessage && (
          <p className="rounded-2xl bg-white/10 p-3 text-center text-sm font-bold text-white/80">
            {resultMessage}
          </p>
        )}
      </div>
    </div>
  );
}

function SideButton({
  active,
  onClick,
  title,
  count,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-2xl px-4 py-4 text-right font-black transition ${active
        ? "bg-[#F2C94C] text-[#063F36]"
        : "bg-white/10 text-white hover:bg-white/15"
        }`}
    >
      <span>{title}</span>
      <span
        className={`rounded-full px-3 py-1 text-sm ${active ? "bg-[#063F36] text-white" : "bg-white/10 text-white"
          }`}
      >
        {count}
      </span>
    </button>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-sm text-white/60">{title}</p>
      <p className="mt-1 text-2xl font-black text-[#F2C94C]">{value}</p>
    </div>
  );
}

function EventsSection({
  events,
  selectedEventId,
  selectEvent,
  updateEvent,
  deleteEvent,
}: {
  events: EventData[];
  selectedEventId: string;
  selectEvent: (event: EventData) => void;
  updateEvent: (event: EventData) => void;
  deleteEvent: (event: EventData) => void;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/10 p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-black">كل الفعاليات</h2>

        <span className="rounded-full bg-[#F2C94C] px-4 py-2 font-black text-[#063F36]">
          {events.length} فعالية
        </span>
      </div>

      {events.length === 0 ? (
        <p className="rounded-2xl bg-white/10 p-5 text-white/70">
          لا توجد فعاليات بعد.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {events.map((item, index) => (
            <div
              key={item.id}
              className={`rounded-3xl border p-5 ${selectedEventId === item.id
                ? "border-[#F2C94C] bg-[#F2C94C]/15"
                : "border-white/10 bg-white/10"
                }`}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="mb-2 text-sm font-black text-[#F2C94C]">
                    فعالية رقم {index + 1}
                  </p>

                  <h3 className="text-xl font-black">{item.title}</h3>
                </div>

                {selectedEventId === item.id && (
                  <span className="rounded-full bg-[#F2C94C] px-3 py-1 text-xs font-black text-[#063F36]">
                    مفتوحة الآن
                  </span>
                )}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <SmallInfo title="الكود" value={item.code} />
                <SmallInfo title="الحالة" value={item.status} />
                <SmallInfo
                  title="التاريخ"
                  value={new Date(item.created_at).toLocaleDateString("ar")}
                />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <button
                  onClick={() => selectEvent(item)}
                  className="rounded-2xl bg-[#F2C94C] px-4 py-3 font-black text-[#063F36]"
                >
                  فتح
                </button>

                <button
                  onClick={() => updateEvent(item)}
                  className="rounded-2xl border border-white/20 px-4 py-3 font-black hover:bg-white/10"
                >
                  تعديل
                </button>

                <button
                  onClick={() => deleteEvent(item)}
                  className="rounded-2xl border border-red-300/30 bg-red-500/20 px-4 py-3 font-black text-red-100 hover:bg-red-500/30"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ControlSection({
  event,
  questions,
  currentQuestion,
  topThree,
  startFirstQuestion,
  goNextQuestion,
  finishEvent,
  resetEventWaiting,
  resumeEvent,
  setActiveQuestion,
}: {
  event: EventData | null;
  questions: QuestionData[];
  currentQuestion: QuestionData | null;
  topThree: ParticipantData[];
  startFirstQuestion: () => void;
  goNextQuestion: () => void;
  finishEvent: () => void;
  resetEventWaiting: () => void;
  resumeEvent: () => void;
  setActiveQuestion: (question: QuestionData) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/10 p-6">
        <h2 className="mb-5 text-xl font-black">تشغيل الفعالية</h2>

        {!event ? (
          <p className="rounded-2xl bg-white/10 p-5 text-white/70">
            اختر فعالية أولاً.
          </p>
        ) : (
          <>
            <div className="mb-5 rounded-3xl border border-[#F2C94C]/30 bg-[#F2C94C]/10 p-5">
              <p className="text-sm text-white/60">السؤال المعروض الآن</p>
              <h3 className="mt-2 text-2xl font-black">
                {currentQuestion
                  ? `السؤال ${currentQuestion.order_number}: ${currentQuestion.question_text}`
                  : event.status === "finished"
                    ? "الفعالية منتهية"
                    : "لا يوجد سؤال معروض حالياً"}
              </h3>
            </div>

            <div className="grid gap-3 md:grid-cols-5">
              <button
                onClick={startFirstQuestion}
                className="rounded-2xl bg-[#F2C94C] px-4 py-4 font-black text-[#063F36]"
              >
                بدء أول سؤال
              </button>

              <button
                onClick={goNextQuestion}
                className="rounded-2xl border border-white/20 px-4 py-4 font-black hover:bg-white/10"
              >
                السؤال التالي
              </button>

              <button
                onClick={finishEvent}
                className="rounded-2xl border border-red-300/30 bg-red-500/20 px-4 py-4 font-black text-red-100"
              >
                إنهاء الفعالية
              </button>

              <button
                onClick={resetEventWaiting}
                className="rounded-2xl border border-white/20 px-4 py-4 font-black hover:bg-white/10"
              >
                وضع الانتظار
              </button>
              <button
                onClick={resumeEvent}
                className="rounded-2xl border border-green-300/30 bg-green-500/20 px-4 py-4 font-black text-green-100"
              >
                إزالة وضع الانتظار
              </button>
            </div>
          </>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/10 p-6">
        <h2 className="mb-5 text-xl font-black">اختيار سؤال معيّن</h2>

        {questions.length === 0 ? (
          <p className="rounded-2xl bg-white/10 p-5 text-white/70">
            لا توجد أسئلة.
          </p>
        ) : (
          <div className="space-y-3">
            {questions.map((question) => (
              <button
                key={question.id}
                onClick={() => setActiveQuestion(question)}
                className={`w-full rounded-2xl border p-4 text-right font-black ${currentQuestion?.id === question.id
                  ? "border-[#F2C94C] bg-[#F2C94C]/20"
                  : "border-white/10 bg-white/10 hover:bg-white/15"
                  }`}
              >
                السؤال {question.order_number}: {question.question_text}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/10 p-6">
        <h2 className="mb-5 text-xl font-black">أفضل 3 حتى الآن</h2>

        {topThree.length === 0 ? (
          <p className="rounded-2xl bg-white/10 p-5 text-white/70">
            لا يوجد نتائج بعد.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {topThree.map((player, index) => (
              <div
                key={player.id}
                className="rounded-3xl bg-white/10 p-5 text-center"
              >
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#F2C94C] text-2xl font-black text-[#063F36]">
                  {index + 1}
                </div>
                <h3 className="font-black">{player.name}</h3>
                <p className="text-sm text-white/60">{player.player_code}</p>
                <p className="mt-3 text-3xl font-black text-[#F2C94C]">
                  {player.total_score}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function QuestionsSection(props: {
  questions: QuestionData[];
  questionText: string;
  setQuestionText: (value: string) => void;
  optionA: string;
  setOptionA: (value: string) => void;
  optionB: string;
  setOptionB: (value: string) => void;
  optionC: string;
  setOptionC: (value: string) => void;
  optionD: string;
  setOptionD: (value: string) => void;
  correctOption: "A" | "B" | "C" | "D";
  setCorrectOption: (value: "A" | "B" | "C" | "D") => void;
  timeLimit: number;
  setTimeLimit: (value: number) => void;
  addQuestion: () => void;
  deleteQuestion: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/10 p-6">
        <h2 className="mb-4 text-xl font-black">إضافة سؤال جديد</h2>

        <div className="space-y-4">
          <textarea
            value={props.questionText}
            onChange={(e) => props.setQuestionText(e.target.value)}
            className="min-h-24 w-full rounded-2xl bg-white px-4 py-3 text-right text-[#063F36] outline-none"
            placeholder="اكتب نص السؤال هنا"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={props.optionA}
              onChange={(e) => props.setOptionA(e.target.value)}
              className="rounded-2xl bg-white px-4 py-3 text-right text-[#063F36] outline-none"
              placeholder="الخيار A"
            />
            <input
              value={props.optionB}
              onChange={(e) => props.setOptionB(e.target.value)}
              className="rounded-2xl bg-white px-4 py-3 text-right text-[#063F36] outline-none"
              placeholder="الخيار B"
            />
            <input
              value={props.optionC}
              onChange={(e) => props.setOptionC(e.target.value)}
              className="rounded-2xl bg-white px-4 py-3 text-right text-[#063F36] outline-none"
              placeholder="الخيار C"
            />
            <input
              value={props.optionD}
              onChange={(e) => props.setOptionD(e.target.value)}
              className="rounded-2xl bg-white px-4 py-3 text-right text-[#063F36] outline-none"
              placeholder="الخيار D"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <select
              value={props.correctOption}
              onChange={(e) =>
                props.setCorrectOption(e.target.value as "A" | "B" | "C" | "D")
              }
              className="rounded-2xl bg-white px-4 py-3 text-[#063F36] outline-none"
            >
              <option value="A">الجواب الصحيح A</option>
              <option value="B">الجواب الصحيح B</option>
              <option value="C">الجواب الصحيح C</option>
              <option value="D">الجواب الصحيح D</option>
            </select>

            <input
              type="number"
              value={props.timeLimit}
              onChange={(e) => props.setTimeLimit(Number(e.target.value))}
              className="rounded-2xl bg-white px-4 py-3 text-[#063F36] outline-none"
              min={5}
              max={120}
            />

            <button
              onClick={props.addQuestion}
              className="rounded-2xl bg-[#F2C94C] px-4 py-3 font-black text-[#063F36]"
            >
              إضافة السؤال
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/10 p-6">
        <h2 className="mb-5 text-xl font-black">قائمة الأسئلة</h2>

        {props.questions.length === 0 ? (
          <p className="rounded-2xl bg-white/10 p-5 text-white/70">
            لا توجد أسئلة بعد.
          </p>
        ) : (
          <div className="space-y-4">
            {props.questions.map((question) => (
              <div
                key={question.id}
                className="rounded-3xl border border-white/10 bg-white/10 p-5"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-2 text-sm font-bold text-[#F2C94C]">
                      السؤال {question.order_number} -{" "}
                      {question.time_limit_seconds} ثانية
                    </p>
                    <h3 className="text-xl font-black">
                      {question.question_text}
                    </h3>
                  </div>

                  <button
                    onClick={() => props.deleteQuestion(question.id)}
                    className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-black text-red-200 hover:bg-red-500/30"
                  >
                    حذف
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <AnswerBox
                    letter="A"
                    text={question.option_a}
                    correct={question.correct_option === "A"}
                  />
                  <AnswerBox
                    letter="B"
                    text={question.option_b}
                    correct={question.correct_option === "B"}
                  />
                  <AnswerBox
                    letter="C"
                    text={question.option_c}
                    correct={question.correct_option === "C"}
                  />
                  <AnswerBox
                    letter="D"
                    text={question.option_d}
                    correct={question.correct_option === "D"}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AnswersSection({
  answers,
  participants,
}: {
  answers: AnswerData[];
  participants: ParticipantData[];
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/10 p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-black">إجابات المشاركين</h2>

        <span className="rounded-full bg-[#F2C94C] px-4 py-2 font-black text-[#063F36]">
          {answers.length} إجابة
        </span>
      </div>

      {participants.length === 0 ? (
        <p className="rounded-2xl bg-white/10 p-5 text-white/70">
          لا يوجد مشاركين بعد.
        </p>
      ) : (
        <div className="space-y-6">
          {participants.map((participant) => {
            const playerAnswers = answers.filter(
              (answer) => answer.participant_id === participant.id
            );

            const correctCount = playerAnswers.filter(
              (answer) => answer.is_correct
            ).length;

            const wrongCount = playerAnswers.filter(
              (answer) => !answer.is_correct
            ).length;

            return (
              <div
                key={participant.id}
                className="rounded-3xl border border-white/10 bg-white/10 p-5"
              >
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-black">{participant.name}</h3>

                    <p className="text-sm text-white/60">
                      الكود: {participant.player_code}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Badge title="النقاط" value={participant.total_score} />
                    <Badge title="صحيحة" value={correctCount} />
                    <Badge title="خاطئة" value={wrongCount} />
                    <Badge title="كل الإجابات" value={playerAnswers.length} />
                  </div>
                </div>

                {playerAnswers.length === 0 ? (
                  <p className="rounded-2xl bg-white/10 p-4 text-white/60">
                    لم يجب هذا المشارك بعد.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {playerAnswers.map((answer) => (
                      <div
                        key={answer.id}
                        className="rounded-2xl border border-white/10 bg-white/10 p-4"
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="font-black text-[#F2C94C]">
                            السؤال {answer.questions?.order_number || "-"}
                          </p>

                          <span
                            className={`rounded-full px-3 py-1 text-sm font-black ${answer.is_correct
                              ? "bg-green-500/20 text-green-200"
                              : "bg-red-500/20 text-red-200"
                              }`}
                          >
                            {answer.is_correct ? "صحيح" : "خطأ"}
                          </span>
                        </div>

                        <p className="mb-3 text-white/90">
                          {answer.questions?.question_text || "السؤال غير موجود"}
                        </p>

                        <div className="grid gap-3 md:grid-cols-3">
                          <SmallInfo
                            title="إجابة المشارك"
                            value={answer.selected_option}
                          />

                          <SmallInfo
                            title="الجواب الصحيح"
                            value={answer.questions?.correct_option || "-"}
                          />

                          <SmallInfo title="النقاط" value={answer.score} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function WinnersSection({
  topThree,
  participants,
}: {
  topThree: ParticipantData[];
  participants: ParticipantData[];
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/10 p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-black">الفائزون Top 3</h2>
        <span className="rounded-full bg-[#F2C94C] px-4 py-2 font-black text-[#063F36]">
          فلتر أعلى 3
        </span>
      </div>

      {topThree.length === 0 ? (
        <p className="rounded-2xl bg-white/10 p-5 text-white/70">
          لا يوجد مشاركين بعد.
        </p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {topThree.map((player, index) => (
            <div
              key={player.id}
              className={`rounded-[2rem] border p-6 text-center ${index === 0
                ? "border-[#F2C94C] bg-[#F2C94C]/20"
                : "border-white/10 bg-white/10"
                }`}
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#F2C94C] text-4xl font-black text-[#063F36]">
                {index + 1}
              </div>

              <h3 className="text-2xl font-black">{player.name}</h3>
              <p className="mt-2 text-white/60">الكود: {player.player_code}</p>

              <p className="mt-5 text-5xl font-black text-[#F2C94C]">
                {player.total_score}
              </p>
              <p className="mt-1 text-sm text-white/60">نقطة</p>

              {index === 0 && (
                <p className="mt-5 rounded-full bg-[#F2C94C] px-4 py-2 font-black text-[#063F36]">
                  الفائز الأول 🏆
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {participants.length > 3 && (
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-black">باقي الترتيب</h3>
          <div className="space-y-3">
            {participants.slice(3).map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-2xl bg-white/10 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 font-black">
                    {index + 4}
                  </span>
                  <div>
                    <p className="font-black">{player.name}</p>
                    <p className="text-sm text-white/60">
                      {player.player_code}
                    </p>
                  </div>
                </div>

                <span className="font-black text-[#F2C94C]">
                  {player.total_score} نقطة
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function AnswerBox({
  letter,
  text,
  correct,
}: {
  letter: string;
  text: string;
  correct: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl p-4 ${correct
        ? "border border-[#F2C94C] bg-[#F2C94C]/20"
        : "border border-white/10 bg-white/10"
        }`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white font-black text-[#063F36]">
        {letter}
      </span>
      <span className="font-bold">{text}</span>
      {correct && (
        <span className="mr-auto rounded-full bg-[#F2C94C] px-3 py-1 text-xs font-black text-[#063F36]">
          صحيح
        </span>
      )}
    </div>
  );
}

function Badge({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3 text-center">
      <p className="text-xs text-white/60">{title}</p>
      <p className="mt-1 font-black text-[#F2C94C]">{value}</p>
    </div>
  );
}

function SmallInfo({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-white/10 p-3">
      <p className="text-xs text-white/60">{title}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}
