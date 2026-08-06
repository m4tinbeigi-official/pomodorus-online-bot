import "dotenv/config";
import { Telegraf } from "telegraf";
import { ConvexHttpClient } from "convex/browser";
import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const SITE_URL = process.env.SITE_URL || "https://pomodorus.yazdan.me/";
const CONVEX_URL = process.env.CONVEX_URL;

// puppeteer-core doesn't bundle Chromium (keeps install small); point it at
// a browser already on the machine instead of downloading one.
const DEFAULT_CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
];
const CHROME_PATH =
  process.env.CHROME_PATH ?? DEFAULT_CHROME_PATHS.find((p) => existsSync(p));

if (!CHROME_PATH) {
  throw new Error(
    "No Chrome/Chromium found. Install Google Chrome, or set CHROME_PATH in .env to its executable."
  );
}

if (!BOT_TOKEN) throw new Error("Missing BOT_TOKEN in .env");
if (!CONVEX_URL) throw new Error("Missing CONVEX_URL in .env");

const bot = new Telegraf(BOT_TOKEN);
const convex = new ConvexHttpClient(CONVEX_URL);

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

async function fetchFeed() {
  return convex.query("sessions:activeFeed", {});
}

async function screenshotSite() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(SITE_URL, { waitUntil: "networkidle2", timeout: 30000 });
    return await page.screenshot({ type: "png", fullPage: false });
  } finally {
    await browser.close();
  }
}

bot.command("online", async (ctx) => {
  const feed = await fetchFeed();
  await ctx.reply(formatFeed(feed), {
    reply_markup: {
      inline_keyboard: [[{ text: "📸 اسکرین‌شات بگیر و بفرست به کانال", callback_data: "screenshot" }]],
    },
  });
});

bot.action("screenshot", async (ctx) => {
  await ctx.answerCbQuery("در حال گرفتن اسکرین‌شات...");
  if (!CHANNEL_ID) {
    await ctx.reply("CHANNEL_ID تنظیم نشده — در .env مقداردهی کن.");
    return;
  }
  try {
    const [feed, shot] = await Promise.all([fetchFeed(), screenshotSite()]);
    await bot.telegram.sendPhoto(
      CHANNEL_ID,
      { source: shot },
      { caption: `کاربران آنلاین:\n${formatFeed(feed)}` }
    );
    await ctx.reply("✅ اسکرین‌شات ارسال شد به کانال.");
  } catch (err) {
    console.error(err);
    await ctx.reply(`❌ خطا در ارسال اسکرین‌شات: ${err.message}`);
  }
});

bot.start((ctx) =>
  ctx.reply("سلام! با /online لیست کاربران آنلاین پومودوروس رو ببین.")
);

bot.catch((err, ctx) => {
  console.error(`Unhandled error for update ${ctx.update.update_id}:`, err);
});

bot.launch();
console.log("Bot is running (polling)...");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
