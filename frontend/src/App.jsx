import React, { useEffect, useState } from 'react';
import siteConfig from './site_config.json';

/* ------------------------------------------------------------------ */
/*  Sozlamalar va yordamchilar                                          */
/* ------------------------------------------------------------------ */

const API = import.meta.env.VITE_API_URL || '';
const TOTAL = 60;
const FINAL_SIZE = 30;
const LETTERS = ['A', 'B', 'C'];
const IDENTITY_KEY = 'aifc-identity';
const THEME_KEY = 'aifc-theme';

const tgApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
const tgUser = tgApp?.initDataUnsafe?.user;

const readStore = (key) => {
  try {
    return JSON.parse(window.localStorage.getItem(key));
  } catch {
    return null;
  }
};

const writeStore = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* saqlash imkoni bo'lmasa ham ilova ishlayveradi */
  }
};

// GET (body yo'q) yoki POST (body bor) so'rov
async function api(path, body) {
  const res = await fetch(`${API}${path}`, body === undefined
    ? undefined
    : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data.detail === 'string' ? data.detail : 'Serverda xatolik yuz berdi.');
  }
  return data;
}

/* ------------------------------------------------------------------ */
/*  Logotip va ikonkalar                                                */
/* ------------------------------------------------------------------ */

function Logo({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-label="AI Full Course logotipi">
      <rect x="2" y="2" width="44" height="44" rx="12" fill="none" stroke="currentColor" strokeWidth="2.5" />
      {[16, 24, 32].map((x) => (
        <g key={x} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1={x} y1="6" x2={x} y2="11" />
          <line x1={x} y1="37" x2={x} y2="42" />
        </g>
      ))}
      <rect x="13" y="13" width="22" height="22" rx="4" fill="currentColor" />
      <text x="24" y="29" textAnchor="middle" fontSize="11" fontWeight="700"
        fontFamily="'Times New Roman', Times, serif" className="fill-white dark:fill-zinc-900">AI</text>
    </svg>
  );
}

const ICON_PATHS = {
  play: <polygon points="6 4 20 12 6 20 6 4" />,
  info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
  trophy: <><path d="M6 9H4a2 2 0 0 1-2-2V5h4" /><path d="M18 9h2a2 2 0 0 0 2-2V5h-4" /><path d="M6 4h12v6a6 6 0 0 1-12 0V4z" /><path d="M9 21h6M12 16v5" /></>,
  book: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z" />,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  check: <polyline points="20 6 9 17 4 12" />,
  x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  back: <><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></>,
  next: <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
  award: <><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></>,
  zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  print: <><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></>,
  refresh: <><polyline points="23 4 23 10 17 10" /><path d="M20.5 15a9 9 0 1 1-2.1-9.4L23 10" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  alert: <><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
};

