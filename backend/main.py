import hashlib, hmac, json, os, sqlite3, time, urllib.request
from contextlib import contextmanager
from urllib.parse import parse_qsl
from pathlib import Path
from dotenv import load_dotenv
from typing import Optional
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT.parent / '.env')
DB_PATH = Path(os.getenv("DATABASE_PATH") or (ROOT / "ai_course.db"))
BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()
TG_WEBHOOK_SECRET = os.getenv("TG_WEBHOOK_SECRET", "").strip()
WEBAPP_URL = os.getenv("WEBAPP_URL", "").strip()
PRACTICE_PRICE_STARS = int(os.getenv("PRACTICE_PRICE_STARS", "300") or 300)
FRONTEND_ORIGINS = [x.strip() for x in os.getenv("FRONTEND_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",") if x.strip()]
LESSONS = json.loads((ROOT / "course.json").read_text(encoding="utf-8"))
FINAL_QUESTIONS = json.loads((ROOT / "final_exam.json").read_text(encoding="utf-8"))
PRACTICE = json.loads((ROOT / "practice.json").read_text(encoding="utf-8"))

app = FastAPI(title="AI Full Course API", version="1.0.0", description="AI Full Course Telegram Mini App API")
app.add_middleware(CORSMiddleware, allow_origins=FRONTEND_ORIGINS, allow_credentials=True, allow_methods=["GET","POST","OPTIONS"], allow_headers=["*"])

@contextmanager
def connect():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys=ON")
    try:
        yield con
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()

def init_db():
    with connect() as con:
        con.executescript("""
        CREATE TABLE IF NOT EXISTS users (
          telegram_id TEXT PRIMARY KEY, full_name TEXT NOT NULL,
          coins INTEGER NOT NULL DEFAULT 0, xp INTEGER NOT NULL DEFAULT 0,
          current_level INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS progress (
          telegram_id TEXT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
          lesson_id INTEGER NOT NULL, score INTEGER NOT NULL DEFAULT 0,
          total INTEGER NOT NULL DEFAULT 3, coins_earned INTEGER NOT NULL DEFAULT 0,
          completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY(telegram_id, lesson_id)
        );
        CREATE TABLE IF NOT EXISTS exam_attempts (
          id INTEGER PRIMARY KEY AUTOINCREMENT, telegram_id TEXT NOT NULL REFERENCES users(telegram_id),
          score INTEGER NOT NULL, total INTEGER NOT NULL, xp_earned INTEGER NOT NULL,
          certificate TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS payments (
          charge_id TEXT PRIMARY KEY, telegram_id TEXT NOT NULL,
          amount INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        """)
init_db()

def verify_init_data(init_data: Optional[str]):
    if not BOT_TOKEN:
        return None
    if not init_data:
        raise HTTPException(401, "Telegram initData talab qilinadi.")
    try:
        values = dict(parse_qsl(init_data, keep_blank_values=True))
        received_hash = values.pop("hash")
        auth_date = int(values.get("auth_date", "0"))
        if abs(time.time() - auth_date) > 86400:
            raise ValueError("expired")
        data_check = "\n".join(f"{k}={v}" for k,v in sorted(values.items()))
        secret = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
        expected = hmac.new(secret, data_check.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, received_hash):
            raise ValueError("bad hash")
        user_data = json.loads(values["user"])
        return str(user_data["id"])
    except Exception:
        raise HTTPException(401, "Telegram sessiyasi tasdiqlanmadi.")

def require_self(init_data: Optional[str], telegram_id: str):
    # BOT_TOKEN bo'lsa, faqat o'z Telegram hisobining ma'lumotini ko'rsatadi
    if not BOT_TOKEN:
        return
    if verify_init_data(init_data) != telegram_id:
        raise HTTPException(403, "Bu ma'lumotga ruxsat yo'q.")

class UserIn(BaseModel):
    telegram_id: str = Field(min_length=1, max_length=64)
    full_name: str = Field(min_length=1, max_length=120)
    init_data: Optional[str] = None

class ProgressIn(BaseModel):
    telegram_id: str
    lesson_id: int = Field(ge=1, le=60)
    answers: list[int] = Field(min_length=3, max_length=3)
    init_data: Optional[str] = None

class ExamIn(BaseModel):
    telegram_id: str
    answers: list[int] = Field(min_length=30, max_length=30)
    init_data: Optional[str] = None

def user_or_404(con, tid):
    row = con.execute("SELECT * FROM users WHERE telegram_id=?", (tid,)).fetchone()
    if not row: raise HTTPException(404, "Foydalanuvchi topilmadi.")
    return row

@app.get("/api/health")
def health():
    return {"status":"ok","service":"AI Full Course API","lessons":len(LESSONS)}

@app.post("/api/users")
def register_user(data: UserIn):
    verified = verify_init_data(data.init_data)
    if verified and verified != data.telegram_id:
        raise HTTPException(403, "Telegram foydalanuvchi identifikatori mos emas.")
    if BOT_TOKEN and not verified:
        raise HTTPException(401, "Telegram tasdiqlovi topilmadi.")
    with connect() as con:
        con.execute("INSERT INTO users(telegram_id,full_name) VALUES(?,?) ON CONFLICT(telegram_id) DO UPDATE SET full_name=excluded.full_name",
                    (data.telegram_id, data.full_name))
        return get_user_data(con, data.telegram_id)

def get_user_data(con, tid):
    u = user_or_404(con, tid)
    completed = [r["lesson_id"] for r in con.execute("SELECT lesson_id FROM progress WHERE telegram_id=? ORDER BY lesson_id",(tid,))]
    certs = {r["certificate"] for r in con.execute("SELECT certificate FROM exam_attempts WHERE telegram_id=?",(tid,))}
    best_cert = "gold" if "gold" in certs else ("silver" if "silver" in certs else "none")
    return {"telegram_id":u["telegram_id"],"full_name":u["full_name"],"coins":u["coins"],"xp":u["xp"],
            "level":u["current_level"],"completed_lessons":completed,"lessons_completed":len(completed),
            "certificate":best_cert}

@app.get("/api/users/{telegram_id}")
def get_user(telegram_id: str, init_data: Optional[str] = None):
    require_self(init_data, telegram_id)
    with connect() as con: return get_user_data(con, telegram_id)

@app.post("/api/progress")
def update_progress(data: ProgressIn):
    verified = verify_init_data(data.init_data)
    if BOT_TOKEN and verified != data.telegram_id: raise HTTPException(403, "Telegram foydalanuvchi identifikatori mos emas.")
    lesson = LESSONS[data.lesson_id-1]
    if any(a not in (0,1,2) for a in data.answers): raise HTTPException(422,"Javob indeksi noto‘g‘ri.")
    score = sum(1 for i,a in enumerate(data.answers) if a == lesson["quiz"][i]["correct"])
    coins = score * 10
    with connect() as con:
        user_or_404(con,data.telegram_id)
        exists = con.execute("SELECT 1 FROM progress WHERE telegram_id=? AND lesson_id=?",(data.telegram_id,data.lesson_id)).fetchone()
        if not exists:
            con.execute("INSERT INTO progress(telegram_id,lesson_id,score,total,coins_earned) VALUES(?,?,?,?,?)",
                        (data.telegram_id,data.lesson_id,score,3,coins))
            con.execute("UPDATE users SET coins=coins+?, current_level=MAX(current_level,?) WHERE telegram_id=?",
                        (coins,min(60,data.lesson_id+1),data.telegram_id))
        else:
            coins = 0
        result = get_user_data(con,data.telegram_id)
        return {"score":score,"total":3,"coins_earned":coins,"already_completed":bool(exists),"user":result,
                "review":[{"correct":q["correct"],"explanation":q["explanation"]} for q in lesson["quiz"]]}

@app.post("/api/exam/submit")
def submit_exam(data: ExamIn):
    verified = verify_init_data(data.init_data)
    if BOT_TOKEN and verified != data.telegram_id: raise HTTPException(403, "Telegram foydalanuvchi identifikatori mos emas.")
    if any(a not in (0,1,2) for a in data.answers): raise HTTPException(422,"Javob indeksi noto‘g‘ri.")
    with connect() as con:
        user = user_or_404(con,data.telegram_id)
        count = con.execute("SELECT COUNT(*) n FROM progress WHERE telegram_id=?",(data.telegram_id,)).fetchone()["n"]
        if count < 60: raise HTTPException(403,"Yakuniy imtihon uchun 60 ta darsni tugating.")
        score = sum(1 for i,a in enumerate(data.answers) if a == FINAL_QUESTIONS[i]["correct"])
        xp = score * 10
        pct = round(score / 30 * 100)
        cert = "gold" if score == 30 else ("silver" if pct >= 60 else "none")
        previous = con.execute("SELECT MAX(xp_earned) best_xp FROM exam_attempts WHERE telegram_id=?",(data.telegram_id,)).fetchone()["best_xp"]
        xp_awarded = max(0, xp - (previous or 0))
        con.execute("INSERT INTO exam_attempts(telegram_id,score,total,xp_earned,certificate) VALUES(?,?,?,?,?)",
                    (data.telegram_id,score,30,xp,cert))
        con.execute("UPDATE users SET xp=xp+? WHERE telegram_id=?",(xp_awarded,data.telegram_id))
        return {"score":score,"total":30,"percentage":pct,"xp_earned":xp,"xp_awarded":xp_awarded,"certificate":cert,
                "user":get_user_data(con,data.telegram_id),
                "review":[{"correct":q["correct"],"explanation":q["explanation"]} for q in FINAL_QUESTIONS]}

@app.get("/api/course")
def course():
    return [{"id":l["id"],"title":l["title"],"subtitle":l.get("subtitle",""),"slides":l["slides"],
             "quiz":[{"question":q["question"],"options":q["options"]} for q in l["quiz"]],
             "reward_per_correct":l.get("reward_per_correct",10)} for l in LESSONS]

@app.get("/api/exam/questions")
def exam_questions():
    return [{"id":q["id"],"question":q["question"],"options":q["options"]} for q in FINAL_QUESTIONS]

@app.get("/api/practice")
def practice(telegram_id: str, init_data: Optional[str] = None):
    # 2-bosqich pullik: faqat to'lov qilgan foydalanuvchi ko'ra oladi
    if BOT_TOKEN:
        if verify_init_data(init_data) != telegram_id:
            raise HTTPException(403, "Telegram foydalanuvchi identifikatori mos emas.")
        with connect() as con:
            paid = con.execute("SELECT 1 FROM payments WHERE telegram_id=? LIMIT 1", (telegram_id,)).fetchone()
        if not paid:
            raise HTTPException(402, "2-bosqich pullik.")
    return [{"id":p["id"],"title":p["title"],"goal":p["goal"],"tool":p["tool"],"steps":p["steps"],
             "checkpoint":p["checkpoint"],
             "quiz":[{"question":q["question"],"options":q["options"],"correct":q["correct"],"explanation":q["explanation"]} for q in p["quiz"]]}
            for p in PRACTICE]

@app.get("/api/leaderboard")
def leaderboard():
    with connect() as con:
        rows=con.execute("SELECT full_name name,xp,coins,current_level level FROM users ORDER BY xp DESC, coins DESC LIMIT 50").fetchall()
        return [dict(r) for r in rows]

class InvoiceIn(BaseModel):
    telegram_id: str = Field(min_length=1, max_length=64)
    init_data: Optional[str] = None

@app.post("/api/practice/invoice")
def practice_invoice(data: InvoiceIn):
    if not BOT_TOKEN:
        raise HTTPException(503, "To'lov sozlanmagan.")
    if verify_init_data(data.init_data) != data.telegram_id:
        raise HTTPException(403, "Telegram foydalanuvchi identifikatori mos emas.")
    res = tg_call("createInvoiceLink", {
        "title": "AI Full Course — 2-bosqich",
        "description": "Amaliy loyiha: 40 ta amaliy dars va mini-testlar",
        "payload": f"practice:{data.telegram_id}",
        "provider_token": "",
        "currency": "XTR",
        "prices": [{"label": "2-bosqich", "amount": PRACTICE_PRICE_STARS}],
    })
    return {"url": res["result"]}

def tg_call(method: str, payload: dict):
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{BOT_TOKEN}/{method}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

@app.post("/api/tg-webhook")
def tg_webhook(update: dict, x_telegram_bot_api_secret_token: Optional[str] = Header(None)):
    # Telegram har bir xabarni shu manzilga yuboradi (setWebhook orqali ulanadi)
    if not TG_WEBHOOK_SECRET or x_telegram_bot_api_secret_token != TG_WEBHOOK_SECRET:
        raise HTTPException(403, "Ruxsat yo'q.")
    pcq = update.get("pre_checkout_query")
    if pcq:
        # Telegram Stars to'lovini tasdiqlash (10 soniya ichida javob kerak)
        tg_call("answerPreCheckoutQuery", {"pre_checkout_query_id": pcq["id"], "ok": True})
        return {"ok": True}
    msg = update.get("message") or {}
    chat_id = (msg.get("chat") or {}).get("id")
    text = (msg.get("text") or "").strip()
    payment = msg.get("successful_payment")
    if payment and str(payment.get("invoice_payload", "")).startswith("practice:"):
        tid = payment["invoice_payload"].split(":", 1)[1]
        with connect() as con:
            con.execute("INSERT OR IGNORE INTO payments(charge_id,telegram_id,amount) VALUES(?,?,?)",
                        (payment["telegram_payment_charge_id"], tid, payment.get("total_amount", 0)))
        if chat_id:
            tg_call("sendMessage", {"chat_id": chat_id, "text": "To'lov qabul qilindi! 2-bosqich ochildi. Ilovani qayta oching."})
        return {"ok": True}
    if chat_id and text.startswith("/start") and WEBAPP_URL.startswith("https://") and BOT_TOKEN:
        tg_call("sendMessage", {
            "chat_id": chat_id,
            "text": "AI Full Course ga xush kelibsiz! Kursni boshlash uchun tugmani bosing.",
            "reply_markup": {"inline_keyboard": [[{"text": "Kursni boshlash", "web_app": {"url": WEBAPP_URL}}], [{"text": "AI Chat", "url": "https://ai-plan.onrender.com/chat"}]]},
        })
    return {"ok": True}

# Frontend build (backend/static) bitta hostingda API bilan birga xizmat qiladi.
# Bu qator eng oxirida turadi, shuning uchun /api manzillari avval ishlaydi.
STATIC_DIR = ROOT / "dist"
if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="site")
