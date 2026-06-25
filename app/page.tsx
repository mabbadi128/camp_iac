export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#063F36] text-white">
      <section className="relative flex min-h-screen items-center justify-center px-6 py-10">
        {/* خلفية المعسكر */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0A6152_0%,#063F36_42%,#032B25_100%)]" />

        {/* طبقة تغميق للفصل بين الخلفية والمحتوى */}
        <div className="absolute inset-0 bg-black/20" />

        {/* إضاءة خفيفة */}
        <div className="absolute left-10 top-10 h-36 w-36 rounded-full bg-[#F2C94C]/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-1/3 top-1/4 h-40 w-40 rounded-full bg-[#F2C94C]/10 blur-3xl" />

        {/* خطوط خفيفة بالخلفية */}
        <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(90deg,white_1px,transparent_1px),linear-gradient(0deg,white_1px,transparent_1px)] bg-[size:70px_70px]" />

        {/* طبقة أرض */}
        <div className="absolute bottom-0 left-0 right-0 h-36 bg-[#032B25]/80" />

        {/* جبال بالخلفية */}
        <svg
          className="absolute bottom-0 left-0 right-0 h-[42vh] w-full opacity-65"
          viewBox="0 0 1440 420"
          preserveAspectRatio="none"
        >
          <path
            d="M0 420V260L180 130L330 260L520 90L760 300L950 150L1160 290L1440 110V420H0Z"
            fill="#042F29"
          />
          <path
            d="M0 420V310L220 190L420 330L650 170L850 330L1050 210L1260 340L1440 230V420H0Z"
            fill="#05261F"
            fillOpacity="0.95"
          />
        </svg>

        {/* أشجار يسار */}
        <svg
          className="absolute bottom-16 left-8 hidden w-52 opacity-50 md:block"
          viewBox="0 0 220 180"
          fill="none"
        >
          <path d="M35 150V95" stroke="#F2C94C" strokeWidth="5" strokeLinecap="round" />
          <path d="M35 25L10 90H60L35 25Z" fill="#0A6152" />
          <path d="M35 60L0 125H70L35 60Z" fill="#06483E" />

          <path d="M105 160V85" stroke="#F2C94C" strokeWidth="5" strokeLinecap="round" />
          <path d="M105 10L70 90H140L105 10Z" fill="#0A6152" />
          <path d="M105 55L55 140H155L105 55Z" fill="#06483E" />

          <path d="M175 155V100" stroke="#F2C94C" strokeWidth="5" strokeLinecap="round" />
          <path d="M175 35L145 100H205L175 35Z" fill="#0A6152" />
          <path d="M175 70L135 140H215L175 70Z" fill="#06483E" />
        </svg>

        {/* خيمة ونار يمين */}
        <svg
          className="absolute bottom-14 right-8 hidden w-64 opacity-70 md:block"
          viewBox="0 0 280 190"
          fill="none"
        >
          <path
            d="M35 155L105 45L175 155H35Z"
            fill="#F2C94C"
            fillOpacity="0.18"
            stroke="#F2C94C"
            strokeWidth="3"
          />
          <path
            d="M105 45L225 155H175L105 45Z"
            fill="#ffffff"
            fillOpacity="0.08"
            stroke="#ffffff"
            strokeOpacity="0.25"
            strokeWidth="3"
          />
          <path
            d="M105 75L82 155H128L105 75Z"
            fill="#032B25"
            fillOpacity="0.8"
            stroke="#F2C94C"
            strokeOpacity="0.5"
          />

          <path
            d="M220 130C235 112 218 98 230 78C205 92 202 110 209 126C195 116 192 100 198 88C174 108 181 145 211 150C214 151 218 147 220 130Z"
            fill="#F2C94C"
          />
          <path
            d="M220 140C229 130 220 119 225 108C211 116 208 129 213 141C205 134 203 124 206 116C190 131 197 154 216 154C218 154 220 149 220 140Z"
            fill="#FF7A30"
          />
          <path d="M190 162L250 142" stroke="#8B5A2B" strokeWidth="6" strokeLinecap="round" />
          <path d="M250 162L190 142" stroke="#8B5A2B" strokeWidth="6" strokeLinecap="round" />
        </svg>

        <div className="relative z-10 grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2">
          {/* النص */}
          <div className="space-y-8 rounded-[2rem] border border-white/10 bg-[#032B25]/45 p-6 text-center shadow-[0_35px_100px_rgba(0,0,0,0.42)] backdrop-blur-xl lg:text-right">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#F2C94C]/35 bg-[#F2C94C]/12 px-5 py-2 text-sm font-bold text-white/95 shadow-[0_12px_35px_rgba(0,0,0,0.25)] backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[#F2C94C] shadow-[0_0_18px_rgba(242,201,76,0.8)]" />
              مسابقة مباشرة ضمن أجواء المعسكر
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-black leading-tight drop-shadow-[0_10px_28px_rgba(0,0,0,0.65)] md:text-6xl">
                Camp Quiz
                <span className="block text-[#F2C94C] drop-shadow-[0_0_28px_rgba(242,201,76,0.35)]">
                  Live
                </span>
              </h1>

              <p className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-black/20 p-4 text-lg leading-9 text-white/90 shadow-[0_20px_50px_rgba(0,0,0,0.28)] backdrop-blur-md lg:mx-0">
                تجربة تفاعلية للفرق المشاركة في المعسكر، تعرض الأسئلة على شاشة
                كبيرة، ويجيب المشاركون من هواتفهم مباشرة مع نقاط وترتيب لحظي.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <a
                href="/admin"
                className="rounded-2xl bg-[#F2C94C] px-7 py-4 text-center font-bold text-[#063F36] shadow-[0_16px_40px_rgba(242,201,76,0.30)] transition hover:scale-105"
              >
                لوحة التحكم
              </a>

              <a
                href="/join"
                className="rounded-2xl border border-white/25 bg-white/15 px-7 py-4 text-center font-bold text-white shadow-[0_16px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl transition hover:bg-white/25"
              >
                دخول المشاركين
              </a>

              <a
                href="/screen"
                className="rounded-2xl border border-white/25 bg-[#032B25]/30 px-7 py-4 text-center font-bold text-white shadow-[0_16px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl transition hover:bg-white/10"
              >
                شاشة العرض
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-[#032B25]/50 p-4 shadow-[0_16px_35px_rgba(0,0,0,0.28)] backdrop-blur-md">
                <p className="text-2xl drop-shadow-lg">⛺</p>
                <p className="mt-2 text-sm font-bold text-white/80">
                  أجواء معسكر
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-[#032B25]/50 p-4 shadow-[0_16px_35px_rgba(0,0,0,0.28)] backdrop-blur-md">
                <p className="text-2xl drop-shadow-lg">🔥</p>
                <p className="mt-2 text-sm font-bold text-white/80">
                  تحديات مباشرة
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-[#032B25]/50 p-4 shadow-[0_16px_35px_rgba(0,0,0,0.28)] backdrop-blur-md">
                <p className="text-2xl drop-shadow-lg">🏆</p>
                <p className="mt-2 text-sm font-bold text-white/80">
                  فائزون وترتيب
                </p>
              </div>
            </div>
          </div>

          {/* كرت اللوغو */}
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-[2rem] border border-white/20 bg-white/10 p-6 shadow-[0_35px_100px_rgba(0,0,0,0.48)] ring-1 ring-white/10 backdrop-blur-2xl">
              <div className="rounded-[1.5rem] bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
                <img
                  src="/iac-logo.png"
                  alt="IAC Logo"
                  className="mx-auto h-40 w-auto object-contain"
                />
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-[#F2C94C]/35 bg-[#F2C94C]/12 p-5 text-center shadow-[0_18px_45px_rgba(0,0,0,0.25)] backdrop-blur-md">
                <p className="text-sm font-bold text-white/75">
                  تحدي المعسكر المباشر
                </p>
                <p className="mt-2 text-3xl font-black text-[#F2C94C] drop-shadow-[0_0_22px_rgba(242,201,76,0.25)]">
                  Camp Challenge
                </p>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/10 bg-[#032B25]/40 p-4 text-center shadow-[0_14px_35px_rgba(0,0,0,0.25)] backdrop-blur-md">
                  <p className="text-sm text-white/65">المشاركون</p>
                  <p className="mt-1 text-2xl font-black">100</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#032B25]/40 p-4 text-center shadow-[0_14px_35px_rgba(0,0,0,0.25)] backdrop-blur-md">
                  <p className="text-sm text-white/65">الأسئلة</p>
                  <p className="mt-1 text-2xl font-black">20</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#032B25]/40 p-4 text-center shadow-[0_14px_35px_rgba(0,0,0,0.25)] backdrop-blur-md">
                  <p className="text-sm text-white/65">الفائزون</p>
                  <p className="mt-1 text-2xl font-black text-[#F2C94C]">
                    3
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/15 bg-[#032B25]/45 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.28)] backdrop-blur-md">
                <p className="text-sm leading-7 text-white/90">
                  نظام مخصص لإدارة مسابقات المعسكر، يبدأ من تسجيل المشاركين
                  وحتى عرض النتائج والفائزين بشكل مباشر على الشاشة.
                </p>
              </div>

              <div className="mt-5 flex items-center justify-center gap-3 text-sm font-bold text-white/75">
                <span className="h-px w-12 bg-[#F2C94C]/60" />
                <span className="drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)]">
                  جاهز للتحدي
                </span>
                <span className="h-px w-12 bg-[#F2C94C]/60" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}