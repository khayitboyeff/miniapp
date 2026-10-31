# Joylashtirish: Backend — PythonAnywhere, Frontend — Netlify

Bu qo'llanma ketma-ket bajariladi. Har bir bosqichda tekshiruv nuqtasi bor.

## 0. Muhim eslatma (avval o'qing)

- PythonAnywhere **bepul** hisobida tashqi saytlarga kirish cheklangan. Gemini API (`generativelanguage.googleapis.com`) bepul hisobda ishlamasligi mumkin. Bu hali tasdiqlanmagan. **Birinchi sinovda `Gemini` chaqiruvi xato bersa, pullik (Hacker) rejaga o'ting.** Narxni PythonAnywhere sahifasidan tekshiring.
- Bepul hisobda SQLite ma'lumoti saqlanadi (PythonAnywhere fayl tizimi doimiy), lekin hisob cheklovlarini rasmiy sahifadan tekshiring.

## 1. PythonAnywhere hisobi

1. pythonanywhere.com da bepul hisob oching.
2. Dashboard → **Files**: `ai-full-course` papkasini yarating. Repozitoriydan yoki ZIP dan `backend/` ni shu yerga joylang.
3. Tekshiruv: Files ro'yxatida `main.py`, `course.json`, `final_exam.json`, `practice.json`, `wsgi.py` ko'rinadi.

## 2. Virtual muhit va kutubxonalar

1. Dashboard → **Consoles** → **Bash**.
2. Buyruqlar:
   ```
   cd ~/ai-full-course/backend
   python3.11 -m venv ~/venvs/aifc
   source ~/venvs/aifc/bin/activate
   pip install -r requirements.txt
   ```
3. Tekshiruv: `pip list` da `fastapi`, `a2wsgi` ko'rinadi.

## 3. Web app yaratish

1. Dashboard → **Web** → **Add a new web app**.
2. Domen: `<username>.pythonanywhere.com`. Python versiyasi: 3.11.
3. **Manual configuration** ni tanlang (Flask emas).
4. Virtualenv yo'li: `/home/<username>/venvs/aifc`.
5. **WSGI configuration file** havolasini oching va uni to'liq almashtiring: `wsgi.py` dagi kod, lekin `PROJECT` yo'lini o'z username'ingiz bilan to'g'rilang:
   ```python
   PROJECT = "/home/<username>/ai-full-course/backend"
   ```
6. **Reload** tugmasini bosing.

## 4. Muhit o'zgaruvchilari (maxfiy)

- Web tab → **Environment variables** (yoki WSGI faylida `os.environ`):
  - `FRONTEND_ORIGINS` = Netlify manzili (3-bosqichdan keyin), masalan `https://ai-kurs.netlify.app`
  - `BOT_TOKEN` = bo'sh qoldiring (Telegram bot bo'lmasa)
  - `GEMINI_API_KEY` = o'z kalitingiz (kodga yozmang)

## 5. Tekshiruv

- Brauzerda `https://<username>.pythonanywhere.com/api/health` oching.
- Javob: `{"status":"ok", ...}`. Xato bo'lsa: Web → **Error log** ni o'qing.

## 6. Frontend'ni Netlify ga joylash

1. `frontend/.env.local` da `VITE_API_URL=https://<username>.pythonanywhere.com` yozing.
2. Kompyuterda: `cd frontend && npm install && npm run build` (chiqish papkasi: `dist`).
3. netlify.com → **Add new site** → **Deploy manually** → `dist` papkasini sudrab tashlang.
4. Olingan manzilni PythonAnywhere muhitida `FRONTEND_ORIGINS` ga yozing va Web tabda **Reload** bosing.
5. Tekshiruv: Netlify manzilini oching, kurs ro'yxati yuklanishi kerak.

## 7. Bepul va pullik variantlar (narxlar o'zgarishi mumkin, rasmiy sahifadan tekshiring)

| Qism | Bepul | Pullik | Eslatma |
|---|---|---|---|
| Frontend (Netlify) | Bepul reja bor, limitlari tekshiriladi | Ko'proq trafik uchun | Statik sayt uchun yetarli |
| Backend (PythonAnywhere) | Bepul hisob, tashqi API cheklovi bo'lishi mumkin | Hacker reja | Gemini ishlashini birinchi tekshiring |
| AI (Gemini API) | Bepul kvota bor, limitlari o'zgaradi | Pullik narx | Kalitni hech qachon kodga yozmang |

## 8. Tez-tez uchraydigan xatolar

- **Brauzerda CORS xatosi:** `FRONTEND_ORIGINS` da Netlify manzili yo'q. Manzilni to'liq (https bilan) yozing.
- **500 xatosi:** Error log ni tekshiring. Ko'pincha kutubxona yoki yo'l xatosi.
- **Gemini 403/connection xatosi:** bepul hisob cheklovi. Pullik rejaga o'ting yoki boshqa hostingni sinab ko'ring.
- **Ma'lumot yo'qolishi:** `DATABASE_PATH` yo'lini doimiy papkaga qo'ying, masalan `/home/<username>/data/ai_course.db`.
