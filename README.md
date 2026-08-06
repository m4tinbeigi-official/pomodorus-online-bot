# Pomodorus Online Bot

A standalone Telegram bot for the [Pomodorus](https://pomodorus.yazdan.me/) pomodoro app. On `/start` it lists who's currently online (working / on a break) with an inline "📸 Screenshot" button. Tapping it takes a live screenshot of the site and posts it — along with the current online list — to a Telegram channel.

This is a separate project from the Pomodorus app itself. It only reads the app's existing **public** feed (`sessions:activeFeed` in Convex), the same data already shown on the site's own landing page — nothing new is exposed.

Two ways to run it, in this repo:

- [`index.js`](index.js) — a plain Node.js bot using long-polling. Simple, runs anywhere with an always-on process.
- [`cloudflare/`](cloudflare) — a Cloudflare Workers version using webhooks + Cloudflare's Browser Rendering, deployable **for free** on Cloudflare's free plan.

راهنمای فارسی در پایین همین فایل قرار دارد.

## Features

- `/start` — lists everyone currently online with their status (work / short break / long break) and label, plus an inline "📸 Screenshot" button.
- Tapping the button captures a live screenshot of the site and posts it to a configured Telegram channel, captioned with the current online list.

---

## Option 1: Node.js (long-polling)

### Prerequisites

- Node.js 18+
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- The bot added as an **admin** of the destination channel (needed to post photos)
- Google Chrome or Chromium installed locally (the bot drives an already-installed browser via `puppeteer-core` instead of downloading its own Chromium, to keep the install small)

### Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable      | Required | Description                                                                 |
| ------------- | -------- | ----------------------------------------------------------------------------- |
| `BOT_TOKEN`   | yes      | Token from @BotFather                                                         |
| `CHANNEL_ID`  | yes      | Destination channel's `@username` or numeric chat id (e.g. `-1001234567890`)   |
| `SITE_URL`    | no       | Defaults to `https://pomodorus.yazdan.me/`                                    |
| `CONVEX_URL`  | no       | Defaults to the live Pomodorus Convex deployment                              |
| `CHROME_PATH` | no       | Path to a Chrome/Chromium executable; auto-detected on common install paths   |

Run it:

```bash
npm start
```

### Deployment notes

The bot runs on long-polling, so it needs an always-on process (a VPS, Railway, Render, a Raspberry Pi, etc. — polling doesn't work on request-driven serverless platforms like Vercel). Since it drives a real browser, the host needs Chrome/Chromium available (either preinstalled, or install it in your Dockerfile/build step and point `CHROME_PATH` at it).

---

## Option 2: Cloudflare Workers (free)

Lives in [`cloudflare/`](cloudflare). Uses a Telegram **webhook** instead of polling (so there's no process to keep alive) and Cloudflare's **Browser Rendering** binding instead of a locally installed Chrome — both work on Cloudflare's free plan.

Free plan limits to know: Workers Free gives you 100k requests/day, and Browser Rendering gives 10 minutes of browser time/day — plenty for an occasional on-demand screenshot bot. If you ever hit that ceiling you'd need a Workers Paid plan ($5/mo), not required for normal use.

### Prerequisites

- A Cloudflare account (free)
- `npm install -g wrangler` or use `npx wrangler`
- Same Telegram bot token + channel admin setup as above

### Setup

```bash
cd cloudflare
npm install
npx wrangler login
```

Set secrets (never committed to git):

```bash
npx wrangler secret put BOT_TOKEN
npx wrangler secret put CHANNEL_ID
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET   # any random string you make up
```

`SITE_URL` and `CONVEX_URL` are plain (non-secret) vars already set in [`wrangler.toml`](cloudflare/wrangler.toml) — edit there if you need different values.

Deploy:

```bash
npx wrangler deploy
```

This prints your Worker's URL, e.g. `https://pomodorus-online-bot.<your-subdomain>.workers.dev`. Point Telegram's webhook at it (replace `<TOKEN>`, `<WORKER_URL>`, and `<SECRET>` with your bot token, the printed URL, and the same random string you used for `TELEGRAM_WEBHOOK_SECRET`):

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<WORKER_URL>/webhook&secret_token=<SECRET>"
```

That's it — message your bot with `/start`.

### Local dev

```bash
cd cloudflare
cp .dev.vars.example .dev.vars   # fill in the same three secrets
npx wrangler dev
```

`wrangler dev` gives you a temporary public URL you can point a *test* Telegram webhook at, if you want to iterate without redeploying each time.

---

## License

MIT — see [LICENSE](LICENSE).

---

## راهنمای فارسی

ربات تلگرامی مستقل برای اپ [Pomodorus](https://pomodorus.yazdan.me/). با زدن `/start` لیست کاربران آنلاین (در حال کار یا استراحت) را به‌همراه دکمه‌ی شیشه‌ای «📸 اسکرین‌شات» نشان می‌دهد. با زدن دکمه، یک اسکرین‌شات زنده از سایت می‌گیرد و همراه با لیست کاربران آنلاین در یک کانال تلگرامی پست می‌کند.

این پروژه کاملاً از سایت اصلی جداست و فقط از فید عمومی `sessions:activeFeed` که در Convex همان پروژه از قبل public تعریف شده استفاده می‌کند — دقیقاً همان داده‌ای که در صفحه‌ی اصلی سایت هم نمایش داده می‌شود؛ چیز جدیدی افشا نمی‌شود.

دو روش اجرا در همین ریپو موجود است:

- [`index.js`](index.js) — ربات ساده‌ی Node.js با polling. اجرا روی هر جایی که یک پروسه‌ی همیشه-روشن داشته باشد.
- [`cloudflare/`](cloudflare) — نسخه‌ی Cloudflare Workers با webhook، که **رایگان** روی پلن رایگان Cloudflare قابل دیپلوی است.

### روش ۱: Node.js (polling)

1. یک ربات جدید در تلگرام از [@BotFather](https://t.me/BotFather) بساز و توکنش را بگیر.
2. ربات را به‌عنوان **ادمین** به کانال مقصد اضافه کن (برای اجازه‌ی ارسال عکس).
3. نصب و پیکربندی:
   ```bash
   npm install
   cp .env.example .env
   ```
   و `BOT_TOKEN` و `CHANNEL_ID` را در `.env` پر کن.
4. اجرا:
   ```bash
   npm start
   ```

این ربات با polling کار می‌کند، پس باید یک پروسه‌ی همیشه-روشن اجرایش کند (VPS، Railway، Render و مشابه — روی پلتفرم‌های سرورلس مثل Vercel کار نمی‌کند). چون از یک مرورگر واقعی (Chrome/Chromium نصب‌شده روی سیستم) استفاده می‌کند، هاست باید به آن دسترسی داشته باشد.

### روش ۲: Cloudflare Workers (رایگان)

داخل پوشه‌ی [`cloudflare/`](cloudflare). به‌جای polling از webhook تلگرام استفاده می‌کند (پس نیازی به پروسه‌ی همیشه-روشن نیست) و به‌جای مرورگر نصب‌شده‌ی محلی، از قابلیت **Browser Rendering** کلادفلر استفاده می‌کند — هر دو روی پلن رایگان کلادفلر کار می‌کنند.

سقف پلن رایگان: Workers Free روزی ۱۰۰ هزار درخواست می‌دهد، و Browser Rendering روزی ۱۰ دقیقه زمان مرورگر — برای یک ربات اسکرین‌شات‌گیرِ گاه‌به‌گاه کاملاً کافی است. اگر روزی به این سقف رسیدی، پلن Paid کلادفلر (۵ دلار در ماه) لازم می‌شود؛ برای استفاده‌ی معمولی نیازی نیست.

راه‌اندازی:

```bash
cd cloudflare
npm install
npx wrangler login
```

مقداردهی سکرت‌ها (هیچ‌وقت در گیت commit نمی‌شوند):

```bash
npx wrangler secret put BOT_TOKEN
npx wrangler secret put CHANNEL_ID
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET   # یک رشته‌ی رندوم دلخواه
```

`SITE_URL` و `CONVEX_URL` مقادیر غیرحساسی هستند که از قبل در [`wrangler.toml`](cloudflare/wrangler.toml) تنظیم شده‌اند — اگر لازم بود آنجا تغییرشان بده.

دیپلوی:

```bash
npx wrangler deploy
```

آدرس Worker چاپ می‌شود، مثلاً `https://pomodorus-online-bot.<subdomain>.workers.dev`. سپس webhook تلگرام را به آن آدرس وصل کن (به‌جای `<TOKEN>`، `<WORKER_URL>` و `<SECRET>` مقادیر واقعی خودت را بگذار):

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<WORKER_URL>/webhook&secret_token=<SECRET>"
```

همین. حالا به ربات `/start` بزن.

### لایسنس

MIT — به فایل [LICENSE](LICENSE) نگاه کن.
