# Pomodorus Online Bot

A standalone Telegram bot for the [Pomodorus](https://pomodorus.yazdan.me/) pomodoro app. It lists who's currently online (working / on a break) and, on demand, takes a live screenshot of the site and posts it — along with the current online list — to a Telegram channel.

This is a separate project from the Pomodorus app itself. It only reads the app's existing **public** feed (`sessions:activeFeed` in Convex), the same data already shown on the site's own landing page — nothing new is exposed.

راهنمای فارسی در پایین همین فایل قرار دارد.

## Features

- `/online` — lists everyone currently online with their status (work / short break / long break) and category label, plus an inline "📸 Screenshot" button.
- Tapping the button captures a live screenshot of the site and posts it to a configured Telegram channel, captioned with the current online list.

## Prerequisites

- Node.js 18+
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- The bot added as an **admin** of the destination channel (needed to post photos)
- Google Chrome or Chromium installed locally (the bot drives an already-installed browser via `puppeteer-core` instead of downloading its own Chromium, to keep the install small)

## Setup

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

## Deployment notes

The bot runs on long-polling, so it needs an always-on process (a VPS, Railway, Render, a Raspberry Pi, etc. — polling doesn't work on request-driven serverless platforms like Vercel). Since it drives a real browser, the host needs Chrome/Chromium available (either preinstalled, or install it in your Dockerfile/build step and point `CHROME_PATH` at it).

## License

MIT — see [LICENSE](LICENSE).

---

## راهنمای فارسی

ربات تلگرامی مستقل برای اپ [Pomodorus](https://pomodorus.yazdan.me/). لیست کاربران آنلاین (در حال کار یا استراحت) را نشان می‌دهد و با زدن یک دکمه، اسکرین‌شات زنده‌ای از سایت می‌گیرد و همراه با لیست کاربران آنلاین در یک کانال تلگرامی پست می‌کند.

این پروژه کاملاً از سایت اصلی جداست و فقط از فید عمومی `sessions:activeFeed` که در Convex همان پروژه از قبل public تعریف شده استفاده می‌کند — دقیقاً همان داده‌ای که در صفحه‌ی اصلی سایت هم نمایش داده می‌شود؛ چیز جدیدی افشا نمی‌شود.

### راه‌اندازی

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

### استفاده

- `/online` — لیست کاربران آنلاین به‌همراه دکمه‌ی اسکرین‌شات را نشان می‌دهد.
- زدن دکمه‌ی «📸 اسکرین‌شات بگیر و بفرست به کانال» — یک اسکرین‌شات زنده از سایت می‌گیرد و همراه با لیست کاربران آنلاین در کانال تنظیم‌شده پست می‌کند.

### نکته دربارهٔ دیپلوی

این ربات با polling کار می‌کند، پس باید یک پروسه‌ی همیشه-روشن اجرایش کند (VPS، Railway، Render و مشابه — روی پلتفرم‌های سرورلس مثل Vercel کار نمی‌کند). چون از یک مرورگر واقعی (Chrome/Chromium نصب‌شده روی سیستم) استفاده می‌کند، هاست باید به آن دسترسی داشته باشد.

### لایسنس

MIT — به فایل [LICENSE](LICENSE) نگاه کن.