function Icon({ name, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {ICON_PATHS[name]}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Umumiy uslublar                                                     */
/* ------------------------------------------------------------------ */

const card = 'rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900';
const btnPrimary = 'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-bold tracking-wide text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300';
const btnGhost = 'inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 px-4 py-3 text-sm font-bold transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800';
const linkBtn = 'inline-flex items-center gap-1 text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100';

/* ------------------------------------------------------------------ */
/*  Kichik komponentlar                                                 */
/* ------------------------------------------------------------------ */

function Modal({ title, onClose, children }) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className={`${card} max-h-[80vh] w-full max-w-sm overflow-y-auto p-5`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} aria-label="Yopish" className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Seal({ gold }) {
  const color = gold ? '#b8860b' : '#6b7178';
  return (
    <svg viewBox="0 0 80 80" className="h-16 w-16" aria-label="Rasmiy muhr">
      <circle cx="40" cy="40" r="37" fill="none" stroke={color} strokeWidth="2.5" />
      <circle cx="40" cy="40" r="30" fill={color} />
      <text x="40" y="37" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff" fontFamily="'Times New Roman', serif">RASMIY</text>
      <text x="40" y="48" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff" fontFamily="'Times New Roman', serif">MUHR</text>
    </svg>
  );
}

function Certificate({ name, tier, xp }) {
  const gold = tier === 'gold';
  const frame = gold ? 'border-amber-400' : 'border-zinc-400';
  const ribbon = gold
    ? 'bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 text-amber-950'
    : 'bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-200 text-zinc-900';
  return (
    <div id="certificate" className={`mx-auto max-w-md border-[10px] border-double bg-white p-7 text-center text-zinc-900 ${frame}`}>
      <Logo className="mx-auto h-10 w-10 text-zinc-900" />
      <p className="mt-2 text-[11px] tracking-[0.3em]">AI FULL COURSE</p>
      <h3 className="mt-4 text-2xl font-bold tracking-[0.2em]">SERTIFIKAT</h3>
      <p className="mt-3 text-xs text-zinc-600">Ushbu sertifikat quyidagi shaxsga berildi:</p>
      <p className="mt-2 border-b border-zinc-900 pb-1 text-2xl font-bold italic">{name}</p>
      <p className="mt-3 text-xs leading-relaxed text-zinc-600">
        {gold
          ? "Sun'iy intellekt va prompt injiniring yakuniy imtihonini 100% natija bilan topshirgani uchun."
          : "AI kursini tugatib, yakuniy imtihondan 60% va undan yuqori natija ko'rsatgani uchun."}
      </p>
      <div className={`mt-4 inline-block rounded-md px-4 py-1.5 text-sm font-bold ${ribbon}`}>
        {gold ? 'AI MUTAXASSISI' : 'AI PRO'} · {xp} XP
      </div>
      <div className="mt-7 flex items-end justify-between text-[11px]">
        <div className="w-1/3"><div className="h-7" /><div className="border-t border-zinc-900 pt-1">Direktor</div></div>
        <Seal gold={gold} />
        <div className="w-1/3"><div className="h-7" /><div className="border-t border-zinc-900 pt-1">Kurs rahbari</div></div>
      </div>
    </div>
  );
}

function ProgressBar({ value, max }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div className="h-full rounded-full bg-gradient-to-r from-zinc-400 via-zinc-600 to-zinc-900 transition-all duration-500 dark:from-zinc-500 dark:via-zinc-300 dark:to-zinc-100" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Asosiy komponent                                                    */
/* ------------------------------------------------------------------ */

export default function App() {
  const [dark, setDark] = useState(() => {
    const saved = readStore(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved === 'dark';
    return (siteConfig.theme || 'dark') !== 'light';
  });

  const [course, setCourse] = useState(null);
  const [exam, setExam] = useState(null);
  const [user, setUser] = useState(null);
  const [needName, setNeedName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const [screen, setScreen] = useState('home'); // home | map | lesson | exam
  const [modal, setModal] = useState(null);     // info | leaders
  const [leaders, setLeaders] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [lessonId, setLessonId] = useState(1);
  const [readDone, setReadDone] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [answers, setAnswers] = useState({});
  const [lessonResult, setLessonResult] = useState(null);

  const [examAnswers, setExamAnswers] = useState({});
  const [examResult, setExamResult] = useState(null);

  const [practice, setPractice] = useState(null);
  const [practiceOpen, setPracticeOpen] = useState(null);
  const [practiceAnswers, setPracticeAnswers] = useState({});
  const [practiceDone, setPracticeDone] = useState(() => readStore('aifc-practice-done') || {});

  const initData = tgApp?.initData || null;
  const completed = new Set(user?.completed_lessons || []);
  const doneCount = user?.lessons_completed ?? 0;
  const lesson = course?.find((l) => l.id === lessonId);

  /* Mavzu (dark/light) */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    writeStore(THEME_KEY, dark ? 'dark' : 'light');
  }, [dark]);

  /* Telegram va ma'lumotlarni yuklash */
  async function register(identity) {
    setBusy(true);
    setError('');
    try {
      const u = await api('/api/users', {
        telegram_id: identity.telegram_id,
        full_name: identity.full_name,
        init_data: initData,
      });
      setUser(u);
      setNeedName(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    try {
      tgApp?.ready?.();
      tgApp?.expand?.();
    } catch {
      /* Telegram ichida bo'lmasa e'tiborsiz */
    }
    api('/api/course').then(setCourse).catch((e) => setError(e.message));
    api('/api/exam/questions').then(setExam).catch(() => {});

    if (tgUser) {
      register({
        telegram_id: String(tgUser.id),
        full_name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || tgUser.username || 'O‘quvchi',
      });
    } else {
      const saved = readStore(IDENTITY_KEY);
      if (saved?.telegram_id) register(saved);
      else setNeedName(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveName(e) {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) return;
    const identity = { telegram_id: `web-${Math.random().toString(36).slice(2, 10)}`, full_name: name };
    writeStore(IDENTITY_KEY, identity);
    register(identity);
  }

  /* Dars matni: oxirigacha o'qilmaguncha test ochilmaydi */
  const readerRef = React.useRef(null);

  useEffect(() => {
    if (screen !== 'lesson' || testOpen) return;
    const el = readerRef.current;
    if (el && el.scrollHeight <= el.clientHeight + 4) setReadDone(true);
  }, [screen, lessonId, testOpen]);

  function onReaderScroll(e) {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setReadDone(true);
  }

  function openLesson(id) {
    setLessonId(id);
    setReadDone(false);
    setTestOpen(false);
    setAnswers({});
    setLessonResult(null);
    setScreen('lesson');
  }

  function nextLesson() {
    if (lessonId < TOTAL) openLesson(lessonId + 1);
    else setScreen('map');
  }

  async function submitLesson() {
    setBusy(true);
    setError('');
    try {
      const res = await api('/api/progress', {
        telegram_id: user.telegram_id,
        lesson_id: lessonId,
        answers: [0, 1, 2].map((i) => answers[i]),
        init_data: initData,
      });
      setUser(res.user);
      setLessonResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitExam() {
    setBusy(true);
    setError('');
    try {
      const res = await api('/api/exam/submit', {
        telegram_id: user.telegram_id,
        answers: Array.from({ length: FINAL_SIZE }, (_, i) => examAnswers[i]),
        init_data: initData,
      });
      setUser(res.user);
      setExamResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function openPractice() {
    setScreen('practice');
    if (!practice && user) {
      try {
        setPractice(await api(`/api/practice?telegram_id=${encodeURIComponent(user.telegram_id)}`));
      } catch (e) {
        setError(e.message);
      }
    }
  }

  function answerPractice(pid, qi, oi, quiz) {
    const next = { ...practiceAnswers, [pid]: { ...(practiceAnswers[pid] || {}), [qi]: oi } };
    setPracticeAnswers(next);
    const allRight = quiz.every((q, i) => next[pid]?.[i] === q.correct);
    if (allRight && !practiceDone[pid]) {
      const done = { ...practiceDone, [pid]: true };
      setPracticeDone(done);
      writeStore('aifc-practice-done', done);
    }
  }

  function retakeExam() {
    setExamAnswers({});
    setExamResult(null);
  }

  async function openLeaders() {
    setModal('leaders');
    try {
      setLeaders(await api('/api/leaderboard'));
    } catch (e) {
      setError(e.message);
    }
  }

  const examAnswered = Object.keys(examAnswers).length;
  const lessonAnswered = Object.keys(answers).length;

  /* ---------------------------------------------------------------- */
  /*  Ekranlar                                                         */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-zinc-50 font-serif text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <style>{`@media print {
        body * { visibility: hidden !important; }
        #certificate, #certificate * { visibility: visible !important; }
        #certificate { position: fixed; left: 0; top: 0; width: 100%; max-width: none; margin: 0; }
      }`}</style>

      {/* Yuqori panel */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-zinc-50/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <button onClick={() => setScreen('home')} className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="text-sm font-bold tracking-[0.18em]">AI FULL COURSE</span>
          </button>
          <button
            onClick={() => setDark((d) => !d)}
            aria-label="Mavzuni almashtirish"
            className="rounded-xl border border-zinc-200 p-2 transition hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <Icon name={dark ? 'sun' : 'moon'} className="h-4 w-4" />
          </button>
        </div>

        {screen !== 'home' && user && (
          <div className="mx-auto flex max-w-xl items-center justify-center gap-6 border-t border-zinc-200 px-4 py-2 text-xs dark:border-zinc-800">
            <span className="flex items-center gap-1.5 font-semibold"><Icon name="zap" className="h-3.5 w-3.5" />{user.xp} XP</span>
            <span className="flex items-center gap-1.5 font-semibold"><span className="text-sm leading-none">$</span>{user.coins}</span>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-xl px-4 pb-16 pt-6">
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1">{error}</p>
            <button onClick={() => setError('')} aria-label="Yopish"><Icon name="x" className="h-4 w-4" /></button>
          </div>
        )}

        {/* ---------- BOSH SAHIFA ---------- */}
        {screen === 'home' && (
          <section className="pt-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-900 text-white shadow-xl dark:bg-zinc-100 dark:text-zinc-900">
              <Logo className="h-12 w-12" />
            </div>
            <p className="mt-6 text-[11px] uppercase tracking-[0.35em] text-zinc-500">Sun'iy intellekt kursi</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[0.12em]">AI FULL COURSE</h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              60 ta dars, har bir darsdan so'ng test va yakuniy imtihon. 60% va undan yuqori natija — sertifikat.
            </p>

            {needName ? (
              <form onSubmit={saveName} className={`${card} mt-8 p-5 text-left`}>
                <label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold">
                  <Icon name="user" className="h-4 w-4" /> Ism-familiyangiz
                </label>
                <p className="mt-1 text-xs text-zinc-500">Sertifikatda shu ism yoziladi.</p>
                <input
                  id="name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={120}
                  className="mt-3 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-300"
                  placeholder="Masalan: Ali Valiyev"
                />
                <button type="submit" disabled={!nameInput.trim() || busy} className={`${btnPrimary} mt-3`}>Davom etish</button>
              </form>
            ) : (
              <div className="mt-10 grid gap-3">
                <button onClick={() => setScreen('map')} disabled={!course || !user} className={btnPrimary}>
                  <Icon name="play" className="h-4 w-4" /> SAYOHATNI BOSHLASH
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setModal('info')} className={btnGhost}>
                    <Icon name="info" className="h-4 w-4" /> Batafsil
                  </button>
                  <button onClick={openLeaders} className={btnGhost}>
                    <Icon name="trophy" className="h-4 w-4" /> Reyting
                  </button>
                </div>
                <button onClick={openPractice} className={btnPrimary}>
                  <Icon name="zap" className="h-4 w-4" /> AMALIY LOYIHA (2-BOSQICH)
                </button>
                {!course && !error && <p className="text-xs text-zinc-500">Yuklanmoqda…</p>}
              </div>
            )}
          </section>
        )}

        {/* ---------- DARAJALAR XARITASI ---------- */}
        {screen === 'map' && course && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <button onClick={() => setScreen('home')} className={linkBtn}><Icon name="back" className="h-4 w-4" /> Bosh sahifa</button>
              <span className="text-sm text-zinc-500">{doneCount}/{TOTAL} tugatildi</span>
            </div>

            <div className={`${card} mb-5 p-4`}>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Icon name="grid" className="h-4 w-4" /> Darajalar xaritasi
              </div>
              <ProgressBar value={doneCount} max={TOTAL} />
            </div>

            <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
              {course.map((l) => {
                const isDone = completed.has(l.id);
                return (
                  <button
                    key={l.id}
                    title={l.title}
                    onClick={() => openLesson(l.id)}
                    className={`relative aspect-square rounded-xl border text-sm font-bold transition hover:-translate-y-0.5 hover:shadow-md ${
                      isDone
                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                        : 'border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-500'
                    }`}
                  >
                    {l.id}
                    {isDone && <Icon name="check" className="absolute right-1 top-1 h-2.5 w-2.5" />}
                  </button>
                );
              })}
            </div>

            {doneCount === TOTAL ? (
              <button onClick={() => setScreen('exam')} className={`${btnPrimary} mt-6`}>
                <Icon name="award" className="h-4 w-4" /> YAKUNIY 30 TALIK IMTIHON
              </button>
            ) : (
              <p className="mt-6 text-center text-xs text-zinc-500">
                Yakuniy imtihon barcha 60 ta dars tugagach ochiladi.
              </p>
            )}
          </section>
        )}

        {/* ---------- DARS VA TEST ---------- */}
        {screen === 'lesson' && lesson && (
          <section>
            <button onClick={() => setScreen('map')} className={`${linkBtn} mb-4`}><Icon name="back" className="h-4 w-4" /> Darajalar</button>

            <div className="mb-4">
              <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">Dars {lesson.id} / {TOTAL}</p>
              <h2 className="mt-1 text-xl font-bold leading-snug">{lesson.title}</h2>
            </div>

            {!testOpen ? (
              <>
                <div ref={readerRef} onScroll={onReaderScroll} className={`${card} max-h-[60vh] space-y-4 overflow-y-auto p-4`}>
                  {lesson.slides.map((s, i) => (
                    <article key={i} className="rounded-xl bg-zinc-100 p-4 dark:bg-zinc-800/60">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm dark:bg-zinc-900">{s.icon}</span>
                        <h4 className="font-bold leading-tight">{i + 1}. {s.title}</h4>
                      </div>
                      <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">{s.text}</p>
                    </article>
                  ))}
                </div>

                {!readDone && (
                  <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-zinc-500">
                    <Icon name="book" className="h-3.5 w-3.5" /> Matnni oxirigacha o'qing — test shundan keyin ochiladi.
                  </p>
                )}
                <button onClick={() => setTestOpen(true)} disabled={!readDone} className={`${btnPrimary} mt-4`}>
                  Testga o'tish
                </button>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  {lesson.quiz.map((q, qi) => {
                    const chosen = answers[qi];
                    const rev = lessonResult?.review?.[qi];
                    const right = rev ? chosen === rev.correct : null;
                    return (
                      <div key={qi} className={`${card} p-4`}>
                        <p className="font-bold leading-snug">{qi + 1}. {q.question}</p>
                        <div className="mt-3 grid gap-2">
                          {q.options.map((opt, oi) => {
                            const selected = chosen === oi;
                            const isCorrect = rev && rev.correct === oi;
                            const isWrong = rev && selected && !isCorrect;
                            return (
                              <button
                                key={oi}
                                disabled={!!lessonResult}
                                onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                                className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                                  isCorrect ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                                    : isWrong ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                                    : selected ? 'border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800'
                                    : 'border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600'
                                }`}
                              >
                                <span className="font-bold">{LETTERS[oi]})</span>
                                <span className="flex-1">{opt}</span>
                              </button>
                            );
                          })}
                        </div>

                        {lessonResult && rev && (
                          <div className={`mt-3 rounded-xl p-3 text-sm ${right ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200' : 'bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-200'}`}>
                            <p className="flex items-center gap-2 font-bold">
                              <Icon name={right ? 'check' : 'x'} className="h-4 w-4" />
                              {right ? "To'g'ri" : "Noto'g'ri"}
                            </p>
                            <p className="mt-2 font-semibold">💡 Nima uchun bu javob to'g'ri?</p>
                            <p className="mt-1 leading-relaxed">{rev.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!lessonResult ? (
                  <button onClick={submitLesson} disabled={lessonAnswered < lesson.quiz.length || busy} className={`${btnPrimary} mt-5`}>
                    Javoblarni tekshirish va tahlil
                  </button>
                ) : (
                  <div className={`${card} mt-5 p-4 text-center`}>
                    <p className="text-lg font-bold">
                      Natija: {lessonResult.score}/{lessonResult.total}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {lessonResult.already_completed
                        ? "Bu darsni avval tugatgansiz — mukofot qayta berilmaydi."
                        : `+${lessonResult.coins_earned} $ mukofot`}
                    </p>
                    <button onClick={nextLesson} className={`${btnPrimary} mt-4`}>
                      {lessonId < TOTAL ? <>Keyingi darajaga o'tish <Icon name="next" className="h-4 w-4" /></> : 'Darajalarga qaytish'}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* ---------- YAKUNIY IMTIHON VA SERTIFIKAT ---------- */}
        {screen === 'exam' && (
          <section>
            <button onClick={() => setScreen('map')} className={`${linkBtn} mb-4`}><Icon name="back" className="h-4 w-4" /> Darajalar</button>

            {!exam ? (
              <p className="text-sm text-zinc-500">Savollar yuklanmoqda…</p>
            ) : !examResult ? (
              <>
                <h2 className="text-xl font-bold">Yakuniy imtihon — 30 savol</h2>
                <p className="mb-4 mt-1 text-sm text-zinc-500">Har bir to'g'ri javob uchun +10 XP. Javoblarni yuborgach, sertifikat olasiz.</p>
                <div className="mb-5"><ProgressBar value={examAnswered} max={FINAL_SIZE} /><p className="mt-2 text-right text-xs text-zinc-500">{examAnswered}/{FINAL_SIZE}</p></div>

                <div className="space-y-4">
                  {exam.map((q, qi) => (
                    <div key={q.id} className={`${card} p-4`}>
                      <p className="font-bold leading-snug">{q.id}. {q.question}</p>
                      <div className="mt-3 grid gap-2">
                        {q.options.map((opt, oi) => (
                          <button
                            key={oi}
                            onClick={() => setExamAnswers((a) => ({ ...a, [qi]: oi }))}
                            className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                              examAnswers[qi] === oi
                                ? 'border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800'
                                : 'border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600'
                            }`}
                          >
                            <span className="font-bold">{LETTERS[oi]})</span>
                            <span className="flex-1">{opt}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={submitExam} disabled={examAnswered < FINAL_SIZE || busy} className={`${btnPrimary} mt-6`}>
                  Imtihonni yakunlash
                </button>
              </>
            ) : (
              <>
                <div className={`${card} mb-5 p-5 text-center`}>
                  <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Natija</p>
                  <p className="mt-1 text-4xl font-bold">{examResult.percentage}%</p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {examResult.score}/{examResult.total} to'g'ri · +{examResult.xp_awarded} yangi XP
                  </p>
                </div>

                {examResult.certificate === 'none' ? (
                  <div className="rounded-2xl border border-red-300 bg-red-50 p-5 text-sm leading-relaxed text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                    Imtihondan o'ta olmadingiz ({examResult.percentage}%). Kamida 60% kerak. Materiallarni qayta o'rganib, imtihonni qayta topshiring.
                  </div>
                ) : (
                  <>
                    <Certificate name={user.full_name} tier={examResult.certificate} xp={examResult.xp_earned} />
                    <button onClick={() => window.print()} className={`${btnPrimary} mt-5`}>
                      <Icon name="print" className="h-4 w-4" /> Sertifikatni yuklab olish (PDF)
                    </button>
                    <button onClick={openPractice} className={`${btnPrimary} mt-3`}>
                      <Icon name="zap" className="h-4 w-4" /> Amaliy loyihaga o'tish (2-bosqich)
                    </button>
                  </>
                )}

                <button onClick={retakeExam} className={`${btnGhost} mt-3`}>
                  <Icon name="refresh" className="h-4 w-4" /> Imtihonni qayta topshirish
                </button>
              </>
            )}
          </section>
        )}
        {/* ---------- AMALIY LOYIHA (2-BOSQICH) ---------- */}
        {screen === 'practice' && (
          <section>
            <button onClick={() => setScreen('home')} className={`${linkBtn} mb-4`}><Icon name="back" className="h-4 w-4" /> Bosh sahifa</button>
            <h2 className="text-xl font-bold">Amaliy loyiha — 2-bosqich</h2>
            <p className="mb-5 mt-1 text-sm text-zinc-500">Har bir darsni o'z kompyuteringizda bajaring. Mini-testni to'g'ri yechsangiz, dars tugallangan hisoblanadi.</p>

            {!practice ? (
              <p className="text-sm text-zinc-500">Yuklanmoqda…</p>
            ) : (
              <div className="space-y-4">
                {practice.map((p) => {
                  const open = practiceOpen === p.id;
                  const done = !!practiceDone[p.id];
                  const ans = practiceAnswers[p.id] || {};
                  return (
                    <div key={p.id} className={card}>
                      <button onClick={() => setPracticeOpen(open ? null : p.id)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                        <span>
                          <span className="block text-[11px] uppercase tracking-[0.25em] text-zinc-500">Amaliy {p.id} / {practice.length}</span>
                          <span className="font-bold">{p.title}</span>
                        </span>
                        {done ? <Icon name="check" className="h-5 w-5 shrink-0" /> : <Icon name={open ? 'x' : 'next'} className="h-4 w-4 shrink-0" />}
                      </button>

                      {open && (
                        <div className="space-y-4 border-t border-zinc-200 p-4 dark:border-zinc-800">
                          <p className="text-sm"><b>Maqsad:</b> {p.goal}</p>
                          <p className="text-sm"><b>Vosita:</b> {p.tool}</p>
                          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                            {p.steps.map((s, i) => <li key={i}>{s}</li>)}
                          </ol>
                          <p className="rounded-xl bg-zinc-100 p-3 text-sm dark:bg-zinc-800/60">✅ Tekshiruv: {p.checkpoint}</p>

                          <div className="space-y-3">
                            <p className="text-sm font-bold">Mini-test</p>
                            {p.quiz.map((q, qi) => {
                              const chosen = ans[qi];
                              const answered = chosen !== undefined;
                              const right = answered && chosen === q.correct;
                              return (
                                <div key={qi} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                                  <p className="text-sm font-semibold">{qi + 1}. {q.question}</p>
                                  <div className="mt-2 grid gap-2">
                                    {q.options.map((opt, oi) => (
                                      <button
                                        key={oi}
                                        onClick={() => answerPractice(p.id, qi, oi, p.quiz)}
                                        className={`flex items-start gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${
                                          answered && oi === q.correct ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                                            : answered && chosen === oi ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                                            : 'border-zinc-200 hover:border-zinc-400 dark:border-zinc-800'
                                        }`}
                                      >
                                        <span className="font-bold">{LETTERS[oi]})</span>
                                        <span className="flex-1">{opt}</span>
                                      </button>
                                    ))}
                                  </div>
                                  {answered && (
                                    <p className={`mt-2 text-sm ${right ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                                      {right ? '✅ To\'g\'ri. ' : '❌ Noto\'g\'ri. '}{q.explanation}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {done && <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Bu amaliy dars tugallandi.</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* ---------- MODALLAR ---------- */}
      {modal === 'info' && (
        <Modal title="Kurs haqida" onClose={() => setModal(null)}>
          <ul className="space-y-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            <li>• 60 ta dars — har biri PowerPoint slayd ko'rinishida, 3–4 daqiqalik ma'ruza.</li>
            <li>• Har dars so'ngida 3 ta savoldan iborat test va har bir javob uchun tushuntirish.</li>
            <li>• Yakuniy imtihon (30 savol): har bir to'g'ri javob +10 XP.</li>
            <li>• 100% — AI Mutaxassisi, 60% va undan yuqori — AI Pro sertifikati.</li>
          </ul>
        </Modal>
      )}

      {modal === 'leaders' && (
        <Modal title="Reyting" onClose={() => setModal(null)}>
          {!leaders ? (
            <p className="text-sm text-zinc-500">Yuklanmoqda…</p>
          ) : leaders.length === 0 ? (
            <p className="text-sm text-zinc-500">Hali ishtirokchilar yo'q.</p>
          ) : (
            <ol className="space-y-2">
              {leaders.map((u, i) => (
                <li key={u.name + i} className="flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-800">
                  <span className="flex items-center gap-3">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-200 dark:bg-zinc-800'}`}>{i + 1}</span>
                    {u.name}
                  </span>
                  <span className="flex items-center gap-1 font-semibold"><Icon name="zap" className="h-3.5 w-3.5" />{u.xp}</span>
                </li>
              ))}
            </ol>
          )}
        </Modal>
      )}
    </div>
  );
}
