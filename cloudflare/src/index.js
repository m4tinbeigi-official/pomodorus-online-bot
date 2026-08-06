import puppeteer from "@cloudflare/puppeteer";

const KIND_LABEL = {
  work: "🎯 کار",
  shortBreak: "☕️ استراحت کوتاه",
  longBreak: "🛋️ استراحت بلند",
};

function formatFeed(feed) {
  if (feed.length === 0) return "الان کسی آنلاین نیست.";
  return feed
    .map((p) => {
      const kind = KIND_LABEL[p.kind] ?? p.kind;
      const label = p.label ? ` — ${p.label}` : "";
      return `• @${p.username} ${kind}${label}`;
    })
    .join("\n");
}

async function fetchFeed(env) {
  const res = await fetch(`${env.CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "sessions:activeFeed",
      args: {},
      format: "json",
    }),
  });
  const data = await res.json();
  if (data.status !== "success") {
    throw new Error(`Convex query failed: ${data.errorMessage ?? res.status}`);
  }
  return data.value;
}

async function screenshotSite(env) {
  const browser = await puppeteer.launch(env.BROWSER);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(env.SITE_URL, { waitUntil: "networkidle0", timeout: 30000 });
    return await page.screenshot({ type: "png" });
  } finally {
    await browser.close();
  }
}

async function telegram(env, method, params) {
  const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram ${method} failed: ${data.description}`);
  return data.result;
}

async function sendPhotoToChannel(env, chatId, photoBytes, caption) {
  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("caption", caption);
  form.append("photo", new Blob([photoBytes], { type: "image/png" }), "screenshot.png");
  const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram sendPhoto failed: ${data.description}`);
  return data.result;
}

async function replyWithFeedAndButton(env, chatId) {
  const feed = await fetchFeed(env);
  await telegram(env, "sendMessage", {
    chat_id: chatId,
    text: formatFeed(feed),
    reply_markup: {
      inline_keyboard: [
        [{ text: "📸 اسکرین‌شات بگیر و بفرست به کانال", callback_data: "screenshot" }],
      ],
    },
  });
}

async function handleUpdate(update, env) {
  const message = update.message;
  const callback = update.callback_query;

  if (message?.text === "/start") {
    await replyWithFeedAndButton(env, message.chat.id);
    return;
  }

  if (callback?.data === "screenshot") {
    await telegram(env, "answerCallbackQuery", {
      callback_query_id: callback.id,
      text: "در حال گرفتن اسکرین‌شات...",
    });

    if (!env.CHANNEL_ID) {
      await telegram(env, "sendMessage", {
        chat_id: callback.message.chat.id,
        text: "CHANNEL_ID تنظیم نشده — با wrangler secret put مقداردهی کن.",
      });
      return;
    }

    try {
      const [feed, shot] = await Promise.all([fetchFeed(env), screenshotSite(env)]);
      await sendPhotoToChannel(env, env.CHANNEL_ID, shot, `کاربران آنلاین:\n${formatFeed(feed)}`);
      await telegram(env, "sendMessage", {
        chat_id: callback.message.chat.id,
        text: "✅ اسکرین‌شات ارسال شد به کانال.",
      });
    } catch (err) {
      await telegram(env, "sendMessage", {
        chat_id: callback.message.chat.id,
        text: `❌ خطا در ارسال اسکرین‌شات: ${err.message}`,
      });
    }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/webhook" || request.method !== "POST") {
      return new Response("Not found", { status: 404 });
    }

    if (
      env.TELEGRAM_WEBHOOK_SECRET &&
      request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.TELEGRAM_WEBHOOK_SECRET
    ) {
      return new Response("Unauthorized", { status: 401 });
    }

    const update = await request.json();

    try {
      await handleUpdate(update, env);
    } catch (err) {
      console.error(err);
    }

    // Always 200 so Telegram doesn't retry-storm us on our own errors.
    return new Response("OK", { status: 200 });
  },
};
