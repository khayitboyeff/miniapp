# AI Full Course — Telegram Mini App

60 ta o‘ziga xos mavzu, har birida 3 ta test, SQLite progress va XP reytingi, 30 savollik yakuniy imtihon hamda Telegram bot orqali PNG sertifikat.

## 1. Talablar

- Windows 10/11
- Python 3.11 yoki 3.12
- Node.js LTS (npm bilan)
- Telegram bot uchun BotFather token
- Telegram Mini App uchun HTTPS manzilli frontend hosting (Telegram WebApp tugmasi oddiy localhost HTTP manzilini qabul qilmaydi)

## 2. Lokal ishga tushirish

1. ZIP faylni to‘liq papkaga oching.
2. `START_AI_FULL_COURSE.bat` faylini ikki marta bosing.
3. Script Python virtual muhitini yaratadi, backend va bot kutubxonalarini o‘rnatadi, frontend paketlarini o‘rnatadi va serverlarni alohida oynalarda ishga tushiradi.
4. Brauzerda `http://localhost:3000` ni oching.
5. API hujjatlari: `http://127.0.0.1:8000/docs`.

Birinchi ishga tushirishda internet kerak bo‘ladi (pip va npm paketlarini o‘rnatish uchun). Keyingi ishga tushirishlar tezroq bo‘ladi.

## 3. Telegram botni ulash

1. Telegramda `@BotFather` orqali bot yarating va token oling.
2. Loyiha papkasidagi `.env` faylini oching.
3. `BOT_TOKEN=` qatoridan keyin tokenni yozing.
4. Frontendni HTTPS domeningizga deploy qiling.
5. `.env` ichidagi `WEBAPP_URL=` qiymatini shu HTTPS manzilga almashtiring.
6. `FRONTEND_ORIGINS=` qatoriga frontend domeningizni yozing.
7. BotFather sozlamalarida Mini App / Web App domenini tasdiqlang.
8. `START_AI_FULL_COURSE.bat` ni qayta ishga tushiring.

Telegram Mini App foydalanuvchi ma’lumotlari backendda `BOT_TOKEN` mavjud bo‘lganda Telegram `initData` HMAC imzosi orqali tekshiriladi. Tokenni hech qachon frontendga qo‘ymang yoki GitHub’ga yubormang.

## 4. Admin ID

Frontendda `frontend/.env.local` faylidagi `VITE_ADMIN_IDS` qiymatiga admin Telegram ID raqamlarini vergul bilan yozish mumkin. Bu hozircha interfeysda admin yorlig‘i/holatini aniqlash uchun. Darslar barcha foydalanuvchilar uchun ochiq. Haqiqiy admin vakolatlari kerak bo‘lsa, backendda alohida role va server-side authorization qo‘shilishi shart.

## 5. Mukofot va imtihon qoidalari

- Har darsda 3 ta savol bor; har to‘g‘ri javob 10 coin.
- Dars mukofoti faqat birinchi yakunlashda beriladi.
- 60 dars tugamasdan yakuniy imtihon topshirilmaydi.
- Yakuniy imtihonda har to‘g‘ri javob 10 XP.
- Qayta urinishda XP faqat avvalgi eng yaxshi natijadan oshgan qismiga ko‘payadi.
- 100% — AI Mutaxassisi (tilla), 60% va undan yuqori — AI Pro (kumush).
- Sertifikat o‘quv kursini yakunlaganlikni bildiradi; akkreditatsiyalangan diplom yoki davlat malaka hujjati emas.

## 6. Papkalar

- `frontend/` — React + Vite interfeysi, 60 dars va 30 savol ma’lumotlari
- `backend/` — FastAPI REST API, SQLite bazasi va server-side javob tekshiruvi
- `bot/` — Aiogram 3 Telegram bot va PNG sertifikat generatori
- `START_AI_FULL_COURSE.bat` — Windows uchun bir tugmali o‘rnatish/ishga tushirish
- `.env.example` — maxfiy sozlamalar namunasi

## 7. To‘xtatish

Har bir server oynasida `Ctrl+C` bosing. SQLite bazasi `backend/ai_course.db` ichida saqlanadi; uni o‘chirmasangiz foydalanuvchi progressi saqlanadi.

## 8. Muhim ishlab chiqarish eslatmalari

Bu loyiha ishga tushadigan MVP/starter hisoblanadi. Ommaviy productionga chiqarishdan oldin HTTPS reverse proxy, rate limiting, backup, loglarni maxfiy ma’lumotlardan tozalash, admin rollarini backendda tekshirish, Telegram initData tekshiruvini barcha userga tegishli endpointlarda qo‘llash, monitoring va privacy policy qo‘shing. Sertifikatdagi muhr dizayn elementi, rasmiy akkreditatsiya belgisi emas.
