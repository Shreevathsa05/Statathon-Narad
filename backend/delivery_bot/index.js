import { Telegraf, Markup } from "telegraf";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import { Survey } from "./models/Survey.js";
import { SurveyResponse } from "./models/SurveyResponse.js";

dotenv.config();
await connectDB();

const bot = new Telegraf(process.env.BOT_TOKEN);
const sessions = new Map();

/* ---------- Helpers ---------- */

function getSession(chatId) {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, {
      step: "LANG",
      language: "english",
      survey: null,
      currentIndex: 0,
      answers: {},
      user: {},
      otp: null,
      responseDocId: null
    });
  }
  return sessions.get(chatId);
}

function shouldShowField(question, answers) {
  if (!question.showIf) return true;
  return answers[question.showIf.questionId] === question.showIf.equals;
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* ---------- START ---------- */

bot.start(async (ctx) => {
  const chatId = ctx.chat.id;
  const session = getSession(chatId);

  const survey = await Survey.findOne({
    surveyId: "mospi-household-survey-2025-01",
    status: "active"
  });

  if (!survey) return ctx.reply("Survey not available");

  session.survey = survey;

  // Resume check
  const existing = await SurveyResponse.findOne({
    telegramChatId: chatId,
    surveyId: survey.surveyId,
    status: "in_progress"
  });

  if (existing) {
    session.answers = Object.fromEntries(
      existing.response.map(r => [r.qid, r.optionId])
    );
    session.currentIndex = existing.currentIndex;
    session.user = existing.user;
    session.responseDocId = existing._id;
    session.step = "QUESTION";

    return ctx.reply(
      "You have an unfinished survey.",
      Markup.inlineKeyboard([
        [Markup.button.callback("Resume", "resume_yes")],
        [Markup.button.callback("Start Fresh", "resume_no")]
      ])
    );
  }

  session.step = "LANG";
  ctx.reply(
    "Choose language / भाषा चुनें",
    Markup.inlineKeyboard([
      [Markup.button.callback("English", "lang_english")],
      [Markup.button.callback("हिंदी", "lang_hindi")]
    ])
  );
});

/* ---------- Resume ---------- */

bot.action("resume_yes", async (ctx) => {
    console.log(ctx)
  await ctx.answerCbQuery();
  askNext(ctx);
});

bot.action("resume_no", async (ctx) => {
  await ctx.answerCbQuery();
  sessions.delete(ctx.chat.id);
  ctx.reply("Starting new survey. Type /start");
});

/* ---------- Language ---------- */

bot.action(/^lang_/, async (ctx) => {
  const session = getSession(ctx.chat.id);
  session.language = ctx.callbackQuery.data.split("_")[1];
  session.step = "NAME";

  await ctx.answerCbQuery();
  ctx.reply(
    session.language === "english"
      ? "Enter your full name"
      : "अपना पूरा नाम दर्ज करें"
  );
});

/* ---------- TEXT INPUT ---------- */

bot.on("text", async (ctx) => {
  const session = getSession(ctx.chat.id);

  // NAME
  if (session.step === "NAME") {
    session.user.fullname = ctx.message.text;
    session.step = "PHONE";
    return ctx.reply("Enter phone number");
  }

  // PHONE
  if (session.step === "PHONE") {
    if (!/^\d{10}$/.test(ctx.message.text)) {
      return ctx.reply("Enter valid 10-digit phone number");
    }

    session.user.phone_no = ctx.message.text;
    session.otp = generateOTP();
    session.step = "OTP";

    // 🔴 For now send OTP via Telegram
    await ctx.reply(`Your OTP is: ${session.otp}`);
    return ctx.reply("Enter OTP");
  }

  // OTP
  if (session.step === "OTP") {
    if (ctx.message.text !== session.otp) {
      return ctx.reply("Invalid OTP. Try again.");
    }

    session.step = "QUESTION";
    session.currentIndex = 0;

    const doc = await SurveyResponse.create({
      surveyId: session.survey.surveyId,
      telegramChatId: ctx.chat.id,
      user: session.user,
      response: [],
      currentIndex: 0,
      status: "in_progress"
    });

    session.responseDocId = doc._id;
    return askNext(ctx);
  }
});

/* ---------- QUESTIONS ---------- */

async function askNext(ctx) {
  const session = getSession(ctx.chat.id);
  const questions = session.survey.questions;

  while (session.currentIndex < questions.length) {
    const q = questions[session.currentIndex];

    if (!shouldShowField(q, session.answers)) {
      session.currentIndex++;
      continue;
    }

    return ctx.reply(
      q.text[session.language],
      Markup.inlineKeyboard(
        q.options.map(opt => [
          Markup.button.callback(
            opt.label[session.language],
            `ans_${q.qid}_${opt.id}`
          )
        ])
      )
    );
  }

  return submitSurvey(ctx);
}

/* ---------- ANSWER ---------- */

bot.action(/^ans_/, async (ctx) => {
  const session = getSession(ctx.chat.id);
  const [, qid, optionId] = ctx.callbackQuery.data.split("_");

  if (session.answers[qid]) {
    return ctx.answerCbQuery("Already answered");
  }

  session.answers[qid] = optionId;
  session.currentIndex++;

  await SurveyResponse.findByIdAndUpdate(session.responseDocId, {
    response: Object.entries(session.answers).map(([qid, optionId]) => ({
      qid,
      optionId
    })),
    currentIndex: session.currentIndex
  });

  await ctx.answerCbQuery();
  askNext(ctx);
});

/* ---------- SUBMIT ---------- */

async function submitSurvey(ctx) {
  const session = getSession(ctx.chat.id);

  await SurveyResponse.findByIdAndUpdate(session.responseDocId, {
    status: "completed"
  });

  ctx.reply("✅ Survey submitted successfully");
  sessions.delete(ctx.chat.id);
}

/* ---------- Launch ---------- */

bot.launch();
console.log("🤖 Telegram Survey Bot running");
